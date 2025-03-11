package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"sort"
	"time"

	"github.com/coder/websocket"
	"github.com/enzofalone/kahoot/internal/repo"
)

// echoServer is the WebSocket echo server implementation.
// It ensures the client speaks the echo subprotocol and
// only allows one message every 100ms with a 10 message burst.
type HostHandler struct {
	logf        func(format string, args ...interface{})
	rooms       map[string]*Room
	db          *repo.Database
	broadcaster *Broadcaster
}

func NewHostHandler(logf func(format string, args ...interface{}), db *repo.Database, rooms map[string]*Room) *HostHandler {
	return &HostHandler{
		logf:        logf,
		rooms:       rooms,
		db:          db,
		broadcaster: NewBroadcaster(logf),
	}
}

func (h HostHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	c, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		Subprotocols:   []string{"kahoot"},
		OriginPatterns: []string{"127.0.0.1:5173"},
	})
	if err != nil {
		h.logf("%v", err)
		return
	}
	defer c.CloseNow()

	if c.Subprotocol() != "kahoot" {
		c.Close(websocket.StatusPolicyViolation, "client must speak the kahoot subprotocol")
		return
	}

	currentRoom := h.createRoom(c)
	event := &Event{
		Event: "room_created",
		Content: struct {
			RoomCode string `json:"roomCode"`
			Success  bool   `json:"success"`
		}{
			RoomCode: currentRoom.ID,
			Success:  true,
		},
	}
	defer h.deleteRoom(currentRoom.ID)

	eventJson, err := json.Marshal(event)
	if err != nil {
		h.logf("Failed to marshal room created event: %v", err)
		return
	}

	if err := h.broadcaster.SendTo(currentRoom.HostConn, eventJson); err != nil {
		h.logf("Failed to send room creation event: %v", err)
		return
	}

	h.PrintRoomStatus()

	for {
		_, reader, err := c.Reader(context.Background())
		if err != nil {
			h.logf("Failed to get reader from host: %v", err)
			break
		}

		message, err := io.ReadAll(reader)
		if err != nil {
			h.logf("Failed to read message from host: %v", err)
			break
		}

		var event Event
		if err := json.Unmarshal(message, &event); err != nil {
			h.logf("Failed to unmarshal event: %v", err)
			continue
		}

		switch event.Event {
		case EVENT_START:
			if err = h.startGame(currentRoom.ID); err != nil {
				h.logf("Failed to start game: %v", err)
			}
		case EVENT_REVEAL:
			if err = h.showLeaderboard(currentRoom.ID); err != nil {
				h.logf("Failed to reveal answer: %v", err)
			}
		case EVENT_NEXT:
			if currentRoom.Question.State == EVENT_REVEAL {
				if err = h.showLeaderboard(currentRoom.ID); err != nil {
					h.logf("Failed to show leaderboard: %v", err)
				}
			} else if currentRoom.Question.State == EVENT_REVEAL_SCORE {
				if err = h.nextQuestion(currentRoom.ID); err != nil {
					h.logf("Failed to send next question: %v", err)
				}
			}
		case EVENT_SKIP_QUESTION:
			if err = h.skipQuestion(currentRoom.ID); err != nil {
				h.logf("Failed to skip question: %v", err)
			}
		}
	}

	h.PrintRoomStatus()
}

func (h HostHandler) startGame(roomID string) error {
	room, exists := h.rooms[roomID]
	if !exists {
		return fmt.Errorf("room %s not found", roomID)
	}

	e := &Event{
		Event: EVENT_START,
		Content: struct {
			Sleep          int `json:"sleep"`
			TotalQuestions int `json:"totalQuestions"`
		}{
			Sleep:          5000,
			TotalQuestions: len(h.rooms[roomID].Bank.Questions),
		},
	}

	eJson, err := json.Marshal(&e)
	if err != nil {
		return fmt.Errorf("startGame: failed to marshal event: %v", err)
	}

	if err := h.broadcaster.BroadcastAll(room.HostConn, room.Players, eJson); err != nil {
		h.logf("startGame: failed to broadcast: %v", err)
	}

	time.Sleep(5 * time.Second)
	h.nextQuestion(roomID)

	return nil
}

func (h HostHandler) nextQuestion(roomID string) error {
	room, exists := h.rooms[roomID]
	if !exists {
		return fmt.Errorf("room %s not found", roomID)
	}

	// if finished send summary
	if room.Question.Index == len(room.Bank.Questions) {
		h.revealResults(roomID)
		return nil
	}

	room.Question.State = EVENT_QUESTION_PROMPT
	room.Question.Index++

	// send prompt only
	promptEvent := &Event{
		Event: EVENT_QUESTION_PROMPT,
		Content: struct {
			Prompt string `json:"prompt"`
			Sleep  int    `json:"sleep"`
		}{
			Prompt: room.Bank.Questions[room.Question.Index].Prompt,
			Sleep:  5000,
		},
	}

	promptJson, err := json.Marshal(promptEvent)
	if err != nil {
		h.logf("nextQuestion: failed to marshal prompt event: %v", err)
		return err
	}

	if err := h.broadcaster.BroadcastAll(room.HostConn, room.Players, promptJson); err != nil {
		h.logf("nextQuestion: failed to broadcast prompt: %v", err)
	}

	time.Sleep(5 * time.Second)

	room.Question.PostedAt = time.Now()
	room.Question.Answers = []string{}
	room.Question.AnswerDist = make(map[string]int)

	room.Skip.Used = false // Reset skip flag for new question
	room.Skip.Channel = make(chan struct{})

	e := &Event{
		Event: EVENT_QUESTION,
		Content: struct {
			QuestionPublic
			Sleep int `json:"sleep"`
		}{
			QuestionPublic{
				room.Bank.Questions[room.Question.Index].Prompt,
				room.Bank.Questions[room.Question.Index].AnswerBank,
			},
			20000,
		},
	}

	eJson, err := json.Marshal(&e)
	if err != nil {
		h.logf("nextQuestion: failed to marshal event: %v", err)
		return err
	}

	if err := h.broadcaster.BroadcastAll(room.HostConn, room.Players, eJson); err != nil {
		h.logf("nextQuestion: failed to broadcast question: %v", err)
	}

	timeout := time.After(30 * time.Second)
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if len(room.Question.Answers) == len(room.Players) {
				h.logf("All players answered, proceeding to reveal")

				allAnsweredEvent := &Event{
					Event: EVENT_ALL_ANSWERED,
					Content: struct {
						Sleep int `json:"sleep"`
					}{
						3000,
					},
				}

				allAnsweredJson, err := json.Marshal(allAnsweredEvent)
				if err != nil {
					h.logf("nextQuestion: failed to marshal all answered event: %v", err)
				}

				if err := h.broadcaster.BroadcastAll(room.HostConn, room.Players, allAnsweredJson); err != nil {
					h.logf("nextQuestion: failed to broadcast all answered event: %v", err)
				}

				time.Sleep(5 * time.Second)
				h.revealAnswer(roomID)
				return nil
			}
		case <-timeout:
			h.logf("Question time limit reached, proceeding to reveal")
			h.revealAnswer(roomID)
			return nil
		case <-room.Skip.Channel:
			h.logf("Host skipped question, proceeding to reveal")
			h.revealAnswer(roomID)
			return nil
		}
	}
}

func (h HostHandler) showLeaderboard(roomID string) error {
	room, exists := h.rooms[roomID]
	if !exists {
		return fmt.Errorf("room %s not found", roomID)
	}

	// Sort players by points in descending order
	type playerScore struct {
		ID     string `json:"id"`
		Points int    `json:"points"`
	}

	scores := make([]playerScore, 0, len(room.Players))
	for _, p := range room.Players {
		scores = append(scores, playerScore{
			ID:     p.ID,
			Points: p.Points,
		})
	}

	// Sort scores slice by points descending
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Points > scores[j].Points
	})

	// Get top 10 scores
	if len(scores) > 10 {
		scores = scores[:10]
	}

	room.Question.State = EVENT_REVEAL_SCORE
	e := &Event{
		Event: EVENT_REVEAL_SCORE,
		Content: struct {
			Scores []playerScore `json:"scores"`
		}{
			Scores: scores,
		},
	}

	eJson, err := json.Marshal(&e)
	if err != nil {
		h.logf("showLeaderboard: failed to marshal event: %v", err)
	}

	if err := h.broadcaster.SendTo(room.HostConn, eJson); err != nil {
		h.logf("showLeaderboard: failed to broadcast scores: %v", err)
	}

	return nil
}

func (h HostHandler) revealAnswer(roomID string) error {
	room, exists := h.rooms[roomID]
	if !exists {
		return fmt.Errorf("room %s not found", roomID)
	}

	room.Question.State = EVENT_REVEAL
	e := &Event{
		Event: EVENT_REVEAL,
		Content: struct {
			CorrectAnswer string         `json:"correctAnswer"`
			AnswerDist    map[string]int `json:"answerDistribution"`
		}{
			CorrectAnswer: room.Bank.Questions[room.Question.Index].CorrectAnswer,
			AnswerDist:    room.Question.AnswerDist,
		},
	}

	eJson, err := json.Marshal(&e)
	if err != nil {
		return fmt.Errorf("revealAnswer: failed to marshal event: %v", err)
	}

	if err := h.broadcaster.BroadcastAll(room.HostConn, room.Players, eJson); err != nil {
		h.logf("revealAnswer: failed to broadcast answer: %v", err)
	}

	// TODO: send to every player their score received from the answer

	return nil
}

func (h HostHandler) revealResults(roomID string) error {
	room, exists := h.rooms[roomID]
	if !exists {
		return fmt.Errorf("room %s not found", roomID)
	}
	room.Question.State = EVENT_FINISH

	// Sort players by points in descending order
	type playerScore struct {
		ID     string `json:"id"`
		Points int    `json:"points"`
	}

	scores := make([]playerScore, 0, len(room.Players))
	for _, p := range room.Players {
		scores = append(scores, playerScore{
			ID:     p.ID,
			Points: p.Points,
		})
	}

	// Sort scores slice by points descending
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Points > scores[j].Points
	})

	// Get top 10 scores
	if len(scores) > 10 {
		scores = scores[:10]
	}

	e := &Event{
		Event: EVENT_FINISH,
		Content: struct {
			Scores []playerScore `json:"scores"`
			Sleep  int           `json:"sleep"`
		}{
			Scores: scores,
			Sleep:  30000,
		},
	}

	eJson, err := json.Marshal(&e)
	if err != nil {
		return fmt.Errorf("revealResults: failed to marshal event: %v", err)
	}

	if err := h.broadcaster.BroadcastAll(room.HostConn, room.Players, eJson); err != nil {
		h.logf("revealResults: failed to broadcast results: %v", err)
	}

	time.Sleep(30 * time.Second)
	h.deleteRoom(roomID)

	return nil
}

// deleteRoom removes a room and disconnects all players within
func (h HostHandler) deleteRoom(roomID string) error {
	room, exists := h.rooms[roomID]
	if !exists {
		return fmt.Errorf("room %s not found", roomID)
	}

	// Disconnect all players in the room
	for _, player := range room.Players {
		player.Conn.Close(websocket.StatusNormalClosure, "Room has been closed")
	}

	// Remove the room from the map
	delete(h.rooms, roomID)

	h.logf("Room %s has been deleted", roomID)
	return nil
}

// creates a room assigned to a host
func (h HostHandler) createRoom(c *websocket.Conn) *Room {
	questions := []Question{
		{
			Prompt:        "What is 2 + 2?",
			AnswerBank:    []string{"3", "4", "5", "6"},
			CorrectAnswer: "4",
		},
		{
			Prompt:        "Which planet is closest to the Sun?",
			AnswerBank:    []string{"Venus", "Mars", "Mercury", "Earth"},
			CorrectAnswer: "Mercury",
		},
		{
			Prompt:        "What color is a banana?",
			AnswerBank:    []string{"Red", "Green", "Yellow", "Blue"},
			CorrectAnswer: "Yellow",
		},
	}

	b := &Bank{
		ID:        0,
		Title:     "Example Bank",
		Questions: questions,
	}

	r := &Room{
		ID:       h.generateRoomID(),
		Players:  []*Player{},
		HostConn: c,
		Bank:     b,
		Question: QuestionState{
			AnswerDist: make(map[string]int),
		},
		Skip: SkipControl{
			Channel: make(chan struct{}),
		},
	}

	h.rooms[r.ID] = r
	h.logf("Room %s created", r.ID)
	return r
}

func (h HostHandler) generateRoomID() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const length = 6

	for {
		b := make([]byte, length)
		for i := range b {
			b[i] = charset[rand.Intn(len(charset))]
		}
		roomID := string(b)

		if _, exists := h.rooms[roomID]; !exists {
			return roomID
		}
	}
}

func (h HostHandler) PrintRoomStatus() {
	fmt.Println("\n=== Room Status ===")
	for roomID, room := range h.rooms {
		fmt.Printf("\nRoom: %s\n", roomID)
		fmt.Printf("Players (%d):\n", len(room.Players))
		for _, player := range room.Players {
			fmt.Printf("- %s\n", player.ID)
		}
	}
	fmt.Println("===========")
}

func (h HostHandler) skipQuestion(roomID string) error {
	room, exists := h.rooms[roomID]
	if !exists {
		return fmt.Errorf("room %s not found", roomID)
	}

	// Check if skip has already been used for this question
	if room.Skip.Used {
		return fmt.Errorf("skip already used for this question")
	}

	// Signal the skip channel if it exists
	if room.Skip.Channel != nil {
		room.Skip.Used = true
		room.Skip.Channel <- struct{}{}
		return nil
	}

	h.logf("Warning: skip channel not initialized, revealing answer directly")
	return h.revealAnswer(roomID)
}

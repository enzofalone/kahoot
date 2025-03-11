package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/coder/websocket"
)

type PlayerHandler struct {
	logf        func(format string, args ...interface{})
	rooms       map[string]*Room
	broadcaster *Broadcaster
}

func NewPlayerHandler(logf func(format string, args ...interface{}), rooms map[string]*Room) *PlayerHandler {
	return &PlayerHandler{
		logf:        logf,
		rooms:       rooms,
		broadcaster: NewBroadcaster(logf),
	}
}

func (p PlayerHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	c, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		Subprotocols:   []string{"kahoot-player"},
		OriginPatterns: []string{"127.0.0.1:5173"},
	})
	if err != nil {
		p.logf("%v", err)
		return
	}
	defer c.CloseNow()

	if c.Subprotocol() != "kahoot-player" {
		c.Close(websocket.StatusPolicyViolation, "client must speak the echo subprotocol")
		return
	}

	// Get room and player IDs from headers
	playerID := r.Header.Get("Player-ID")
	if len(playerID) == 0 {
		c.Close(websocket.StatusPolicyViolation, "Player ID is required")
		return
	}

	roomID := r.Header.Get("Room-ID")
	if len(roomID) == 0 {
		c.Close(websocket.StatusPolicyViolation, "Room ID is required")
		return
	}

	// Check if room exists
	room, exists := p.rooms[roomID]
	if !exists {
		c.Close(websocket.StatusPolicyViolation, "Room not found")
		return
	}

	// Check for duplicate player ID
	for _, existingPlayer := range room.Players {
		if existingPlayer.ID == playerID {
			c.Close(websocket.StatusPolicyViolation, "Player ID already exists in room")
			return
		}
	}

	// Create and add player to room
	player := &Player{
		ID:     playerID,
		Points: 0,
		Conn:   c,
	}

	if err := p.addPlayerToRoom(player, roomID); err != nil {
		p.logf("Failed to add player to room: %v", err)
		c.Close(websocket.StatusPolicyViolation, "Failed to join room")
		return
	}
	defer p.removePlayerFromRoom(player.ID, roomID)

	// Send join confirmation
	JoinConfirm := &Event{
		Event: EVENT_JOIN,
		Content: &PlayerJoin{
			PlayerId: playerID,
		},
	}

	joinConfirmJson, err := json.Marshal(JoinConfirm)
	if err != nil {
		p.logf("Failed to marshal join confirmation: %v", err)
		return
	}

	if err := p.broadcaster.SendTo(room.HostConn, joinConfirmJson); err != nil {
		p.logf("Failed to send join confirmation: %v", err)
		return
	}

	// Handle player events
	for {
		_, reader, err := c.Reader(context.Background())
		if err != nil {
			p.logf("Failed to get reader: %v", err)
			break
		}

		message, err := io.ReadAll(reader)
		if err != nil {
			p.logf("Failed to read message: %v", err)
			break
		}

		var event Event
		if err := json.Unmarshal(message, &event); err != nil {
			p.logf("Failed to unmarshal event: %v", err)
			continue
		}

		// Handle player events
		switch event.Event {
		case EVENT_QUESTION:
			answer, ok := event.Content.(string)
			if !ok {
				p.logf("Invalid answer format")
				continue
			}

			if err := p.answerQuestion(playerID, answer, roomID); err != nil {
				p.logf("Failed to process answer: %v", err)
			}
		}
	}

	// notify host player has disconnected
	disconnectEvent := &Event{
		Event: EVENT_DISCONNECT,
		Content: &PlayerDisconnect{
			ID: playerID,
		},
	}

	disconnectEventJson, err := json.Marshal(&disconnectEvent)
	if err != nil {
		p.logf("Error while marshalling disconnect event for %s to host in room %s", playerID, room.ID)
		return
	}

	if err := p.broadcaster.SendTo(room.HostConn, disconnectEventJson); err != nil {
		p.logf("Failed to send disconnect event to host: %v", err)
		return
	}
}

func (p PlayerHandler) answerQuestion(playerID string, answer string, roomID string) error {
	room, exists := p.rooms[roomID]
	if !exists {
		p.logf("answerQuestion: room %s does not exist!", roomID)
		return fmt.Errorf("room %s does not exist for player %s", roomID, playerID)
	}

	var player *Player
	for _, p := range room.Players {
		if p.ID == playerID {
			player = p
			break
		}
	}

	if player == nil {
		p.logf("answerQuestion: player %s does not exist in room %s!", playerID, roomID)
		return fmt.Errorf("player %s does not exist in room %s", playerID, roomID)
	}

	// Check if player has already answered this question
	for _, answeredID := range room.Question.Answers {
		if answeredID == playerID {
			p.logf("answerQuestion: player %s already answered question %d", playerID, room.Question.Index)
			return fmt.Errorf("player %s already answered this question", playerID)
		}
	}

	// Calculate score if the user answered correctly
	if answer == room.Bank.Questions[room.Question.Index].CorrectAnswer {
		player.Points += calculateScore(room.Question.PostedAt)
	}

	room.Question.Answers = append(room.Question.Answers, player.ID)
	room.Question.AnswerDist[answer]++

	// Send confirmation to host and player
	answerEvent := &Event{
		Event: EVENT_ANSWER,
		Content: &PlayerAnswer{
			ID: playerID,
		},
	}

	answerEventJson, err := json.Marshal(answerEvent)
	if err != nil {
		return fmt.Errorf("error marshalling answer event confirmation json %w", err)
	}

	if err := p.broadcaster.SendToArray([]*websocket.Conn{p.rooms[roomID].HostConn, player.Conn}, answerEventJson); err != nil {
		p.logf("Failed to send answer event to host: %v", err)
		return err
	}

	return nil
}

func (p PlayerHandler) addPlayerToRoom(player *Player, roomID string) error {
	room, exists := p.rooms[roomID]
	if !exists {
		return fmt.Errorf("room %s not found", roomID)
	}

	room.Players = append(room.Players, player)
	return nil
}

func (p PlayerHandler) removePlayerFromRoom(playerID string, roomID string) error {
	room, exists := p.rooms[roomID]
	if !exists {
		return fmt.Errorf("room %s not found", roomID)
	}

	for i, player := range room.Players {
		if player.ID == playerID {
			room.Players = append(room.Players[:i], room.Players[i+1:]...)
			return nil
		}
	}

	return fmt.Errorf("player %s not found in room %s", playerID, roomID)
}

// calculateScore determines points based on how quickly the player answered
func calculateScore(questionPostedAt time.Time) int {
	elapsed := time.Since(questionPostedAt)
	maxScore := 1000
	minScore := 100
	timeLimit := 30 * time.Second

	if elapsed >= timeLimit {
		return minScore
	}

	// Calculate score based on time taken
	score := float64(maxScore) * (1 - (elapsed.Seconds() / timeLimit.Seconds()))
	return int(score)
}

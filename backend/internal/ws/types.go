package ws

import (
	"time"

	"github.com/coder/websocket"
)

// Player represents a connected player
type Player struct {
	ID     string
	Points int
	Conn   *websocket.Conn
}

type PlayerScore struct {
	ID     string `json:"id"`
	Points int    `json:"points"`
}

// Room represents a game room with connected players
type Room struct {
	ID       string
	Players  []*Player
	HostConn *websocket.Conn
	Bank     *Bank
	Question QuestionState
	Skip     SkipControl
}

// QuestionState maintains the current state of a question
type QuestionState struct {
	Index      int            // current question index in the bank
	Answers    []string       // store IDs of every player that has answered
	AnswerDist map[string]int // distribution of answers
	PostedAt   time.Time      // track when the question was shown to players
	State      string         // current state of the question (reveal, score, etc)
}

// SkipControl manages the skip functionality for questions
type SkipControl struct {
	Channel chan struct{}
	Used    bool
}

// Bank represents a collection of questions
type Bank struct {
	ID        int
	Title     string
	Questions []Question
}

// Question represents a single quiz question
type Question struct {
	ID            int
	BankID        int
	Prompt        string
	AnswerBank    []string
	CorrectAnswer string
}

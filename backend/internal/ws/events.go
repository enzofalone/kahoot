package ws

// Event types
const (
	EVENT_START           = "event_start"             // start game
	EVENT_NEXT            = "event_next"              // go to next question
	EVENT_NEXT_READY      = "event_next_ready"        // event to tell host is ready to click to next question
	EVENT_QUESTION        = "event_question"          // display question and answer bank
	EVENT_QUESTION_PROMPT = "event_question_prompt"   // display only question's prompt
	EVENT_REVEAL          = "event_reveal"            // reveal current question's answer
	EVENT_REVEAL_SCORE    = "event_reveal_score"      // reveal score of leaderboard
	EVENT_FINISH          = "event_finish"            // show results of game
	EVENT_ALL_ANSWERED    = "event_all_answered"      // send to players that all room
	EVENT_SKIP_QUESTION   = "event_skip_question"     // end current question's timer regardless of how many players have answered
	EVENT_ANSWER          = "event_answer"            // player answer
	EVENT_JOIN            = "event_player_join"       // player has joined
	EVENT_DISCONNECT      = "event_player_disconnect" // player disconnected
)

// Question states
const (
	STATE_REVEAL_ANSWER      = "state_reveal_answer"
	STATE_REVEAL_LEADERBOARD = "state_reveal_leaderboard"
)

// Event represents a WebSocket event message
type Event struct {
	Event   string      `json:"event"`
	Content interface{} `json:"content"`
}

// QuestionPublic represents the public question data sent to players
type QuestionPublic struct {
	Prompt     string   `json:"prompt"`
	AnswerBank []string `json:"answerBank"`
}

type PlayerJoin struct {
	PlayerId string `json:"playerId"`
}

type PlayerAnswer struct {
	ID string `json:"id"`
}

type PlayerDisconnect struct {
	ID string `json:"id"`
}

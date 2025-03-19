package ws

type RoomCreated struct {
	RoomCode string `json:"roomCode"`
}

type Start struct {
	Sleep          int `json:"sleep"`
	TotalQuestions int `json:"totalQuestions"`
}

type Prompt struct {
	Prompt string `json:"prompt"`
	Sleep  int    `json:"sleep"`
}

type AllAnswered struct {
	Sleep int `json:"sleep"`
}

type RevealScore struct {
	Scores []PlayerScore `json:"scores"`
}

type Reveal struct {
	CorrectAnswer string         `json:"correctAnswer"`
	AnswerDist    map[string]int `json:"answerDistribution"`
}

type Finish struct {
	Scores []PlayerScore `json:"scores"`
	Sleep  int           `json:"sleep"`
}

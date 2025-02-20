export enum EventType {
  START = 'event_start', // start game
  NEXT = 'event_next', // go to next question
  NEXT_READY = 'event_next_ready', // event to tell host is ready to click to next question
  QUESTION = 'event_question', // display question and answer bank
  REVEAL = 'event_reveal', // reveal current question's answer
  REVEAL_SCORE = 'event_reveal_score', // reveal score of leaderboard
  FINISH = 'event_finish', // show results of game
  ALL_ANSWERED = 'event_all_answered', // send to players that all room
  SKIP_QUESTION = 'event_skip_question', // end current question's timer regardless of how many players have answered
  ANSWER = 'event_answer', // player answer
  JOIN = 'event_player_join', // player has joined
  DISCONNECT = 'event_player_disconnect', // player disconnected
}

export type Event = {
  event: EventType;
  content?: string;
};

export const createEvent = (eventType: EventType, content?: string) => {
  return { event: eventType, content } as Event;
};

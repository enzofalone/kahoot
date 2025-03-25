import { Player } from './player';

export enum EventType {
  START = 'event_start', // start game
  NEXT = 'event_next', // go to next question
  NEXT_READY = 'event_next_ready', // event to tell host is ready to click to next question
  QUESTION = 'event_question', // display question and answer bank
  PROMPT = 'event_question_prompt', // display question only
  REVEAL = 'event_reveal', // reveal current question's answer
  REVEAL_SCORE = 'event_reveal_score', // reveal score of leaderboard
  FINISH = 'event_finish', // show results of game
  ALL_ANSWERED = 'event_all_answered', // send to players that all room
  SKIP_QUESTION = 'event_skip_question', // end current question's timer regardless of how many players have answered
  ANSWER = 'event_answer', // player answer
  JOIN = 'event_player_join', // player has joined
  DISCONNECT = 'event_player_disconnect', // player disconnected
  ROOM_CREATED = 'event_room_created', // room created confirmation
}

export type BaseEvent<T> = {
  event: EventType;
  content?: T;
};

export type EventStartGame = {
  sleep: number;
  totalQuestions: number;
};

export type EventPrompt = {
  prompt: string;
  sleep: number;
};

export type EventQuestion = {
  prompt: string;
  answerBank: string[];
  sleep: number;
};

export type EventReveal = {
  correctAnswer: string;
  answerDistribution: Record<string, number>;
};

export type EventRevealLeaderboard = {
  scores: Player[];
};

export type EventQuestionSkipped = {
  sleep: number;
};

export type EventJoin = {
  playerId: string;
};

export type EventDisconnect = EventJoin;

export type EventAnswer = {
  playerId: string;
};

export type EventRoomCreated = {
  roomCode: string;
};

type EventAllAnswered = {
  sleep: number;
};

export type EventPayloads = {
  [EventType.ROOM_CREATED]: EventRoomCreated;
  [EventType.START]: EventStartGame;
  [EventType.JOIN]: EventJoin;
  [EventType.DISCONNECT]: EventDisconnect;
  [EventType.PROMPT]: EventPrompt;
  [EventType.QUESTION]: EventQuestion;
  [EventType.SKIP_QUESTION]: EventQuestionSkipped;
  [EventType.REVEAL_SCORE]: EventRevealLeaderboard;
  [EventType.ANSWER]: EventAnswer;
  [EventType.REVEAL]: EventReveal;
  [EventType.ALL_ANSWERED]: EventAllAnswered;
};

export const createEvent = <T>(
  eventType: EventType,
  content?: BaseEvent<T>
): string => {
  return JSON.stringify({ event: eventType, content } as BaseEvent<T>);
};

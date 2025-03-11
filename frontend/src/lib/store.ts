import { create } from 'zustand';

type GameStore = {
  answerBank: string[];
  setAnswerBank: (newAnswerBank: string[]) => void;

  prompt: string;
  setPrompt: (newPrompt: string) => void;

  clearQuestion: () => void;

  roomCode: string;
  setRoomCode: (newRoomCode: string) => void;

  questionIndex: number;
  incrementQuestionIndex: () => void;

  totalQuestions: number;
  setTotalQuestions: (n: number) => void;

  answers: number;
  incrementAnswers: () => void;
  //   state: EventType;
  //   setState: (newState: EventType) => void;
};

type LobbyStore = {
  players: string[];
  addPlayer: (p: string) => void;
  removePlayer: (p: string) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  prompt: '',
  setPrompt: (newPrompt) => set({ prompt: newPrompt }),

  answerBank: [],
  setAnswerBank: (newAnswerBank) => set({ answerBank: newAnswerBank }),

  roomCode: '',
  setRoomCode: (newRoomCode) => set({ roomCode: newRoomCode }),

  clearQuestion: () => set({ prompt: '', answerBank: [], answers: 0 }),

  questionIndex: 0,
  incrementQuestionIndex: () =>
    set((state) => ({
      questionIndex: state.questionIndex + 1,
    })),

  totalQuestions: 0,
  setTotalQuestions: (n) => set({ totalQuestions: n }),

  answers: 0,
  incrementAnswers: () => set({ answers: 0 }),
}));

export const useLobbyStore = create<LobbyStore>((set) => ({
  players: [],
  addPlayer: (p) =>
    set((state) => {
      if (!state.players.includes(p)) {
        state.players.push(p);
      }
      return state;
    }),
  removePlayer: () => {},
}));

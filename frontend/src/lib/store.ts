import { Player } from '@/util/player';
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

  //   state: EventType;
  //   setState: (newState: EventType) => void;
};

type LobbyStore = {
  players: Player[];
  addPlayer: (pName: string) => void;
  removePlayer: (pName: string) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  prompt: '',
  setPrompt: (newPrompt) => set({ prompt: newPrompt }),

  answerBank: [],
  setAnswerBank: (newAnswerBank) => set({ answerBank: newAnswerBank }),

  roomCode: '',
  setRoomCode: (newRoomCode) => set({ roomCode: newRoomCode }),

  clearQuestion: () => set({ prompt: '', answerBank: [] }),

  questionIndex: 0,
  incrementQuestionIndex: () =>
    set((state) => ({
      questionIndex: state.questionIndex + 1,
    })),

  totalQuestions: 0,
  setTotalQuestions: (n) => set({ totalQuestions: n }),
}));

export const useLobbyStore = create<LobbyStore>((set) => ({
  players: [],
  addPlayer: (ID) =>
    set((state) => {
      const duplicate = state.players.some((player) => player.ID === ID);

      if (!duplicate) {
        return {
          players: [
            ...state.players,
            { ID, profilePic: Math.round(Math.random()) },
          ],
        };
      }

      return state;
    }),
  removePlayer: (ID) =>
    set((state) => {
      const updatedPlayers = state.players.filter((player) => player.ID !== ID);
      return { players: updatedPlayers };
    }),
}));

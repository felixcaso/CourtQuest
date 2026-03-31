import { create } from 'zustand';
import { MOCK_GAMES } from '../constants/mockData';

const useGameStore = create((set) => ({
  games: MOCK_GAMES,

  addGame: (game) =>
    set((state) => ({ games: [...state.games, game] })),

  joinGame: (gameId) =>
    set((state) => ({
      games: state.games.map((g) =>
        g.id === gameId && g.players < g.maxPlayers
          ? { ...g, players: g.players + 1 }
          : g
      ),
    })),
}));

export default useGameStore;

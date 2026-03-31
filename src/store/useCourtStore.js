import { create } from 'zustand';
import { MOCK_COURTS } from '../constants/mockData';

const useCourtStore = create((set) => ({
  courts: MOCK_COURTS,
  selectedCourt: null,
  kingClaims: {},

  selectCourt: (court) => set({ selectedCourt: court }),

  claimCourt: (courtId, userId) =>
    set((state) => ({
      kingClaims: { ...state.kingClaims, [courtId]: userId },
    })),
}));

export default useCourtStore;

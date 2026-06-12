import { create } from 'zustand';

interface GlobalLoaderState {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useGlobalLoaderStore = create<GlobalLoaderState>((set) => ({
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

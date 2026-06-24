import { create } from "zustand";

import React from "react";

interface ModalState {
  content: boolean | React.ReactNode;
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
}

export const useModal = create<ModalState>((set) => ({
  content: false,
  showModal: (content) => set({ content }),
  hideModal: () => set({ content: false }),
}));

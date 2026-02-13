import { create } from "zustand";

export type TourStep = {
  target: string;
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right";
  route?: string;
};

type TourStore = {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  completedTours: string[];
  startTour: (steps: TourStep[], tourId?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  skipTour: () => void;
};

const STORAGE_KEY = "forge-completed-tours";

function loadCompletedTours(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCompletedTours(tours: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tours));
}

export const useTourStore = create<TourStore>((set, get) => ({
  isActive: false,
  currentStep: 0,
  steps: [],
  completedTours: loadCompletedTours(),

  startTour: (steps, tourId) => {
    if (tourId) {
      const completed = get().completedTours;
      if (completed.includes(tourId)) return;
    }
    set({ isActive: true, currentStep: 0, steps });
  },

  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      get().endTour();
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  endTour: () => {
    const completed = [...get().completedTours];
    if (!completed.includes("welcome")) {
      completed.push("welcome");
    }
    saveCompletedTours(completed);
    set({ isActive: false, currentStep: 0, steps: [], completedTours: completed });
  },

  skipTour: () => {
    get().endTour();
  },
}));

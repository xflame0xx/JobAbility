import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  EMPTY_VACANCY_FILTERS,
  type VacancyFilters,
} from "../types/vacancy";

const STORAGE_KEY = "jobability_vacancy_filters";

interface VacancyFiltersState {
  draft: VacancyFilters;
  applied: VacancyFilters;
}

const readFiltersFromStorage = (): VacancyFiltersState => {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return {
        draft: EMPTY_VACANCY_FILTERS,
        applied: EMPTY_VACANCY_FILTERS,
      };
    }

    const parsedValue = JSON.parse(rawValue) as Partial<VacancyFiltersState>;

    return {
      draft: {
        ...EMPTY_VACANCY_FILTERS,
        ...parsedValue.draft,
      },
      applied: {
        ...EMPTY_VACANCY_FILTERS,
        ...parsedValue.applied,
      },
    };
  } catch {
    return {
      draft: EMPTY_VACANCY_FILTERS,
      applied: EMPTY_VACANCY_FILTERS,
    };
  }
};

const saveFiltersToStorage = (state: VacancyFiltersState) => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      draft: state.draft,
      applied: state.applied,
    }),
  );
};

const initialState: VacancyFiltersState = readFiltersFromStorage();

export const vacancyFiltersSlice = createSlice({
  name: "vacancyFilters",
  initialState,
  reducers: {
    setDraftVacancyFilters: (
      state,
      action: PayloadAction<VacancyFilters>,
    ) => {
      state.draft = action.payload;
      saveFiltersToStorage(state);
    },

    applyVacancyFilters: (state) => {
      state.applied = state.draft;
      saveFiltersToStorage(state);
    },

    resetVacancyFilters: (state) => {
      state.draft = EMPTY_VACANCY_FILTERS;
      state.applied = EMPTY_VACANCY_FILTERS;
      saveFiltersToStorage(state);
    },
  },
});

export const {
  setDraftVacancyFilters,
  applyVacancyFilters,
  resetVacancyFilters,
} = vacancyFiltersSlice.actions;

export const vacancyFiltersReducer = vacancyFiltersSlice.reducer;

import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  ApplicationGeneratedApi,
  getApiErrorMessage,
  VacancyGeneratedApi,
} from "../generated/jobabilityApi";
import {
  EMPTY_VACANCY_FILTERS,
  type Vacancy,
  type VacancyFilters,
} from "../types/vacancy";
import type { ApplicationCart } from "../types/application";

interface VacanciesState {
  filters: VacancyFilters;
  appliedFilters: VacancyFilters;
  items: Vacancy[];
  cart: ApplicationCart | null;
  loading: boolean;
  cartLoading: boolean;
  addingVacancyId: number | null;
  error: string;
  success: string;
}

const initialState: VacanciesState = {
  filters: EMPTY_VACANCY_FILTERS,
  appliedFilters: EMPTY_VACANCY_FILTERS,
  items: [],
  cart: null,
  loading: false,
  cartLoading: false,
  addingVacancyId: null,
  error: "",
  success: "",
};

export const fetchVacanciesThunk = createAsyncThunk<
  Vacancy[],
  void,
  { state: { vacancies: VacanciesState }; rejectValue: string }
>("vacancies/fetchVacancies", async (_, { getState, rejectWithValue }) => {
  try {
    return await VacancyGeneratedApi.vacancyList(getState().vacancies.appliedFilters);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const fetchCartThunk = createAsyncThunk<
  ApplicationCart,
  void,
  { rejectValue: string }
>("vacancies/fetchCart", async (_, { rejectWithValue }) => {
  try {
    return await ApplicationGeneratedApi.applicationCartGet();
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const addVacancyToDraftThunk = createAsyncThunk<
  ApplicationCart,
  number,
  { rejectValue: string }
>("vacancies/addVacancyToDraft", async (vacancyId, { rejectWithValue }) => {
  try {
    await ApplicationGeneratedApi.applicationLineAdd(vacancyId);
    return await ApplicationGeneratedApi.applicationCartGet();
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

const vacanciesSlice = createSlice({
  name: "vacancies",
  initialState,
  reducers: {
    setVacancyFilters(state, action: PayloadAction<VacancyFilters>) {
      state.filters = action.payload;
    },
    applyVacancyFilters(state) {
      state.appliedFilters = state.filters;
    },
    resetVacancyFilters(state) {
      state.filters = EMPTY_VACANCY_FILTERS;
      state.appliedFilters = EMPTY_VACANCY_FILTERS;
    },
    clearVacancyMessage(state) {
      state.error = "";
      state.success = "";
    },
    clearCart(state) {
      state.cart = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVacanciesThunk.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchVacanciesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVacanciesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Не удалось загрузить вакансии";
      })
      .addCase(fetchCartThunk.pending, (state) => {
        state.cartLoading = true;
      })
      .addCase(fetchCartThunk.fulfilled, (state, action) => {
        state.cartLoading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCartThunk.rejected, (state) => {
        state.cartLoading = false;
        state.cart = null;
      })
      .addCase(addVacancyToDraftThunk.pending, (state, action) => {
        state.addingVacancyId = action.meta.arg;
        state.error = "";
        state.success = "";
      })
      .addCase(addVacancyToDraftThunk.fulfilled, (state, action) => {
        state.addingVacancyId = null;
        state.cart = action.payload;
        state.success = "Вакансия добавлена в текущую заявку";
      })
      .addCase(addVacancyToDraftThunk.rejected, (state, action) => {
        state.addingVacancyId = null;
        state.error = action.payload || "Не удалось добавить вакансию";
      });
  },
});

export const {
  setVacancyFilters,
  applyVacancyFilters,
  resetVacancyFilters,
  clearVacancyMessage,
  clearCart,
} = vacanciesSlice.actions;
export const vacanciesReducer = vacanciesSlice.reducer;

import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  deleteApplication,
  deleteApplicationLine,
  fetchApplicationById,
  fetchApplications,
  formApplication,
  moderateApplication,
  updateApplication,
  updateApplicationLine,
} from "../api/applicationApi";
import {
  EMPTY_APPLICATION_FILTERS,
  type ApplicationDetail,
  type ApplicationFilters,
  type ApplicationLine,
  type ApplicationLineUpdatePayload,
  type ApplicationListItem,
  type ApplicationModerationPayload,
  type ApplicationUpdatePayload,
} from "../types/application";

interface ApplicationsState {
  filters: ApplicationFilters;
  appliedFilters: ApplicationFilters;
  items: ApplicationListItem[];
  detail: ApplicationDetail | null;
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  processingId: number | null;
  error: string;
  success: string;
  lastPollAt: string | null;
}

const initialState: ApplicationsState = {
  filters: EMPTY_APPLICATION_FILTERS,
  appliedFilters: EMPTY_APPLICATION_FILTERS,
  items: [],
  detail: null,
  listLoading: false,
  detailLoading: false,
  saving: false,
  processingId: null,
  error: "",
  success: "",
  lastPollAt: null,
};

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Не удалось выполнить запрос";

export const fetchApplicationsThunk = createAsyncThunk<
  ApplicationListItem[],
  void,
  { state: { applications: ApplicationsState }; rejectValue: string }
>("applications/fetchApplications", async (_, { getState, rejectWithValue }) => {
  const { status, dateFrom, dateTo } = getState().applications.appliedFilters;

  try {
    return await fetchApplications({ status, dateFrom, dateTo, creator: "" });
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const fetchApplicationByIdThunk = createAsyncThunk<
  ApplicationDetail,
  string,
  { rejectValue: string }
>("applications/fetchById", async (id, { rejectWithValue }) => {
  try {
    return await fetchApplicationById(id);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const updateApplicationThunk = createAsyncThunk<
  ApplicationDetail,
  { id: number; payload: ApplicationUpdatePayload },
  { rejectValue: string }
>("applications/update", async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await updateApplication(id, payload);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const updateApplicationLineThunk = createAsyncThunk<
  ApplicationLine,
  ApplicationLineUpdatePayload,
  { rejectValue: string }
>("applications/updateLine", async (payload, { rejectWithValue }) => {
  try {
    return await updateApplicationLine(payload);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const deleteApplicationLineThunk = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("applications/deleteLine", async (vacancyId, { rejectWithValue }) => {
  try {
    await deleteApplicationLine(vacancyId);
    return vacancyId;
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const formApplicationThunk = createAsyncThunk<
  ApplicationDetail,
  number,
  { rejectValue: string }
>("applications/form", async (id, { rejectWithValue }) => {
  try {
    return await formApplication(id);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const deleteApplicationThunk = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("applications/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteApplication(id);
    return id;
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const moderateApplicationThunk = createAsyncThunk<
  ApplicationDetail,
  { id: number; payload: ApplicationModerationPayload },
  { rejectValue: string }
>("applications/moderate", async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await moderateApplication(id, payload);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const replaceDetailLine = (
  detail: ApplicationDetail | null,
  updatedLine: ApplicationLine,
): ApplicationDetail | null => {
  if (!detail) {
    return detail;
  }

  const lines = detail.lines.map((line) =>
    line.vacancy.id === updatedLine.vacancy.id ? updatedLine : line,
  );

  const totalSalary = lines.reduce(
    (sum, line) => sum + (line.line_salary_total ?? line.qty * line.vacancy.salary),
    0,
  );

  return {
    ...detail,
    lines,
    total_salary: totalSalary,
  };
};

const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    setApplicationFilters(state, action: PayloadAction<ApplicationFilters>) {
      state.filters = action.payload;
    },
    applyApplicationFilters(state) {
      state.appliedFilters = state.filters;
    },
    resetApplicationFilters(state) {
      state.filters = EMPTY_APPLICATION_FILTERS;
      state.appliedFilters = EMPTY_APPLICATION_FILTERS;
    },
    clearApplicationMessage(state) {
      state.error = "";
      state.success = "";
    },
    clearApplicationDetail(state) {
      state.detail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplicationsThunk.pending, (state) => {
        state.listLoading = true;
        state.error = "";
      })
      .addCase(fetchApplicationsThunk.fulfilled, (state, action) => {
        state.listLoading = false;
        state.items = action.payload;
        state.lastPollAt = new Date().toISOString();
      })
      .addCase(fetchApplicationsThunk.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload || "Не удалось загрузить заявки";
      })
      .addCase(fetchApplicationByIdThunk.pending, (state) => {
        state.detailLoading = true;
        state.error = "";
        state.success = "";
      })
      .addCase(fetchApplicationByIdThunk.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchApplicationByIdThunk.rejected, (state, action) => {
        state.detailLoading = false;
        state.detail = null;
        state.error = action.payload || "Не удалось загрузить заявку";
      })
      .addCase(updateApplicationThunk.pending, (state) => {
        state.saving = true;
        state.error = "";
        state.success = "";
      })
      .addCase(updateApplicationThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.detail = action.payload;
        state.success = "Данные заявки сохранены";
      })
      .addCase(updateApplicationThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Не удалось сохранить заявку";
      })
      .addCase(updateApplicationLineThunk.pending, (state) => {
        state.saving = true;
        state.error = "";
        state.success = "";
      })
      .addCase(updateApplicationLineThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.detail = replaceDetailLine(state.detail, action.payload);
        state.success = "Строка заявки изменена";
      })
      .addCase(updateApplicationLineThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Не удалось изменить строку заявки";
      })
      .addCase(deleteApplicationLineThunk.pending, (state) => {
        state.saving = true;
        state.error = "";
        state.success = "";
      })
      .addCase(deleteApplicationLineThunk.fulfilled, (state, action) => {
        state.saving = false;
        if (state.detail) {
          state.detail.lines = state.detail.lines.filter(
            (line) => line.vacancy.id !== action.payload,
          );
        }
        state.success = "Вакансия удалена из заявки";
      })
      .addCase(deleteApplicationLineThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Не удалось удалить вакансию из заявки";
      })
      .addCase(formApplicationThunk.pending, (state, action) => {
        state.processingId = action.meta.arg;
        state.error = "";
        state.success = "";
      })
      .addCase(formApplicationThunk.fulfilled, (state, action) => {
        state.processingId = null;
        state.detail = action.payload;
        state.success = "Заявка сформирована";
      })
      .addCase(formApplicationThunk.rejected, (state, action) => {
        state.processingId = null;
        state.error = action.payload || "Не удалось сформировать заявку";
      })
      .addCase(moderateApplicationThunk.pending, (state, action) => {
        state.processingId = action.meta.arg.id;
        state.error = "";
        state.success = "";
      })
      .addCase(moderateApplicationThunk.fulfilled, (state, action) => {
        state.processingId = null;
        state.detail = action.payload;
        state.items = state.items.map((item) =>
          item.id === action.payload.id
            ? {
                ...item,
                status: action.payload.status,
                moderator_login: action.payload.moderator_login,
                completed_at: action.payload.completed_at,
              }
            : item,
        );
        state.success = "Статус заявки изменён модератором";
      })
      .addCase(moderateApplicationThunk.rejected, (state, action) => {
        state.processingId = null;
        state.error = action.payload || "Не удалось обработать заявку";
      })
      .addCase(deleteApplicationThunk.fulfilled, (state, action) => {
        state.detail = null;
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const {
  setApplicationFilters,
  applyApplicationFilters,
  resetApplicationFilters,
  clearApplicationMessage,
  clearApplicationDetail,
} = applicationsSlice.actions;
export const applicationsReducer = applicationsSlice.reducer;

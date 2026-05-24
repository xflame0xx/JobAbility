import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchApplicantProfile,
  updateApplicantProfile,
} from "../api/cabinetApi";
import type { ApplicantProfile } from "../types/application";

interface ProfileState {
  profile: ApplicantProfile | null;
  loading: boolean;
  saving: boolean;
  error: string;
  success: string;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  saving: false,
  error: "",
  success: "",
};

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Не удалось выполнить запрос";

export const fetchProfileThunk = createAsyncThunk<
  ApplicantProfile,
  void,
  { rejectValue: string }
>("profile/fetch", async (_, { rejectWithValue }) => {
  try {
    return await fetchApplicantProfile();
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const updateProfileThunk = createAsyncThunk<
  ApplicantProfile,
  ApplicantProfile,
  { rejectValue: string }
>("profile/update", async (payload, { rejectWithValue }) => {
  try {
    return await updateApplicantProfile(payload, null);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileMessage(state) {
      state.error = "";
      state.success = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileThunk.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Не удалось загрузить профиль";
      })
      .addCase(updateProfileThunk.pending, (state) => {
        state.saving = true;
        state.error = "";
        state.success = "";
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.profile = action.payload;
        state.success = "Профиль сохранён";
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Не удалось сохранить профиль";
      });
  },
});

export const { clearProfileMessage } = profileSlice.actions;
export const profileReducer = profileSlice.reducer;

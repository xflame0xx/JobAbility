import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getApiErrorMessage,
  ProfileGeneratedApi,
} from "../generated/jobabilityApi";
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

export const fetchProfileThunk = createAsyncThunk<
  ApplicantProfile,
  void,
  { rejectValue: string }
>("profile/fetch", async (_, { rejectWithValue }) => {
  try {
    return await ProfileGeneratedApi.applicantProfileGet();
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const updateProfileThunk = createAsyncThunk<
  ApplicantProfile,
  ApplicantProfile,
  { rejectValue: string }
>("profile/update", async (payload, { rejectWithValue }) => {
  try {
    return await ProfileGeneratedApi.applicantProfileUpdate(payload);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
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

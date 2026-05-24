import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  changePassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../api/authApi";
import type {
  CurrentUser,
  LoginPayload,
  PasswordChangePayload,
  RegisterPayload,
} from "../types/auth";

interface AuthState {
  user: CurrentUser | null;
  initialized: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string;
  passwordStatus: "idle" | "loading" | "succeeded" | "failed";
  passwordError: string;
}

const initialState: AuthState = {
  user: null,
  initialized: false,
  status: "idle",
  error: "",
  passwordStatus: "idle",
  passwordError: "",
};

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Не удалось выполнить запрос";

export const loadCurrentUserThunk = createAsyncThunk<
  CurrentUser | null,
  void,
  { rejectValue: string }
>("auth/loadCurrentUser", async (_, { rejectWithValue }) => {
  try {
    return await getCurrentUser();
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const loginThunk = createAsyncThunk<
  CurrentUser,
  LoginPayload,
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    return await loginUser(payload);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const registerThunk = createAsyncThunk<
  void,
  RegisterPayload,
  { rejectValue: string }
>("auth/register", async (payload, { rejectWithValue }) => {
  try {
    await registerUser(payload);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutUser();
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

export const changePasswordThunk = createAsyncThunk<
  void,
  PasswordChangePayload,
  { rejectValue: string }
>("auth/changePassword", async (payload, { rejectWithValue }) => {
  try {
    await changePassword(payload);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = "";
    },
    resetPasswordStatus(state) {
      state.passwordStatus = "idle";
      state.passwordError = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCurrentUserThunk.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loadCurrentUserThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
        state.status = "succeeded";
      })
      .addCase(loadCurrentUserThunk.rejected, (state, action) => {
        state.user = null;
        state.initialized = true;
        state.status = "failed";
        state.error = action.payload || "Не удалось проверить авторизацию";
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
        state.status = "succeeded";
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Ошибка входа";
      })
      .addCase(registerThunk.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Ошибка регистрации";
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.initialized = true;
        state.status = "idle";
        state.error = "";
      })
      .addCase(changePasswordThunk.pending, (state) => {
        state.passwordStatus = "loading";
        state.passwordError = "";
      })
      .addCase(changePasswordThunk.fulfilled, (state) => {
        state.passwordStatus = "succeeded";
      })
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.passwordStatus = "failed";
        state.passwordError = action.payload || "Не удалось изменить пароль";
      });
  },
});

export const { clearAuthError, resetPasswordStatus } = authSlice.actions;
export const authReducer = authSlice.reducer;

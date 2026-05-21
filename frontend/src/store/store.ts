import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { authReducer, logoutThunk } from "./authSlice";
import { vacanciesReducer } from "./vacanciesSlice";
import { applicationsReducer } from "./applicationsSlice";
import { profileReducer } from "./profileSlice";

const appReducer = combineReducers({
  auth: authReducer,
  vacancies: vacanciesReducer,
  applications: applicationsReducer,
  profile: profileReducer,
});

export const rootReducer: typeof appReducer = (state, action) => {
  if (logoutThunk.fulfilled.match(action)) {
    return appReducer(undefined, action);
  }

  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

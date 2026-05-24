import { apiRequest, isMockMode } from "./apiClient";
import type {
  CurrentUser,
  LoginPayload,
  PasswordChangePayload,
  RegisterPayload,
  UserRole,
} from "../types/auth";

const MOCK_USER_KEY = "jobability_demo_user";

const readMockUser = (): CurrentUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.sessionStorage.getItem(MOCK_USER_KEY);
    return value ? (JSON.parse(value) as CurrentUser) : null;
  } catch {
    return null;
  }
};

const storeMockUser = (user: CurrentUser | null) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (user) {
      window.sessionStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    } else {
      window.sessionStorage.removeItem(MOCK_USER_KEY);
    }
  } catch {
    // Demo auth continues in memory when storage is unavailable.
  }
};

let mockUser: CurrentUser | null = readMockUser();

const getMockRoleByUsername = (username: string): UserRole => {
  const value = username.trim().toLowerCase();

  if (
    value.includes("moderator") ||
    value.includes("admin") ||
    value.includes("ilya")
  ) {
    return "moderator";
  }

  if (
    value.includes("employer") ||
    value.includes("company") ||
    value.includes("hr")
  ) {
    return "employer";
  }

  return "applicant";
};

const buildMockUser = (
  username: string,
  role: UserRole,
  extra?: Partial<CurrentUser>,
): CurrentUser => {
  return {
    id: role === "moderator" ? 1 : role === "employer" ? 2 : 3,
    username,
    role,
    full_name: extra?.full_name || username,
    email: extra?.email || `${username}@example.com`,
    is_authenticated: true,
    session_key: "mock-session",
  };
};

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  if (isMockMode()) {
    return mockUser;
  }

  try {
    return await apiRequest<CurrentUser>("/api/users/me/");
  } catch {
    return null;
  }
};

export const loginUser = async (
  payload: LoginPayload,
): Promise<CurrentUser> => {
  if (isMockMode()) {
    const role = getMockRoleByUsername(payload.username);
    mockUser = buildMockUser(payload.username, role);
    storeMockUser(mockUser);
    return mockUser;
  }

  await apiRequest("/api/users/login/", {
    method: "POST",
    json: {
      username: payload.username,
      password: payload.password,
    },
  });

  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Не удалось получить текущего пользователя после входа");
  }

  return user;
};

export const registerUser = async (
  payload: RegisterPayload,
): Promise<void> => {
  if (isMockMode()) {
    mockUser = null;
    storeMockUser(null);
    return;
  }

  await apiRequest("/api/users/register/", {
    method: "POST",
    json: payload,
  });

  /*
    Если backend после регистрации автоматически авторизовал пользователя,
    сразу выполняем logout. Так после регистрации пользователь должен войти вручную.
  */
  try {
    await apiRequest("/api/users/logout/", {
      method: "POST",
    });
  } catch {
    // Если backend не авторизует пользователя после регистрации,
    // logout может вернуть ошибку. Это не критично.
  }
};

export const logoutUser = async (): Promise<void> => {
  if (isMockMode()) {
    mockUser = null;
    storeMockUser(null);
    return;
  }

  await apiRequest("/api/users/logout/", {
    method: "POST",
  });
};

export const changePassword = async (
  payload: PasswordChangePayload,
): Promise<void> => {
  if (isMockMode()) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 180));
    return;
  }

  await apiRequest("/api/users/password/", {
    method: "PUT",
    json: payload,
  });
};

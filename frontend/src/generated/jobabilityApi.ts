import axios, { AxiosError } from "axios";
import type {
  ApplicantProfile,
  ApplicationCart,
  ApplicationDetail,
  ApplicationLine,
  ApplicationLineUpdatePayload,
  ApplicationListItem,
  ApplicationModerationPayload,
  ApplicationUpdatePayload,
  BackendApplicationFilters,
} from "../types/application";
import type {
  CurrentUser,
  LoginPayload,
  PasswordChangePayload,
  RegisterPayload,
} from "../types/auth";
import type { Vacancy, VacancyFilters } from "../types/vacancy";

export const jobabilityAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    const data = axiosError.response?.data;

    if (data && typeof data === "object" && "detail" in data && data.detail) {
      return String(data.detail);
    }

    if (axiosError.response?.data) {
      return JSON.stringify(axiosError.response.data);
    }

    return axiosError.message;
  }

  return error instanceof Error ? error.message : "Неизвестная ошибка запроса";
};

const buildVacancyParams = (filters: VacancyFilters) => {
  return {
    search: filters.search.trim() || undefined,
    min_price: filters.minPrice.trim() || undefined,
    max_price: filters.maxPrice.trim() || undefined,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
  };
};

const buildApplicationParams = (filters: BackendApplicationFilters) => {
  return {
    status: filters.status || undefined,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
  };
};

export const AuthGeneratedApi = {
  async authMe(): Promise<CurrentUser> {
    const { data } = await jobabilityAxios.get<CurrentUser>("/api/users/me/");
    return data;
  },

  async authLogin(payload: LoginPayload): Promise<CurrentUser> {
    const { data } = await jobabilityAxios.post<CurrentUser>(
      "/api/users/login/",
      payload,
    );
    return data;
  },

  async authRegister(payload: RegisterPayload): Promise<void> {
    await jobabilityAxios.post("/api/users/register/", payload);
  },

  async authLogout(): Promise<void> {
    await jobabilityAxios.post("/api/users/logout/");
  },

  async authPasswordChange(payload: PasswordChangePayload): Promise<void> {
    await jobabilityAxios.put("/api/users/password/", payload);
  },
};

export const VacancyGeneratedApi = {
  async vacancyList(filters: VacancyFilters): Promise<Vacancy[]> {
    const { data } = await jobabilityAxios.get<Vacancy[]>("/api/vacancies/", {
      params: buildVacancyParams(filters),
    });
    return data;
  },

  async vacancyGet(id: string): Promise<Vacancy> {
    const { data } = await jobabilityAxios.get<Vacancy>(`/api/vacancies/${id}/`);
    return data;
  },
};

export const ApplicationGeneratedApi = {
  async applicationCartGet(): Promise<ApplicationCart> {
    const { data } = await jobabilityAxios.get<ApplicationCart>(
      "/api/applications/cart/",
    );
    return data;
  },

  async applicationLineAdd(
    vacancyId: number,
  ): Promise<{ application_id: number; line: ApplicationLine }> {
    const { data } = await jobabilityAxios.post(
      "/api/application-lines/",
      { vacancy_id: vacancyId, qty: 1 },
    );
    return data;
  },

  async applicationLineUpdate(
    payload: ApplicationLineUpdatePayload,
  ): Promise<ApplicationLine> {
    const { data } = await jobabilityAxios.put<ApplicationLine>(
      "/api/application-lines/",
      payload,
    );
    return data;
  },

  async applicationLineDelete(vacancyId: number): Promise<void> {
    await jobabilityAxios.delete("/api/application-lines/", {
      data: { vacancy_id: vacancyId },
    });
  },

  async applicationList(
    filters: BackendApplicationFilters,
  ): Promise<ApplicationListItem[]> {
    const { data } = await jobabilityAxios.get<ApplicationListItem[]>(
      "/api/applications/",
      {
        params: buildApplicationParams(filters),
      },
    );
    return data;
  },

  async applicationGet(id: string): Promise<ApplicationDetail> {
    const { data } = await jobabilityAxios.get<ApplicationDetail>(
      `/api/applications/${id}/`,
    );
    return data;
  },

  async applicationUpdate(
    id: number,
    payload: ApplicationUpdatePayload,
  ): Promise<ApplicationDetail> {
    const { data } = await jobabilityAxios.put<ApplicationDetail>(
      `/api/applications/${id}/`,
      payload,
    );
    return data;
  },

  async applicationForm(id: number): Promise<ApplicationDetail> {
    const { data } = await jobabilityAxios.put<ApplicationDetail>(
      `/api/applications/${id}/form/`,
      {},
    );
    return data;
  },

  async applicationModerate(
    id: number,
    payload: ApplicationModerationPayload,
  ): Promise<ApplicationDetail> {
    const { data } = await jobabilityAxios.put<ApplicationDetail>(
      `/api/applications/${id}/moderate/`,
      payload,
    );
    return data;
  },

  async applicationDelete(id: number): Promise<void> {
    await jobabilityAxios.delete(`/api/applications/${id}/delete/`);
  },
};

export const ProfileGeneratedApi = {
  async applicantProfileGet(): Promise<ApplicantProfile> {
    const { data } = await jobabilityAxios.get<ApplicantProfile>(
      "/api/users/profile/",
    );
    return data;
  },

  async applicantProfileUpdate(
    payload: ApplicantProfile,
  ): Promise<ApplicantProfile> {
    const { data } = await jobabilityAxios.put<ApplicantProfile>(
      "/api/users/profile/",
      payload,
    );
    return data;
  },
};

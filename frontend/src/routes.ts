import { getApiBaseUrl } from "./api/apiClient";

export const ROUTES = {
  HOME: "/",

  LOGIN: "/login",
  REGISTER: "/register",

  VACANCIES: "/vacancies",
  VACANCY_DETAIL: "/vacancies/:id",
  ANALYTICS: "/analytics",

  APPLICATIONS: "/applications",
  APPLICATION_DETAIL: "/applications/:id",

  APPLICANT_CABINET: "/cabinet/applicant",
  EMPLOYER_CABINET: "/cabinet/employer",
  EMPLOYER_RESPONSES: "/cabinet/employer/responses",
  MODERATOR_CABINET: "/cabinet/moderator",

  SWAGGER: "/swagger/",
};

export const buildVacancyUrl = (id: number | string) => {
  return `/vacancies/${id}`;
};

export const buildApplicationUrl = (id: number | string) => {
  return `/applications/${id}`;
};

export const getBackendPageUrl = (path: string) => {
  const backendUrl = getApiBaseUrl();

  if (!backendUrl) {
    return path;
  }

  return `${backendUrl}${path}`;
};

export const ROUTE_LABELS = {
  HOME: "Главная",

  LOGIN: "Вход",
  REGISTER: "Регистрация",

  VACANCIES: "Вакансии",
  VACANCY_DETAIL: "Вакансия",
  ANALYTICS: "Аналитика",

  APPLICATIONS: "Заявки",
  APPLICATION_DETAIL: "Заявка",

  APPLICANT_CABINET: "Кабинет соискателя",
  EMPLOYER_CABINET: "Кабинет работодателя",
  EMPLOYER_RESPONSES: "Отклики",
  MODERATOR_CABINET: "Кабинет модератора",
};

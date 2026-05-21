import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { isTauriGuestMode } from "./api/apiClient";

import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { VacanciesPage } from "./pages/VacanciesPage";
import { VacancyDetailPage } from "./pages/VacancyDetailPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import { ApplicantCabinetPage } from "./pages/ApplicantCabinetPage";
import { EmployerCabinetPage } from "./pages/EmployerCabinetPage";
import { EmployerResponsesPage } from "./pages/EmployerResponsesPage";
import { ModeratorCabinetPage } from "./pages/ModeratorCabinetPage";

import { ROUTES } from "./routes";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { loadCurrentUserThunk } from "./store/authSlice";

const getRouterBasename = () => {
  const base = import.meta.env.BASE_URL || "/";

  if (base === "./" || base === "") {
    return "/";
  }

  if (base !== "/" && base.endsWith("/")) {
    return base.slice(0, -1);
  }

  return base;
};

const App = () => {
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const initialized = useAppSelector((state) => state.auth.initialized);

  const tauriGuestMode = isTauriGuestMode();

  useEffect(() => {
    if (tauriGuestMode) {
      return;
    }

    dispatch(loadCurrentUserThunk());
  }, [dispatch, tauriGuestMode]);

  if (!tauriGuestMode && !initialized) {
    return <main className="page">Загрузка пользователя...</main>;
  }

  return (
    <BrowserRouter basename={getRouterBasename()}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />

          <Route
            path="/static/frontend/"
            element={<Navigate to={ROUTES.VACANCIES} replace />}
          />

          <Route path={ROUTES.VACANCIES} element={<VacanciesPage />} />

          <Route
            path={ROUTES.VACANCY_DETAIL}
            element={<VacancyDetailPage user={user} />}
          />

          {!tauriGuestMode && (
            <>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />

              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

              <Route
                path={ROUTES.APPLICATIONS}
                element={
                  <ProtectedRoute roles={["applicant", "moderator"]}>
                    <ApplicationsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.APPLICATION_DETAIL}
                element={
                  <ProtectedRoute roles={["applicant", "moderator"]}>
                    <ApplicationDetailPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.APPLICANT_CABINET}
                element={
                  <ProtectedRoute roles={["applicant"]}>
                    <ApplicantCabinetPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.EMPLOYER_CABINET}
                element={
                  <ProtectedRoute roles={["employer"]}>
                    <EmployerCabinetPage user={user!} />
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.EMPLOYER_RESPONSES}
                element={
                  <ProtectedRoute roles={["employer"]}>
                    <EmployerResponsesPage user={user!} />
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.MODERATOR_CABINET}
                element={
                  <ProtectedRoute roles={["moderator"]}>
                    <ModeratorCabinetPage user={user!} />
                  </ProtectedRoute>
                }
              />
            </>
          )}

          <Route path="*" element={<Navigate to={ROUTES.VACANCIES} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import { Outlet } from "react-router-dom";
import { getApiBaseUrl, isMockMode } from "../api/apiClient";
import { AppNavbar } from "./AppNavbar";

export const AppLayout = () => {
  const pagesMode = import.meta.env.VITE_APP_TARGET === "pages";
  const demoMode = isMockMode();
  const apiHost = getApiBaseUrl().replace(/^https?:\/\//, "");

  return (
    <>
      <AppNavbar />

      <main className="page">
        {pagesMode && (
          <aside className={`data-status ${demoMode ? "data-status--demo" : "data-status--live"}`}>
            <span className="data-status__dot" />
            <strong>{demoMode ? "Демо-версия" : "Онлайн-данные"}</strong>
            <span>
              {demoMode
                ? "Интерфейс полностью доступен на тестовых данных."
                : `Подключено к API: ${apiHost}`}
            </span>
          </aside>
        )}

        <Outlet />
      </main>
    </>
  );
};

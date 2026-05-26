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
            <strong>{demoMode ? "Демо-режим" : "Рабочая система"}</strong>
            <span>
              {demoMode
                ? "Примеры вакансий демонстрируют сервис доступного трудоустройства."
                : `Защищённое подключение к данным: ${apiHost}`}
            </span>
          </aside>
        )}

        <Outlet />
      </main>
    </>
  );
};

import { Link, useNavigate } from "react-router-dom";

import { isMockMode, isTauriGuestMode } from "../api/apiClient";
import { getBackendPageUrl, ROUTES } from "../routes";
import { ROLE_LABELS } from "../types/auth";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutThunk } from "../store/authSlice";

export const AppNavbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.auth.user);

  const tauriGuestMode = isTauriGuestMode();
  const mockMode = isMockMode();

  const showBackendLinks = !tauriGuestMode && !mockMode;

  const handleLogout = async () => {
    await dispatch(logoutThunk()).unwrap();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="topbar">
      <Link to={ROUTES.HOME} className="brand">
        <span className="brand-badge">JA</span>

        <span className="brand-text">
          <strong className="brand-name">JobAbility</strong>
          <small className="brand-sub">Платформа вакансий и откликов</small>
        </span>
      </Link>

      <nav className="topnav">
        <Link to={ROUTES.HOME}>Главная</Link>
        <Link to={ROUTES.VACANCIES}>Вакансии</Link>

        {!tauriGuestMode && user && (
          <>
            {(user.role === "applicant" || user.role === "moderator") && (
              <Link to={ROUTES.APPLICATIONS}>Заявки</Link>
            )}

            {user.role === "applicant" && (
              <Link to={ROUTES.APPLICANT_CABINET}>Личный кабинет</Link>
            )}

            {user.role === "employer" && (
              <>
                <Link to={ROUTES.EMPLOYER_CABINET}>Личный кабинет</Link>
                <Link to={ROUTES.EMPLOYER_RESPONSES}>Отклики</Link>
              </>
            )}

            {user.role === "moderator" && (
              <Link to={ROUTES.MODERATOR_CABINET}>Личный кабинет</Link>
            )}
          </>
        )}

        {showBackendLinks && (
          <>
            <a href={getBackendPageUrl(ROUTES.SWAGGER)}>Swagger</a>
            <a href={getBackendPageUrl(ROUTES.ADMIN)}>Admin</a>
          </>
        )}
      </nav>

      {!tauriGuestMode && (
        <div className="userbox">
          {user ? (
            <>
              <div className="user-meta">
                <div className="user-name">
                  {user.full_name || user.username}
                </div>

                <div className="user-role">{ROLE_LABELS[user.role]}</div>
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleLogout}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="btn btn-ghost">
                Войти
              </Link>

              <Link to={ROUTES.REGISTER} className="btn">
                Регистрация
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

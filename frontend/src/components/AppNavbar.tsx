import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import { isMockMode, isTauriGuestMode } from "../api/apiClient";
import { getBackendPageUrl, ROUTES } from "../routes";
import { ROLE_LABELS } from "../types/auth";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutThunk } from "../store/authSlice";

export const AppNavbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);

  const tauriGuestMode = isTauriGuestMode();
  const mockMode = isMockMode();

  const showBackendLinks = !tauriGuestMode && !mockMode;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logoutThunk()).unwrap();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className={`topbar ${menuOpen ? "topbar--open" : ""}`}>
      <div className="topbar__head">
        <Link to={ROUTES.HOME} className="brand">
          <img
            className="brand-badge brand-badge--image"
            src={`${import.meta.env.BASE_URL}jobability-mark.svg`}
            alt=""
          />

          <span className="brand-text">
            <strong className="brand-name">JobAbility</strong>
            <small className="brand-sub">Трудоустройство без барьеров</small>
          </span>
        </Link>

        <button
          type="button"
          className="topbar__toggle"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((opened) => !opened)}
        >
          <span className="sr-only">Открыть меню</span>
          <span />
          <span />
          <span />
        </button>
      </div>

      <div id="site-navigation" className="topbar__menu">
        <nav className="topnav" aria-label="Основная навигация">
          <NavLink to={ROUTES.HOME} end>
            Главная
          </NavLink>
          <NavLink to={ROUTES.VACANCIES}>Вакансии</NavLink>

          {!tauriGuestMode && user && (
            <>
              {(user.role === "applicant" || user.role === "moderator") && (
                <NavLink to={ROUTES.APPLICATIONS}>Заявки</NavLink>
              )}

              {user.role === "applicant" && (
                <NavLink to={ROUTES.APPLICANT_CABINET}>Личный кабинет</NavLink>
              )}

              {user.role === "employer" && (
                <>
                  <NavLink to={ROUTES.EMPLOYER_CABINET}>Личный кабинет</NavLink>
                  <NavLink to={ROUTES.EMPLOYER_RESPONSES}>Отклики</NavLink>
                </>
              )}

              {user.role === "moderator" && (
                <NavLink to={ROUTES.MODERATOR_CABINET}>Личный кабинет</NavLink>
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
      </div>
    </header>
  );
};

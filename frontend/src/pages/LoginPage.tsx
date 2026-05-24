import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import { isMockMode } from "../api/apiClient";
import { ROUTES } from "../routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginThunk } from "../store/authSlice";
import type { CurrentUser, LoginPayload } from "../types/auth";

const DEMO_MODERATOR = {
  username: "Ilya Snytkin",
  password: "Ilya123",
};

const redirectByRole = (navigate: ReturnType<typeof useNavigate>, user: CurrentUser) => {
  if (user.role === "applicant") {
    navigate(ROUTES.APPLICANT_CABINET);
    return;
  }

  if (user.role === "employer") {
    navigate(ROUTES.EMPLOYER_CABINET);
    return;
  }

  navigate(ROUTES.MODERATOR_CABINET);
};

export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((state) => state.auth.status);
  const authError = useAppSelector((state) => state.auth.error);
  const demoMode = isMockMode();

  const [form, setForm] = useState<LoginPayload>({ username: "", password: "" });

  const updateField = (field: keyof LoginPayload, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const user = await dispatch(loginThunk(form)).unwrap();
      redirectByRole(navigate, user);
    } catch {
      // Ошибка уже сохранена в Redux.
    }
  };

  return (
    <section className="ja-auth-screen">
      <div className="ja-auth-info">
        <span className="ja-section-label">Авторизация</span>
        <h1>Добро пожаловать</h1>
        <p>
          Войдите, чтобы управлять откликами, сохранять вакансии и следить за
          статусом заявок в одном месте.
        </p>

        {demoMode && (
          <div className="ja-demo-box">
            <div className="ja-demo-box__title">Посмотреть кабинет модератора</div>
            <p className="ja-demo-box__hint">
              Для Pages это безопасная демонстрация: изменения сохраняются
              только в текущей вкладке.
            </p>
            <button
              type="button"
              className="ja-button ja-button--light"
              onClick={() => setForm(DEMO_MODERATOR)}
            >
              Заполнить демо-вход
            </button>
          </div>
        )}
      </div>

      <form className="ja-auth-form" onSubmit={handleSubmit}>
        <h2>Вход</h2>

        {authError && <Alert variant="danger">{authError}</Alert>}

        <label className="ja-form-field">
          <span>Логин</span>
          <input
            placeholder="Ваш логин"
            value={form.username}
            required
            autoComplete="username"
            onChange={(event) => updateField("username", event.target.value)}
          />
        </label>

        <label className="ja-form-field">
          <span>Пароль</span>
          <input
            type="password"
            placeholder="Ваш пароль"
            value={form.password}
            required
            autoComplete="current-password"
            onChange={(event) => updateField("password", event.target.value)}
          />
        </label>

        <button className="ja-button ja-button--wide" type="submit" disabled={status === "loading"}>
          {status === "loading" ? <Spinner size="sm" animation="border" /> : "Войти"}
        </button>
      </form>
    </section>
  );
};

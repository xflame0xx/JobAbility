import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import { ROUTES } from "../routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { registerThunk } from "../store/authSlice";
import type { RegisterPayload, UserRole } from "../types/auth";

export const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((state) => state.auth.status);
  const authError = useAppSelector((state) => state.auth.error);

  const [form, setForm] = useState<RegisterPayload>({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    role: "applicant",
  });

  const updateField = (field: keyof RegisterPayload, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateRole = (role: Exclude<UserRole, "moderator">) => {
    setForm((current) => ({ ...current, role }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await dispatch(registerThunk(form)).unwrap();
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      // Ошибка отображается из Redux.
    }
  };

  return (
    <section className="ja-auth-screen ja-auth-screen--register">
      <div className="ja-auth-info">
        <span className="ja-section-label">Регистрация</span>
        <h1>Создайте профиль без барьеров</h1>
        <p>
          Соискателям доступен поиск подходящей работы, а работодателям —
          публикация вакансий с описанием адаптации рабочего места.
        </p>
      </div>

      <form className="ja-auth-form ja-auth-form--register" onSubmit={handleSubmit}>
        <h2>Новый аккаунт</h2>
        {authError && <Alert variant="danger">{authError}</Alert>}

        <div className="field-row">
          <div className="field">
            <label>Имя</label>
            <input
              value={form.first_name}
              onChange={(event) => updateField("first_name", event.target.value)}
            />
          </div>
          <div className="field">
            <label>Фамилия</label>
            <input
              value={form.last_name}
              onChange={(event) => updateField("last_name", event.target.value)}
            />
          </div>
        </div>

        <div className="field">
            <label>Логин</label>
          <input
            value={form.username}
            required
            autoComplete="username"
            onChange={(event) => updateField("username", event.target.value)}
          />
        </div>

        <div className="field">
            <label>Email для связи</label>
          <input
            type="email"
            value={form.email}
            autoComplete="email"
            onChange={(event) => updateField("email", event.target.value)}
          />
        </div>

        <div className="field">
          <label>Пароль</label>
          <input
            type="password"
            value={form.password}
            required
            autoComplete="new-password"
            onChange={(event) => updateField("password", event.target.value)}
          />
        </div>

        <div className="field">
          <label>Тип аккаунта</label>
          <div className="choice-grid choice-grid--two">
            <label className="choice-card">
              <input
                type="radio"
                name="role"
                value="applicant"
                checked={form.role === "applicant"}
                onChange={() => updateRole("applicant")}
              />
              <span>Соискатель</span>
            </label>

            <label className="choice-card">
              <input
                type="radio"
                name="role"
                value="employer"
                checked={form.role === "employer"}
                onChange={() => updateRole("employer")}
              />
              <span>Работодатель</span>
            </label>
          </div>
        </div>

        <button className="ja-button ja-button--wide" type="submit" disabled={status === "loading"}>
          {status === "loading" ? <Spinner size="sm" animation="border" /> : "Создать аккаунт"}
        </button>
      </form>
    </section>
  );
};

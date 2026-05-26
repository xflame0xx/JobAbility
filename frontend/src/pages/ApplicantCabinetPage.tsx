import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { changePasswordThunk, resetPasswordStatus } from "../store/authSlice";
import {
  clearProfileMessage,
  fetchProfileThunk,
  updateProfileThunk,
} from "../store/profileSlice";
import type {
  ApplicantProfile,
  DisabilityCategory,
  Gender,
} from "../types/application";
import {
  DISABILITY_CATEGORY_LABELS,
  GENDER_LABELS,
} from "../types/application";
import { ROLE_LABELS } from "../types/auth";

const emptyProfile: ApplicantProfile = {
  full_name: "",
  phone: "",
  city: "",
  age: null,
  gender: "other",
  disability_category: "none",
};

export const ApplicantCabinetPage = () => {
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const { passwordStatus, passwordError } = useAppSelector(
    (state) => state.auth,
  );
  const { profile, loading, saving, error, success } = useAppSelector(
    (state) => state.profile,
  );

  const [profileForm, setProfileForm] =
    useState<ApplicantProfile>(emptyProfile);

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    new_password_repeat: "",
  });

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        ...emptyProfile,
        ...profile,
      });
    }
  }, [profile]);

  useEffect(() => {
    return () => {
      dispatch(clearProfileMessage());
      dispatch(resetPasswordStatus());
    };
  }, [dispatch]);

  const updateProfileField = <K extends keyof ApplicantProfile>(
    key: K,
    value: ApplicantProfile[K],
  ) => {
    setProfileForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(updateProfileThunk(profileForm));
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await dispatch(changePasswordThunk(passwordForm));

    if (changePasswordThunk.fulfilled.match(result)) {
      setPasswordForm({
        old_password: "",
        new_password: "",
        new_password_repeat: "",
      });
    }
  };

  return (
    <section className="ja-page-section applicant-page">
      <div className="ja-page-head">
        <span className="ja-section-label">Личный кабинет</span>
        <h1>Профиль соискателя</h1>
        <p>
          Заполните контактные данные и особенности, важные для подбора
          доступного рабочего места.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {passwordError && <div className="alert alert-danger">{passwordError}</div>}
      {passwordStatus === "succeeded" && (
        <div className="alert alert-success">Пароль успешно изменён.</div>
      )}

      <div className="ja-cabinet-grid">
        <article className="ja-profile-card">
          <h2>Данные авторизации</h2>

          <div className="ja-profile-info">
            <div>
              <strong>Логин</strong>
              <span>{user?.username || "—"}</span>
            </div>

            <div>
              <strong>Имя</strong>
              <span>{user?.full_name || "—"}</span>
            </div>

            <div>
              <strong>Email</strong>
              <span>{user?.email || "—"}</span>
            </div>

            <div>
              <strong>Роль</strong>
              <span>{user ? ROLE_LABELS[user.role] : "—"}</span>
            </div>
          </div>
        </article>

        <article className="ja-password-card">
          <h2>Смена пароля</h2>

          <form onSubmit={submitPassword}>
            <label className="ja-form-field">
              <span>Старый пароль</span>
              <input
                type="password"
                value={passwordForm.old_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    old_password: event.target.value,
                  }))
                }
              />
            </label>

            <label className="ja-form-field">
              <span>Новый пароль</span>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    new_password: event.target.value,
                  }))
                }
              />
            </label>

            <label className="ja-form-field">
              <span>Повтор нового пароля</span>
              <input
                type="password"
                value={passwordForm.new_password_repeat}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    new_password_repeat: event.target.value,
                  }))
                }
              />
            </label>

            <button
              type="submit"
              className="ja-button"
              disabled={passwordStatus === "loading"}
            >
              {passwordStatus === "loading" ? "Сохранение..." : "Изменить пароль"}
            </button>
          </form>
        </article>
      </div>

      <form className="ja-profile-form" onSubmit={submitProfile}>
        <h2>Анкета соискателя</h2>

        {loading ? (
          <div className="ja-empty">Загрузка анкеты...</div>
        ) : (
          <>
            <div className="ja-form-grid">
              <label className="ja-form-field">
                <span>ФИО</span>
                <input
                  value={profileForm.full_name}
                  onChange={(event) =>
                    updateProfileField("full_name", event.target.value)
                  }
                />
              </label>

              <label className="ja-form-field">
                <span>Телефон</span>
                <input
                  value={profileForm.phone}
                  onChange={(event) =>
                    updateProfileField("phone", event.target.value)
                  }
                />
              </label>

              <label className="ja-form-field">
                <span>Город</span>
                <input
                  value={profileForm.city}
                  onChange={(event) =>
                    updateProfileField("city", event.target.value)
                  }
                />
              </label>

              <label className="ja-form-field">
                <span>Возраст</span>
                <input
                  type="number"
                  min="0"
                  value={profileForm.age ?? ""}
                  onChange={(event) =>
                    updateProfileField(
                      "age",
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                />
              </label>

              <label className="ja-form-field">
                <span>Пол</span>
                <select
                  value={profileForm.gender}
                  onChange={(event) =>
                    updateProfileField("gender", event.target.value as Gender)
                  }
                >
                  {Object.entries(GENDER_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ja-form-field">
                <span>Категория инвалидности</span>
                <select
                  value={profileForm.disability_category}
                  onChange={(event) =>
                    updateProfileField(
                      "disability_category",
                      event.target.value as DisabilityCategory,
                    )
                  }
                >
                  {Object.entries(DISABILITY_CATEGORY_LABELS).map(
                    ([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <button type="submit" className="ja-button" disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить профиль"}
            </button>
          </>
        )}
      </form>
    </section>
  );
};

import { useEffect, useMemo, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ROUTES } from "../routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearApplicationDetail,
  deleteApplicationLineThunk,
  deleteApplicationThunk,
  fetchApplicationByIdThunk,
  formApplicationThunk,
  moderateApplicationThunk,
  updateApplicationLineThunk,
  updateApplicationThunk,
} from "../store/applicationsSlice";
import {
  APPLICATION_STATUS_LABELS,
  DISABILITY_CATEGORY_LABELS,
  GENDER_LABELS,
  type ApplicationDetail,
  type ApplicationLine,
  type ApplicationUpdatePayload,
  type DisabilityCategory,
  type Gender,
} from "../types/application";

interface ApplicationLineEditorProps {
  line: ApplicationLine;
  editable: boolean;
  saving: boolean;
  onSaveQtyComment: (line: ApplicationLine, qty: number, comment: string) => void;
  onToggleMain: (line: ApplicationLine) => void;
  onMoveUp: (line: ApplicationLine) => void;
  onMoveDown: (line: ApplicationLine) => void;
  onDelete: (line: ApplicationLine) => void;
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildApplicationForm = (
  application: ApplicationDetail,
): ApplicationUpdatePayload => {
  return {
    full_name: application.applicant?.full_name || "",
    phone: application.applicant?.phone || "",
    city: application.applicant?.city || "",
    age: application.applicant?.age ?? null,
    gender: application.applicant?.gender || "other",
    disability_category: application.applicant?.disability_category || "none",
    contact_email: application.contact_email || "",
    cover_letter: application.cover_letter || "",
  };
};

const getStatusClassName = (status: ApplicationDetail["status"]) => {
  return `ja-status-badge ja-status-badge--${String(status).toLowerCase()}`;
};

const getVacancyText = (
  vacancy: ApplicationLine["vacancy"],
  keys: string[],
  fallback: string,
) => {
  const source = vacancy as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
};

const getVacancyImage = (vacancy: ApplicationLine["vacancy"]) => {
  const source = vacancy as unknown as Record<string, unknown>;

  const image =
    source.image_url ||
    source.image ||
    source.photo ||
    source.picture ||
    source.preview_image;

  return typeof image === "string" && image.trim() ? image : "";
};

const getLineTotal = (line: ApplicationLine) => {
  return line.line_salary_total ?? line.qty * line.vacancy.salary;
};

const ApplicationLineEditor = ({
  line,
  editable,
  saving,
  onSaveQtyComment,
  onToggleMain,
  onMoveUp,
  onMoveDown,
  onDelete,
}: ApplicationLineEditorProps) => {
  const [qty, setQty] = useState(line.qty);
  const [comment, setComment] = useState(line.comment || "");

  useEffect(() => {
    setQty(line.qty);
    setComment(line.comment || "");
  }, [line.qty, line.comment]);

  const vacancyTitle = getVacancyText(
    line.vacancy,
    ["title", "name", "position"],
    `Вакансия №${line.vacancy.id}`,
  );

  const company = getVacancyText(
    line.vacancy,
    ["company", "company_name", "employer", "employer_name"],
    "Компания не указана",
  );

  const city = getVacancyText(line.vacancy, ["city", "location"], "Город не указан");

  const description = getVacancyText(
    line.vacancy,
    ["description", "short_description", "requirements"],
    "Описание вакансии не указано.",
  );

  const imageUrl = getVacancyImage(line.vacancy);

  return (
    <article className="application-line-card">
      <div className="application-line-card__top">
        <div className="application-line-card__image">
          {imageUrl ? (
            <img src={imageUrl} alt={vacancyTitle} />
          ) : (
            <div className="application-line-card__placeholder">
              Нет изображения
            </div>
          )}
        </div>

        <div className="application-line-card__info">
          <h3>{vacancyTitle}</h3>

          <p>
            {company} • {city}
          </p>

          <div className="application-line-card__badges">
            <span>{line.vacancy.salary.toLocaleString("ru-RU")} ₽</span>
            <span>Количество: {line.qty}</span>
            <span>Порядок: {line.order_index}</span>
            <span>{line.is_main ? "Основная" : "Обычная"}</span>
          </div>
        </div>
      </div>

      <p className="application-line-card__description">{description}</p>

      <div className="application-line-card__fields">
        <label className="application-field">
          <span>Количество</span>
          <input
            type="number"
            min="1"
            disabled={!editable || saving}
            value={qty}
            onChange={(event) => setQty(Number(event.target.value) || 1)}
          />
        </label>

        <label className="application-field">
          <span>Комментарий к вакансии</span>
          <textarea
            rows={4}
            disabled={!editable || saving}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
      </div>

      <div className="application-line-card__footer">
        <div className="application-line-card__sum">
          <span>Сумма строки</span>
          <strong>{getLineTotal(line).toLocaleString("ru-RU")} ₽</strong>
        </div>

        {editable && (
          <div className="application-line-card__actions">
            <button
              type="button"
              disabled={saving}
              onClick={() => onSaveQtyComment(line, qty, comment)}
            >
              Сохранить
            </button>

            <button type="button" disabled={saving} onClick={() => onToggleMain(line)}>
              {line.is_main ? "Снять основную" : "Сделать основной"}
            </button>

            <button type="button" disabled={saving} onClick={() => onMoveUp(line)}>
              Выше
            </button>

            <button type="button" disabled={saving} onClick={() => onMoveDown(line)}>
              Ниже
            </button>

            <button
              className="ja-button--danger"
              type="button"
              disabled={saving}
              onClick={() => onDelete(line)}
            >
              Удалить
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export const ApplicationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const {
    detail: application,
    detailLoading,
    saving,
    processingId,
    error,
    success,
  } = useAppSelector((state) => state.applications);

  const [form, setForm] = useState<ApplicationUpdatePayload | null>(null);

  const isApplicant = user?.role === "applicant";
  const isModerator = user?.role === "moderator";
  const isDraft = application?.status === "DRAFT";
  const isFormed = application?.status === "FORMED";

  const canEditDraft = isApplicant && isDraft;
  const canModerate = isModerator && isFormed;

  const totalPositions = useMemo(() => {
    if (!application) {
      return 0;
    }

    return application.lines.reduce((sum, line) => sum + line.qty, 0);
  }, [application]);

  const totalSalary = useMemo(() => {
    if (!application) {
      return 0;
    }

    return application.lines.reduce((sum, line) => sum + getLineTotal(line), 0);
  }, [application]);

  useEffect(() => {
    if (!id) {
      return;
    }

    dispatch(fetchApplicationByIdThunk(id));

    return () => {
      dispatch(clearApplicationDetail());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (application) {
      setForm(buildApplicationForm(application));
    }
  }, [application]);

  const updateFormField = <K extends keyof ApplicationUpdatePayload>(
    field: K,
    value: ApplicationUpdatePayload[K],
  ) => {
    setForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  };

  const handleSaveApplication = () => {
    if (!application || !form) {
      return;
    }

    dispatch(
      updateApplicationThunk({
        id: application.id,
        payload: form,
      }),
    );
  };

  const handleSaveQtyComment = (
    line: ApplicationLine,
    qty: number,
    comment: string,
  ) => {
    dispatch(
      updateApplicationLineThunk({
        vacancy_id: line.vacancy.id,
        qty,
        comment,
        is_main: line.is_main,
        order_index: line.order_index,
      }),
    );
  };

  const handleToggleMain = (line: ApplicationLine) => {
    dispatch(
      updateApplicationLineThunk({
        vacancy_id: line.vacancy.id,
        qty: line.qty,
        comment: line.comment,
        is_main: !line.is_main,
        order_index: line.order_index,
      }),
    );
  };

  const handleMoveUp = (line: ApplicationLine) => {
    dispatch(
      updateApplicationLineThunk({
        vacancy_id: line.vacancy.id,
        qty: line.qty,
        comment: line.comment,
        is_main: line.is_main,
        order_index: Math.max(1, line.order_index - 1),
      }),
    );
  };

  const handleMoveDown = (line: ApplicationLine) => {
    dispatch(
      updateApplicationLineThunk({
        vacancy_id: line.vacancy.id,
        qty: line.qty,
        comment: line.comment,
        is_main: line.is_main,
        order_index: line.order_index + 1,
      }),
    );
  };

  const handleDeleteLine = (line: ApplicationLine) => {
    if (!window.confirm("Удалить эту вакансию из заявки?")) {
      return;
    }

    dispatch(deleteApplicationLineThunk(line.vacancy.id));
  };

  const handleFormApplication = () => {
    if (!application) {
      return;
    }

    if (application.lines.length === 0) {
      window.alert("Нельзя сформировать пустую заявку.");
      return;
    }

    dispatch(formApplicationThunk(application.id));
  };

  const handleDeleteDraft = async () => {
    if (!application) {
      return;
    }

    if (!window.confirm("Удалить черновик заявки?")) {
      return;
    }

    await dispatch(deleteApplicationThunk(application.id)).unwrap();
    navigate(ROUTES.APPLICATIONS);
  };

  const handleModerate = (action: "finish" | "reject") => {
    if (!application) {
      return;
    }

    const note = window.prompt(
      action === "finish"
        ? "Комментарий модератора при завершении"
        : "Причина отклонения заявки",
      application.moderator_note || "",
    );

    dispatch(
      moderateApplicationThunk({
        id: application.id,
        payload: {
          action,
          moderator_note: note || "",
        },
      }),
    );
  };

  if (detailLoading) {
    return (
      <main className="application-detail-page">
        <div className="application-loading">
          <Spinner animation="border" size="sm" />
          <span>Загрузка заявки...</span>
        </div>
      </main>
    );
  }

  if (error && !application) {
    return (
      <main className="application-detail-page">
        <div className="application-empty">{error}</div>
      </main>
    );
  }

  if (!application || !form) {
    return (
      <main className="application-detail-page">
        <div className="application-empty">Заявка не найдена.</div>
      </main>
    );
  }

  return (
    <main className="application-detail-page">
      <section className="application-hero">
        <div>
          <p className="application-kicker">Заявка пользователя</p>
          <h1>Заявка №{application.id}</h1>

          <p className="application-subtitle">
            Заявка открыта по ID: <strong>/applications/{application.id}</strong>.
            В статусе черновика соискатель может редактировать анкету и строки
            m-m связи.
          </p>
        </div>

        <Link className="application-back-link" to={ROUTES.APPLICATIONS}>
          К списку заявок
        </Link>
      </section>

      {error && (
        <Alert variant="danger" className="application-alert">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="application-alert">
          {success}
        </Alert>
      )}

      <section className="application-summary-grid">
        <article className="application-summary-card">
          <span>Статус</span>
          <strong>
            <span className={getStatusClassName(application.status)}>
              {APPLICATION_STATUS_LABELS[application.status]}
            </span>
          </strong>
        </article>

        <article className="application-summary-card">
          <span>Создатель</span>
          <strong>{application.creator_login}</strong>
        </article>

        <article className="application-summary-card">
          <span>Создана</span>
          <strong>{formatDateTime(application.created_at)}</strong>
        </article>

        <article className="application-summary-card">
          <span>Сформирована</span>
          <strong>{formatDateTime(application.formed_at)}</strong>
        </article>

        <article className="application-summary-card">
          <span>Позиций</span>
          <strong>{totalPositions}</strong>
        </article>

        <article className="application-summary-card">
          <span>Итоговая сумма</span>
          <strong>{totalSalary.toLocaleString("ru-RU")} ₽</strong>
        </article>
      </section>

      <section className="application-layout">
        <article className="application-panel">
          <div className="application-panel-head">
            <div>
              <p className="application-kicker">Анкета</p>
              <h2>Данные соискателя</h2>
            </div>

            {!canEditDraft && (
              <span className="application-readonly-badge">Только просмотр</span>
            )}
          </div>

          <div className="application-form-grid">
            <label className="application-field">
              <span>ФИО</span>
              <input
                disabled={!canEditDraft || saving}
                value={form.full_name}
                onChange={(event) =>
                  updateFormField("full_name", event.target.value)
                }
              />
            </label>

            <label className="application-field">
              <span>Телефон</span>
              <input
                disabled={!canEditDraft || saving}
                value={form.phone}
                onChange={(event) => updateFormField("phone", event.target.value)}
              />
            </label>

            <label className="application-field">
              <span>Город</span>
              <input
                disabled={!canEditDraft || saving}
                value={form.city}
                onChange={(event) => updateFormField("city", event.target.value)}
              />
            </label>

            <label className="application-field">
              <span>Возраст</span>
              <input
                type="number"
                disabled={!canEditDraft || saving}
                value={form.age ?? ""}
                onChange={(event) =>
                  updateFormField(
                    "age",
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
              />
            </label>

            <label className="application-field">
              <span>Пол</span>
              <select
                disabled={!canEditDraft || saving}
                value={form.gender}
                onChange={(event) =>
                  updateFormField("gender", event.target.value as Gender)
                }
              >
                {Object.entries(GENDER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="application-field">
              <span>Категория инвалидности</span>
              <select
                disabled={!canEditDraft || saving}
                value={form.disability_category}
                onChange={(event) =>
                  updateFormField(
                    "disability_category",
                    event.target.value as DisabilityCategory,
                  )
                }
              >
                {Object.entries(DISABILITY_CATEGORY_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>

          <div className="application-form-grid application-form-grid--one">
            <label className="application-field">
              <span>Email для связи</span>
              <input
                type="email"
                disabled={!canEditDraft || saving}
                value={form.contact_email}
                onChange={(event) =>
                  updateFormField("contact_email", event.target.value)
                }
              />
            </label>

            <label className="application-field">
              <span>Сопроводительное письмо</span>
              <textarea
                rows={5}
                disabled={!canEditDraft || saving}
                value={form.cover_letter}
                onChange={(event) =>
                  updateFormField("cover_letter", event.target.value)
                }
              />
            </label>
          </div>

          <div className="application-actions">
            {canEditDraft ? (
              <button
                className="application-btn"
                type="button"
                disabled={saving}
                onClick={handleSaveApplication}
              >
                Сохранить данные заявки
              </button>
            ) : (
              <p className="application-hint">
                Редактирование отключено, потому что заявка уже не находится в
                статусе черновика.
              </p>
            )}
          </div>
        </article>

        <article className="application-panel">
          <div className="application-panel-head">
            <div>
              <p className="application-kicker">M-M связь</p>
              <h2>Состав заявки</h2>
            </div>

            <span className="application-readonly-badge">
              {application.lines.length} строк
            </span>
          </div>

          <div className="application-lines">
            {application.lines.length === 0 && (
              <div className="application-empty">
                В заявке пока нет вакансий.
              </div>
            )}

            {application.lines.map((line) => (
              <ApplicationLineEditor
                key={line.id}
                line={line}
                editable={canEditDraft}
                saving={saving}
                onSaveQtyComment={handleSaveQtyComment}
                onToggleMain={handleToggleMain}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onDelete={handleDeleteLine}
              />
            ))}
          </div>

          <div className="application-total-box">
            <span>Итого по заявке</span>
            <strong>{totalSalary.toLocaleString("ru-RU")} ₽</strong>
          </div>
        </article>
      </section>

      {canEditDraft && (
        <section className="application-bottom-actions">
          <button
            className="application-btn application-btn--success"
            type="button"
            disabled={processingId === application.id}
            onClick={handleFormApplication}
          >
            Сформировать заявку
          </button>

          <button
            className="application-btn application-btn--danger"
            type="button"
            disabled={processingId === application.id}
            onClick={handleDeleteDraft}
          >
            Удалить черновик
          </button>
        </section>
      )}

      {canModerate && (
        <section className="application-bottom-actions">
          <button
            className="application-btn application-btn--success"
            type="button"
            disabled={processingId === application.id}
            onClick={() => handleModerate("finish")}
          >
            Завершить заявку
          </button>

          <button
            className="application-btn application-btn--danger"
            type="button"
            disabled={processingId === application.id}
            onClick={() => handleModerate("reject")}
          >
            Отклонить заявку
          </button>
        </section>
      )}
    </main>
  );
};

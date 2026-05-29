import { useEffect, useMemo } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";

import { ApplicationFilters } from "../components/ApplicationFilters";
import { buildApplicationUrl } from "../routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  applyApplicationFilters,
  fetchApplicationsThunk,
  moderateApplicationThunk,
  resetApplicationFilters,
  setApplicationFilters,
} from "../store/applicationsSlice";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationListItem,
} from "../types/application";

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

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

const getStatusClassName = (status: ApplicationListItem["status"]) => {
  return `ja-status-badge ja-status-badge--${String(status).toLowerCase()}`;
};

export const ApplicationsPage = () => {
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const {
    filters,
    appliedFilters,
    items,
    listLoading,
    processingId,
    error,
    success,
  } = useAppSelector((state) => state.applications);

  const isModerator = user?.role === "moderator";

  useEffect(() => {
    dispatch(fetchApplicationsThunk());
  }, [dispatch, appliedFilters]);

  useEffect(() => {
    if (!isModerator) {
      return;
    }

    const timerId = window.setInterval(() => {
      dispatch(fetchApplicationsThunk({ silent: true }));
    }, 5000);

    return () => window.clearInterval(timerId);
  }, [dispatch, isModerator, appliedFilters]);

  const visibleItems = useMemo(() => {
    const creator = appliedFilters.creator.trim().toLowerCase();

    if (!isModerator || !creator) {
      return items;
    }

    return items.filter((item) =>
      item.creator_login.toLowerCase().includes(creator),
    );
  }, [items, isModerator, appliedFilters.creator]);

  const setTodayRange = () => {
    const today = getToday();

    dispatch(
      setApplicationFilters({
        ...filters,
        dateFrom: today,
        dateTo: today,
      }),
    );
  };

  const handleModerate = (
    application: ApplicationListItem,
    action: "finish" | "reject",
  ) => {
    const note = window.prompt(
      action === "finish" ? "Комментарий при завершении" : "Причина отклонения",
      "",
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

  return (
    <main className="applications-page">
      <section className="ja-page-head applications-head">
        <span className="ja-section-label">Трудоустройство</span>

        <h1>{isModerator ? "Все заявки" : "Мои заявки"}</h1>

        <p>
          Отслеживайте обращения по выбранным вакансиям и этап их
          рассмотрения работодателем и модератором сервиса.
        </p>
      </section>

      <ApplicationFilters
        filters={filters}
        loading={listLoading}
        showCreatorFilter={isModerator}
        onChange={(value) => dispatch(setApplicationFilters(value))}
        onSubmit={() => dispatch(applyApplicationFilters())}
        onReset={() => dispatch(resetApplicationFilters())}
      />

      <section className="applications-toolbar">
        <button
          className="ja-button ja-button--outline"
          type="button"
          onClick={setTodayRange}
        >
          Подставить диапазон за сегодня
        </button>
      </section>

      {error && (
        <Alert variant="danger" className="applications-alert">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="applications-alert">
          {success}
        </Alert>
      )}

      {listLoading && (
        <div className="applications-loading">
          <Spinner animation="border" size="sm" />
          <span>Загрузка заявок...</span>
        </div>
      )}

      {!listLoading && visibleItems.length === 0 && (
        <div className="applications-empty">Заявок нет.</div>
      )}

      {!listLoading && visibleItems.length > 0 && (
        <div className="applications-table-wrap">
          <table className="applications-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Создатель</th>
                <th>Статус</th>
                <th>Создана</th>
                <th>Сформирована</th>
                <th>Позиций</th>
                <th>Сумма</th>
                <th>Действия</th>
              </tr>
            </thead>

            <tbody>
              {visibleItems.map((application) => {
                const total = application.total_sum || application.total_salary || 0;
                const canModerate =
                  isModerator && application.status === "FORMED";

                return (
                  <tr key={application.id}>
                    <td>
                      <strong>№{application.id}</strong>
                    </td>

                    <td>{application.creator_login}</td>

                    <td>
                      <span className={getStatusClassName(application.status)}>
                        {APPLICATION_STATUS_LABELS[application.status]}
                      </span>
                    </td>

                    <td>{formatDateTime(application.created_at)}</td>

                    <td>{formatDateTime(application.formed_at)}</td>

                    <td>{application.lines_count || 0}</td>

                    <td>
                      <strong>{total.toLocaleString("ru-RU")} ₽</strong>
                    </td>

                    <td>
                      <div className="applications-actions">
                        <Link
                          className="ja-button applications-action-link"
                          to={buildApplicationUrl(application.id)}
                        >
                          Открыть
                        </Link>

                        {canModerate && (
                          <>
                            <button
                              className="ja-button applications-action-link"
                              type="button"
                              disabled={processingId === application.id}
                              onClick={() => handleModerate(application, "finish")}
                            >
                              Завершить
                            </button>

                            <button
                              className="ja-button ja-button--danger applications-action-link"
                              type="button"
                              disabled={processingId === application.id}
                              onClick={() => handleModerate(application, "reject")}
                            >
                              Отклонить
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

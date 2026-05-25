import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";

import type { Vacancy } from "../types/vacancy";
import type { ApplicationCart } from "../types/application";

import { isTauriGuestMode } from "../api/apiClient";
import { fetchVacancies } from "../api/vacancyApi";
import {
  addVacancyToApplication,
  fetchApplicationCart,
} from "../api/applicationApi";

import { DraftApplicationCard } from "../components/DraftApplicationCard";
import { VacancyCard } from "../components/VacancyCard";
import { VacancyFilters } from "../components/VacancyFilters";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  applyVacancyFilters,
  resetVacancyFilters,
  setVacancyFilters,
} from "../store/vacanciesSlice";

export const VacanciesPage = () => {
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const filters = useAppSelector((state) => state.vacancies.filters);
  const appliedFilters = useAppSelector(
    (state) => state.vacancies.appliedFilters,
  );

  const tauriGuestMode = isTauriGuestMode();

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [cart, setCart] = useState<ApplicationCart | null>(null);

  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [addingVacancyId, setAddingVacancyId] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadVacancies = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchVacancies(appliedFilters);

        if (!ignore) {
          setVacancies(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Не удалось загрузить вакансии",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadVacancies();

    return () => {
      ignore = true;
    };
  }, [appliedFilters]);

  useEffect(() => {
    let ignore = false;

    const loadCart = async () => {
      if (tauriGuestMode || !user || user.role !== "applicant") {
        setCart(null);
        return;
      }

      try {
        setCartLoading(true);

        const data = await fetchApplicationCart();

        if (!ignore) {
          setCart(data);
        }
      } finally {
        if (!ignore) {
          setCartLoading(false);
        }
      }
    };

    loadCart();

    return () => {
      ignore = true;
    };
  }, [user, tauriGuestMode]);

  const handleSubmitFilters = () => {
    dispatch(applyVacancyFilters());
    setFiltersOpen(false);
  };

  const handleResetFilters = () => {
    dispatch(resetVacancyFilters());
    setFiltersOpen(false);
  };

  const handleAddToApplication = async (vacancyId: number) => {
    if (tauriGuestMode) {
      return;
    }

    try {
      setAddingVacancyId(vacancyId);
      setError("");
      setSuccess("");

      const response = await addVacancyToApplication(vacancyId);

      setCart((current) => ({
        application_id: response.application_id,
        items_count: current ? current.items_count + 1 : 1,
      }));

      setSuccess("Вакансия добавлена в текущую заявку");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось добавить вакансию в заявку",
      );
    } finally {
      setAddingVacancyId(null);
    }
  };

  return (
    <section className="ja-page-section">
      <div className="ja-page-head">
        <span className="ja-section-label">Каталог вакансий</span>

        <h1 className="page-title">Вакансии для соискателей</h1>

        <p>
          Найдите подходящую роль по направлению, городу и зарплате. Фильтры
          сохраняются при переходе между вакансиями.
        </p>
      </div>

      <div className="ja-filters">
        <button
          className="ja-filters__toggle"
          type="button"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((opened) => !opened)}
        >
          <span>Фильтры поиска</span>
          <span aria-hidden="true">{filtersOpen ? "−" : "+"}</span>
        </button>

        <div className={`ja-filters__panel ${filtersOpen ? "ja-filters__panel--open" : ""}`}>
          <VacancyFilters
            filters={filters}
            loading={loading}
            onChange={(nextFilters) => dispatch(setVacancyFilters(nextFilters))}
            onSubmit={handleSubmitFilters}
            onReset={handleResetFilters}
          />
        </div>
      </div>

      {!tauriGuestMode &&
        (cartLoading ? (
          <div className="draft-empty">Загрузка текущей заявки...</div>
        ) : (
          <DraftApplicationCard user={user} cart={cart} />
        ))}

      {error && (
        <Alert variant="danger" style={{ marginBottom: 20 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" style={{ marginBottom: 20 }}>
          {success}
        </Alert>
      )}

      {loading && (
        <div className="empty">
          <Spinner animation="border" size="sm" /> Загрузка вакансий...
        </div>
      )}

      {!loading && vacancies.length > 0 && (
        <>
          <div className="ja-results-summary" aria-live="polite">
            <span>Найдено вакансий</span>
            <strong>{vacancies.length}</strong>
          </div>

          <div className="grid">
            {vacancies.map((vacancy) => (
              <VacancyCard
                key={vacancy.id}
                vacancy={vacancy}
                user={user}
                adding={addingVacancyId === vacancy.id}
                onAddToApplication={handleAddToApplication}
              />
            ))}
          </div>
        </>
      )}

      {!loading && vacancies.length === 0 && (
        <div className="empty">Ничего не найдено.</div>
      )}
    </section>
  );
};

import type { FormEvent } from "react";
import type { VacancyFilters as VacancyFiltersType } from "../types/vacancy";

interface VacancyFiltersProps {
  filters: VacancyFiltersType;
  loading: boolean;
  onChange: (filters: VacancyFiltersType) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export const VacancyFilters = ({
  filters,
  loading,
  onChange,
  onSubmit,
  onReset,
}: VacancyFiltersProps) => {
  const updateField = (field: keyof VacancyFiltersType, value: string) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="search" onSubmit={handleSubmit}>
      <label className="search-field search-field--wide">
        <span>Поиск</span>

        <input
          type="text"
          value={filters.search}
          placeholder="Название, компания, город"
          autoComplete="off"
          onChange={(event) => updateField("search", event.target.value)}
        />
      </label>

      <label className="search-field">
        <span>Зарплата от</span>

        <input
          type="number"
          min="0"
          value={filters.minPrice}
          placeholder="от"
          onChange={(event) => updateField("minPrice", event.target.value)}
        />
      </label>

      <label className="search-field">
        <span>Зарплата до</span>

        <input
          type="number"
          min="0"
          value={filters.maxPrice}
          placeholder="до"
          onChange={(event) => updateField("maxPrice", event.target.value)}
        />
      </label>

      <label className="search-field">
        <span>Дата от</span>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(event) => updateField("dateFrom", event.target.value)}
        />
      </label>

      <label className="search-field">
        <span>Дата до</span>

        <input
          type="date"
          value={filters.dateTo}
          onChange={(event) => updateField("dateTo", event.target.value)}
        />
      </label>

      <button type="submit" disabled={loading}>
        Найти
      </button>

      <button type="button" disabled={loading} onClick={onReset}>
        Сбросить
      </button>
    </form>
  );
};

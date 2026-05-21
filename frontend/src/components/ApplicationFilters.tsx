import {
  APPLICATION_STATUS_LABELS,
  type ApplicationFilters as ApplicationFiltersType,
  type ApplicationStatus,
} from "../types/application";

interface ApplicationFiltersProps {
  filters: ApplicationFiltersType;
  loading: boolean;
  showCreatorFilter: boolean;
  onChange: (filters: ApplicationFiltersType) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export const ApplicationFilters = ({
  filters,
  loading,
  showCreatorFilter,
  onChange,
  onSubmit,
  onReset,
}: ApplicationFiltersProps) => {
  const update = (field: keyof ApplicationFiltersType, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  const statuses = Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[];

  return (
    <section className="filter-card">
      <div className="filter-grid">
        <label className="field">
          <span>Статус заявки</span>
          <select
            value={filters.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="">Все статусы</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {APPLICATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Дата формирования от</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => update("dateFrom", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Дата формирования до</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => update("dateTo", event.target.value)}
          />
        </label>

        {showCreatorFilter && (
          <label className="field">
            <span>Создатель заявки, фильтр на frontend</span>
            <input
              value={filters.creator}
              placeholder="Например: applicant1"
              onChange={(event) => update("creator", event.target.value)}
            />
          </label>
        )}
      </div>

      <div className="filter-actions">
        <button className="btn" type="button" disabled={loading} onClick={onSubmit}>
          Применить
        </button>
        <button className="btn btn-ghost" type="button" disabled={loading} onClick={onReset}>
          Сбросить
        </button>
      </div>
    </section>
  );
};

import { useEffect, useState } from "react";

import { SafeVacancyImage } from "./SafeVacancyImage";
import type { ApplicationLine } from "../types/application";

interface ApplicationLineCardProps {
  line: ApplicationLine;
  editable: boolean;
  saving: boolean;
  onSaveQtyComment: (
    line: ApplicationLine,
    qty: number,
    comment: string,
  ) => void;
  onToggleMain: (line: ApplicationLine) => void;
  onMoveUp: (line: ApplicationLine) => void;
  onMoveDown: (line: ApplicationLine) => void;
  onDelete: (line: ApplicationLine) => void;
}

export const ApplicationLineCard = ({
  line,
  editable,
  saving,
  onSaveQtyComment,
  onToggleMain,
  onMoveUp,
  onMoveDown,
  onDelete,
}: ApplicationLineCardProps) => {
  const [qty, setQty] = useState(line.qty);
  const [comment, setComment] = useState(line.comment || "");

  useEffect(() => {
    setQty(line.qty);
    setComment(line.comment || "");
  }, [line.id, line.qty, line.comment]);

  const lineSalary =
    line.line_salary_total ?? line.qty * line.vacancy.salary;

  return (
    <article className="application-line-card">
      <div className="application-line-image">
        <SafeVacancyImage src={line.vacancy.image_url} alt={line.vacancy.title} />
      </div>

      <div className="application-line-info">
        <h3>{line.vacancy.title}</h3>

        <p className="application-line-meta">
          {line.vacancy.company} • {line.vacancy.city}
        </p>

        <div className="application-line-tags">
          <span>З/п: {line.vacancy.salary.toLocaleString("ru-RU")} ₽</span>
          <span>Количество: {line.qty}</span>
          <span>Порядок: {line.order_index}</span>
          <span>{line.is_main ? "Основная" : "Обычная"}</span>
        </div>

        <p className="application-line-total">
          Сумма строки: <strong>{lineSalary.toLocaleString("ru-RU")} ₽</strong>
        </p>
      </div>

      <div className="application-line-editor">
        <label className="application-field">
          <span>Количество</span>
          <input
            type="number"
            min="1"
            disabled={!editable || saving}
            value={qty}
            onChange={(event) =>
              setQty(Math.max(1, Number(event.target.value) || 1))
            }
          />
        </label>

        <label className="application-field">
          <span>Комментарий к вакансии</span>
          <textarea
            rows={3}
            disabled={!editable || saving}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>

        {editable && (
          <div className="application-line-actions">
            <button
              className="application-btn"
              type="button"
              disabled={saving}
              onClick={() => onSaveQtyComment(line, qty, comment)}
            >
              1. Изменить количество/комментарий
            </button>

            <button
              className="application-btn application-btn--outline"
              type="button"
              disabled={saving}
              onClick={() => onToggleMain(line)}
            >
              Сделать основной вакансией
            </button>

            <button
              className="application-btn application-btn--outline"
              type="button"
              disabled={saving}
              onClick={() => onMoveUp(line)}
            >
              Поднять выше
            </button>

            <button
              className="application-btn application-btn--outline"
              type="button"
              disabled={saving}
              onClick={() => onMoveDown(line)}
            >
              Опустить ниже
            </button>

            <button
              className="application-btn application-btn--danger"
              type="button"
              disabled={saving}
              onClick={() => onDelete(line)}
            >
              Удалить вакансию
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

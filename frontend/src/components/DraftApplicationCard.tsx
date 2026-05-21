import { Link } from "react-router-dom";
import { buildApplicationUrl, ROUTES } from "../routes";
import type { CurrentUser } from "../types/auth";
import type { ApplicationCart } from "../types/application";

interface DraftApplicationCardProps {
  user: CurrentUser | null;
  cart: ApplicationCart | null;
}

export const DraftApplicationCard = ({
  user,
  cart,
}: DraftApplicationCardProps) => {
  if (!user) {
    return (
      <div className="draft-application-card">
        <div>
          <h3>Хотите откликнуться?</h3>

          <p>
            Войдите в аккаунт соискателя, чтобы добавлять вакансии в заявку и
            отслеживать её статус.
          </p>
        </div>

        <Link to={ROUTES.LOGIN} className="ja-button">
          Войти
        </Link>
      </div>
    );
  }

  if (user.role !== "applicant") {
    return null;
  }

  if (!cart || cart.items_count === 0 || cart.application_id === null) {
    return (
      <div className="draft-application-card">
        <div>
          <h3>Текущая заявка пуста</h3>

          <p>
            Добавьте подходящие вакансии в заявку, чтобы позже отправить её на
            рассмотрение.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-application-card draft-application-card--active">
      <div>
        <h3>Текущая заявка</h3>

        <p>
          В черновике уже есть вакансии. Вы можете открыть заявку, проверить
          список позиций и продолжить оформление.
        </p>
      </div>

      <div className="draft-application-card__meta">
        <span>{cart.items_count}</span>
        <small>позиций</small>
      </div>

      <Link to={buildApplicationUrl(cart.application_id)} className="ja-button">
        Открыть заявку
      </Link>
    </div>
  );
};

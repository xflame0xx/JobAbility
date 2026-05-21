import { Link } from "react-router-dom";
import { AppBreadcrumbs } from "../components/AppBreadcrumbs";
import { ROUTES } from "../routes";

export const HomePage = () => {
  return (
    <section className="home-page">
      <AppBreadcrumbs items={[]} />

      <div className="home-hero home-hero--clean">
        <div className="home-hero__content">
          <span className="ja-section-label">Платформа трудоустройства</span>

          <h1>JobAbility</h1>

          <p>
            Сервис помогает соискателям находить подходящие вакансии, а
            работодателям — размещать предложения и получать отклики.
            Интерфейс адаптирован для компьютера, планшета и телефона.
          </p>

          <div className="home-hero__actions">
            <Link to={ROUTES.VACANCIES} className="ja-button">
              Перейти к вакансиям
            </Link>
          </div>
        </div>

        <aside className="home-hero__card home-hero__card--clean">
          <h2>Возможности сервиса</h2>

          <div className="feature-list">
            <div className="feature-item">
              <span>01</span>
              <div>
                <h3>Каталог вакансий</h3>
                <p>
                  Просмотр актуальных вакансий с фильтрацией по названию,
                  зарплате и дате публикации.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <span>02</span>
              <div>
                <h3>Удобный отклик</h3>
                <p>
                  Соискатель может добавлять вакансии в заявку и отслеживать
                  дальнейший статус обращения.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <span>03</span>
              <div>
                <h3>Адаптивный интерфейс</h3>
                <p>
                  Страницы корректно отображаются на телефоне, планшете и
                  широком экране компьютера.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

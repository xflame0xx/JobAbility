import { Link } from "react-router-dom";
import { AppBreadcrumbs } from "../components/AppBreadcrumbs";
import { ROUTES } from "../routes";

export const HomePage = () => {
  return (
    <section className="home-page">
      <AppBreadcrumbs items={[]} />

      <div className="home-hero home-hero--clean">
        <div className="home-hero__content">
          <span className="ja-section-label">Доступное трудоустройство</span>

          <h1>Работа без барьеров</h1>

          <p>
            JobAbility — система трудоустройства для людей с ограниченными
            возможностями. Мы объединяем соискателей и работодателей, которые
            готовы создавать понятные и доступные условия работы.
          </p>

          <div className="home-hero__chips" aria-label="Преимущества платформы">
            <span>Доступная среда</span>
            <span>Условия адаптации</span>
            <span>Отклики онлайн</span>
          </div>

          <div className="home-hero__actions">
            <Link to={ROUTES.VACANCIES} className="ja-button">
              Перейти к вакансиям
            </Link>
          </div>

          <div className="home-hero__stats" aria-label="Возможности сервиса">
            <div>
              <strong>01</strong>
              <span>Поиск работы</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Профиль кандидата</span>
            </div>
            <div>
              <strong>03</strong>
              <span>Связь с компанией</span>
            </div>
          </div>
        </div>

        <aside className="home-hero__card home-hero__card--clean">
          <h2>Как помогает JobAbility</h2>

          <div className="feature-list">
            <div className="feature-item">
              <span>01</span>
              <div>
                <h3>Понятные вакансии</h3>
                <p>
                  В каждой карточке указаны график, зарплата и доступные
                  условия рабочего места.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <span>02</span>
              <div>
                <h3>Комфортный отклик</h3>
                <p>
                  Соискатель формирует заявку и отслеживает её рассмотрение в
                  личном кабинете.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <span>03</span>
              <div>
                <h3>Удобство на любом экране</h3>
                <p>
                  Сервис удобно использовать на телефоне, планшете и
                  компьютере.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

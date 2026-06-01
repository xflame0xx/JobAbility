import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { AppBreadcrumbs } from "../components/AppBreadcrumbs";
import type {
  AccessibilityItem,
  AnalyticsData,
  AnalyticsFunnelItem,
  AnalyticsStatusItem,
  InterviewDynamicsItem,
  MonthlyActivityItem,
} from "../types/analytics";

const numberFormatter = new Intl.NumberFormat("ru-RU");

const formatNumber = (value: number) => numberFormatter.format(value);

const cssVar = (name: string, value: string) =>
  ({ [name]: value }) as CSSProperties;

const buildLinePath = (
  items: MonthlyActivityItem[],
  key: keyof Pick<MonthlyActivityItem, "applications" | "interviews" | "employed">,
  maxValue: number,
) => {
  const width = 820;
  const height = 260;
  const paddingX = 20;
  const paddingTop = 16;
  const paddingBottom = 28;
  const chartHeight = height - paddingTop - paddingBottom;
  const step = (width - paddingX * 2) / Math.max(items.length - 1, 1);

  return items.map((item, index) => ({
    x: paddingX + index * step,
    y: paddingTop + chartHeight - (item[key] / maxValue) * chartHeight,
  }));
};

const toSvgPath = (points: { x: number; y: number }[]) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

interface ActivityChartProps {
  data: MonthlyActivityItem[];
}

const ActivityChart = ({ data }: ActivityChartProps) => {
  const [activeIndex, setActiveIndex] = useState(data.length - 1);

  const maxValue = Math.ceil(
    Math.max(...data.map((item) => item.applications)) / 50,
  ) * 50;

  const applications = buildLinePath(data, "applications", maxValue);
  const interviews = buildLinePath(data, "interviews", maxValue);
  const employed = buildLinePath(data, "employed", maxValue);
  const safeActiveIndex = Math.min(activeIndex, data.length - 1);
  const active = data[safeActiveIndex];
  const activePoint = applications[safeActiveIndex];
  const areaPath = `${toSvgPath(applications)} L ${applications[applications.length - 1].x} 232 L ${applications[0].x} 232 Z`;
  const hitAreaWidth = 780 / Math.max(data.length, 1);

  return (
    <div className="analytics-activity">
      <div className="analytics-chart-legend" aria-label="Легенда графика">
        <span><i className="analytics-dot analytics-dot--violet" />Отклики</span>
        <span><i className="analytics-dot analytics-dot--blue" />Собеседования</span>
        <span><i className="analytics-dot analytics-dot--green" />Трудоустройство</span>
      </div>

      <div className="analytics-line-chart">
        <svg
          viewBox="0 0 820 260"
          role="img"
          aria-label="Динамика откликов, собеседований и трудоустройства по месяцам"
        >
          <defs>
            <linearGradient id="analytics-area-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#635bff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#635bff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((line) => {
            const y = 16 + line * 54;

            return (
              <line
                key={line}
                className="analytics-chart-grid"
                x1="20"
                x2="800"
                y1={y}
                y2={y}
              />
            );
          })}

          <path className="analytics-chart-area" d={areaPath} />
          <path className="analytics-chart-line analytics-chart-line--violet" d={toSvgPath(applications)} />
          <path className="analytics-chart-line analytics-chart-line--blue" d={toSvgPath(interviews)} />
          <path className="analytics-chart-line analytics-chart-line--green" d={toSvgPath(employed)} />

          {applications.map((point, index) => (
            <g key={`${data[index].month}-${index}`}>
              {index === safeActiveIndex && (
                <>
                  <line
                    className="analytics-chart-focus-line"
                    x1={point.x}
                    x2={point.x}
                    y1="16"
                    y2="232"
                  />
                  <circle className="analytics-chart-point analytics-chart-point--violet" cx={point.x} cy={point.y} r="5" />
                  <circle className="analytics-chart-point analytics-chart-point--blue" cx={interviews[index].x} cy={interviews[index].y} r="5" />
                  <circle className="analytics-chart-point analytics-chart-point--green" cx={employed[index].x} cy={employed[index].y} r="5" />
                </>
              )}
              <rect
                className="analytics-chart-hit-area"
                x={point.x - hitAreaWidth / 2}
                y="0"
                width={hitAreaWidth}
                height="260"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                tabIndex={0}
              />
              <text className="analytics-chart-label" x={point.x} y="254">
                {data[index].month}
              </text>
            </g>
          ))}
        </svg>

        <div
          className="analytics-line-tooltip"
          style={{
            left: `${(activePoint.x / 820) * 100}%`,
            top: `${Math.max(activePoint.y - 7, 14)}px`,
            transform:
              safeActiveIndex === 0
                ? "translate(0, -100%)"
                : safeActiveIndex === data.length - 1
                  ? "translate(-100%, -100%)"
                  : "translate(-50%, -100%)",
          }}
        >
          <strong>{active.month}</strong>
          <span>Отклики: {formatNumber(active.applications)}</span>
          <span>Собеседования: {formatNumber(active.interviews)}</span>
          <span>Трудоустроено: {formatNumber(active.employed)}</span>
        </div>
      </div>
    </div>
  );
};

interface StatusDonutProps {
  items: AnalyticsStatusItem[];
}

const StatusDonut = ({ items }: StatusDonutProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const segments = items.map((item, index) => {
    const previousTotal = items
      .slice(0, index)
      .reduce((sum, previousItem) => sum + previousItem.value, 0);

    return {
      item,
      index,
      offset: (previousTotal / total) * circumference,
      segment: (item.value / total) * circumference,
    };
  });

  return (
    <div className="analytics-donut-layout">
      <div className="analytics-donut">
        <svg viewBox="0 0 190 190" role="img" aria-label="Распределение заявок по статусам">
          <circle className="analytics-donut-track" cx="95" cy="95" r={radius} />
          {segments.map(({ item, index, offset, segment }) => (
              <circle
                key={item.label}
                className={`analytics-donut-segment ${index === activeIndex ? "analytics-donut-segment--active" : ""}`}
                cx="95"
                cy="95"
                r={radius}
                stroke={item.color}
                strokeDasharray={`${segment} ${circumference - segment}`}
                strokeDashoffset={-offset}
                onMouseEnter={() => setActiveIndex(index)}
              />
          ))}
        </svg>
        <div className="analytics-donut-center">
          <strong>{formatNumber(items[activeIndex].value)}</strong>
          <span>{items[activeIndex].label}</span>
        </div>
      </div>

      <div className="analytics-donut-legend">
        {items.map((item, index) => (
          <button
            key={item.label}
            className={index === activeIndex ? "is-active" : ""}
            type="button"
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
          >
            <i style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
            <strong>{formatNumber(item.value)}</strong>
          </button>
        ))}
      </div>
    </div>
  );
};

interface InterviewFunnelProps {
  items: AnalyticsFunnelItem[];
}

const InterviewFunnel = ({ items }: InterviewFunnelProps) => {
  const [activeIndex, setActiveIndex] = useState(items.length - 1);
  const maxValue = items[0].value;

  return (
    <div className="analytics-funnel">
      <div className="analytics-funnel__summary">
        <div>
          <strong>{formatNumber(items[activeIndex].value)}</strong>
          <span>{items[activeIndex].label}</span>
        </div>
        <small>{items[activeIndex].detail}</small>
      </div>

      <div className="analytics-funnel__steps">
        {items.map((item, index) => (
          <button
            key={item.label}
            className={index === activeIndex ? "is-active" : ""}
            type="button"
            style={cssVar("--analytics-funnel-width", `${52 + (item.value / maxValue) * 48}%`)}
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
          >
            <span>{item.label}</span>
            <strong>{formatNumber(item.value)}</strong>
          </button>
        ))}
      </div>
    </div>
  );
};

interface InterviewBarsProps {
  items: InterviewDynamicsItem[];
}

const InterviewBars = ({ items }: InterviewBarsProps) => {
  const [activeIndex, setActiveIndex] = useState(items.length - 1);
  const maxValue = Math.max(...items.map((item) => item.scheduled));
  const active = items[activeIndex];

  return (
    <div className="analytics-bars-chart">
      <div className="analytics-bars-tooltip">
        <strong>{active.month}</strong>
        <span>Назначено: {formatNumber(active.scheduled)}</span>
        <span>Прошли: {formatNumber(active.attended)}</span>
        <span>Успешно: {formatNumber(active.successful)}</span>
      </div>

      <div className="analytics-bars-chart__plot" role="img" aria-label="Динамика собеседований">
        {items.map((item, index) => (
          <div
            key={item.month}
            className={`analytics-bars-chart__group ${index === activeIndex ? "is-active" : ""}`}
            tabIndex={0}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
          >
            <div className="analytics-bars-chart__columns">
              <i className="analytics-bar analytics-bar--scheduled" style={cssVar("--analytics-bar-height", `${(item.scheduled / maxValue) * 100}%`)} />
              <i className="analytics-bar analytics-bar--attended" style={cssVar("--analytics-bar-height", `${(item.attended / maxValue) * 100}%`)} />
              <i className="analytics-bar analytics-bar--successful" style={cssVar("--analytics-bar-height", `${(item.successful / maxValue) * 100}%`)} />
            </div>
            <span>{item.month}</span>
          </div>
        ))}
      </div>

      <div className="analytics-chart-legend">
        <span><i className="analytics-dot analytics-dot--soft-violet" />Назначено</span>
        <span><i className="analytics-dot analytics-dot--blue" />Прошли</span>
        <span><i className="analytics-dot analytics-dot--green" />Успешно</span>
      </div>
    </div>
  );
};

interface AccessibilityListProps {
  items: AccessibilityItem[];
}

const AccessibilityList = ({ items }: AccessibilityListProps) => (
  <div className="analytics-progress-list">
    {items.map((item) => (
      <div className="analytics-progress" key={item.label}>
        <div className="analytics-progress__head">
          <span>{item.label}</span>
          <strong>{item.value}%</strong>
        </div>
        <div className="analytics-progress__track">
          <i
            style={{
              ...cssVar("--analytics-progress-width", `${item.value}%`),
              backgroundColor: item.color,
            }}
          />
        </div>
        <small>{formatNumber(item.count)} вакансий</small>
      </div>
    ))}
  </div>
);

const SummaryIcon = ({ id }: { id: string }) => {
  if (id === "candidates") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 20c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 7c0-1.7-1.3-3-3-3m0-4a2.5 2.5 0 1 0 0-5m-13 9c-1.7 0-3 1.3-3 3m6-9.5a2.5 2.5 0 1 0-5 0" />
      </svg>
    );
  }

  if (id === "vacancies") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6V4h6v2m-8 0h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Zm-3 6h16m-10 0v2h4v-2" />
      </svg>
    );
  }

  if (id === "employed") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12 4 4L19 6M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
    </svg>
  );
};

export const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(12);

  useEffect(() => {
    const controller = new AbortController();

    const loadAnalytics = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/analytics.json`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Не удалось загрузить показатели");
        }

        setData((await response.json()) as AnalyticsData);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Не удалось загрузить аналитику",
        );
      }
    };

    loadAnalytics();

    return () => controller.abort();
  }, []);

  const activity = useMemo(
    () => data?.monthlyActivity.slice(-period) ?? [],
    [data, period],
  );

  const activityTotal = useMemo(
    () => activity.reduce((sum, item) => sum + item.applications, 0),
    [activity],
  );

  if (error) {
    return (
      <section className="analytics-page">
        <AppBreadcrumbs items={[{ label: "Аналитика" }]} />
        <div className="analytics-state analytics-state--error">{error}</div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="analytics-page">
        <AppBreadcrumbs items={[{ label: "Аналитика" }]} />
        <div className="analytics-state">
          <span className="analytics-loader" />
          Загружаем аналитику...
        </div>
      </section>
    );
  }

  const maxRegion = Math.max(...data.regions.map((item) => item.value));
  const maxCategory = Math.max(...data.categories.map((item) => item.value));

  return (
    <section className="analytics-page">
      <AppBreadcrumbs items={[{ label: "Аналитика" }]} />

      <header className="analytics-hero">
        <div className="analytics-hero__content">
          <span className="analytics-eyebrow">
            <i /> JobAbility Intelligence
          </span>
          <h1>{data.meta.title}</h1>
          <p>{data.meta.subtitle}</p>
          <div className="analytics-hero__meta">
            <span><i className="analytics-pulse" /> Данные обновлены: {data.meta.updatedAt}</span>
            <span>Источник: агрегированные данные платформы</span>
          </div>
        </div>

        <aside className="analytics-hero__notice">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M10.3 4.2 2.5 17.7A1.5 1.5 0 0 0 3.8 20h16.4a1.5 1.5 0 0 0 1.3-2.3L13.7 4.2a1.5 1.5 0 0 0-2.6 0Z" />
          </svg>
          <div>
            <strong>Актуальный срез</strong>
            <span>{data.meta.dataNotice}</span>
          </div>
        </aside>
      </header>

      <div className="analytics-summary-grid">
        {data.summary.map((item) => (
          <article className={`analytics-summary-card analytics-summary-card--${item.tone}`} key={item.id}>
            <div className="analytics-summary-card__top">
              <span className="analytics-summary-icon"><SummaryIcon id={item.id} /></span>
              <span className="analytics-trend">+{item.trend}%</span>
            </div>
            <strong>{item.format === "percent" ? `${item.value}%` : formatNumber(item.value)}</strong>
            <span>{item.label}</span>
            <small>{item.trendLabel}</small>
          </article>
        ))}
      </div>

      <div className="analytics-grid analytics-grid--activity">
        <article className="analytics-card analytics-card--wide">
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">Динамика платформы</span>
              <h2>Путь от отклика до трудоустройства</h2>
              <p>{formatNumber(activityTotal)} откликов за выбранный период</p>
            </div>

            <div className="analytics-period" aria-label="Период графика">
              {[6, 12].map((value) => (
                <button
                  className={value === period ? "is-active" : ""}
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                >
                  {value} мес.
                </button>
              ))}
            </div>
          </div>

          <ActivityChart data={activity} key={period} />
        </article>

        <article className="analytics-card analytics-card--impact">
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">Социальный эффект</span>
              <h2>Главное в цифрах</h2>
            </div>
          </div>

          <div className="analytics-impact-list">
            {data.impact.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="analytics-grid analytics-grid--two">
        <article className="analytics-card">
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">Заявки</span>
              <h2>Состояния заявок</h2>
              <p>Распределение актуальных откликов по этапам</p>
            </div>
          </div>
          <StatusDonut items={data.applicationStatuses} />
        </article>

        <article className="analytics-card analytics-card--funnel">
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">Конверсия</span>
              <h2>Воронка собеседований</h2>
              <p>Как кандидаты проходят ключевые этапы отбора</p>
            </div>
          </div>
          <InterviewFunnel items={data.interviewFunnel} />
        </article>
      </div>

      <div className="analytics-grid analytics-grid--two">
        <article className="analytics-card">
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">Собеседования</span>
              <h2>Назначено, пройдено, успешно</h2>
              <p>Динамика за последние шесть месяцев</p>
            </div>
          </div>
          <InterviewBars items={data.interviewDynamics} />
        </article>

        <article className="analytics-card">
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">Инклюзивность</span>
              <h2>Условия доступной работы</h2>
              <p>Доля вакансий с конкретными условиями адаптации</p>
            </div>
          </div>
          <AccessibilityList items={data.accessibility} />
        </article>
      </div>

      <div className="analytics-grid analytics-grid--two">
        <article className="analytics-card">
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">География</span>
              <h2>Регионы-лидеры</h2>
              <p>Количество активных вакансий на платформе</p>
            </div>
          </div>

          <div className="analytics-ranking">
            {data.regions.map((item, index) => (
              <div className="analytics-ranking__item" key={item.label}>
                <span className="analytics-ranking__number">0{index + 1}</span>
                <div>
                  <div className="analytics-ranking__head">
                    <strong>{item.label}</strong>
                    <span>{formatNumber(item.value)} вакансий</span>
                  </div>
                  <div className="analytics-ranking__track">
                    <i style={cssVar("--analytics-progress-width", `${(item.value / maxRegion) * 100}%`)} />
                  </div>
                </div>
                <small>{item.share}%</small>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">Рынок вакансий</span>
              <h2>Популярные направления</h2>
              <p>Структура предложений работодателей</p>
            </div>
          </div>

          <div className="analytics-categories">
            {data.categories.map((item) => (
              <div className="analytics-category" key={item.label}>
                <div className="analytics-category__head">
                  <strong>{item.label}</strong>
                  <span>{formatNumber(item.value)}</span>
                </div>
                <div className="analytics-category__track">
                  <i style={cssVar("--analytics-progress-width", `${(item.value / maxCategory) * 100}%`)} />
                </div>
                <small>+{item.trend}% за период</small>
              </div>
            ))}
          </div>
        </article>
      </div>

      <footer className="analytics-footer">
        <span><i className="analytics-pulse" /> Интерактивный аналитический дашборд</span>
        <span>JobAbility · Цифровые инвестиции 2026</span>
      </footer>
    </section>
  );
};

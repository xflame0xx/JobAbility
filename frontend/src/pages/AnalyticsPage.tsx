import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { AppBreadcrumbs } from "../components/AppBreadcrumbs";
import type {
  AccessibilityItem,
  AnalyticsData,
  AnalyticsFunnelItem,
  AnalyticsStatusItem,
  CategoryItem,
  InterviewDynamicsItem,
  MonthlyActivityItem,
  RegionItem,
} from "../types/analytics";

const numberFormatter = new Intl.NumberFormat("ru-RU");

const formatNumber = (value: number) => numberFormatter.format(value);

const cssVar = (name: string, value: string) =>
  ({ [name]: value }) as CSSProperties;

type AnalyticsFocusId =
  | "employment"
  | "interviews"
  | "accessibility"
  | "regions";

interface AnalyticsFocusItem {
  id: AnalyticsFocusId;
  label: string;
  eyebrow: string;
  value: string;
  detail: string;
  metric: string;
  metricLabel: string;
  targetId: string;
  tone: "violet" | "blue" | "green" | "orange";
}

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

const polarPoint = (
  index: number,
  total: number,
  radius: number,
  centerX = 50,
  centerY = 50,
) => {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / total;

  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
};

interface InterviewOrbitProps {
  items: InterviewDynamicsItem[];
}

const InterviewOrbit = ({ items }: InterviewOrbitProps) => {
  const [activeIndex, setActiveIndex] = useState(items.length - 1);
  const maxValue = Math.max(...items.map((item) => item.scheduled));
  const active = items[activeIndex];
  const attendance = Math.round((active.attended / active.scheduled) * 100);
  const success = Math.round((active.successful / active.attended) * 100);

  const ringDash = (value: number, radius: number) => {
    const circumference = 2 * Math.PI * radius;

    return `${(value / maxValue) * circumference} ${circumference}`;
  };

  return (
    <div className="analytics-orbit-layout">
      <div className="analytics-orbit-visual">
        <svg viewBox="0 0 300 300" role="img" aria-label="Орбитальная динамика собеседований">
          <defs>
            <filter id="analytics-orbit-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle className="analytics-orbit-path analytics-orbit-path--outer" cx="150" cy="150" r="118" />
          <circle className="analytics-orbit-path" cx="150" cy="150" r="70" />
          <circle className="analytics-orbit-track" cx="150" cy="150" r="70" />
          <circle className="analytics-orbit-track" cx="150" cy="150" r="54" />
          <circle className="analytics-orbit-track" cx="150" cy="150" r="38" />
          <circle
            className="analytics-orbit-progress analytics-orbit-progress--violet"
            cx="150"
            cy="150"
            r="70"
            strokeDasharray={ringDash(active.scheduled, 70)}
          />
          <circle
            className="analytics-orbit-progress analytics-orbit-progress--blue"
            cx="150"
            cy="150"
            r="54"
            strokeDasharray={ringDash(active.attended, 54)}
          />
          <circle
            className="analytics-orbit-progress analytics-orbit-progress--green"
            cx="150"
            cy="150"
            r="38"
            strokeDasharray={ringDash(active.successful, 38)}
          />
        </svg>

        {items.map((item, index) => {
          const point = polarPoint(index, items.length, 39.5);

          return (
            <button
              className={`analytics-orbit-node ${index === activeIndex ? "is-active" : ""}`}
              key={item.month}
              type="button"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            >
              <i />
              <span>{item.month}</span>
            </button>
          );
        })}

        <div className="analytics-orbit-core">
          <small>{active.month}</small>
          <strong>{active.attended}</strong>
          <span>прошли</span>
        </div>
      </div>

      <div className="analytics-orbit-insights">
        <div className="analytics-orbit-insights__head">
          <span>Пульс месяца</span>
          <strong>{active.month}</strong>
        </div>

        <div className="analytics-orbit-metrics">
          <div>
            <i className="analytics-dot analytics-dot--soft-violet" />
            <span>Назначено</span>
            <strong>{active.scheduled}</strong>
          </div>
          <div>
            <i className="analytics-dot analytics-dot--blue" />
            <span>Прошли</span>
            <strong>{active.attended}</strong>
          </div>
          <div>
            <i className="analytics-dot analytics-dot--green" />
            <span>Успешно</span>
            <strong>{active.successful}</strong>
          </div>
        </div>

        <div className="analytics-orbit-conversion">
          <div>
            <span>Явка</span>
            <strong>{attendance}%</strong>
          </div>
          <div>
            <span>Успешность</span>
            <strong>{success}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AccessibilityRadarProps {
  items: AccessibilityItem[];
}

const AccessibilityRadar = ({ items }: AccessibilityRadarProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const center = 150;
  const radius = 104;
  const active = items[activeIndex];
  const average = Math.round(
    items.reduce((sum, item) => sum + item.value, 0) / items.length,
  );

  const radarPoint = (index: number, value: number) => {
    return polarPoint(index, items.length, radius * value, center, center);
  };

  const polygon = (value: number) => {
    return items
      .map((_, index) => {
        const point = radarPoint(index, value);

        return `${point.x},${point.y}`;
      })
      .join(" ");
  };

  const valuePolygon = items
    .map((item, index) => {
      const point = radarPoint(index, item.value / 100);

      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className="analytics-radar-layout">
      <div className="analytics-radar-visual">
        <svg viewBox="0 0 300 300" role="img" aria-label="Радар условий доступной работы">
          <defs>
            <linearGradient id="analytics-radar-fill" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#635bff" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#28a7f0" stopOpacity="0.22" />
            </linearGradient>
            <filter id="analytics-radar-glow">
              <feGaussianBlur stdDeviation="3.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((level) => (
            <polygon className="analytics-radar-grid" key={level} points={polygon(level)} />
          ))}

          {items.map((_, index) => {
            const point = radarPoint(index, 1);

            return (
              <line
                className="analytics-radar-axis"
                key={index}
                x1={center}
                x2={point.x}
                y1={center}
                y2={point.y}
              />
            );
          })}

          <polygon className="analytics-radar-shape" points={valuePolygon} />

          {items.map((item, index) => {
            const point = radarPoint(index, item.value / 100);

            return (
              <circle
                className={`analytics-radar-point ${index === activeIndex ? "is-active" : ""}`}
                cx={point.x}
                cy={point.y}
                key={item.label}
                r={index === activeIndex ? 7 : 4.5}
                onMouseEnter={() => setActiveIndex(index)}
              />
            );
          })}
        </svg>

        <div className="analytics-radar-center">
          <strong>{average}%</strong>
          <span>средний индекс</span>
        </div>
      </div>

      <div className="analytics-radar-legend">
        <div className="analytics-radar-legend__active">
          <span>{active.label}</span>
          <strong>{active.value}%</strong>
          <small>{formatNumber(active.count)} вакансий</small>
        </div>

        {items.map((item, index) => (
          <button
            className={index === activeIndex ? "is-active" : ""}
            key={item.label}
            type="button"
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
          >
            <i style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
            <strong>{item.value}%</strong>
          </button>
        ))}
      </div>
    </div>
  );
};

interface RegionLollipopChartProps {
  items: RegionItem[];
}

const RegionLollipopChart = ({ items }: RegionLollipopChartProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];
  const maxValue = Math.max(...items.map((item) => item.value));

  return (
    <div className="analytics-lollipop">
      <div className="analytics-lollipop__summary">
        <span>0{activeIndex + 1}</span>
        <div>
          <strong>{active.label}</strong>
          <small>{active.value} активных вакансий</small>
        </div>
        <b>{active.share}%</b>
      </div>

      <div className="analytics-lollipop__chart" role="img" aria-label="Рейтинг регионов по количеству вакансий">
        {items.map((item, index) => (
          <button
            className={`analytics-lollipop__row ${index === activeIndex ? "is-active" : ""}`}
            key={item.label}
            type="button"
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
          >
            <span className="analytics-lollipop__rank">0{index + 1}</span>
            <span className="analytics-lollipop__label">{item.label}</span>
            <span className="analytics-lollipop__value">{item.value}</span>
            <span className="analytics-lollipop__rail">
              <i style={cssVar("--analytics-lollipop-width", `${(item.value / maxValue) * 100}%`)} />
            </span>
            <small>{item.share}%</small>
          </button>
        ))}
      </div>
    </div>
  );
};

const CATEGORY_LABELS = [
  "IT",
  "Поддержка",
  "Админ.",
  "Производ.",
  "Образов.",
  "Другие",
];

interface CategorySkylineChartProps {
  items: CategoryItem[];
}

const CategorySkylineChart = ({ items }: CategorySkylineChartProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];
  const maxValue = Math.max(...items.map((item) => item.value));

  return (
    <div className="analytics-skyline">
      <div className="analytics-skyline__summary">
        <div>
          <span>Выбрано направление</span>
          <strong>{active.label}</strong>
        </div>
        <b>{active.value}</b>
        <small>+{active.trend}% за период</small>
      </div>

      <div className="analytics-skyline__plot" role="img" aria-label="Распределение вакансий по направлениям">
        {items.map((item, index) => (
          <div className="analytics-skyline__column" key={item.label}>
            <button
              className={`analytics-skyline__bar ${index === activeIndex ? "is-active" : ""}`}
              type="button"
              aria-label={`${item.label}: ${item.value} вакансий`}
              style={cssVar("--analytics-skyline-height", `${(item.value / maxValue) * 100}%`)}
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            >
              <strong>{item.value}</strong>
              <i />
            </button>
            <span>{CATEGORY_LABELS[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [activeFocusId, setActiveFocusId] =
    useState<AnalyticsFocusId>("employment");

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

  const focusItems = useMemo<AnalyticsFocusItem[]>(() => {
    if (!data) {
      return [];
    }

    const employed = data.summary.find((item) => item.id === "employed") ?? {
      value: 0,
      trend: 0,
      trendLabel: "к прошлому периоду",
    };
    const latestInterview =
      data.interviewDynamics[data.interviewDynamics.length - 1];
    const averageAccessibility = Math.round(
      data.accessibility.reduce((sum, item) => sum + item.value, 0) /
        data.accessibility.length,
    );
    const topAccessibility = data.accessibility[0];
    const leaderRegion = data.regions[0];

    return [
      {
        id: "employment",
        label: "Трудоустройство",
        eyebrow: "Результат платформы",
        value: `${formatNumber(employed.value)} человек`,
        detail: "вышли на работу через JobAbility за выбранный период",
        metric: `+${employed.trend}%`,
        metricLabel: employed.trendLabel,
        targetId: "analytics-activity",
        tone: "green",
      },
      {
        id: "interviews",
        label: "Собеседования",
        eyebrow: `Пульс за ${latestInterview.month.toLowerCase()}`,
        value: `${latestInterview.attended} прошли`,
        detail: "собеседование после назначения встречи работодателем",
        metric: `${Math.round(
          (latestInterview.attended / latestInterview.scheduled) * 100,
        )}%`,
        metricLabel: "явка кандидатов",
        targetId: "analytics-interviews",
        tone: "blue",
      },
      {
        id: "accessibility",
        label: "Доступность",
        eyebrow: "Индекс инклюзивности",
        value: `${averageAccessibility}%`,
        detail: "средний уровень представленности условий адаптации",
        metric: `${topAccessibility.value}%`,
        metricLabel: topAccessibility.label,
        targetId: "analytics-accessibility",
        tone: "violet",
      },
      {
        id: "regions",
        label: "География",
        eyebrow: "Регион-лидер",
        value: leaderRegion.label,
        detail: "лидирует по числу активных вакансий на платформе",
        metric: `${leaderRegion.value}`,
        metricLabel: "активных вакансий",
        targetId: "analytics-regions",
        tone: "orange",
      },
    ];
  }, [data]);

  const activeFocus =
    focusItems.find((item) => item.id === activeFocusId) ?? focusItems[0];

  const openFocusChart = () => {
    document.getElementById(activeFocus.targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const focusCardClass = (targetId: string) =>
    activeFocus?.targetId === targetId ? " analytics-card--spotlight" : "";

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

      <section className={`analytics-focus analytics-focus--${activeFocus.tone}`}>
        <div className="analytics-focus__intro">
          <span className="analytics-card__eyebrow">Аналитический фокус</span>
          <h2>Посмотрите данные под разным углом</h2>
          <p>Выберите сценарий: показатели и акцентная диаграмма обновятся автоматически.</p>
        </div>

        <div className="analytics-focus__tabs" role="tablist" aria-label="Сценарий аналитики">
          {focusItems.map((item) => (
            <button
              aria-selected={item.id === activeFocusId}
              className={item.id === activeFocusId ? "is-active" : ""}
              key={item.id}
              onClick={() => setActiveFocusId(item.id)}
              role="tab"
              type="button"
            >
              <i />
              {item.label}
            </button>
          ))}
        </div>

        <div className="analytics-focus__result" key={activeFocus.id}>
          <div className="analytics-focus__value">
            <span>{activeFocus.eyebrow}</span>
            <strong>{activeFocus.value}</strong>
            <p>{activeFocus.detail}</p>
          </div>

          <div className="analytics-focus__metric">
            <strong>{activeFocus.metric}</strong>
            <span>{activeFocus.metricLabel}</span>
          </div>

          <button className="analytics-focus__action" onClick={openFocusChart} type="button">
            Показать диаграмму
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </section>

      <div className="analytics-grid analytics-grid--activity">
        <article
          className={`analytics-card analytics-card--wide${focusCardClass("analytics-activity")}`}
          id="analytics-activity"
        >
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
        <article
          className={`analytics-card analytics-card--orbit${focusCardClass("analytics-interviews")}`}
          id="analytics-interviews"
        >
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">Собеседования</span>
              <h2>Назначено, пройдено, успешно</h2>
              <p>Динамика за последние шесть месяцев</p>
            </div>
          </div>
          <InterviewOrbit items={data.interviewDynamics} />
        </article>

        <article
          className={`analytics-card analytics-card--radar${focusCardClass("analytics-accessibility")}`}
          id="analytics-accessibility"
        >
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">Инклюзивность</span>
              <h2>Условия доступной работы</h2>
              <p>Доля вакансий с конкретными условиями адаптации</p>
            </div>
          </div>
          <AccessibilityRadar items={data.accessibility} />
        </article>
      </div>

      <div className="analytics-grid analytics-grid--two">
        <article
          className={`analytics-card analytics-card--lollipop${focusCardClass("analytics-regions")}`}
          id="analytics-regions"
        >
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">География</span>
              <h2>Регионы-лидеры</h2>
              <p>Количество активных вакансий на платформе</p>
            </div>
          </div>

          <RegionLollipopChart items={data.regions} />
        </article>

        <article className="analytics-card analytics-card--skyline">
          <div className="analytics-card__head">
            <div>
              <span className="analytics-card__eyebrow">Рынок вакансий</span>
              <h2>Популярные направления</h2>
              <p>Структура предложений работодателей</p>
            </div>
          </div>

          <CategorySkylineChart items={data.categories} />
        </article>
      </div>

      <footer className="analytics-footer">
        <span><i className="analytics-pulse" /> Интерактивный аналитический дашборд</span>
        <span>JobAbility · Цифровые инвестиции 2026</span>
      </footer>
    </section>
  );
};

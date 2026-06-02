export type AnalyticsTone = "violet" | "blue" | "green" | "orange";
export type AnalyticsValueFormat = "number" | "percent";

export interface AnalyticsMeta {
  title: string;
  subtitle: string;
  updatedAt: string;
  dataNotice: string;
}

export interface AnalyticsSummaryItem {
  id: string;
  label: string;
  value: number;
  format: AnalyticsValueFormat;
  trend: number;
  trendLabel: string;
  tone: AnalyticsTone;
}

export interface MonthlyActivityItem {
  month: string;
  applications: number;
  interviews: number;
  employed: number;
}

export interface AnalyticsStatusItem {
  label: string;
  value: number;
  color: string;
}

export interface AnalyticsFunnelItem {
  label: string;
  value: number;
  detail: string;
}

export interface InterviewDynamicsItem {
  month: string;
  scheduled: number;
  attended: number;
  successful: number;
}

export interface AccessibilityItem {
  label: string;
  value: number;
  count: number;
  color: string;
}

export interface RegionItem {
  label: string;
  value: number;
  share: number;
}

export interface CategoryItem {
  label: string;
  value: number;
  trend: number;
}

export interface ImpactItem {
  label: string;
  value: string;
  detail: string;
}

export interface AnalyticsSliceFactors {
  candidates: number;
  vacancies: number;
  employed: number;
  conversion: number;
  trends: number;
  activity: {
    applications: number;
    interviews: number;
    employed: number;
  };
  statuses: number[];
  funnel: number[];
  interviews: {
    scheduled: number;
    attended: number;
    successful: number;
  };
  accessibility: number[];
  regions: number[];
  categories: number[];
}

export interface AnalyticsSlice {
  id: string;
  label: string;
  description: string;
  tone: AnalyticsTone;
  factors: AnalyticsSliceFactors;
  impact?: ImpactItem[];
}

export interface AnalyticsDataset {
  summary: AnalyticsSummaryItem[];
  monthlyActivity: MonthlyActivityItem[];
  applicationStatuses: AnalyticsStatusItem[];
  interviewFunnel: AnalyticsFunnelItem[];
  interviewDynamics: InterviewDynamicsItem[];
  accessibility: AccessibilityItem[];
  regions: RegionItem[];
  categories: CategoryItem[];
  impact: ImpactItem[];
}

export interface AnalyticsData extends AnalyticsDataset {
  meta: AnalyticsMeta;
  slices: AnalyticsSlice[];
}

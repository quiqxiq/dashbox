export type ReportTab = 'sales' | 'resume';

export interface ReportEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  username: string;
  ip: string;
  mac: string;
  profile: string;
  comment: string;
  price: number;
}

export interface ReportFilter {
  day: string; // DD (01-31) or 'all'
  month: string; // YYYY-MM or 'all'
  year: string; // YYYY or 'all'
  query: string;
}

export interface ReportSummary {
  todayIncome: number;
  todayCount: number;
  monthIncome: number;
  monthCount: number;
  filteredIncome: number;
  filteredCount: number;
  average: number;
  topProfile: string;
}

export interface ReportResumeRow {
  profile: string;
  count: number;
  income: number;
}

export interface ReportDayPoint {
  label: string;
  income: number;
  count: number;
  height: number;
}

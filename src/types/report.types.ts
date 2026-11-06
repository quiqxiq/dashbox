export type ReportTab = 'sales' | 'resume';

export type ReportDatePreset = 'all' | 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'custom';

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
  startDate: string; // YYYY-MM-DD or ''
  endDate: string; // YYYY-MM-DD or ''
  preset: ReportDatePreset;
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

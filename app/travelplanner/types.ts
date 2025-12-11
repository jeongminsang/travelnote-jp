import type { LucideIcon } from "lucide-react";

export type ScheduleTypeKey =
  | "flight"
  | "transport"
  | "food"
  | "hotel"
  | "sightseeing"
  | "shopping"
  | "etc";

export interface Costs {
  transport: number;
  food: number;
  entrance: number;
  shopping_sujin: number;
  shopping_seona: number;
  etc: number;
  [key: string]: number;
}

export interface ScheduleItem {
  id: string;
  day: number;
  time: string;
  type: ScheduleTypeKey;
  title: string;
  location: string;
  location_url: string | null;
  note: string;
  costs: Costs;
  startTime?: string;
  endTime?: string;
  isCompleted: boolean;
}

export interface ScheduleRow {
  id: string;
  day: number;
  start_time: string | null;
  end_time: string | null;
  type: ScheduleTypeKey;
  title: string;
  location: string | null;
  location_url: string | null;
  note: string | null;
  cost: number;
  is_completed: boolean;
}

export type ScheduleState = Record<number, ScheduleItem[]>;

export interface CostCategory {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  barColor: string;
  hexColor: string;
}

export interface ScheduleTypeOption {
  key: ScheduleTypeKey;
  label: string;
  icon: LucideIcon;
}

export interface ChartData {
  key: string;
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export type ChecklistType = "shopping" | "food";

export interface ChecklistItem {
  id: string;
  title: string;
  is_completed: boolean;
  note?: string;
  created_at?: string;
  category: "shopping" | "food";
}

export type ChecklistState = ChecklistItem[];

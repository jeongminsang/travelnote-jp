import type { LucideIcon } from "lucide-react";
import {
  Plane,
  Bus,
  Utensils,
  BedDouble,
  MapPin,
  ShoppingBag,
  Camera,
  Ticket,
} from "lucide-react";
import { DEFAULT_DAYS } from "./constants";
import type {
  Costs,
  ScheduleItem,
  ScheduleRow,
  ScheduleState,
  ScheduleTypeKey,
} from "./types";

export const createEmptyScheduleState = (): ScheduleState =>
  DEFAULT_DAYS.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {} as ScheduleState);

export const createDefaultNewItem = (day: number): ScheduleItem => ({
  id: "",
  day,
  time: "",
  startTime: "",
  endTime: "",
  type: "sightseeing",
  title: "",
  location: "",
  location_url: "",
  note: "",
  isCompleted: false,
  costs: {
    transport: 0,
    food: 0,
    entrance: 0,
    shopping_sujin: 0,
    shopping_seona: 0,
    etc: 0,
  },
});

export const getSortableTime = (item: ScheduleItem) => {
  if (item.startTime) return item.startTime;
  if (item.time) {
    return item.time.split(/[-~]/)[0]?.trim() || "";
  }
  return "";
};

export const sortItemsByTime = (items: ScheduleItem[]) =>
  [...items].sort((a, b) =>
    getSortableTime(a).localeCompare(getSortableTime(b))
  );

export const sanitizeCosts = (costs?: Partial<Costs>): Costs => ({
  transport: parseInt(String(costs?.transport ?? 0), 10) || 0,
  food: parseInt(String(costs?.food ?? 0), 10) || 0,
  entrance: parseInt(String(costs?.entrance ?? 0), 10) || 0,
  shopping_sujin: parseInt(String(costs?.shopping_sujin ?? 0), 10) || 0,
  shopping_seona: parseInt(String(costs?.shopping_seona ?? 0), 10) || 0,
  etc: parseInt(String(costs?.etc ?? 0), 10) || 0,
});

export const mapRowToItem = (row: ScheduleRow): ScheduleItem => {
  const start = row.start_time ? row.start_time.slice(0, 5) : "";
  const end = row.end_time ? row.end_time.slice(0, 5) : "";
  const timeLabel = start
    ? end
      ? `${start} - ${end}`
      : `${start} ~`
    : end
    ? `~ ${end}`
    : "";
  // ScheduleRow의 cost를 costs의 합계로 변환
  // UI는 여전히 costs를 사용하지만, DB는 cost 하나만 저장
  const totalCost = row.cost ?? 0;
  return {
    id: row.id,
    day: row.day,
    time: timeLabel,
    startTime: start,
    endTime: end,
    type: row.type,
    title: row.title,
    location: row.location || "",
    location_url: row.location_url || "",
    note: row.note || "",
    isCompleted: row.is_completed,
    costs: {
      transport: 0,
      food: 0,
      entrance: 0,
      shopping_sujin: 0,
      shopping_seona: 0,
      etc: totalCost, // 전체 비용을 etc에 할당 (또는 원하는 필드에)
    },
  };
};

export const parseTime = (timeStr: string) => {
  if (!timeStr) return { start: "", end: "" };
  const parts = timeStr.replace(/\s/g, "").split(/[-~]/);
  return {
    start: parts[0] || "",
    end: parts[1] || "",
  };
};

export const timeToDbValue = (value?: string) => (value ? `${value}:00` : null);

export const calculateTotalCost = (costs?: Costs) => {
  if (!costs) return 0;
  return Object.values(costs).reduce((acc, cost) => acc + cost, 0);
};

export const toKRW = (jpy: number, exchangeRate: number) =>
  (jpy * exchangeRate).toLocaleString();

const typeStyleMap: Record<
  ScheduleTypeKey | "default",
  {
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
  }
> = {
  flight: {
    icon: Plane,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  transport: {
    icon: Bus,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  food: {
    icon: Utensils,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  hotel: {
    icon: BedDouble,
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  shopping: {
    icon: ShoppingBag,
    color: "text-pink-500",
    bg: "bg-pink-50",
    border: "border-pink-200",
  },
  sightseeing: {
    icon: Camera,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  etc: {
    icon: Ticket,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
  default: {
    icon: MapPin,
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
};

export const getTypeStyles = (type: string) =>
  typeStyleMap[type as ScheduleTypeKey] ?? typeStyleMap.default;

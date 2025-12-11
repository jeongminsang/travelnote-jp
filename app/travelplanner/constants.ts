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
import type { CostCategory, ScheduleTypeOption } from "./types";

// 일본 엔화(JPY) 대비 한국 원화(KRW) 환율 (2024년 기준)
export const EXCHANGE_RATE = 9.45;

export const DEFAULT_DAYS = [1, 2, 3, 4];

export const costCategories: Record<string, CostCategory> = {
  transport: {
    label: "교통",
    icon: Bus,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    barColor: "bg-indigo-500",
    hexColor: "#4f46e5",
  },
  food: {
    label: "식사",
    icon: Utensils,
    color: "text-orange-600",
    bg: "bg-orange-50",
    barColor: "bg-orange-500",
    hexColor: "#f97316",
  },
  entrance: {
    label: "입장",
    icon: Ticket,
    color: "text-green-600",
    bg: "bg-green-50",
    barColor: "bg-green-500",
    hexColor: "#10b981",
  },
  shopping_sujin: {
    label: "수진 쇼핑",
    icon: ShoppingBag,
    color: "text-pink-600",
    bg: "bg-pink-50",
    barColor: "bg-pink-500",
    hexColor: "#ec4899",
  },
  shopping_seona: {
    label: "선아 쇼핑",
    icon: ShoppingBag,
    color: "text-purple-600",
    bg: "bg-purple-50",
    barColor: "bg-purple-500",
    hexColor: "#a855f7",
  },
  etc: {
    label: "기타 비용",
    icon: Ticket,
    color: "text-gray-600",
    bg: "bg-gray-50",
    barColor: "bg-gray-500",
    hexColor: "#6b7280",
  },
};

export const scheduleTypes: ScheduleTypeOption[] = [
  { key: "flight", label: "항공", icon: Plane },
  { key: "transport", label: "교통", icon: Bus },
  { key: "food", label: "식사", icon: Utensils },
  { key: "hotel", label: "숙소", icon: BedDouble },
  { key: "sightseeing", label: "관광", icon: Camera },
  { key: "shopping", label: "쇼핑", icon: ShoppingBag },
  { key: "etc", label: "기타", icon: MapPin },
];


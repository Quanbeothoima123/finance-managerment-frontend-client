import React from "react";
import {
  Bike,
  BookOpen,
  Car,
  Folder,
  Gift,
  Heart,
  Home,
  Plane,
  ShieldCheck,
  Smartphone,
  Target,
  TrendingUp,
  CheckCircle,
  Clock3,
} from "lucide-react";
import type { GoalItem, GoalUiStatus } from "../types/goals";

export const goalIconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  smartphone: Smartphone,
  plane: Plane,
  shield: ShieldCheck,
  bike: Bike,
  book: BookOpen,
  home: Home,
  car: Car,
  gift: Gift,
  heart: Heart,
  target: Target,
  folder: Folder,
};

export const goalIconOptions = [
  { key: "smartphone", label: "📱" },
  { key: "plane", label: "✈️" },
  { key: "home", label: "🏠" },
  { key: "car", label: "🚗" },
  { key: "bike", label: "🏍️" },
  { key: "book", label: "📚" },
  { key: "shield", label: "🛡️" },
  { key: "target", label: "🎯" },
  { key: "gift", label: "🎁" },
  { key: "heart", label: "❤️" },
];

export const goalColorOptions = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];

export function getGoalIconComponent(icon?: string) {
  return goalIconMap[icon || "target"] || Target;
}

export function formatCurrency(value: number | string | null | undefined) {
  const amount = typeof value === "number" ? value : Number(value || 0);
  return new Intl.NumberFormat("vi-VN").format(
    Number.isFinite(amount) ? amount : 0,
  );
}

export function minorToNumber(value: string | number | null | undefined) {
  const amount = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function formatMinor(value: string | number | null | undefined) {
  return formatCurrency(minorToNumber(value));
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getPriorityLabel(priority?: string | null) {
  switch (priority) {
    case "high":
      return "Ưu tiên cao";
    case "low":
      return "Ưu tiên thấp";
    default:
      return "Ưu tiên trung bình";
  }
}

export function getUiStatus(
  goal?: Pick<GoalItem, "uiStatus" | "status" | "progressPercent"> | null,
): GoalUiStatus {
  if (!goal) return "on-track";
  if (
    goal.uiStatus === "achieved" ||
    goal.status === "completed" ||
    Number(goal.progressPercent) >= 100
  ) {
    return "achieved";
  }
  if (goal.uiStatus === "behind") return "behind";
  return "on-track";
}

export function getUiStatusMeta(status: GoalUiStatus) {
  if (status === "achieved") {
    return {
      label: "Hoàn thành",
      color: "var(--success)",
      bg: "var(--success-light)",
      Icon: CheckCircle,
    };
  }

  if (status === "behind") {
    return {
      label: "Cần tăng tốc",
      color: "var(--warning)",
      bg: "var(--warning-light)",
      Icon: Clock3,
    };
  }

  return {
    label: "Đúng tiến độ",
    color: "var(--primary)",
    bg: "var(--primary-light)",
    Icon: TrendingUp,
  };
}

export function toDateInputValue(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function buildGoalPreview(
  goal: Partial<GoalItem> & {
    name?: string;
    color?: string;
    icon?: string;
    targetAmount?: number;
    currentAmount?: number;
  },
) {
  const currentAmount =
    goal.currentAmount ?? minorToNumber(goal.currentAmountMinor);
  const targetAmount =
    goal.targetAmount ?? minorToNumber(goal.targetAmountMinor);
  const progressPercent =
    targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;

  return {
    icon: goal.icon || "target",
    color: goal.color || "#3b82f6",
    name: goal.name || "Mục tiêu mới",
    currentAmount,
    targetAmount,
    progressPercent,
  };
}

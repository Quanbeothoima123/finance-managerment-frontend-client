import type * as React from "react";
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
  Clock3,
  CheckCircle2,
} from "lucide-react";
import type { GoalPriority, GoalUiStatus } from "../types/goals";

export const goalIcons: Array<{ key: string; label: string }> = [
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

export const goalColors = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];

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

export function getGoalIcon(iconName?: string) {
  return goalIconMap[iconName || ""] || Target;
}

export function formatCurrency(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
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

export function getGoalPriorityLabel(priority: GoalPriority) {
  if (priority === "high") return "Ưu tiên cao";
  if (priority === "low") return "Ưu tiên thấp";
  return "Ưu tiên trung bình";
}

export function getGoalStatusMeta(status: GoalUiStatus) {
  if (status === "achieved") {
    return {
      label: "Hoàn thành",
      textColor: "var(--success)",
      bgColor: "var(--success-light)",
      Icon: CheckCircle2,
    };
  }

  if (status === "behind") {
    return {
      label: "Cần tăng tốc",
      textColor: "var(--warning)",
      bgColor: "var(--warning-light)",
      Icon: Clock3,
    };
  }

  return {
    label: "Đúng tiến độ",
    textColor: "var(--primary)",
    bgColor: "var(--primary-light)",
    Icon: TrendingUp,
  };
}

export function getDaysRemaining(deadline?: string | null) {
  if (!deadline) return null;
  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

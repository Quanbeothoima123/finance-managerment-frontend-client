import React from "react";
import { Globe, Users, Lock } from "lucide-react";
import type { PostAudience } from "../../types/community";

interface AudienceBadgeProps {
  audience: PostAudience;
  size?: "sm" | "md";
}

const config: Record<
  PostAudience,
  { icon: React.ComponentType<any>; label: string; color: string; bg: string }
> = {
  public: {
    icon: Globe,
    label: "Công khai",
    color: "text-[var(--success)]",
    bg: "bg-[var(--success-light)]",
  },
  followers: {
    icon: Users,
    label: "Người theo dõi",
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary-light)]",
  },
  private: {
    icon: Lock,
    label: "Riêng tư",
    color: "text-[var(--text-tertiary)]",
    bg: "bg-[var(--surface)]",
  },
};

export function AudienceBadge({ audience, size = "sm" }: AudienceBadgeProps) {
  const c = config[audience];
  const Icon = c.icon;
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${c.color} ${c.bg} ${isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}
    >
      <Icon className={isSmall ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {c.label}
    </span>
  );
}

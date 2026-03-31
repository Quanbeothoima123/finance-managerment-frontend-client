import React from "react";
import { Globe, Users, Lock } from "lucide-react";
import type { PostAudience } from "../../types/community";

interface AudienceSelectorProps {
  value: PostAudience;
  onChange: (v: PostAudience) => void;
}

const options: {
  value: PostAudience;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    value: "public",
    label: "Công khai",
    icon: <Globe className="w-4 h-4" />,
    desc: "Mọi người đều thấy",
  },
  {
    value: "followers",
    label: "Người theo dõi",
    icon: <Users className="w-4 h-4" />,
    desc: "Chỉ người theo dõi bạn",
  },
  {
    value: "private",
    label: "Riêng tư",
    icon: <Lock className="w-4 h-4" />,
    desc: "Chỉ mình bạn thấy",
  },
];

export function AudienceSelector({ value, onChange }: AudienceSelectorProps) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
            value === opt.value
              ? "border-[var(--primary)] bg-[var(--primary-light)]"
              : "border-[var(--border)] hover:border-[var(--primary)]"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              value === opt.value
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--surface)] text-[var(--text-secondary)]"
            }`}
          >
            {opt.icon}
          </div>
          <div className="text-left flex-1">
            <p
              className={`text-sm font-medium ${value === opt.value ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}
            >
              {opt.label}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">{opt.desc}</p>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              value === opt.value
                ? "border-[var(--primary)]"
                : "border-[var(--border)]"
            }`}
          >
            {value === opt.value && (
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, PiggyBank, BarChart3, Calendar, ShieldCheck } from 'lucide-react';
import type { FinanceRecapData } from '../../contexts/SocialDataContext';

interface FinanceRecapCardProps {
  data: FinanceRecapData;
  large?: boolean;
  showPrivacyHint?: boolean;
  onRemove?: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  weekly: <Calendar className="w-4 h-4" />,
  monthly: <BarChart3 className="w-4 h-4" />,
  goal: <Target className="w-4 h-4" />,
  budget: <PiggyBank className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  weekly: 'Recap tuần',
  monthly: 'Tổng kết tháng',
  goal: 'Tiến độ mục tiêu',
  budget: 'Tiến độ ngân sách',
};

const trendIcons = {
  up: <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" />,
  down: <TrendingDown className="w-3.5 h-3.5 text-[var(--danger)]" />,
  neutral: <Minus className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />,
};

export function FinanceRecapCard({ data, large, showPrivacyHint, onRemove }: FinanceRecapCardProps) {
  const hasMaskedValues = data.stats.some(s => s.value === '***');

  return (
    <div
      className="rounded-2xl border border-[var(--border)] overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${data.color}08, ${data.color}15)` }}
    >
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors z-10"
          title="Gỡ recap"
        >
          ×
        </button>
      )}

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-[var(--divider)]">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${data.color}20`, color: data.color }}>
          {typeIcons[data.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-[var(--text-primary)] ${large ? 'text-sm' : 'text-xs'}`}>{data.title}</p>
          {data.period && <p className="text-xs text-[var(--text-tertiary)]">{data.period}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {hasMaskedValues && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--success-light)] text-[var(--success)]">
              <ShieldCheck className="w-3 h-3" />
              Ẩn số liệu
            </span>
          )}
          <div className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${data.color}20`, color: data.color }}>
            {typeLabels[data.type] || 'MoneyApp'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`px-4 py-3 grid gap-3 ${data.stats.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {data.stats.map((stat, i) => (
          <div key={i}>
            <p className="text-xs text-[var(--text-tertiary)] mb-0.5">{stat.label}</p>
            <div className="flex items-center gap-1">
              <span className={`font-semibold text-[var(--text-primary)] ${large ? 'text-sm' : 'text-xs'} tabular-nums`}>
                {stat.value}
              </span>
              {stat.trend && trendIcons[stat.trend]}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {data.progress !== undefined && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Tiến độ</span>
            <span className="text-xs font-semibold" style={{ color: data.color }}>{data.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(data.progress, 100)}%`, backgroundColor: data.color }}
            />
          </div>
        </div>
      )}

      {/* Privacy hint */}
      {showPrivacyHint && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Chia sẻ an toàn — thông tin nhạy cảm đã được bảo vệ
          </p>
        </div>
      )}
    </div>
  );
}

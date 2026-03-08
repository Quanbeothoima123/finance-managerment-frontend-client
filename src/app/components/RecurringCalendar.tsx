import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { Card } from './Card';

interface RecurringRule {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  frequency: string;
  nextRunDate: string;
  active: boolean;
}

interface RecurringCalendarProps {
  rules: RecurringRule[];
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: RecurringRule[];
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function getOccurrencesInMonth(rule: RecurringRule, year: number, month: number): Date[] {
  if (!rule.active) return [];

  const nextDate = new Date(rule.nextRunDate);
  const results: Date[] = [];
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  if (rule.frequency === 'monthly') {
    const day = nextDate.getDate();
    const lastDay = monthEnd.getDate();
    const targetDay = Math.min(day, lastDay);
    const d = new Date(year, month, targetDay);
    if (d >= monthStart && d <= monthEnd) {
      results.push(d);
    }
  } else if (rule.frequency === 'weekly') {
    const weekday = nextDate.getDay();
    let d = new Date(monthStart);
    while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
    while (d <= monthEnd) {
      results.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
  } else if (rule.frequency === 'daily') {
    let d = new Date(monthStart);
    while (d <= monthEnd) {
      results.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
  } else if (rule.frequency === 'yearly') {
    if (nextDate.getMonth() === month) {
      const day = Math.min(nextDate.getDate(), monthEnd.getDate());
      results.push(new Date(year, month, day));
    }
  } else if (rule.frequency === 'biweekly') {
    let d = new Date(nextDate);
    // Move to first occurrence in or after monthStart
    while (d < monthStart) d.setDate(d.getDate() + 14);
    while (d <= monthEnd) {
      results.push(new Date(d));
      d.setDate(d.getDate() + 14);
    }
  } else if (rule.frequency === 'quarterly') {
    const startMonth = nextDate.getMonth();
    // Quarterly means every 3 months from the start month
    for (let m = startMonth; m < 12; m += 3) {
      if (m === month) {
        const day = Math.min(nextDate.getDate(), monthEnd.getDate());
        results.push(new Date(year, month, day));
      }
    }
  }

  return results;
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'income': return 'var(--success)';
    case 'expense': return 'var(--danger)';
    case 'transfer': return 'var(--info)';
    default: return 'var(--text-secondary)';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'income': return <TrendingUp className="w-3 h-3" />;
    case 'expense': return <TrendingDown className="w-3 h-3" />;
    case 'transfer': return <ArrowRightLeft className="w-3 h-3" />;
    default: return null;
  }
}

export function RecurringCalendar({ rules }: RecurringCalendarProps) {
  const today = new Date('2026-02-23');
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const calendarDays: CalendarDay[] = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const startDayOfWeek = firstOfMonth.getDay(); // 0=Sunday

    // Build event map: day-of-month -> rules[]
    const eventMap: Record<number, RecurringRule[]> = {};
    rules.forEach(rule => {
      const dates = getOccurrencesInMonth(rule, viewYear, viewMonth);
      dates.forEach(d => {
        const day = d.getDate();
        if (!eventMap[day]) eventMap[day] = [];
        eventMap[day].push(rule);
      });
    });

    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonth = new Date(viewYear, viewMonth, 0);
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonth.getDate() - i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, events: [] });
    }

    // Current month days
    for (let day = 1; day <= lastOfMonth.getDate(); day++) {
      const d = new Date(viewYear, viewMonth, day);
      const isToday = d.getFullYear() === today.getFullYear() &&
                     d.getMonth() === today.getMonth() &&
                     d.getDate() === today.getDate();
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday,
        events: eventMap[day] || [],
      });
    }

    // Next month padding to fill 6 rows
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, events: [] });
    }

    return days;
  }, [viewYear, viewMonth, rules]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDay(null);
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // Summary for this month
  const monthlyIncome = useMemo(() => {
    let total = 0;
    rules.forEach(rule => {
      if (rule.type === 'income' && rule.active) {
        total += getOccurrencesInMonth(rule, viewYear, viewMonth).length * rule.amount;
      }
    });
    return total;
  }, [rules, viewYear, viewMonth]);

  const monthlyExpense = useMemo(() => {
    let total = 0;
    rules.forEach(rule => {
      if (rule.type === 'expense' && rule.active) {
        total += getOccurrencesInMonth(rule, viewYear, viewMonth).length * rule.amount;
      }
    });
    return total;
  }, [rules, viewYear, viewMonth]);

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--text-primary)]">Lịch giao dịch định kỳ</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <span className="text-sm font-medium text-[var(--text-primary)] min-w-[140px] text-center capitalize">
            {monthLabel}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="px-3 py-2 bg-[var(--success-light)] rounded-[var(--radius-md)]">
          <p className="text-xs text-[var(--text-secondary)]">Thu dự kiến</p>
          <p className="text-sm font-semibold text-[var(--success)] tabular-nums">
            +{formatCurrency(monthlyIncome)}₫
          </p>
        </div>
        <div className="px-3 py-2 bg-[var(--danger-light)] rounded-[var(--radius-md)]">
          <p className="text-xs text-[var(--text-secondary)]">Chi dự kiến</p>
          <p className="text-sm font-semibold text-[var(--danger)] tabular-nums">
            -{formatCurrency(monthlyExpense)}₫
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0">
        {/* Weekday headers */}
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center py-2">
            <span className="text-xs font-medium text-[var(--text-tertiary)]">{day}</span>
          </div>
        ))}

        {/* Day cells */}
        {calendarDays.map((day, idx) => {
          const hasEvents = day.events.length > 0;
          const isSelected = selectedDay?.date.getTime() === day.date.getTime();
          const hasIncome = day.events.some(e => e.type === 'income');
          const hasExpense = day.events.some(e => e.type === 'expense');
          const hasTransfer = day.events.some(e => e.type === 'transfer');

          return (
            <button
              key={idx}
              onClick={() => hasEvents && day.isCurrentMonth ? setSelectedDay(isSelected ? null : day) : null}
              className={`
                relative flex flex-col items-center justify-center py-1.5 min-h-[40px] rounded-[var(--radius-md)] transition-all
                ${!day.isCurrentMonth ? 'opacity-30' : ''}
                ${day.isToday ? 'bg-[var(--primary-light)]' : ''}
                ${isSelected ? 'bg-[var(--primary)] !opacity-100' : ''}
                ${hasEvents && day.isCurrentMonth && !isSelected ? 'hover:bg-[var(--surface)] cursor-pointer' : ''}
              `}
            >
              <span className={`text-sm tabular-nums ${
                isSelected ? 'text-white font-semibold' :
                day.isToday ? 'text-[var(--primary)] font-semibold' :
                'text-[var(--text-primary)]'
              }`}>
                {day.date.getDate()}
              </span>
              {hasEvents && day.isCurrentMonth && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasIncome && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[var(--success)]'}`} />
                  )}
                  {hasExpense && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[var(--danger)]'}`} />
                  )}
                  {hasTransfer && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[var(--info)]'}`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Detail */}
      {selectedDay && selectedDay.events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--divider)] space-y-2">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
            Ngày {selectedDay.date.getDate()}/{selectedDay.date.getMonth() + 1}
          </p>
          {selectedDay.events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-2.5 rounded-[var(--radius-md)] bg-[var(--surface)]"
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${getTypeColor(event.type)}20`, color: getTypeColor(event.type) }}
              >
                {getTypeIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{event.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {event.type === 'income' ? 'Thu nhập' : event.type === 'expense' ? 'Chi tiêu' : 'Chuyển khoản'}
                </p>
              </div>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: getTypeColor(event.type) }}
              >
                {event.type === 'income' ? '+' : '-'}{formatCurrency(event.amount)}₫
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--divider)]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
          <span className="text-xs text-[var(--text-tertiary)]">Thu nhập</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--danger)]" />
          <span className="text-xs text-[var(--text-tertiary)]">Chi tiêu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--info)]" />
          <span className="text-xs text-[var(--text-tertiary)]">Chuyển khoản</span>
        </div>
      </div>
    </Card>
  );
}

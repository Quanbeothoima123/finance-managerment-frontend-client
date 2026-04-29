import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowUpDown,
  ChevronRight,
  Edit2,
  GripVertical,
  Hash,
  Plus,
  Search,
  Store,
  Tag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { SwipeableRow } from "../components/SwipeableRow";
import { useAutoRulesList } from "../hooks/useAutoRulesList";
import { autoRulesService } from "../services/autoRulesService";
import type { AutoRuleAction, AutoRuleItem } from "../types/autoRules";

const isTouchDevice =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);
const touchBackendOptions = { enableMouseEvents: false, delay: 200 };

type RuleActionBadgeData = {
  type: "category" | "tag" | "merchant" | "account";
  value: string;
};

type DisplayRule = {
  id: string;
  name: string;
  priority: number;
  active: boolean;
  matchField: string;
  matchType: string;
  pattern: string;
  actions: RuleActionBadgeData[];
};

function mapActionToBadge(action: AutoRuleAction): RuleActionBadgeData | null {
  const value = action.targetText || action.value;
  if (!value) return null;

  switch (action.type) {
    case "set_category":
      return { type: "category", value };
    case "add_tag":
      return { type: "tag", value };
    case "set_merchant":
      return { type: "merchant", value };
    case "set_account":
      return { type: "account", value };
    default:
      return null;
  }
}

function mapRuleToDisplay(rule: AutoRuleItem): DisplayRule {
  return {
    id: rule.id,
    name: rule.name,
    priority: rule.priority,
    active: rule.enabled,
    matchField: rule.matchField || "description",
    matchType: rule.matchType || "contains",
    pattern: rule.pattern || "",
    actions: (rule.actions || [])
      .map(mapActionToBadge)
      .filter((action): action is RuleActionBadgeData => Boolean(action)),
  };
}

function getMatchFieldLabel(field: string, t: TFunction) {
  return t(`auto_rules.list.match_fields.${field}`, { defaultValue: field });
}

function getMatchTypeLabel(type: string, t: TFunction) {
  return t(`auto_rules.list.match_types.${type}`, { defaultValue: type });
}

function RuleActionBadge({ action }: { action: RuleActionBadgeData }) {
  const getIcon = () => {
    switch (action.type) {
      case "category":
        return <Hash className="w-3 h-3" />;
      case "tag":
        return <Tag className="w-3 h-3" />;
      case "merchant":
        return <Store className="w-3 h-3" />;
      case "account":
        return <Wallet className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (action.type) {
      case "category":
        return "bg-[var(--primary-light)] text-[var(--primary)]";
      case "tag":
        return "bg-[var(--info-light)] text-[var(--info)]";
      case "merchant":
        return "bg-[var(--success-light)] text-[var(--success)]";
      case "account":
        return "bg-[var(--warning-light)] text-[var(--warning)]";
      default:
        return "bg-[var(--surface)] text-[var(--text-secondary)]";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] text-xs font-medium ${getColor()}`}
    >
      {getIcon()}
      {action.value}
    </span>
  );
}

interface AutoRuleItemProps {
  rule: DisplayRule;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (rule: DisplayRule) => void;
  index: number;
  moveRule: (dragIndex: number, hoverIndex: number) => void;
  canDrag?: boolean;
}

function AutoRuleItem({
  rule,
  onToggle,
  onEdit,
  onDelete,
  index,
  moveRule,
  canDrag = true,
}: AutoRuleItemProps) {
  const { t } = useTranslation("tags-rules");
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "RULE",
      item: { index },
      canDrag,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [index, canDrag],
  );

  const [{ handlerId, isOver }, drop] = useDrop(
    () => ({
      accept: "RULE",
      collect: (monitor) => ({
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
      }),
      hover(item: { index: number }) {
        if (!ref.current) return;
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;
        moveRule(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    }),
    [index, moveRule],
  );

  drop(ref);

  return (
    <div ref={ref} data-handler-id={handlerId}>
      {isOver && !isDragging && (
        <div className="h-0.5 bg-[var(--primary)] rounded-full -mb-0.5 mx-4 transition-all" />
      )}
      <Card
        className={`${isDragging ? "opacity-40 scale-[0.98]" : ""} transition-all`}
      >
        <div className="flex items-start gap-4">
          {canDrag && (
            <div
              ref={(node) => {
                drag(node);
              }}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing flex items-center pt-1 touch-none"
            >
              <GripVertical className="w-5 h-5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors" />
            </div>
          )}

          <div className="flex-shrink-0 w-8 h-8 bg-[var(--surface)] rounded-[var(--radius-md)] flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--text-secondary)] tabular-nums">
              {rule.priority}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                  {rule.name}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {getMatchFieldLabel(rule.matchField, t)}{" "}
                  {getMatchTypeLabel(rule.matchType, t)}{" "}
                  <code className="px-1.5 py-0.5 bg-[var(--surface)] rounded text-xs font-mono">
                    {rule.pattern}
                  </code>
                </p>
              </div>

              <button
                onClick={() => onToggle(rule.id)}
                className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors ${
                  rule.active ? "bg-[var(--success)]" : "bg-[var(--border)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    rule.active ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {rule.actions.map((action, actionIndex) => (
                <RuleActionBadge
                  key={`${rule.id}-${action.type}-${actionIndex}`}
                  action={action}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => onEdit(rule.id)}
                className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
              >
                {t("auto_rules.list.rule_item.edit")}
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(rule)}
                className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--danger)] font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("auto_rules.list.rule_item.delete")}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function AutoRulesList() {
  const { t } = useTranslation("tags-rules");
  const nav = useAppNavigation();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAutoRulesList({
    status: "all",
    sortBy: "priority",
    sortOrder: "asc",
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<DisplayRule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<"priority" | "name">("priority");
  const [reordering, setReordering] = useState(false);

  const baseRules = useMemo(
    () => (data?.items || []).map(mapRuleToDisplay),
    [data?.items],
  );
  const [orderedRules, setOrderedRules] = useState<DisplayRule[]>([]);

  useEffect(() => {
    setOrderedRules(baseRules);
  }, [baseRules]);

  const totalRulesCount = orderedRules.length;
  const activeRulesCount = orderedRules.filter((rule) => rule.active).length;

  const filteredRules = useMemo(() => {
    return orderedRules
      .filter((rule) => {
        if (activeFilter === "active") return rule.active;
        if (activeFilter === "inactive") return !rule.active;
        return true;
      })
      .filter((rule) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          rule.name.toLowerCase().includes(q) ||
          rule.pattern.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name, "vi");
        return a.priority - b.priority;
      });
  }, [activeFilter, orderedRules, searchQuery, sortBy]);

  const handleEdit = (id: string) => {
    nav.goEditAutoRule(id);
  };

  const handleCreate = () => {
    nav.goCreateAutoRule();
  };

  const handleDeleteRequest = (rule: DisplayRule) => {
    setRuleToDelete(rule);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await autoRulesService.deleteAutoRule(ruleToDelete.id);
      setData((prev) => {
        if (!prev) return prev;
        const nextItems = prev.items.filter(
          (item) => item.id !== ruleToDelete.id,
        );
        return {
          ...prev,
          summary: {
            totalRules: nextItems.length,
            activeRules: nextItems.filter((item) => item.enabled).length,
            inactiveRules: nextItems.filter((item) => !item.enabled).length,
          },
          items: nextItems,
        };
      });
      toast.success(t("auto_rules.list.toast.deleted", { name: ruleToDelete.name }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auto_rules.list.toast.delete_failed"));
    } finally {
      setDeleteModalOpen(false);
      setRuleToDelete(null);
    }
  };

  const handleToggle = async (id: string) => {
    const rule = orderedRules.find((item) => item.id === id);
    if (!rule) return;
    const nextEnabled = !rule.active;

    setData((prev) => {
      if (!prev) return prev;
      const nextItems = prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              enabled: nextEnabled,
              active: nextEnabled,
              isActive: nextEnabled,
            }
          : item,
      );
      return {
        ...prev,
        summary: {
          totalRules: nextItems.length,
          activeRules: nextItems.filter((item) => item.enabled).length,
          inactiveRules: nextItems.filter((item) => !item.enabled).length,
        },
        items: nextItems,
      };
    });

    try {
      await autoRulesService.updateAutoRule(id, { enabled: nextEnabled });
      toast.success(
        nextEnabled ? t("auto_rules.list.toast.activated") : t("auto_rules.list.toast.paused"),
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("auto_rules.list.toast.toggle_failed"),
      );
      await reload();
    }
  };

  const moveRule = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      if (reordering) return;
      setOrderedRules((prev) => {
        if (
          dragIndex < 0 ||
          hoverIndex < 0 ||
          dragIndex >= prev.length ||
          hoverIndex >= prev.length
        ) {
          return prev;
        }
        const next = [...prev];
        const [draggedRule] = next.splice(dragIndex, 1);
        if (!draggedRule) return prev;
        next.splice(hoverIndex, 0, draggedRule);
        const reordered = next.map((rule, index) => ({
          ...rule,
          priority: index + 1,
        }));

        void (async () => {
          try {
            setReordering(true);
            const response = await autoRulesService.reorderAutoRules(
              reordered.map((rule) => rule.id),
            );
            setData(response);
          } catch (err) {
            toast.error(
              err instanceof Error
                ? err.message
                : t("auto_rules.list.toast.reorder_failed"),
            );
            await reload();
          } finally {
            setReordering(false);
          }
        })();

        return reordered;
      });
    },
    [reordering, reload, setData, toast],
  );

  const isDragEnabled =
    sortBy === "priority" && activeFilter === "all" && !searchQuery;
  const hasNoResults = totalRulesCount > 0 && filteredRules.length === 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {t("auto_rules.list.title")}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t("auto_rules.list.subtitle")}
            </p>
          </div>

          <Button onClick={handleCreate} className="md:w-auto">
            <Plus className="w-5 h-5" />
            {t("auto_rules.list.add_button")}
          </Button>
        </div>

        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {t("auto_rules.list.summary.total")}
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {totalRulesCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {t("auto_rules.list.summary.active")}
              </p>
              <p className="text-2xl font-bold text-[var(--success)] tabular-nums">
                {activeRulesCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {t("auto_rules.list.summary.paused")}
              </p>
              <p className="text-2xl font-bold text-[var(--text-tertiary)] tabular-nums">
                {totalRulesCount - activeRulesCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {t("auto_rules.list.summary.priority_info_label")}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">{t("auto_rules.list.summary.priority_info_value")}</p>
            </div>
          </div>
        </Card>

        {totalRulesCount > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder={t("auto_rules.list.filters.search_placeholder")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--text-tertiary)]" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {[
                { value: "all", label: t("auto_rules.list.filters.status_all") },
                { value: "active", label: t("auto_rules.list.filters.status_active") },
                { value: "inactive", label: t("auto_rules.list.filters.status_inactive") },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() =>
                    setActiveFilter(tab.value as "all" | "active" | "inactive")
                  }
                  className={`px-3 py-1.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all whitespace-nowrap ${
                    activeFilter === tab.value
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <div className="ml-auto relative flex-shrink-0">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as "priority" | "name")
                  }
                  className="pl-9 pr-8 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  <option value="priority">{t("auto_rules.list.filters.sort_priority")}</option>
                  <option value="name">{t("auto_rules.list.filters.sort_name")}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <Card className="bg-[var(--info-light)] border-[var(--info)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-semibold">💡</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                {t("auto_rules.list.how_it_works.title")}
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("auto_rules.list.how_it_works.description")}
              </p>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card>
            <p className="text-[var(--text-secondary)]">
              {t("auto_rules.list.loading")}
            </p>
          </Card>
        ) : error ? (
          <Card>
            <p className="text-[var(--danger)]">{error}</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => void reload()}
            >
              {t("auto_rules.list.reload")}
            </Button>
          </Card>
        ) : totalRulesCount === 0 ? (
          <Card className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface)] rounded-full mb-4">
              <Hash className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              {t("auto_rules.list.empty.title")}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {t("auto_rules.list.empty.subtitle")}
            </p>
            <Button onClick={handleCreate} className="mx-auto">
              <Plus className="w-5 h-5" />
              {t("auto_rules.list.empty.create_button")}
            </Button>
          </Card>
        ) : hasNoResults ? (
          <Card className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface)] rounded-full mb-4">
              <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              {t("auto_rules.list.no_results.title")}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("auto_rules.list.no_results.subtitle")}
            </p>
          </Card>
        ) : (
          <DndProvider
            backend={isTouchDevice ? TouchBackend : HTML5Backend}
            options={isTouchDevice ? touchBackendOptions : undefined}
          >
            <div className="space-y-4">
              {filteredRules.map((rule, index) => (
                <SwipeableRow
                  key={rule.id}
                  actions={[
                    {
                      icon: <Edit2 className="w-4 h-4" />,
                      label: t("auto_rules.list.swipe_actions.edit"),
                      color: "white",
                      bgColor: "var(--primary)",
                      onClick: () => handleEdit(rule.id),
                    },
                    {
                      icon: <Trash2 className="w-3.5 h-3.5" />,
                      label: t("auto_rules.list.swipe_actions.delete"),
                      color: "white",
                      bgColor: "var(--danger)",
                      onClick: () => handleDeleteRequest(rule),
                    },
                  ]}
                >
                  <AutoRuleItem
                    rule={rule}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    index={index}
                    moveRule={moveRule}
                    canDrag={isDragEnabled && !reordering}
                  />
                </SwipeableRow>
              ))}
            </div>
          </DndProvider>
        )}

        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setRuleToDelete(null);
          }}
          onConfirm={() => {
            void confirmDelete();
          }}
          title={t("auto_rules.list.delete_modal.title")}
          description={t("auto_rules.list.delete_modal.description", { name: ruleToDelete?.name || "" })}
          confirmLabel={t("auto_rules.list.delete_modal.confirm")}
          cancelLabel={t("auto_rules.list.delete_modal.cancel")}
          isDangerous={true}
        />
      </div>
    </div>
  );
}

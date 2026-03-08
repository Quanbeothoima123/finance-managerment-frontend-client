import React, { useState, useCallback, useRef } from 'react';
import { Plus, ChevronRight, Hash, Tag, Store, Trash2, Search, X, ArrowUpDown, GripVertical, Edit2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useDemoData } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { SwipeableRow } from '../components/SwipeableRow';

// Detect touch-only device
const isTouchDevice = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const touchBackendOptions = { enableMouseEvents: false, delay: 200 };

interface RuleActionBadgeProps {
  action: {
    type: string;
    value: string;
  };
}

function RuleActionBadge({ action }: RuleActionBadgeProps) {
  const getIcon = () => {
    switch (action.type) {
      case 'category':
        return <Hash className="w-3 h-3" />;
      case 'tag':
        return <Tag className="w-3 h-3" />;
      case 'merchant':
        return <Store className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (action.type) {
      case 'category':
        return 'bg-[var(--primary-light)] text-[var(--primary)]';
      case 'tag':
        return 'bg-[var(--info-light)] text-[var(--info)]';
      case 'merchant':
        return 'bg-[var(--success-light)] text-[var(--success)]';
      default:
        return 'bg-[var(--surface)] text-[var(--text-secondary)]';
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

interface DisplayRule {
  id: string;
  name: string;
  priority: number;
  active: boolean;
  matchField: string;
  matchType: string;
  pattern: string;
  actions: { type: string; value: string }[];
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

function AutoRuleItem({ rule, onToggle, onEdit, onDelete, index, moveRule, canDrag = true }: AutoRuleItemProps) {
  const getMatchFieldLabel = (field: string) => {
    switch (field) {
      case 'description':
        return 'Mô tả';
      case 'merchant':
        return 'Merchant';
      case 'note':
        return 'Ghi chú';
      default:
        return field;
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'contains':
        return 'chứa';
      case 'equals':
        return 'bằng';
      case 'regex':
        return 'regex';
      default:
        return type;
    }
  };

  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'RULE',
    item: { index },
    canDrag: canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ handlerId, isOver }, drop] = useDrop({
    accept: 'RULE',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
      };
    },
    hover(item: { index: number }) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveRule(dragIndex, hoverIndex);

      item.index = hoverIndex;
    },
  });

  drop(ref);

  return (
    <div ref={ref} data-handler-id={handlerId}>
      {/* Drop indicator line */}
      {isOver && !isDragging && (
        <div className="h-0.5 bg-[var(--primary)] rounded-full -mb-0.5 mx-4 transition-all" />
      )}
      <Card
        className={`${
          isDragging ? 'opacity-40 scale-[0.98]' : ''
        } transition-all`}
      >
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          {canDrag && (
            <div
              ref={(node) => { drag(node); }}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing flex items-center pt-1 touch-none"
            >
              <GripVertical className="w-5 h-5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors" />
            </div>
          )}

          {/* Priority Badge */}
          <div className="flex-shrink-0 w-8 h-8 bg-[var(--surface)] rounded-[var(--radius-md)] flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--text-secondary)] tabular-nums">
              {rule.priority}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{rule.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {getMatchFieldLabel(rule.matchField)} {getMatchTypeLabel(rule.matchType)}{' '}
                  <code className="px-1.5 py-0.5 bg-[var(--surface)] rounded text-xs font-mono">
                    {rule.pattern}
                  </code>
                </p>
              </div>

              {/* Active Toggle */}
              <button
                onClick={() => onToggle(rule.id)}
                className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors ${
                  rule.active ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    rule.active ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mb-3">
              {rule.actions.map((action, index) => (
                <RuleActionBadge key={index} action={action} />
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => onEdit(rule.id)}
                className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
              >
                Chỉnh sửa
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(rule)}
                className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--danger)] font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xoá
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function AutoRulesList() {
  const { autoRules, updateAutoRule, deleteAutoRule, reorderAutoRules } = useDemoData();
  const nav = useAppNavigation();
  const toast = useToast();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<DisplayRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'name'>('priority');

  // Map DemoDataContext autoRules to the display format
  const rules: DisplayRule[] = autoRules.map((rule, index) => ({
    id: rule.id,
    name: rule.name,
    priority: index + 1,
    active: rule.enabled,
    matchField: rule.conditions?.[0]?.field || 'description',
    matchType: rule.conditions?.[0]?.operator || 'contains',
    pattern: String(rule.conditions?.[0]?.value || ''),
    actions: [
      ...rule.actions?.filter(a => a.type === 'set_category').map(a => ({ type: 'category', value: a.value })) || [],
      ...rule.actions?.filter(a => a.type === 'set_merchant').map(a => ({ type: 'merchant', value: a.value })) || [],
      ...rule.actions?.filter(a => a.type === 'add_tag').map(a => ({ type: 'tag', value: a.value })) || [],
    ],
  }));

  const handleToggle = (id: string) => {
    const rule = autoRules.find(r => r.id === id);
    if (rule) {
      updateAutoRule(id, { enabled: !rule.enabled });
      toast.success(rule.enabled ? 'Đã tạm dừng quy tắc' : 'Đã kích hoạt quy tắc');
    }
  };

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

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteAutoRule(ruleToDelete.id);
      toast.success(`Đã xoá quy tắc "${ruleToDelete.name}"`);
      setDeleteModalOpen(false);
      setRuleToDelete(null);
    }
  };

  const activeRulesCount = rules.filter((r) => r.active).length;
  const totalRulesCount = rules.length;

  const filteredRules = rules
    .filter(r => {
      if (activeFilter === 'active') return r.active;
      if (activeFilter === 'inactive') return !r.active;
      return true;
    })
    .filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.pattern.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'vi');
      return a.priority - b.priority;
    });

  const moveRule = useCallback((dragIndex: number, hoverIndex: number) => {
    const newRules = rules.slice();
    const [draggedRule] = newRules.splice(dragIndex, 1);
    newRules.splice(hoverIndex, 0, draggedRule);
    reorderAutoRules(newRules.map(r => r.id));
  }, [rules, reorderAutoRules]);

  // Only enable drag-to-reorder when viewing all rules in priority order
  const isDragEnabled = sortBy === 'priority' && activeFilter === 'all' && !searchQuery;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Quy tắc tự động</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Tự động phân loại giao dịch dựa trên mẫu
            </p>
          </div>

          <Button onClick={handleCreate} className="md:w-auto">
            <Plus className="w-5 h-5" />
            Tạo rule
          </Button>
        </div>

        {/* Stats Card */}
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Tổng quy tắc</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {totalRulesCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Đang hoạt động</p>
              <p className="text-2xl font-bold text-[var(--success)] tabular-nums">
                {activeRulesCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Tạm dừng</p>
              <p className="text-2xl font-bold text-[var(--text-tertiary)] tabular-nums">
                {totalRulesCount - activeRulesCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Độ ưu tiên</p>
              <p className="text-sm text-[var(--text-secondary)]">Cao → Thấp</p>
            </div>
          </div>
        </Card>

        {/* Search & Filter */}
        {rules.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Tìm kiếm quy tắc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--text-tertiary)]" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Tất cả' },
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'inactive', label: 'Tạm dừng' },
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveFilter(tab.value as any)}
                  className={`px-3 py-1.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all whitespace-nowrap ${
                    activeFilter === tab.value
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <div className="ml-auto relative flex-shrink-0">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="pl-9 pr-8 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  <option value="priority">Ưu tiên</option>
                  <option value="name">Tên A-Z</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-[var(--info-light)] border-[var(--info)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-semibold">💡</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                Cách hoạt động
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Quy tắc sẽ được áp dụng theo thứ tự ưu tiên từ cao đến thấp. Khi một giao dịch
                khớp với mẫu, hệ thống sẽ tự động thêm danh mục, merchant, hoặc tag tương ứng.
              </p>
            </div>
          </div>
        </Card>

        {/* Rules List */}
        <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend} options={isTouchDevice ? touchBackendOptions : undefined}>
          <div className="space-y-4">
            {filteredRules.map((rule, index) => (
              <SwipeableRow
                key={rule.id}
                actions={[
                  {
                    icon: <Edit2 className="w-4 h-4" />,
                    label: 'Sửa',
                    color: 'white',
                    bgColor: 'var(--primary)',
                    onClick: () => handleEdit(rule.id),
                  },
                  {
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    label: 'Xoá',
                    color: 'white',
                    bgColor: 'var(--danger)',
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
                  canDrag={isDragEnabled}
                />
              </SwipeableRow>
            ))}
          </div>
        </DndProvider>

        {/* Empty State */}
        {rules.length === 0 && (
          <Card className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface)] rounded-full mb-4">
              <Hash className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              Chưa có quy tắc nào
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Tạo quy tắc đầu tiên để tự động phân loại giao dịch
            </p>
            <Button onClick={handleCreate} className="mx-auto">
              <Plus className="w-5 h-5" />
              Tạo rule
            </Button>
          </Card>
        )}

        {/* Search No Results */}
        {rules.length > 0 && filteredRules.length === 0 && (
          <Card className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface)] rounded-full mb-4">
              <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              Không tìm thấy quy tắc
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm
            </p>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setRuleToDelete(null); }}
          onConfirm={confirmDelete}
          title="Xoá quy tắc?"
          description={`Bạn có chắc muốn xoá quy tắc "${ruleToDelete?.name || ''}"? Các giao dịch đã được phân loại trước đó sẽ không bị ảnh hưởng.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous={true}
        />
      </div>
    </div>
  );
}
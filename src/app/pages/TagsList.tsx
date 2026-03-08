import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, X, Edit2, Hash, ArrowUpDown, Trash2, CheckSquare, Square, XCircle, Check, Palette } from 'lucide-react';
import { Card } from '../components/Card';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { useDemoData } from '../contexts/DemoDataContext';
import { SwipeableRow } from '../components/SwipeableRow';

interface DisplayTag {
  id: string;
  name: string;
  color: string;
  usageCount: number;
}

interface TagChipProps {
  tag: DisplayTag;
  onEdit: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isInlineEditing?: boolean;
  onInlineSave?: (name: string, color: string) => void;
  onInlineCancel?: () => void;
}

const TAG_COLOR_PRESETS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6'];

function TagChip({ tag, onEdit, onDelete, isSelected, onToggleSelect, isInlineEditing, onInlineSave, onInlineCancel }: TagChipProps) {
  const [editName, setEditName] = useState(tag.name);
  const [editColor, setEditColor] = useState(tag.color);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isInlineEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isInlineEditing]);

  useEffect(() => {
    setEditName(tag.name);
    setEditColor(tag.color);
  }, [tag.name, tag.color]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editName.trim()) onInlineSave?.(editName.trim(), editColor);
    } else if (e.key === 'Escape') {
      onInlineCancel?.();
    }
  };

  if (isInlineEditing) {
    return (
      <div
        className="flex flex-col gap-2 px-4 py-3 rounded-[var(--radius-lg)] ring-2 ring-[var(--primary)] bg-[var(--card)]"
        style={{ borderLeft: `4px solid ${editColor}` }}
      >
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 flex-shrink-0" style={{ color: editColor }} />
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-b-2 border-[var(--primary)] text-[var(--text-primary)] font-medium outline-none py-0.5 px-1"
          />
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors"
            title="Đổi màu"
          >
            <Palette className="w-4 h-4" style={{ color: editColor }} />
          </button>
          <button
            onClick={() => { if (editName.trim()) onInlineSave?.(editName.trim(), editColor); }}
            className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
            title="Lưu"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onInlineCancel}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors"
            title="Huỷ"
          >
            <X className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </button>
        </div>
        {showColorPicker && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {TAG_COLOR_PRESETS.map(c => (
              <button
                key={c}
                onClick={() => { setEditColor(c); setShowColorPicker(false); }}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${editColor === c ? 'border-[var(--text-primary)] scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] transition-all hover:shadow-[var(--shadow-md)] ${
        isSelected ? 'ring-2 ring-[var(--primary)]' : ''
      }`}
      style={{
        backgroundColor: `${tag.color}15`,
        borderLeft: `4px solid ${tag.color}`,
      }}
    >
      {onToggleSelect && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          className="flex-shrink-0 p-0.5"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
          ) : (
            <Square className="w-4 h-4 text-[var(--text-tertiary)]" />
          )}
        </button>
      )}
      <Hash className="w-4 h-4" style={{ color: tag.color }} />
      <span className="flex-1 font-medium text-[var(--text-primary)]">{tag.name}</span>
      <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
        {tag.usageCount}
      </span>
      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors"
          title="Chỉnh sửa"
        >
          <Edit2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--danger-light)] transition-colors"
          title="Xoá"
        >
          <X className="w-3.5 h-3.5 text-[var(--text-secondary)] hover:text-[var(--danger)]" />
        </button>
      </div>
    </div>
  );
}

export default function TagsList() {
  const { tags, deleteTag, updateTag } = useDemoData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'usage' | 'name'>('usage');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<DisplayTag | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const nav = useAppNavigation();
  const toast = useToast();

  const displayTags: DisplayTag[] = tags.map(t => ({
    id: t.id,
    name: t.name,
    color: t.color,
    usageCount: t.count,
  }));

  const filteredTags = displayTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    nav.goCreateTag();
  };

  const handleEdit = (id: string) => {
    nav.goEditTag(id);
  };

  const handleInlineEdit = (id: string) => {
    setInlineEditingId(id);
  };

  const handleInlineSave = (id: string, name: string, color: string) => {
    updateTag(id, { name, color });
    setInlineEditingId(null);
    toast.success(`Đã cập nhật nhãn "${name}"`);
  };

  const handleInlineCancel = () => {
    setInlineEditingId(null);
  };

  const handleDelete = (id: string) => {
    const tag = displayTags.find(t => t.id === id);
    setTagToDelete(tag || null);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (tagToDelete) {
      deleteTag(tagToDelete.id);
      toast.success(`Đã xoá nhãn "${tagToDelete.name}"`);
      setDeleteModalOpen(false);
      setTagToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    const count = selectedTags.size;
    selectedTags.forEach(id => deleteTag(id));
    setSelectedTags(new Set());
    setBulkDeleteModalOpen(false);
    toast.success(`Đã xoá ${count} nhãn`);
  };

  const handleSelectAll = () => {
    if (selectedTags.size === filteredTags.length) {
      setSelectedTags(new Set());
    } else {
      setSelectedTags(new Set(filteredTags.map(t => t.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalUsage = displayTags.reduce((sum, tag) => sum + tag.usageCount, 0);
  const avgUsage = displayTags.length > 0 ? Math.round(totalUsage / displayTags.length) : 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Nhãn</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Quản lý nhãn cho giao dịch
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Tạo nhãn</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Tổng số nhãn</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {displayTags.length}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Tổng sử dụng</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {totalUsage}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Trung bình</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {avgUsage}
            </p>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Tìm kiếm nhãn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
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
            <div className="relative flex-shrink-0">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-9 pr-8 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="usage">Lượt dùng</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Tags Grid */}
        {filteredTags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...filteredTags]
              .sort((a, b) => {
                if (sortBy === 'usage') return b.usageCount - a.usageCount;
                return a.name.localeCompare(b.name, 'vi');
              })
              .map((tag) => (
              <SwipeableRow
                key={tag.id}
                actions={[
                  {
                    icon: <Edit2 className="w-4 h-4" />,
                    label: 'Sửa',
                    color: 'white',
                    bgColor: 'var(--primary)',
                    onClick: () => handleEdit(tag.id),
                  },
                  {
                    icon: <Trash2 className="w-4 h-4" />,
                    label: 'Xoá',
                    color: 'white',
                    bgColor: 'var(--danger)',
                    onClick: () => handleDelete(tag.id),
                  },
                ]}
              >
                <TagChip
                  tag={tag}
                  onEdit={() => handleInlineEdit(tag.id)}
                  onDelete={() => handleDelete(tag.id)}
                  isSelected={selectedTags.has(tag.id)}
                  onToggleSelect={() => handleToggleSelect(tag.id)}
                  isInlineEditing={inlineEditingId === tag.id}
                  onInlineSave={(name, color) => handleInlineSave(tag.id, name, color)}
                  onInlineCancel={handleInlineCancel}
                />
              </SwipeableRow>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Hash className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                {searchQuery ? 'Không tìm thấy nhãn' : 'Chưa có nhãn nào'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {searchQuery
                  ? 'Thử tìm kiếm với từ khoá khác'
                  : 'Tạo nhãn đầu tiên để bắt đầu'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Tạo nhãn</span>
                </button>
              )}
            </div>
          </Card>
        )}

        {/* Usage Info */}
        {displayTags.length > 0 && (
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Nhãn được sử dụng nhiều nhất
            </h3>
            <div className="space-y-3">
              {[...displayTags]
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 5)
                .map((tag, index) => {
                  const maxCount = Math.max(...displayTags.map(t => t.usageCount), 1);
                  return (
                    <div key={tag.id} className="flex items-center gap-3">
                      <div className="w-6 text-center">
                        <span className="text-sm font-semibold text-[var(--text-secondary)] tabular-nums">
                          {index + 1}
                        </span>
                      </div>
                      <div
                        className="flex-1 h-2 rounded-full"
                        style={{ backgroundColor: `${tag.color}30` }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            backgroundColor: tag.color,
                            width: `${(tag.usageCount / maxCount) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Hash className="w-4 h-4" style={{ color: tag.color }} />
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {tag.name}
                        </span>
                      </div>
                      <span className="text-sm text-[var(--text-secondary)] tabular-nums min-w-[60px] text-right">
                        {tag.usageCount}
                      </span>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}

        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setTagToDelete(null); }}
          onConfirm={confirmDelete}
          title="Xoá nhãn?"
          description={`Bạn có chắc muốn xoá nhãn "${tagToDelete?.name || ''}"? Nhãn sẽ bị gỡ khỏi tất cả giao dịch.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous={true}
        />

        <ConfirmationModal
          isOpen={bulkDeleteModalOpen}
          onClose={() => { setBulkDeleteModalOpen(false); setSelectedTags(new Set()); }}
          onConfirm={confirmBulkDelete}
          title="Xoá nhiều nhãn?"
          description={`Bạn có chắc muốn xoá ${selectedTags.size} nhãn đã chọn? Nhãn sẽ bị gỡ khỏi tất cả giao dịch.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous={true}
        />
      </div>

      {/* Floating Action Bar */}
      {selectedTags.size > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 px-5 py-3 bg-[var(--card)] rounded-[var(--radius-xl)] shadow-2xl border border-[var(--border)]">
            <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums whitespace-nowrap">
              {selectedTags.size} đã chọn
            </span>
            <div className="w-px h-6 bg-[var(--divider)]" />
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-[var(--radius-md)] transition-colors whitespace-nowrap"
            >
              <CheckSquare className="w-4 h-4" />
              {selectedTags.size === filteredTags.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[var(--danger)] hover:opacity-90 rounded-[var(--radius-md)] transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              Xoá
            </button>
            <button
              onClick={() => setSelectedTags(new Set())}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
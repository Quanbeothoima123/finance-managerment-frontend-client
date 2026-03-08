import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Check, Clock, TrendingUp } from 'lucide-react';
import { useDemoData, Tag } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';

interface TagPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTagIds: string[];
  onApply: (tagIds: string[]) => void;
}

const TAG_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#14B8A6',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#DC2626',
];

export function TagPickerModal({ isOpen, onClose, selectedTagIds, onApply }: TagPickerModalProps) {
  const { tags, transactions, addTag } = useDemoData();
  const toast = useToast();

  const [localSelected, setLocalSelected] = useState<string[]>(selectedTagIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // Reset local state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalSelected(selectedTagIds);
      setSearchQuery('');
      setShowCreateForm(false);
      setNewTagName('');
    }
  }, [isOpen, selectedTagIds]);

  // Recently used tags (from last 10 transactions)
  const recentTagIds = useMemo(() => {
    const sorted = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    const seen = new Set<string>();
    const result: string[] = [];
    for (const t of sorted) {
      for (const tagId of (t.tags || [])) {
        if (!seen.has(tagId)) {
          seen.add(tagId);
          result.push(tagId);
        }
      }
    }
    return result.slice(0, 6);
  }, [transactions]);

  // Popular tags (most used across all transactions)
  const popularTagIds = useMemo(() => {
    const countMap: Record<string, number> = {};
    for (const t of transactions) {
      for (const tagId of (t.tags || [])) {
        countMap[tagId] = (countMap[tagId] || 0) + 1;
      }
    }
    return Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id);
  }, [transactions]);

  // Filter tags by search
  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags;
    const q = searchQuery.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(q));
  }, [tags, searchQuery]);

  const toggleTag = (tagId: string) => {
    setLocalSelected(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleApply = () => {
    onApply(localSelected);
    onClose();
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const newTag = addTag({ name: newTagName.trim(), color: newTagColor });
    setLocalSelected(prev => [...prev, newTag.id]);
    toast.success(`Đã tạo nhãn "${newTag.name}"`);
    setNewTagName('');
    setShowCreateForm(false);
  };

  const getTag = (id: string) => tags.find(t => t.id === id);

  const renderTagChip = (tag: Tag, isSelected: boolean) => (
    <button
      key={tag.id}
      type="button"
      onClick={() => toggleTag(tag.id)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] border text-sm font-medium transition-all ${
        isSelected
          ? 'border-transparent text-white shadow-sm'
          : 'border-[var(--border)] text-[var(--text-primary)] bg-[var(--surface)] hover:border-[var(--text-tertiary)]'
      }`}
      style={isSelected ? { backgroundColor: tag.color } : {}}
    >
      {isSelected && <Check className="w-3 h-3" />}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'hidden' : ''}`}
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal / Bottom sheet */}
      <div className="relative bg-[var(--card)] sm:rounded-[var(--radius-xl)] rounded-t-[var(--radius-xl)] shadow-[var(--shadow-2xl)] border border-[var(--border)] w-full sm:max-w-lg max-h-[85vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--divider)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Chọn nhãn
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[var(--divider)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Tìm nhãn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Selected count */}
          {localSelected.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Đã chọn {localSelected.length} nhãn
              </span>
              <button
                onClick={() => setLocalSelected([])}
                className="text-xs font-medium text-[var(--danger)] hover:text-[var(--danger)]/80"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          )}

          {/* Recently used */}
          {!searchQuery && recentTagIds.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Gần đây
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentTagIds.map(id => {
                  const tag = getTag(id);
                  if (!tag) return null;
                  return renderTagChip(tag, localSelected.includes(id));
                })}
              </div>
            </div>
          )}

          {/* Popular */}
          {!searchQuery && popularTagIds.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Phổ biến
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTagIds.map(id => {
                  const tag = getTag(id);
                  if (!tag) return null;
                  return renderTagChip(tag, localSelected.includes(id));
                })}
              </div>
            </div>
          )}

          {/* All tags */}
          <div>
            {(searchQuery || (!recentTagIds.length && !popularTagIds.length)) ? null : (
              <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Tất cả nhãn
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              {filteredTags.map(tag => renderTagChip(tag, localSelected.includes(tag.id)))}
            </div>
            {filteredTags.length === 0 && searchQuery && (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                Không tìm thấy nhãn "{searchQuery}"
              </p>
            )}
          </div>

          {/* Create new tag */}
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo nhãn mới
            </button>
          ) : (
            <div className="p-4 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">Tạo nhãn mới</span>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--border)] transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--text-tertiary)]" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Tên nhãn"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTag(); }}
                className="w-full px-3 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      newTagColor === color ? 'border-[var(--text-primary)] scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="w-full px-3 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-[var(--radius-md)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tạo nhãn
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--divider)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] border border-[var(--border)] rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-[var(--radius-lg)] transition-colors shadow-sm"
          >
            Áp dụng{localSelected.length > 0 ? ` (${localSelected.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Tag, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useLocalizedName } from '../utils/localizedName';

type TagFilterMode = 'AND' | 'OR';

interface TagItem {
  id: string;
  name: string;
  nameEn?: string | null;
  color: string;
}

interface TagFilterDropdownProps {
  tags: TagItem[];
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  tagFilterMode: TagFilterMode;
  onTagFilterModeChange: (mode: TagFilterMode) => void;
  /** Compact mode for inline filter bars */
  compact?: boolean;
}

export function TagFilterDropdown({
  tags,
  selectedTags,
  onSelectedTagsChange,
  tagFilterMode,
  onTagFilterModeChange,
  compact = false,
}: TagFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const localName = useLocalizedName();

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onSelectedTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onSelectedTagsChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border rounded-[var(--radius-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors ${
          compact ? 'px-3 py-2' : 'px-4 py-2.5'
        } ${
          selectedTags.length > 0
            ? 'bg-[var(--warning-light)] border-[var(--warning)] text-[var(--warning)] font-medium'
            : 'bg-[var(--input-background)] border-[var(--border)] text-[var(--text-primary)]'
        }`}
      >
        <Tag className="w-4 h-4" />
        <span className="max-w-[120px] truncate">
          {selectedTags.length > 0
            ? `${selectedTags.length} tag`
            : 'Tag'}
        </span>
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-30 w-72 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden">
            <div className="p-3">
              {/* Header with AND/OR toggle */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Lọc theo tag</span>
                <div className="flex items-center gap-1 bg-[var(--surface)] rounded-[var(--radius-md)] p-0.5">
                  <button
                    onClick={() => onTagFilterModeChange('OR')}
                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors ${
                      tagFilterMode === 'OR'
                        ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    HOẶC
                  </button>
                  <button
                    onClick={() => onTagFilterModeChange('AND')}
                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors ${
                      tagFilterMode === 'AND'
                        ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    VÀ
                  </button>
                </div>
              </div>

              {/* Tag chips */}
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {tags.map(tag => {
                  const isActive = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        isActive
                          ? 'border-transparent text-white'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] bg-[var(--background)]'
                      }`}
                      style={isActive ? { backgroundColor: tag.color } : undefined}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.5)' : tag.color }}
                      />
                      {localName(tag)}
                      {isActive && <X className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
                {tags.length === 0 && (
                  <p className="text-xs text-[var(--text-tertiary)] py-2">Chưa có tag nào</p>
                )}
              </div>

              {/* Footer */}
              {selectedTags.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    {selectedTags.length} tag • Chế độ {tagFilterMode === 'AND' ? 'VÀ' : 'HOẶC'}
                  </span>
                  <button
                    onClick={() => onSelectedTagsChange([])}
                    className="text-xs text-[var(--danger)] hover:text-[var(--danger)]/80 font-medium"
                  >
                    Xoá tất cả
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Active tag filter badges — shows selected tags with mode indicator
 */
export function TagFilterBadge({
  tags,
  selectedTags,
  tagFilterMode,
  onClear,
}: {
  tags: TagItem[];
  selectedTags: string[];
  tagFilterMode: TagFilterMode;
  onClear: () => void;
}) {
  if (selectedTags.length === 0) return null;

  const getTagName = (id: string) => tags.find(t => t.id === id)?.name || '?';
  const separator = tagFilterMode === 'AND' ? ' + ' : ' | ';
  const modeLabel = tagFilterMode === 'AND' ? 'VÀ' : 'HOẶC';

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--warning-light)] text-[var(--warning)] rounded-[var(--radius-md)] text-xs font-medium">
      Tag ({modeLabel}): {selectedTags.map(id => getTagName(id)).join(separator)}
      <button onClick={onClear} className="ml-0.5 hover:text-[var(--danger)]">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

/**
 * Helper to filter transactions by tags with AND/OR mode
 */
export function filterByTags(
  txnTags: string[] | undefined,
  filterTags: string[],
  mode: TagFilterMode,
): boolean {
  if (filterTags.length === 0) return true;
  const tags = txnTags || [];
  if (mode === 'AND') {
    return filterTags.every(tagId => tags.includes(tagId));
  }
  return filterTags.some(tagId => tags.includes(tagId));
}

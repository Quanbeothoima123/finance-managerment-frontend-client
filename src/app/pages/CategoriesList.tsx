import React, { useState, useMemo, useRef, useCallback } from 'react';
import { 
  Plus, ChevronRight, ChevronDown, Edit2, GripVertical, Trash2,
  ShoppingBag, Home, Car, Utensils, Heart, Briefcase, DollarSign,
  Gift, TrendingUp, PlusCircle, Smile, Book, Dumbbell, Tag, Folder,
  Search, X, ArrowUpDown, MoreHorizontal, EyeOff, Eye, Merge, AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData, type Category } from '../contexts/DemoDataContext';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { SwipeableRow } from '../components/SwipeableRow';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  briefcase: Briefcase, gift: Gift, 'trending-up': TrendingUp,
  'plus-circle': PlusCircle, utensils: Utensils, car: Car,
  'shopping-bag': ShoppingBag, home: Home, heart: Heart,
  smile: Smile, book: Book, dumbbell: Dumbbell, dollar: DollarSign,
  tag: Tag, folder: Folder,
};
function getIcon(iconName: string) { return iconMap[iconName] || Folder; }

// Display category (tree node)
interface DisplayCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parentId?: string;
  hidden?: boolean;
  children: DisplayCategory[];
  transactionCount: number;
}

// ── Action Menu ──
function ActionMenu({ onEdit, onHide, onUnhide, onMerge, onDelete, isHidden, canDelete }: {
  onEdit: () => void; onHide?: () => void; onUnhide?: () => void;
  onMerge: () => void; onDelete: () => void; isHidden: boolean; canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--border)] transition-colors">
        <MoreHorizontal className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-48 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-1 overflow-hidden">
          <button onClick={() => { setOpen(false); onEdit(); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
            <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" /> Chỉnh sửa
          </button>
          {!isHidden && onHide && (
            <button onClick={() => { setOpen(false); onHide(); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
              <EyeOff className="w-4 h-4 text-[var(--text-secondary)]" /> Ẩn danh mục
            </button>
          )}
          {isHidden && onUnhide && (
            <button onClick={() => { setOpen(false); onUnhide(); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
              <Eye className="w-4 h-4 text-[var(--text-secondary)]" /> Hiện lại
            </button>
          )}
          <button onClick={() => { setOpen(false); onMerge(); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
            <Merge className="w-4 h-4 text-[var(--text-secondary)]" /> Gộp vào...
          </button>
          <div className="border-t border-[var(--divider)] my-1" />
          <button onClick={() => { setOpen(false); onDelete(); }}
            className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors ${
              canDelete ? 'text-[var(--danger)] hover:bg-[var(--danger-light)]' : 'text-[var(--text-tertiary)] cursor-not-allowed'
            }`}
            disabled={!canDelete && false /* we handle in-use logic in parent */}>
            <Trash2 className="w-4 h-4" /> Xoá
          </button>
        </div>
      )}
    </div>
  );
}

// ── Category Item ──
interface CategoryItemProps {
  category: DisplayCategory;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onEdit: (id: string) => void;
  onDelete: (cat: DisplayCategory) => void;
  onHide: (cat: DisplayCategory) => void;
  onUnhide: (cat: DisplayCategory) => void;
  onMerge: (cat: DisplayCategory) => void;
}

function CategoryItem({ category, level, isExpanded, onToggle, onSelect, isSelected, onEdit, onDelete, onHide, onUnhide, onMerge }: CategoryItemProps) {
  const Icon = getIcon(category.icon);
  const hasChildren = category.children.length > 0;
  const canDirectDelete = category.transactionCount === 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] cursor-pointer transition-colors group ${
          isSelected ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'hover:bg-[var(--surface)]'
        } ${category.hidden ? 'opacity-60' : ''}`}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => onSelect(category.id)}
      >
        <GripVertical className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-0.5">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />}
          </button>
        ) : <div className="w-5" />}
        <div className="p-1.5 rounded-[var(--radius-md)]" style={{ backgroundColor: `${category.color}20` }}>
          <Icon className="w-4 h-4" style={{ color: category.color }} />
        </div>
        <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">
          {category.name}
        </span>
        {category.hidden && (
          <span className="text-[10px] px-1.5 py-0.5 bg-[var(--surface)] text-[var(--text-tertiary)] rounded-[var(--radius-sm)] font-medium">Đã ẩn</span>
        )}
        <span className="text-xs text-[var(--text-tertiary)] tabular-nums">{category.transactionCount}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <ActionMenu
            onEdit={() => onEdit(category.id)}
            onHide={!category.hidden ? () => onHide(category) : undefined}
            onUnhide={category.hidden ? () => onUnhide(category) : undefined}
            onMerge={() => onMerge(category)}
            onDelete={() => onDelete(category)}
            isHidden={!!category.hidden}
            canDelete={canDirectDelete}
          />
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {category.children.map((child) => (
            <CategoryItem key={child.id} category={child} level={level + 1}
              isExpanded={false} onToggle={() => {}} onSelect={onSelect} isSelected={false}
              onEdit={onEdit} onDelete={onDelete} onHide={onHide} onUnhide={onUnhide} onMerge={onMerge} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Draggable wrapper ──
interface DraggableCategoryItemProps extends CategoryItemProps { index: number; moveCategory: (dragIndex: number, hoverIndex: number) => void; }

function DraggableCategoryItem({ index, moveCategory, ...categoryProps }: DraggableCategoryItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({ type: 'CATEGORY', item: { index }, collect: m => ({ isDragging: m.isDragging() }) });
  const [{ isOver }, drop] = useDrop({
    accept: 'CATEGORY', collect: m => ({ isOver: m.isOver() }),
    hover(item: { index: number }) {
      if (!ref.current) return;
      if (item.index === index) return;
      moveCategory(item.index, index);
      item.index = index;
    },
  });
  drop(ref);
  return (
    <div ref={ref} className={`${isDragging ? 'opacity-40' : ''} transition-opacity`}>
      {isOver && !isDragging && <div className="h-0.5 bg-[var(--primary)] rounded-full -mb-0.5 mx-2 transition-all" />}
      <div className="relative">
        <div ref={(n) => { drag(n); }} className="absolute left-3 top-0 bottom-0 w-6 z-10 cursor-grab active:cursor-grabbing" />
        <CategoryItem {...categoryProps} />
      </div>
    </div>
  );
}

// ── Merge Modal ──
function MergeModal({ source, categories, txCount, onClose, onConfirm }: {
  source: DisplayCategory;
  categories: Category[];
  txCount: number;
  onClose: () => void;
  onConfirm: (destId: string) => void;
}) {
  const [destId, setDestId] = useState('');
  const [search, setSearch] = useState('');
  const eligible = categories.filter(c => c.id !== source.id && c.type === source.type && !c.hidden);
  const filtered = search ? eligible.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : eligible;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--card)] w-full max-w-md rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] p-6 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Gộp danh mục</h3>
          <button onClick={onClose} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)]"><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
        </div>

        {/* Source (read-only) */}
        <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)] mb-4">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Danh mục nguồn</p>
          <div className="flex items-center gap-2">
            {React.createElement(getIcon(source.icon), { className: 'w-4 h-4', style: { color: source.color } })}
            <span className="text-sm font-medium text-[var(--text-primary)]">{source.name}</span>
            <span className="text-xs text-[var(--text-tertiary)]">({txCount} giao dịch)</span>
          </div>
        </div>

        {/* Destination picker */}
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Gộp vào danh mục</label>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input type="text" placeholder="Tìm danh mục..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 mb-4 max-h-48">
          {filtered.map(c => {
            const CI = getIcon(c.icon);
            return (
              <button key={c.id} onClick={() => setDestId(c.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[var(--radius-md)] transition-colors text-left ${
                  destId === c.id ? 'bg-[var(--primary-light)] border border-[var(--primary)]' : 'hover:bg-[var(--surface)] border border-transparent'
                }`}>
                <div className="p-1 rounded-[var(--radius-sm)]" style={{ backgroundColor: `${c.color}20` }}>
                  <CI className="w-4 h-4" style={{ color: c.color }} />
                </div>
                <span className="text-sm text-[var(--text-primary)]">{c.name}</span>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-[var(--text-tertiary)] text-center py-4">Không tìm thấy danh mục phù hợp</p>}
        </div>

        {/* Preview */}
        {destId && (
          <div className="p-3 bg-[var(--info-light)] border border-[var(--info)] rounded-[var(--radius-lg)] mb-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Sẽ chuyển <span className="font-semibold">{txCount}</span> giao dịch từ <span className="font-semibold">{source.name}</span> → <span className="font-semibold">{eligible.find(c => c.id === destId)?.name}</span>
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
          <button onClick={() => destId && onConfirm(destId)} disabled={!destId}
            className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Gộp danh mục
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function CategoriesList() {
  const { categories, transactions, deleteCategory, updateCategory, reorderCategories, updateTransaction } = useDemoData();
  const nav = useAppNavigation();
  const toast = useToast();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<DisplayCategory | null>(null);
  const [bulkChildrenDeleteParentId, setBulkChildrenDeleteParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'txCount'>('name');
  const [visibilityTab, setVisibilityTab] = useState<'active' | 'hidden'>('active');

  // Hide bottom sheet
  const [hideConfirmCat, setHideConfirmCat] = useState<DisplayCategory | null>(null);
  // Merge modal
  const [mergeCat, setMergeCat] = useState<DisplayCategory | null>(null);
  // In-use deletion modal (blocks delete, offers merge)
  const [inUseCat, setInUseCat] = useState<DisplayCategory | null>(null);

  // Build tx count map
  const txCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(tx => { if (tx.categoryId) map[tx.categoryId] = (map[tx.categoryId] || 0) + 1; });
    return map;
  }, [transactions]);

  // Build tree
  const categoryTree = useMemo(() => {
    const parents: DisplayCategory[] = [];
    const childrenMap: Record<string, DisplayCategory[]> = {};
    categories.forEach(cat => {
      const d: DisplayCategory = {
        id: cat.id, name: cat.name, type: cat.type, icon: cat.icon,
        color: cat.color, parentId: cat.parentId, hidden: cat.hidden,
        children: [], transactionCount: txCountMap[cat.id] || 0,
      };
      if (cat.parentId) {
        if (!childrenMap[cat.parentId]) childrenMap[cat.parentId] = [];
        childrenMap[cat.parentId].push(d);
      } else {
        parents.push(d);
      }
    });
    parents.forEach(p => {
      p.children = childrenMap[p.id] || [];
      if (p.children.length > 0) p.transactionCount += p.children.reduce((s, c) => s + c.transactionCount, 0);
    });
    return parents;
  }, [categories, txCountMap]);

  const parentIds = useMemo(() => categoryTree.filter(c => c.children.length > 0).map(c => c.id), [categoryTree]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(parentIds));
  const [selectedId, setSelectedId] = useState<string | null>(categoryTree.length > 0 ? categoryTree[0].id : null);

  const selectedCategory = useMemo(() => {
    for (const cat of categoryTree) {
      if (cat.id === selectedId) return cat;
      for (const child of cat.children) if (child.id === selectedId) return child;
    }
    return null;
  }, [categoryTree, selectedId]);

  // Filtered tree
  const filteredTree = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = categoryTree
      .filter(cat => {
        // Visibility tab filter
        const isHidden = !!cat.hidden;
        if (visibilityTab === 'active' && isHidden) return false;
        if (visibilityTab === 'hidden' && !isHidden) return false;
        // Type filter
        if (typeFilter !== 'all' && cat.type !== typeFilter) return false;
        return true;
      })
      .map(cat => {
        if (!q) return cat;
        const filteredChildren = cat.children.filter(child => child.name.toLowerCase().includes(q));
        if (cat.name.toLowerCase().includes(q)) return cat;
        if (filteredChildren.length > 0) return { ...cat, children: filteredChildren };
        return null;
      })
      .filter(Boolean) as DisplayCategory[];
    return filtered.sort((a, b) => sortBy === 'txCount' ? b.transactionCount - a.transactionCount : a.name.localeCompare(b.name, 'vi'));
  }, [categoryTree, searchQuery, typeFilter, sortBy, visibilityTab]);

  const handleToggle = (id: string) => {
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleEdit = (id: string) => nav.goEditCategory(id);

  // ── Hide/Unhide ──
  const handleHide = (cat: DisplayCategory) => setHideConfirmCat(cat);
  const confirmHide = () => {
    if (!hideConfirmCat) return;
    updateCategory(hideConfirmCat.id, { hidden: true });
    // Also hide children
    hideConfirmCat.children.forEach(c => updateCategory(c.id, { hidden: true }));
    toast.success('Đã ẩn danh mục');
    setHideConfirmCat(null);
  };
  const handleUnhide = (cat: DisplayCategory) => {
    updateCategory(cat.id, { hidden: false });
    cat.children.forEach(c => updateCategory(c.id, { hidden: false }));
    toast.success('Đã hiện danh mục');
  };

  // ── Merge ──
  const handleMerge = (cat: DisplayCategory) => setMergeCat(cat);

  // ── Delete ──
  const handleDeleteRequest = (cat: DisplayCategory) => {
    if (cat.transactionCount > 0) {
      // Category in use → show in-use modal
      setInUseCat(cat);
    } else {
      setCategoryToDelete(cat);
      setDeleteModalOpen(true);
    }
  };
  const confirmDelete = () => {
    if (!categoryToDelete) return;
    deleteCategory(categoryToDelete.id);
    categoryToDelete.children.forEach(c => deleteCategory(c.id));
    toast.success(`Đã xoá danh mục "${categoryToDelete.name}"`);
    if (selectedId === categoryToDelete.id) setSelectedId(categoryTree.length > 0 ? categoryTree[0].id : null);
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleBulkDeleteChildren = (parentId: string) => setBulkChildrenDeleteParentId(parentId);
  const confirmBulkDeleteChildren = () => {
    const parent = categoryTree.find(c => c.id === bulkChildrenDeleteParentId);
    if (parent) {
      parent.children.forEach(child => deleteCategory(child.id));
      toast.success(`Đã xoá ${parent.children.length} danh mục con của "${parent.name}"`);
    }
    setBulkChildrenDeleteParentId(null);
  };

  const moveCategory = useCallback((dragIndex: number, hoverIndex: number) => {
    const reordered = [...filteredTree];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(hoverIndex, 0, removed);
    const allIds: string[] = [];
    reordered.forEach(p => { allIds.push(p.id); p.children.forEach(c => allIds.push(c.id)); });
    categories.forEach(cat => { if (!allIds.includes(cat.id)) allIds.push(cat.id); });
    reorderCategories(allIds);
  }, [filteredTree, categories, reorderCategories]);

  const SelectedIcon = selectedCategory ? getIcon(selectedCategory.icon) : null;

  const activeCount = categoryTree.filter(c => !c.hidden).length;
  const hiddenCount = categoryTree.filter(c => c.hidden).length;
  const incomeCount = filteredTree.filter(c => c.type === 'income').length;
  const expenseCount = filteredTree.filter(c => c.type === 'expense').length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Danh mục</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Quản lý danh mục thu chi</p>
          </div>
          <button onClick={() => nav.goCreateCategory()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]">
            <Plus className="w-5 h-5" />
            <span className="font-medium hidden md:inline">Tạo danh mục</span>
          </button>
        </div>

        {/* Visibility Tabs: Active / Hidden */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setVisibilityTab('active')}
            className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
              visibilityTab === 'active'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]'
            }`}>
            Đang dùng ({activeCount})
          </button>
          <button onClick={() => setVisibilityTab('hidden')}
            className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
              visibilityTab === 'hidden'
                ? 'bg-[var(--text-secondary)] text-white'
                : 'bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]'
            }`}>
            <EyeOff className="w-3.5 h-3.5 inline mr-1" />Đã ẩn ({hiddenCount})
          </button>
        </div>

        {/* Search & Filter */}
        {categoryTree.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input type="text" placeholder="Tìm kiếm danh mục..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors">
                  <X className="w-4 h-4 text-[var(--text-tertiary)]" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Tất cả', count: filteredTree.length },
                { value: 'expense', label: 'Chi tiêu', count: expenseCount },
                { value: 'income', label: 'Thu nhập', count: incomeCount },
              ].map(tab => (
                <button key={tab.value} onClick={() => setTypeFilter(tab.value as any)}
                  className={`px-3 py-1.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all whitespace-nowrap ${
                    typeFilter === tab.value
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]'
                  }`}>
                  {tab.label} ({tab.count})
                </button>
              ))}
              <div className="ml-auto relative flex-shrink-0">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                  className="pl-9 pr-8 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]">
                  <option value="name">Tên A-Z</option>
                  <option value="txCount">Giao dịch</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Desktop: Split View */}
        {filteredTree.length > 0 && (
        <div className="hidden md:grid md:grid-cols-[400px,1fr] gap-6">
          <Card className="h-[calc(100vh-320px)] overflow-y-auto">
            <DndProvider backend={HTML5Backend}>
            <div className="space-y-1">
              {filteredTree.map((category, index) => (
                <DraggableCategoryItem key={category.id} index={index} moveCategory={moveCategory}
                  category={category} level={0} isExpanded={expandedIds.has(category.id)}
                  onToggle={() => handleToggle(category.id)} onSelect={id => setSelectedId(id)}
                  isSelected={selectedId === category.id} onEdit={handleEdit}
                  onDelete={handleDeleteRequest} onHide={handleHide} onUnhide={handleUnhide} onMerge={handleMerge} />
              ))}
            </div>
            </DndProvider>
          </Card>

          {/* Right: Preview */}
          <Card>
            {selectedCategory ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-[var(--radius-lg)]" style={{ backgroundColor: `${selectedCategory.color}20` }}>
                      {SelectedIcon && <SelectedIcon className="w-8 h-8" style={{ color: selectedCategory.color }} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{selectedCategory.name}</h2>
                        {selectedCategory.hidden && (
                          <span className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--text-tertiary)] rounded-[var(--radius-sm)] font-medium">Đã ẩn</span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-[var(--radius-sm)] ${
                        selectedCategory.type === 'income' ? 'bg-[var(--success-light)] text-[var(--success)]' : 'bg-[var(--danger-light)] text-[var(--danger)]'
                      }`}>
                        {selectedCategory.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(selectedCategory.id)}
                      className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">
                      <Edit2 className="w-4 h-4" /><span>Sửa</span>
                    </button>
                    {!selectedCategory.hidden ? (
                      <button onClick={() => handleHide(selectedCategory)}
                        className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">
                        <EyeOff className="w-4 h-4" /><span>Ẩn</span>
                      </button>
                    ) : (
                      <button onClick={() => handleUnhide(selectedCategory)}
                        className="flex items-center gap-2 px-4 py-2 border border-[var(--primary)] text-[var(--primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-light)] transition-colors">
                        <Eye className="w-4 h-4" /><span>Hiện lại</span>
                      </button>
                    )}
                    <button onClick={() => handleDeleteRequest(selectedCategory)}
                      className="flex items-center gap-2 px-4 py-2 border border-[var(--danger)] text-[var(--danger)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--danger-light)] transition-colors">
                      <Trash2 className="w-4 h-4" /><span>Xoá</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Giao dịch</p>
                    <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">{selectedCategory.transactionCount}</p>
                  </div>
                  <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Danh mục con</p>
                    <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">{selectedCategory.children?.length || 0}</p>
                  </div>
                </div>

                {selectedCategory.children && selectedCategory.children.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-3">Danh mục con</h3>
                    <div className="space-y-2">
                      {selectedCategory.children.map(child => {
                        const ChildIcon = getIcon(child.icon);
                        return (
                          <div key={child.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--surface)] hover:bg-[var(--border)] cursor-pointer transition-colors"
                            onClick={() => setSelectedId(child.id)}>
                            <div className="p-2 rounded-[var(--radius-md)]" style={{ backgroundColor: `${child.color}20` }}>
                              <ChildIcon className="w-5 h-5" style={{ color: child.color }} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[var(--text-primary)]">{child.name}</p>
                              <p className="text-xs text-[var(--text-secondary)]">{child.transactionCount} giao dịch</p>
                            </div>
                            {child.hidden && <span className="text-[10px] px-1.5 py-0.5 bg-[var(--surface)] text-[var(--text-tertiary)] rounded-[var(--radius-sm)]">Ẩn</span>}
                            <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3">Màu sắc</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] border-2 border-[var(--border)]" style={{ backgroundColor: selectedCategory.color }} />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)] uppercase">{selectedCategory.color}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Mã màu HEX</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">Chọn một danh mục để xem chi tiết</p>
              </div>
            )}
          </Card>
        </div>
        )}

        {/* Mobile: Accordion List */}
        {filteredTree.length > 0 && (
        <div className="md:hidden space-y-2">
          {filteredTree.map(category => {
            const Icon = getIcon(category.icon);
            const isExpanded = expandedIds.has(category.id);
            const hasChildren = category.children.length > 0;
            return (
              <SwipeableRow key={category.id} actions={[
                { icon: <Edit2 className="w-4 h-4" />, label: 'Sửa', color: 'white', bgColor: 'var(--primary)', onClick: () => handleEdit(category.id) },
                ...(category.hidden
                  ? [{ icon: <Eye className="w-4 h-4" />, label: 'Hiện', color: 'white', bgColor: 'var(--info)', onClick: () => handleUnhide(category) }]
                  : [{ icon: <EyeOff className="w-4 h-4" />, label: 'Ẩn', color: 'white', bgColor: 'var(--warning)', onClick: () => handleHide(category) }]
                ),
                { icon: <Merge className="w-4 h-4" />, label: 'Gộp', color: 'white', bgColor: 'var(--info)', onClick: () => handleMerge(category) },
                { icon: <Trash2 className="w-4 h-4" />, label: 'Xoá', color: 'white', bgColor: 'var(--danger)', onClick: () => handleDeleteRequest(category) },
              ]}>
                <Card className={`p-0 overflow-hidden ${category.hidden ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => hasChildren && handleToggle(category.id)}>
                    {hasChildren ? (
                      <button className="p-0.5 flex-shrink-0">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />}
                      </button>
                    ) : <div className="w-6 flex-shrink-0" />}
                    <div className="p-2.5 rounded-[var(--radius-lg)] flex-shrink-0" style={{ backgroundColor: `${category.color}20` }}>
                      <Icon className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-[var(--text-primary)] truncate">{category.name}</p>
                        {category.hidden && <span className="text-[10px] px-1.5 py-0.5 bg-[var(--surface)] text-[var(--text-tertiary)] rounded-[var(--radius-sm)] flex-shrink-0">Đã ẩn</span>}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {category.type === 'income' ? 'Thu nhập' : 'Chi tiêu'} · {category.transactionCount} giao dịch
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                  </div>
                  {hasChildren && isExpanded && (
                    <div className="border-t border-[var(--divider)] bg-[var(--surface)]">
                      {category.children.length > 1 && (
                        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--divider)]">
                          <span className="text-xs text-[var(--text-secondary)]">{category.children.length} danh mục con</span>
                          <button onClick={e => { e.stopPropagation(); handleBulkDeleteChildren(category.id); }}
                            className="flex items-center gap-1 text-xs text-[var(--danger)] font-medium px-2 py-1 rounded-[var(--radius-sm)] hover:bg-[var(--danger-light)] transition-colors">
                            <Trash2 className="w-3 h-3" /> Xoá tất cả
                          </button>
                        </div>
                      )}
                      {category.children.map(child => {
                        const ChildIcon = getIcon(child.icon);
                        return (
                          <SwipeableRow key={child.id} actions={[
                            { icon: <Edit2 className="w-4 h-4" />, label: 'Sửa', color: 'white', bgColor: 'var(--primary)', onClick: () => handleEdit(child.id) },
                            { icon: <Trash2 className="w-4 h-4" />, label: 'Xoá', color: 'white', bgColor: 'var(--danger)', onClick: () => handleDeleteRequest(child) },
                          ]}>
                            <div className="flex items-center gap-3 p-4 pl-12 border-t first:border-t-0 border-[var(--divider)] bg-[var(--surface)]">
                              <div className="p-2 rounded-[var(--radius-md)] flex-shrink-0" style={{ backgroundColor: `${child.color}20` }}>
                                <ChildIcon className="w-4 h-4" style={{ color: child.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{child.name}</p>
                                <p className="text-xs text-[var(--text-secondary)]">{child.transactionCount} giao dịch</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                            </div>
                          </SwipeableRow>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </SwipeableRow>
            );
          })}
        </div>
        )}

        {/* Empty States */}
        {categoryTree.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Chưa có danh mục nào</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Tạo danh mục đầu tiên để phân loại giao dịch</p>
              <button onClick={() => nav.goCreateCategory()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors">
                <Plus className="w-5 h-5" /><span className="font-medium">Tạo danh mục</span>
              </button>
            </div>
          </Card>
        )}

        {categoryTree.length > 0 && filteredTree.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                {visibilityTab === 'hidden' ? <EyeOff className="w-8 h-8 text-[var(--text-tertiary)]" /> : <Search className="w-8 h-8 text-[var(--text-tertiary)]" />}
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                {visibilityTab === 'hidden' ? 'Không có danh mục ẩn' : 'Không tìm thấy danh mục'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {visibilityTab === 'hidden' ? 'Các danh mục ẩn sẽ hiển thị ở đây' : 'Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm'}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Hide Confirmation Bottom Sheet */}
      {hideConfirmCat && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setHideConfirmCat(null)}>
          <div className="bg-[var(--card)] w-full max-w-md rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Ẩn danh mục này?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Danh mục sẽ không xuất hiện khi tạo giao dịch mới. Giao dịch cũ vẫn giữ nguyên.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setHideConfirmCat(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
              <button onClick={confirmHide}
                className="flex-1 px-4 py-2.5 bg-[var(--text-secondary)] text-white rounded-[var(--radius-lg)] font-medium hover:opacity-90 transition-colors">
                <EyeOff className="w-4 h-4 inline mr-1.5" />Ẩn danh mục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Use Deletion Modal */}
      {inUseCat && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setInUseCat(null)}>
          <div className="bg-[var(--card)] w-full max-w-md rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[var(--warning-light)] rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Danh mục đang được dùng</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Danh mục "<span className="font-semibold">{inUseCat.name}</span>" đang có <span className="font-semibold">{inUseCat.transactionCount}</span> giao dịch liên kết.
            </p>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Bạn cần gộp các giao dịch sang danh mục khác trước khi xoá.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setInUseCat(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
              <button onClick={() => { setMergeCat(inUseCat); /* don't close inUseCat yet, MergeModal will close both */ }}
                className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors">
                <Merge className="w-4 h-4 inline mr-1.5" />Gộp vào danh mục khác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {mergeCat && (
        <MergeModal
          source={mergeCat}
          categories={categories}
          txCount={mergeCat.transactionCount}
          onClose={() => { setMergeCat(null); setInUseCat(null); }}
          onConfirm={(destId) => {
            const destCat = categories.find(c => c.id === destId);
            if (!destCat || !mergeCat) return;
            const sourceIds = [mergeCat.id, ...mergeCat.children.map(c => c.id)];
            transactions.forEach(tx => {
              if (sourceIds.includes(tx.categoryId)) {
                updateTransaction(tx.id, { categoryId: destId, category: destCat.name });
              }
            });
            // Hide source after merge
            updateCategory(mergeCat.id, { hidden: true });
            mergeCat.children.forEach(c => updateCategory(c.id, { hidden: true }));
            toast.success('Đã gộp danh mục');
            setMergeCat(null);
            setInUseCat(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setCategoryToDelete(null); }}
        onConfirm={confirmDelete}
        title="Xoá danh mục?"
        description={`Bạn có chắc muốn xoá danh mục "${categoryToDelete?.name || ''}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        isDangerous={true}
      />

      {/* Bulk Delete Children */}
      <ConfirmationModal
        isOpen={bulkChildrenDeleteParentId !== null}
        onClose={() => setBulkChildrenDeleteParentId(null)}
        onConfirm={confirmBulkDeleteChildren}
        title="Xoá tất cả danh mục con?"
        description={`Bạn có chắc muốn xoá tất cả ${categoryTree.find(c => c.id === bulkChildrenDeleteParentId)?.children.length || 0} danh mục con?`}
        confirmLabel="Xoá tất cả"
        cancelLabel="Huỷ"
        isDangerous={true}
      />
    </div>
  );
}
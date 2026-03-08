import React from 'react';
import { useParams } from 'react-router';
import { Layout } from '../components/Layout';
import CreateEditBudget from './CreateEditBudget';
import { useDemoData } from '../contexts/DemoDataContext';

export default function EditBudgetWithLayout() {
  const { id } = useParams<{ id: string }>();
  const { budgets, categories } = useDemoData();
  const budget = budgets.find(b => b.id === id);

  const periodMap: Record<string, 'monthly' | 'weekly' | 'custom'> = {
    monthly: 'monthly',
    weekly: 'weekly',
    yearly: 'custom',
    custom: 'custom',
  };

  // Build category lookup
  const categoryMap: Record<string, { name: string; icon: string; color: string }> = {};
  categories.forEach(cat => {
    categoryMap[cat.id] = { name: cat.name, icon: cat.icon, color: cat.color };
  });

  let items: { id: string; categoryId: string; categoryName: string; icon: string; color: string; limit: number }[] | undefined;

  if (budget) {
    if (budget.items && budget.items.length > 0) {
      // Use explicit budget items
      items = budget.items.map(item => {
        const cat = categoryMap[item.categoryId];
        return {
          id: item.id,
          categoryId: item.categoryId,
          categoryName: cat?.name || item.categoryName,
          icon: cat?.icon || 'folder',
          color: cat?.color || '#3b82f6',
          limit: item.amount,
        };
      });
    } else if (budget.categories.length > 0) {
      // Build items from categories array, dividing budget evenly
      const perCat = Math.round(budget.amount / budget.categories.length);
      items = budget.categories.map((catId, idx) => {
        const cat = categoryMap[catId];
        return {
          id: `item-${idx}`,
          categoryId: catId,
          categoryName: cat?.name || catId,
          icon: cat?.icon || 'folder',
          color: cat?.color || '#3b82f6',
          limit: perCat,
        };
      });
    }
  }

  const initialData = budget ? {
    id: budget.id,
    name: budget.name,
    periodType: periodMap[budget.period] || 'monthly',
    startDate: budget.startDate,
    endDate: budget.endDate,
    rollover: false,
    items,
    alertsEnabled: budget.alertsEnabled,
    alertThresholds: budget.alertThresholds,
  } : undefined;

  return (
    <Layout title="Chỉnh sửa ngân sách">
      <CreateEditBudget mode="edit" initialData={initialData} />
    </Layout>
  );
}

import React from 'react';
import { useParams } from 'react-router';
import { Layout } from '../components/Layout';
import CreateEditCategory from './CreateEditCategory';
import { useDemoData } from '../contexts/DemoDataContext';

export default function EditCategoryWithLayout() {
  const { id } = useParams<{ id: string }>();
  const { categories } = useDemoData();
  const category = categories.find(c => c.id === id);

  const initialData = category ? {
    id: category.id,
    name: category.name,
    kind: category.type as 'expense' | 'income' | 'both',
    icon: category.icon,
    color: category.color,
    parentId: category.parentId || '',
    active: true,
  } : undefined;

  return (
    <Layout title="Chỉnh sửa danh mục">
      <CreateEditCategory mode="edit" initialData={initialData} />
    </Layout>
  );
}

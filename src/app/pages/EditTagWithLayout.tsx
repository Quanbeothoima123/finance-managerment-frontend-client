import React from 'react';
import { useParams } from 'react-router';
import { Layout } from '../components/Layout';
import CreateEditTag from './CreateEditTag';
import { useDemoData } from '../contexts/DemoDataContext';

export default function EditTagWithLayout() {
  const { id } = useParams<{ id: string }>();
  const { tags } = useDemoData();
  const tag = tags.find(t => t.id === id);

  const initialData = tag ? {
    id: tag.id,
    name: tag.name,
    color: tag.color,
  } : undefined;

  return (
    <Layout title="Chỉnh sửa nhãn">
      <CreateEditTag mode="edit" initialData={initialData} />
    </Layout>
  );
}

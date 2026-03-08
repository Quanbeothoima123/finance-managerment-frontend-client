import React from 'react';
import { useParams } from 'react-router';
import { Layout } from '../components/Layout';
import CreateEditMerchant from './CreateEditMerchant';
import { useDemoData } from '../contexts/DemoDataContext';

export default function EditMerchantWithLayout() {
  const { id } = useParams<{ id: string }>();
  const { merchants } = useDemoData();
  const merchant = merchants.find(m => m.id === id);

  const initialData = merchant ? {
    id: merchant.id,
    name: merchant.name,
    defaultCategory: merchant.defaultCategory || '',
  } : undefined;

  return (
    <Layout title="Chỉnh sửa nhà cung cấp">
      <CreateEditMerchant mode="edit" initialData={initialData} />
    </Layout>
  );
}

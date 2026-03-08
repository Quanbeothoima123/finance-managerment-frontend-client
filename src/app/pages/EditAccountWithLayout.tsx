import React from 'react';
import { useParams } from 'react-router';
import { Layout } from '../components/Layout';
import CreateEditAccount from './CreateEditAccount';
import { useDemoData } from '../contexts/DemoDataContext';

export default function EditAccountWithLayout() {
  const { id } = useParams<{ id: string }>();
  const { accounts } = useDemoData();
  const account = accounts.find(a => a.id === id);

  const initialData = account ? {
    id: account.id,
    name: account.name,
    type: account.type,
    institution: '',
    balance: account.balance,
    openingBalance: account.openingBalance,
    currency: account.currency,
    note: '',
    active: true,
    accountNumber: account.accountNumber || '',
    accountOwnerName: account.accountOwnerName || '',
  } : undefined;

  return (
    <Layout title="Chỉnh sửa tài khoản">
      <CreateEditAccount mode="edit" initialData={initialData} />
    </Layout>
  );
}
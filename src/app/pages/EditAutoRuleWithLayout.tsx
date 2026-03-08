import React from 'react';
import { useParams } from 'react-router';
import { Layout } from '../components/Layout';
import CreateAutoRule from './CreateAutoRule';
import { useDemoData } from '../contexts/DemoDataContext';

export default function EditAutoRuleWithLayout() {
  const { id } = useParams<{ id: string }>();
  const { autoRules } = useDemoData();
  const rule = autoRules.find(r => r.id === id);

  const initialData = rule ? {
    id: rule.id,
    name: rule.name,
    active: rule.enabled,
    priority: '1',
    matchField: rule.conditions?.[0]?.field || 'description',
    matchType: rule.conditions?.[0]?.operator || 'contains',
    pattern: String(rule.conditions?.[0]?.value || ''),
    selectedCategory: rule.actions?.find(a => a.type === 'set_category')?.value || '',
    selectedMerchant: rule.actions?.find(a => a.type === 'set_merchant')?.value || '',
    selectedTags: rule.actions?.filter(a => a.type === 'add_tag').map(a => a.value) || [],
  } : undefined;

  return (
    <Layout title="Chỉnh sửa quy tắc">
      <CreateAutoRule mode="edit" initialData={initialData} />
    </Layout>
  );
}

import React from 'react';
import { useParams } from 'react-router';
import { Layout } from '../components/Layout';
import CreateEditGoal from './CreateEditGoal';
import { useDemoData } from '../contexts/DemoDataContext';

export default function EditGoalWithLayout() {
  const { id } = useParams<{ id: string }>();
  const { goals } = useDemoData();
  const goal = goals.find(g => g.id === id);

  const initialData = goal ? {
    id: goal.id,
    name: goal.name,
    icon: goal.icon,
    color: goal.color,
    targetAmount: String(goal.targetAmount),
    initialAmount: String(goal.currentAmount),
    startDate: new Date().toISOString().split('T')[0],
    targetDate: goal.deadline,
    linkedAccountId: '',
    note: '',
    priority: goal.priority,
  } : undefined;

  return (
    <Layout title="Chỉnh sửa mục tiêu">
      <CreateEditGoal mode="edit" initialData={initialData} />
    </Layout>
  );
}

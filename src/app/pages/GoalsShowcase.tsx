import React from 'react';
import { Layout } from '../components/Layout';
import GoalsOverview from './GoalsOverview';
import GoalDetail from './GoalDetail';
import CreateEditGoal from './CreateEditGoal';
import AddGoalContribution from './AddGoalContribution';

// Showcase mock goalInfo (standalone, not from CRUD flow)
const showcaseGoalInfo = {
  name: 'Du lịch Nhật Bản',
  icon: 'plane',
  color: '#3b82f6',
  currentAmount: 32500000,
  targetAmount: 50000000,
};

export default function GoalsShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Goals (F1-F4) - Design Showcase
          </h1>
          <p className="text-gray-600">
            Complete goal management system with progress tracking, contributions, and insights
          </p>
        </div>

        {/* F1 - Goals Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">F1 - Goals Overview</h2>

          {/* Light Theme - Desktop */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Light Theme - Desktop (1440px)
            </h3>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300">
              <div
                className="bg-white"
                style={{
                  width: '1440px',
                  height: '900px',
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left',
                }}
              >
                <div style={{ width: '1440px', height: '900px', transform: 'scale(1.43)' }}>
                  <Layout title="Mục tiêu">
                    <GoalsOverview />
                  </Layout>
                </div>
              </div>
            </div>
          </div>

          {/* Dark Theme - Desktop */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Dark Theme - Desktop (1440px)
            </h3>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800">
              <div
                className="dark bg-[#0f1113]"
                style={{
                  width: '1440px',
                  height: '900px',
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left',
                }}
              >
                <div style={{ width: '1440px', height: '900px', transform: 'scale(1.43)' }}>
                  <Layout title="Mục tiêu">
                    <GoalsOverview />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* F2 - Goal Detail */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">F2 - Goal Detail</h2>

          {/* Light Theme - Desktop */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Light Theme - Desktop (1440px)
            </h3>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300">
              <div
                className="bg-white"
                style={{
                  width: '1440px',
                  height: '900px',
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left',
                }}
              >
                <div style={{ width: '1440px', height: '900px', transform: 'scale(1.43)' }}>
                  <Layout title="Chi tiết mục tiêu">
                    <GoalDetail />
                  </Layout>
                </div>
              </div>
            </div>
          </div>

          {/* Dark Theme - Desktop */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Dark Theme - Desktop (1440px)
            </h3>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800">
              <div
                className="dark bg-[#0f1113]"
                style={{
                  width: '1440px',
                  height: '900px',
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left',
                }}
              >
                <div style={{ width: '1440px', height: '900px', transform: 'scale(1.43)' }}>
                  <Layout title="Chi tiết mục tiêu">
                    <GoalDetail />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* F3 - Create/Edit Goal */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">F3 - Create/Edit Goal</h2>

          {/* Light Theme - Desktop */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Light Theme - Desktop (1440px)
            </h3>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300">
              <div
                className="bg-white"
                style={{
                  width: '1440px',
                  height: '900px',
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left',
                }}
              >
                <div style={{ width: '1440px', height: '900px', transform: 'scale(1.43)' }}>
                  <Layout title="Tạo mục tiêu">
                    <CreateEditGoal mode="create" />
                  </Layout>
                </div>
              </div>
            </div>
          </div>

          {/* Dark Theme - Desktop */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Dark Theme - Desktop (1440px)
            </h3>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800">
              <div
                className="dark bg-[#0f1113]"
                style={{
                  width: '1440px',
                  height: '900px',
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left',
                }}
              >
                <div style={{ width: '1440px', height: '900px', transform: 'scale(1.43)' }}>
                  <Layout title="Tạo mục tiêu">
                    <CreateEditGoal mode="create" />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* F4 - Add Goal Contribution */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            F4 - Add Goal Contribution (Modal & Page)
          </h2>

          {/* Modal Version - Light Theme */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Modal Version - Light Theme (Desktop)
            </h3>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300">
              <div
                className="bg-white relative"
                style={{
                  width: '1440px',
                  height: '900px',
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left',
                }}
              >
                <div style={{ width: '1440px', height: '900px', transform: 'scale(1.43)' }}>
                  <Layout title="Chi tiết mục tiêu">
                    <GoalDetail />
                  </Layout>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
                      <AddGoalContribution isModal={true} goalInfo={showcaseGoalInfo} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Version - Dark Theme */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Modal Version - Dark Theme (Desktop)
            </h3>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800">
              <div
                className="dark bg-[#0f1113] relative"
                style={{
                  width: '1440px',
                  height: '900px',
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left',
                }}
              >
                <div style={{ width: '1440px', height: '900px', transform: 'scale(1.43)' }}>
                  <Layout title="Chi tiết mục tiêu">
                    <GoalDetail />
                  </Layout>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-[#1a1d21] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
                      <AddGoalContribution isModal={true} goalInfo={showcaseGoalInfo} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Version - Mobile Comparison */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Page Version - Mobile Comparison (375px)
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-3">Light Theme</h4>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300 inline-block">
                  <div className="bg-white" style={{ width: '375px', height: '812px' }}>
                    <Layout title="Thêm đóng góp">
                      <AddGoalContribution isModal={false} goalInfo={showcaseGoalInfo} />
                    </Layout>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-3">Dark Theme</h4>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800 inline-block">
                  <div className="dark bg-[#0f1113]" style={{ width: '375px', height: '812px' }}>
                    <Layout title="Thêm đóng góp">
                      <AddGoalContribution isModal={false} goalInfo={showcaseGoalInfo} />
                    </Layout>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
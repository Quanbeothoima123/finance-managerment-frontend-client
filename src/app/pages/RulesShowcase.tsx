import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import AutoRulesList from './AutoRulesList';
import CreateAutoRule from './CreateAutoRule';
import RecurringRulesList from './RecurringRulesList';
import CreateRecurringRule from './CreateRecurringRule';
import GeneratePreviewDemo from './GeneratePreviewDemo';

export default function RulesShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rules & Recurring (H1-H5) - Design Showcase
          </h1>
          <p className="text-gray-600">
            Complete rules and automation system with auto rules, recurring transactions, and preview
          </p>
        </div>

        {/* H1 - Auto Rules List */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">H1 - Auto Rules List</h2>

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
                  <Layout title="Quy tắc tự động">
                    <AutoRulesList />
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
                  <Layout title="Quy tắc tự động">
                    <AutoRulesList />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* H2 - Create/Edit Auto Rule */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">H2 - Create/Edit Auto Rule</h2>

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
                  <Layout title="Tạo quy tắc">
                    <CreateAutoRule />
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
                  <Layout title="Tạo quy tắc">
                    <CreateAutoRule />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* H3 - Recurring Rules List */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">H3 - Recurring Rules List</h2>

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
                  <Layout title="Giao dịch định kỳ">
                    <RecurringRulesList />
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
                  <Layout title="Giao dịch định kỳ">
                    <RecurringRulesList />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* H4 - Create/Edit Recurring Rule */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">H4 - Create/Edit Recurring Rule</h2>

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
                  <Layout title="Tạo định kỳ">
                    <CreateRecurringRule />
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
                  <Layout title="Tạo định kỳ">
                    <CreateRecurringRule />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* H5 - Generate Preview Modal */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            H5 - Generate Preview (Modal)
          </h2>

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
                  <Layout title="Xem trước">
                    <GeneratePreviewDemo />
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
                  <Layout title="Xem trước">
                    <GeneratePreviewDemo />
                  </Layout>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Comparison */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Mobile Comparison (375px)
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-3">Light Theme</h4>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300 inline-block">
                  <div className="bg-white" style={{ width: '375px', height: '812px' }}>
                    <GeneratePreviewDemo />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-3">Dark Theme</h4>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800 inline-block">
                  <div className="dark bg-[#0f1113]" style={{ width: '375px', height: '812px' }}>
                    <GeneratePreviewDemo />
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

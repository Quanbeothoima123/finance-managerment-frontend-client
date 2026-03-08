import React from 'react';
import HomeContent from './Home';
import { Layout } from '../components/Layout';

export default function HomeShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Home Dashboard (B1) - Design Showcase
          </h1>
          <p className="text-gray-600">
            Responsive Home Dashboard with both Light and Dark themes
          </p>
        </div>

        {/* Light Theme - Desktop */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Light Theme - Desktop (1440px)
          </h2>
          <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300">
            <div className="bg-white" style={{ width: '1440px', height: '900px', transform: 'scale(0.7)', transformOrigin: 'top left' }}>
              <div style={{ width: '1440px', height: '900px', transform: 'scale(1.43)' }}>
                <Layout title="Tổng quan">
                  <HomeContent />
                </Layout>
              </div>
            </div>
          </div>
        </div>

        {/* Dark Theme - Desktop */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dark Theme - Desktop (1440px)
          </h2>
          <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800">
            <div className="dark bg-[#0f1113]" style={{ width: '1440px', height: '900px', transform: 'scale(0.7)', transformOrigin: 'top left' }}>
              <div style={{ width: '1440px', height: '900px', transform: 'scale(1.43)' }}>
                <Layout title="Tổng quan">
                  <HomeContent />
                </Layout>
              </div>
            </div>
          </div>
        </div>

        {/* Light Theme - Mobile */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Light Theme - Mobile (375px)
          </h2>
          <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300 inline-block">
            <div className="bg-white" style={{ width: '375px', height: '812px' }}>
              <Layout title="Tổng quan">
                <HomeContent />
              </Layout>
            </div>
          </div>
        </div>

        {/* Dark Theme - Mobile */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dark Theme - Mobile (375px)
          </h2>
          <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800 inline-block">
            <div className="dark bg-[#0f1113]" style={{ width: '375px', height: '812px' }}>
              <Layout title="Tổng quan">
                <HomeContent />
              </Layout>
            </div>
          </div>
        </div>

        {/* Side by Side Comparison */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Side-by-Side Theme Comparison - Desktop
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Light Theme</h3>
              <div className="rounded-lg overflow-hidden shadow-xl border border-gray-300">
                <div className="bg-white" style={{ width: '720px', height: '900px', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                  <div style={{ width: '720px', height: '900px', transform: 'scale(1.25)' }}>
                    <Layout title="Tổng quan">
                      <HomeContent />
                    </Layout>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Dark Theme</h3>
              <div className="rounded-lg overflow-hidden shadow-xl border border-gray-800">
                <div className="dark bg-[#0f1113]" style={{ width: '720px', height: '900px', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                  <div style={{ width: '720px', height: '900px', transform: 'scale(1.25)' }}>
                    <Layout title="Tổng quan">
                      <HomeContent />
                    </Layout>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

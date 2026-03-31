import React from "react";
import { Layout } from "../components/Layout";
import InsightsOverview from "./InsightsOverview";
import CategoryBreakdown from "./CategoryBreakdown";
import CashflowChart from "./CashflowChart";
import AccountBreakdown from "./AccountBreakdown";
import MonthlyRecap from "./MonthlyRecap";

export default function InsightsShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Insights / Reports (G1-G5) - Design Showcase
          </h1>
          <p className="text-gray-600">
            Complete insights and reports system with interactive charts,
            filters, and shareable monthly recap
          </p>
        </div>

        {/* G1 - Insights Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            G1 - Insights Overview
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
                  width: "1440px",
                  height: "900px",
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(1.43)",
                  }}
                >
                  <Layout title="Thống kê & Báo cáo">
                    <InsightsOverview />
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
                  width: "1440px",
                  height: "900px",
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(1.43)",
                  }}
                >
                  <Layout title="Thống kê & Báo cáo">
                    <InsightsOverview />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* G2 - Category Breakdown */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            G2 - Category Breakdown
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
                  width: "1440px",
                  height: "900px",
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(1.43)",
                  }}
                >
                  <Layout title="Phân tích danh mục">
                    <CategoryBreakdown />
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
                  width: "1440px",
                  height: "900px",
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(1.43)",
                  }}
                >
                  <Layout title="Phân tích danh mục">
                    <CategoryBreakdown />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* G3 - Cashflow Chart */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            G3 - Cashflow Chart
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
                  width: "1440px",
                  height: "900px",
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(1.43)",
                  }}
                >
                  <Layout title="Biểu đồ dòng tiền">
                    <CashflowChart />
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
                  width: "1440px",
                  height: "900px",
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(1.43)",
                  }}
                >
                  <Layout title="Biểu đồ dòng tiền">
                    <CashflowChart />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* G4 - Account Breakdown */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            G4 - Account Breakdown
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
                  width: "1440px",
                  height: "900px",
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(1.43)",
                  }}
                >
                  <Layout title="Phân tích tài khoản">
                    <AccountBreakdown />
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
                  width: "1440px",
                  height: "900px",
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(1.43)",
                  }}
                >
                  <Layout title="Phân tích tài khoản">
                    <AccountBreakdown />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* G5 - Monthly Recap (Shareable) */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            G5 - Monthly Recap (Shareable)
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
                  width: "1440px",
                  height: "900px",
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(1.43)",
                  }}
                >
                  <MonthlyRecap />
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
                  width: "1440px",
                  height: "900px",
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(1.43)",
                  }}
                >
                  <MonthlyRecap />
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
                <h4 className="text-lg font-medium text-gray-700 mb-3">
                  Light Theme
                </h4>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300 inline-block">
                  <div
                    className="bg-white"
                    style={{ width: "375px", height: "812px" }}
                  >
                    <MonthlyRecap />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-3">
                  Dark Theme
                </h4>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800 inline-block">
                  <div
                    className="dark bg-[#0f1113]"
                    style={{ width: "375px", height: "812px" }}
                  >
                    <MonthlyRecap />
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

import React from "react";
import { Layout } from "../components/Layout";
import BudgetsOverview from "./BudgetsOverview";
import BudgetDetail from "./BudgetDetail";
import CreateEditBudget from "./CreateEditBudget";
import AddBudgetItem from "./AddBudgetItem";

export default function BudgetsShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Budgets (E1-E4) - Design Showcase
          </h1>
          <p className="text-gray-600">
            Complete budget management system with month selector, progress
            tracking, and item management
          </p>
        </div>

        {/* E1 - Budgets Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            E1 - Budgets Overview (Month Selector)
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
                  <Layout title="Ngân sách">
                    <BudgetsOverview />
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
                  <Layout title="Ngân sách">
                    <BudgetsOverview />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E2 - Budget Detail */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            E2 - Budget Detail
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
                  <Layout title="Chi tiết ngân sách">
                    <BudgetDetail />
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
                  <Layout title="Chi tiết ngân sách">
                    <BudgetDetail />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E3 - Create/Edit Budget */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            E3 - Create/Edit Budget
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
                  <Layout title="Tạo ngân sách">
                    <CreateEditBudget mode="create" />
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
                  <Layout title="Tạo ngân sách">
                    <CreateEditBudget mode="create" />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E4 - Add Budget Item */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            E4 - Add Budget Item (Modal & Page)
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
                  <Layout title="Tạo ngân sách">
                    <CreateEditBudget mode="edit" />
                  </Layout>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
                      <AddBudgetItem isModal={true} />
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
                  <Layout title="Tạo ngân sách">
                    <CreateEditBudget mode="edit" />
                  </Layout>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-[#1a1d21] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
                      <AddBudgetItem isModal={true} />
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
                <h4 className="text-lg font-medium text-gray-700 mb-3">
                  Light Theme
                </h4>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300 inline-block">
                  <div
                    className="bg-white"
                    style={{ width: "375px", height: "812px" }}
                  >
                    <Layout title="Thêm danh mục">
                      <AddBudgetItem isModal={false} />
                    </Layout>
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
                    <Layout title="Thêm danh mục">
                      <AddBudgetItem isModal={false} />
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

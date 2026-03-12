import React from "react";
import { Layout } from "../components/Layout";
import { Card } from "../components/Card";
import CreateEditGoal from "./CreateEditGoal";
import AddGoalContribution from "./AddGoalContribution";

const showcaseGoalInfo = {
  name: "Du lịch Nhật Bản",
  icon: "plane",
  color: "#3b82f6",
  currentAmount: 32500000,
  targetAmount: 50000000,
};

const previewForm = {
  name: "Du lịch Nhật Bản",
  icon: "plane",
  color: "#3b82f6",
  targetAmount: "50000000",
  initialAmount: "32500000",
  startDate: "2026-01-10",
  targetDate: "2026-08-15",
  linkedAccountId: "",
  note: "Showcase thiết kế cho màn hình Goals.",
  priority: "high" as const,
};

export default function GoalsShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Goals Showcase
          </h1>
          <p className="text-gray-600">
            Route /goals hiện đã dùng API thật. Trang showcase này giữ lại
            preview tĩnh để không phụ thuộc auth/router data.
          </p>
        </div>

        <Card className="bg-white">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lưu ý</h2>
          <p className="text-sm text-gray-600">
            Các màn hình production GoalsOverview và GoalDetail đang lấy dữ liệu
            từ backend. Vì vậy showcase không mount trực tiếp hai màn này nữa để
            tránh gọi API ngoài luồng demo.
          </p>
        </Card>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Create/Edit Goal Preview
          </h2>
          <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300 bg-white">
            <Layout title="Tạo mục tiêu">
              <CreateEditGoal
                mode="create"
                standalonePreview={true}
                initialData={previewForm}
              />
            </Layout>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Add Goal Contribution Preview
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300 bg-white p-6">
              <AddGoalContribution
                isModal={true}
                goalInfo={showcaseGoalInfo}
                onSave={async () => undefined}
                onClose={() => undefined}
              />
            </div>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300 bg-white">
              <Layout title="Thêm đóng góp">
                <AddGoalContribution
                  isModal={false}
                  goalInfo={showcaseGoalInfo}
                  onSave={async () => undefined}
                />
              </Layout>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import React from "react";
import { Layout } from "../components/Layout";
import AccountsOverview from "./AccountsOverview";
import CreateEditAccount from "./CreateEditAccount";
import AccountDetail from "./AccountDetail";

export default function AccountsShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Accounts Section (C1-C3) - Design Showcase
          </h1>
          <p className="text-gray-600">
            Complete accounts management flow with Light and Dark themes
          </p>
        </div>

        {/* C1 - Accounts Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            C1 - Accounts Overview
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
                  <Layout title="Ví & Tài khoản">
                    <AccountsOverview />
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
                  <Layout title="Ví & Tài khoản">
                    <AccountsOverview />
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
                <h4 className="text-lg font-medium text-gray-700 mb-3">
                  Light Theme
                </h4>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300 inline-block">
                  <div
                    className="bg-white"
                    style={{ width: "375px", height: "812px" }}
                  >
                    <Layout title="Ví & Tài khoản">
                      <AccountsOverview />
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
                    <Layout title="Ví & Tài khoản">
                      <AccountsOverview />
                    </Layout>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* C2 - Create Account */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            C2 - Create/Edit Account
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
                  <Layout title="Tạo tài khoản">
                    <CreateEditAccount mode="create" />
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
                  <Layout title="Tạo tài khoản">
                    <CreateEditAccount mode="create" />
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
                <h4 className="text-lg font-medium text-gray-700 mb-3">
                  Light Theme
                </h4>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-300 inline-block">
                  <div
                    className="bg-white"
                    style={{ width: "375px", height: "812px" }}
                  >
                    <Layout title="Tạo tài khoản">
                      <CreateEditAccount mode="create" />
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
                    <Layout title="Tạo tài khoản">
                      <CreateEditAccount mode="create" />
                    </Layout>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* C3 - Account Detail */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            C3 - Account Detail
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
                  <Layout title="Chi tiết tài khoản">
                    <AccountDetail />
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
                  <Layout title="Chi tiết tài khoản">
                    <AccountDetail />
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
                <h4 className="text-lg font-medium text-gray-700 mb-3">
                  Light Theme
                </h4>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800 inline-block">
                  <div
                    className="bg-white"
                    style={{ width: "375px", height: "812px" }}
                  >
                    <Layout title="Chi tiết tài khoản">
                      <AccountDetail />
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
                    <Layout title="Chi tiết tài khoản">
                      <AccountDetail />
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

import React from "react";
import { Layout } from "../components/Layout";
import CategoriesList from "./CategoriesList";
import CreateEditCategory from "./CreateEditCategory";
import TagsList from "./TagsList";
import CreateEditTag from "./CreateEditTag";
import MerchantsList from "./MerchantsList";
import MerchantDetail from "./MerchantDetail";

export default function CategoriesShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Categories/Tags/Merchants (D1-D6) - Design Showcase
          </h1>
          <p className="text-gray-600">
            Complete management system for categories, tags, and merchants with
            Light and Dark themes
          </p>
        </div>

        {/* D1 - Categories List */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            D1 - Categories List (Tree View)
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
                  <Layout title="Danh mục">
                    <CategoriesList />
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
                  <Layout title="Danh mục">
                    <CategoriesList />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* D2 - Create Category */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            D2 - Create/Edit Category
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
                  <Layout title="Tạo danh mục">
                    <CreateEditCategory mode="create" />
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
                  <Layout title="Tạo danh mục">
                    <CreateEditCategory mode="create" />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* D3 - Tags List */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            D3 - Tags List
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
                  <Layout title="Nhãn">
                    <TagsList />
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
                  <Layout title="Nhãn">
                    <TagsList />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* D4 - Create Tag */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            D4 - Create/Edit Tag
          </h2>

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
                    <Layout title="Tạo nhãn">
                      <CreateEditTag mode="create" />
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
                    <Layout title="Tạo nhãn">
                      <CreateEditTag mode="create" />
                    </Layout>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* D5 - Merchants List */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            D5 - Merchants List
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
                  <Layout title="Nhà cung cấp">
                    <MerchantsList />
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
                  <Layout title="Nhà cung cấp">
                    <MerchantsList />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* D6 - Merchant Detail */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            D6 - Merchant Detail/Edit
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
                  <Layout title="Chi tiết nhà cung cấp">
                    <MerchantDetail />
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
                  <Layout title="Chi tiết nhà cung cấp">
                    <MerchantDetail />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

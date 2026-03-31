import React from "react";
import { Layout } from "../components/Layout";
import AttachmentsGallery from "./AttachmentsGallery";
import ExportCenter from "./ExportCenter";
import SettingsHome from "./SettingsHome";
import SecuritySettings from "./SecuritySettings";
import DataBackupSettings from "./DataBackupSettings";
import AboutPage from "./AboutPage";

export default function SettingsShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Attachments/Export/Settings (I1-I6) - Design Showcase
          </h1>
          <p className="text-gray-600">
            Complete attachments, export, and settings with comprehensive
            functionality
          </p>
        </div>

        {/* I1 - Attachments Gallery */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            I1 - Receipt Attachments Gallery
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
                  <Layout title="Hoá đơn">
                    <AttachmentsGallery />
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
                  <Layout title="Hoá đơn">
                    <AttachmentsGallery />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* I2 - Export Center */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            I2 - Export Center (CSV/PDF)
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
                  <Layout title="Xuất dữ liệu">
                    <ExportCenter />
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
                  <Layout title="Xuất dữ liệu">
                    <ExportCenter />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* I3 - Settings Home */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            I3 - Settings Home
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
                  <SettingsHome />
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
                  <SettingsHome />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* I4 - Security Settings */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            I4 - Security (PIN/Biometrics)
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
                  <Layout title="Bảo mật">
                    <SecuritySettings />
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
                  <Layout title="Bảo mật">
                    <SecuritySettings />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* I5 - Data & Backup */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            I5 - Data & Backup
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
                  <Layout title="Dữ liệu & Sao lưu">
                    <DataBackupSettings />
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
                  <Layout title="Dữ liệu & Sao lưu">
                    <DataBackupSettings />
                  </Layout>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* I6 - About Page */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            I6 - About (Version)
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
                  <Layout title="Giới thiệu">
                    <AboutPage />
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
                  <Layout title="Giới thiệu">
                    <AboutPage />
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
                    <AboutPage />
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
                    <AboutPage />
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

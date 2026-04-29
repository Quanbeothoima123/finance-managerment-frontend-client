import React from "react";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  Shield,
  FileText,
  Heart,
} from "lucide-react";
import { Card } from "../components/Card";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const nav = useAppNavigation();
  const { t } = useTranslation("misc");
  const toast = useToast();

  const handleBack = () => {
    nav.goBack();
  };

  const handleLink = (link: string) => {
    toast.info(t("about.opening_link"));
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t("about.back")}</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {t("about.title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t("about.subtitle")}
          </p>
        </div>

        {/* App Info Card */}
        <Card className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-[var(--radius-xl)] mb-4">
            <span className="text-4xl">💰</span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            {t("about.app_name")}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {t("about.app_tagline")}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] rounded-[var(--radius-lg)]">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {t("about.version_label")}
            </span>
            <span className="text-sm font-bold text-[var(--primary)] tabular-nums">
              1.0.0
            </span>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--divider)]">
            <p className="text-xs text-[var(--text-secondary)]">
              {t("about.build_info")}{" "}
              <Heart className="w-3 h-3 inline text-[var(--danger)]" />{" "}
              {t("about.made_in")}
            </p>
          </div>
        </Card>

        {/* Links Section */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {t("about.legal.title")}
          </h3>

          <div className="space-y-1">
            <button
              onClick={() => handleLink("privacy")}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t("about.legal.privacy_policy")}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            <button
              onClick={() => handleLink("terms")}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t("about.legal.terms_of_use")}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            <button
              onClick={() => handleLink("licenses")}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t("about.legal.open_source_licenses")}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </Card>

        {/* Contact Section */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {t("about.contact.title")}
          </h3>

          <div className="space-y-1">
            <button
              onClick={() => handleLink("support")}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[var(--text-secondary)]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {t("about.contact.support_email")}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    support@quanlytaichinh.vn
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            <button
              onClick={() => handleLink("feedback")}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {t("about.contact.send_feedback")}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t("about.contact.feedback_description")}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </Card>

        {/* Technical Info */}
        <Card className="bg-[var(--surface)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {t("about.tech_info.title")}
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">
                {t("about.tech_info.app_version")}
              </span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                1.0.0
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">
                {t("about.tech_info.build_number")}
              </span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                2026.02.12
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">
                {t("about.tech_info.framework")}
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                React 18.3.1
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">
                {t("about.tech_info.size")}
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                14.8 MB
              </span>
            </div>
          </div>
        </Card>

        {/* Credits */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {t("about.credits.title")}
          </h3>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                React Router
              </p>
              <p className="text-xs text-[var(--text-secondary)]">v7.13.0</p>
            </div>

            <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                Tailwind CSS
              </p>
              <p className="text-xs text-[var(--text-secondary)]">v4.1.12</p>
            </div>

            <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                Recharts
              </p>
              <p className="text-xs text-[var(--text-secondary)]">v2.15.2</p>
            </div>

            <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
              <p className="font-semibold text-[var(--text-primary)] mb-1">
                Lucide React
              </p>
              <p className="text-xs text-[var(--text-secondary)]">v0.487.0</p>
            </div>
          </div>

          <button
            onClick={() => handleLink("all-licenses")}
            className="mt-4 w-full text-center text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
          >
            {t("about.credits.view_all_licenses")}
          </button>
        </Card>

        {/* Copyright */}
        <div className="text-center py-6">
          <p className="text-sm text-[var(--text-secondary)]">
            {t("about.copyright")}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {t("about.developed_in")}
          </p>
        </div>
      </div>
    </div>
  );
}

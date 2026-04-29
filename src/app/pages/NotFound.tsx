import React from "react";
import { useNavigate } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/Button";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation("misc");

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-[var(--text-tertiary)] mb-4">
          {t("not_found.code")}
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          {t("not_found.title")}
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          {t("not_found.description")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
            {t("not_found.back_button")}
          </Button>
          <Button onClick={() => navigate("/home")} variant="secondary">
            <Home className="w-5 h-5" />
            {t("not_found.home_button")}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(next);
    localStorage.setItem("app-language", next);
  };

  return (
    <button
      onClick={toggle}
      className="px-2 py-1 rounded-[var(--radius-md)] text-xs font-medium border border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
    >
      {i18n.language === "vi" ? "VI" : "EN"}
    </button>
  );
}

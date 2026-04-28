import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, Building2, Save, Smartphone } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useToast } from "../contexts/ToastContext";
import { useAccountDetail } from "../hooks/useAccountDetail";
import { accountsService } from "../services/accountsService";
import { normalizeFrontendAccountType } from "../utils/accountHelpers";

const institutions: Record<string, Array<{ value: string; label: string }>> = {
  ewallet: [
    { value: "MoMo", label: "MoMo" },
    { value: "ZaloPay", label: "ZaloPay" },
    { value: "VNPay", label: "VNPay" },
    { value: "ShopeePay", label: "ShopeePay" },
    { value: "ViettelPay", label: "ViettelPay" },
  ],
  bank: [
    { value: "Vietcombank", label: "Vietcombank (VCB)" },
    { value: "Techcombank", label: "Techcombank (TCB)" },
    { value: "ACB", label: "ACB" },
    { value: "VIB", label: "VIB" },
    { value: "MBBank", label: "MBBank" },
    { value: "VPBank", label: "VPBank" },
    { value: "BIDV", label: "BIDV" },
    { value: "Agribank", label: "Agribank" },
  ],
};

interface CreateEditAccountProps {
  mode?: "create" | "edit";
}

export default function CreateEditAccount({
  mode = "create",
}: CreateEditAccountProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation("accounts");
  const { data: detailData, loading: loadingDetail } = useAccountDetail(
    mode === "edit" ? id : undefined,
  );
  const account = detailData?.account;

  const accountTypes = [
    { value: "cash", label: t("form.account_types.cash"), icon: Banknote },
    {
      value: "ewallet",
      label: t("form.account_types.ewallet"),
      icon: Smartphone,
    },
    { value: "bank", label: t("form.account_types.bank"), icon: Building2 },
    { value: "credit", label: t("form.account_types.credit"), icon: Building2 },
    {
      value: "investment",
      label: t("form.account_types.investment"),
      icon: Building2,
    },
    {
      value: "savings",
      label: t("form.account_types.savings"),
      icon: Building2,
    },
  ] as const;

  const [formData, setFormData] = useState({
    name: "",
    type: "cash",
    institution: "",
    openingBalance: "0",
    currency: "VND",
    active: true,
    accountNumber: "",
    accountOwnerName: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!account || mode !== "edit") return;

    setFormData({
      name: account.name,
      type: normalizeFrontendAccountType(account.accountType),
      institution: account.providerName || "",
      openingBalance: String(Number(account.openingBalanceMinor || 0)),
      currency: account.currencyCode || "VND",
      active: account.status === "active",
      accountNumber: account.accountNumber || "",
      accountOwnerName: account.accountOwnerName || "",
    });
  }, [account, mode]);

  const institutionOptions = useMemo(() => {
    return institutions[formData.type] || [];
  }, [formData.type]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = t("form.errors.name_required");
    }

    if (
      (formData.type === "bank" || formData.type === "ewallet") &&
      !formData.institution
    ) {
      nextErrors.institution = t("form.errors.institution_required");
    }

    if (Number(formData.openingBalance) < 0) {
      nextErrors.openingBalance = t("form.errors.opening_balance_negative");
    }

    if (formData.type === "bank" && !formData.accountNumber.trim()) {
      nextErrors.accountNumber = t("form.errors.account_number_required");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        type: formData.type as
          | "cash"
          | "bank"
          | "ewallet"
          | "credit"
          | "savings"
          | "investment",
        institution: formData.institution || null,
        accountNumber: formData.accountNumber || null,
        accountOwnerName: formData.accountOwnerName || null,
        currency: formData.currency,
        openingBalance: Number(formData.openingBalance || 0),
        active: formData.active,
      };

      if (mode === "create") {
        await accountsService.createAccount(payload);
        toast.success(t("form.success_create"));
      } else if (id) {
        await accountsService.updateAccount(id, payload);
        toast.success(t("form.success_edit"));
      }

      navigate("/accounts");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("form.errors.save_failed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "edit" && loadingDetail) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("form.loading")}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t("form.back")}</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {mode === "create" ? t("form.title_create") : t("form.title_edit")}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === "create"
              ? t("form.subtitle_create")
              : t("form.subtitle_edit")}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  {t("form.section_basic")}
                </h3>

                <div className="space-y-4">
                  <Input
                    label={t("form.account_name_label")}
                    placeholder={t("form.account_name_placeholder")}
                    value={formData.name}
                    onChange={(event) =>
                      handleInputChange("name", event.target.value)
                    }
                    error={errors.name}
                  />

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      {t("form.account_type_label")}
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {accountTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.type === type.value;

                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              handleInputChange("type", type.value)
                            }
                            className={`flex flex-col items-center gap-2 p-3 rounded-[var(--radius-lg)] border-2 transition-all ${
                              isSelected
                                ? "border-[var(--primary)] bg-[var(--primary-light)]"
                                : "border-[var(--border)] hover:border-[var(--text-tertiary)]"
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                isSelected
                                  ? "text-[var(--primary)]"
                                  : "text-[var(--text-secondary)]"
                              }`}
                            />
                            <span
                              className={`text-xs text-center ${
                                isSelected
                                  ? "text-[var(--primary)] font-medium"
                                  : "text-[var(--text-secondary)]"
                              }`}
                            >
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(formData.type === "bank" ||
                    formData.type === "ewallet") && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        {t("form.institution_label")}
                      </label>
                      <select
                        value={formData.institution}
                        onChange={(event) =>
                          handleInputChange("institution", event.target.value)
                        }
                        className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                      >
                        <option value="">
                          {t("form.institution_placeholder")}
                        </option>
                        {institutionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.institution && (
                        <p className="text-sm text-[var(--danger)] mt-1">
                          {errors.institution}
                        </p>
                      )}
                    </div>
                  )}

                  <Input
                    label={t("form.account_number_label")}
                    placeholder={t("form.account_number_placeholder")}
                    value={formData.accountNumber}
                    onChange={(event) =>
                      handleInputChange("accountNumber", event.target.value)
                    }
                    error={errors.accountNumber}
                  />

                  <Input
                    label={t("form.account_owner_label")}
                    placeholder={t("form.account_owner_placeholder")}
                    value={formData.accountOwnerName}
                    onChange={(event) =>
                      handleInputChange("accountOwnerName", event.target.value)
                    }
                  />
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  {t("form.section_balance")}
                </h3>

                <div className="space-y-4">
                  <Input
                    label={t("form.opening_balance_label")}
                    type="number"
                    value={formData.openingBalance}
                    onChange={(event) =>
                      handleInputChange("openingBalance", event.target.value)
                    }
                    error={errors.openingBalance}
                  />

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      {t("form.currency_label")}
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(event) =>
                        handleInputChange("currency", event.target.value)
                      }
                      className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                    >
                      <option value="VND">VND (₫)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  {t("form.section_extra")}
                </h3>

                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {t("form.active_status_label")}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Tài khoản đang sử dụng
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(event) =>
                      handleInputChange("active", event.target.checked)
                    }
                    className="w-5 h-5"
                  />
                </label>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              {t("form.cancel")}
            </Button>

            <Button type="submit" disabled={submitting}>
              <Save className="w-4 h-4" />
              {submitting
                ? t("form.submitting")
                : mode === "create"
                  ? t("form.submit_create")
                  : t("form.submit_edit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedName } from "../utils/localizedName";
import { useParams } from "react-router";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  Camera,
  Copy,
  Edit,
  FileText,
  Landmark,
  MoreVertical,
  SplitSquareHorizontal,
  Store,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import i18n from "../../i18n";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { TagChip } from "../components/TagChip";
import { useToast } from "../contexts/ToastContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useTransactionDetail } from "../hooks/useTransactionDetail";
import { transactionsService } from "../services/transactionsService";

function getLocale() {
  return i18n.language === "en" ? "en-US" : "vi-VN";
}

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat(getLocale()).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(getLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getTypeIcon(type: string) {
  switch (type) {
    case "income":
      return <ArrowUpRight className="w-8 h-8 text-[var(--success)]" />;
    case "expense":
      return <ArrowDownLeft className="w-8 h-8 text-[var(--danger)]" />;
    case "transfer":
      return <ArrowLeftRight className="w-8 h-8 text-[var(--info)]" />;
    default:
      return <Wallet className="w-8 h-8 text-[var(--text-secondary)]" />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "income":
      return i18n.t("transactions:detail.type_labels.income");
    case "expense":
      return i18n.t("transactions:detail.type_labels.expense");
    case "transfer":
      return i18n.t("transactions:detail.type_labels.transfer");
    case "adjustment":
      return i18n.t("transactions:detail.type_labels.adjustment");
    default:
      return type;
  }
}

function getAmountColor(type: string) {
  switch (type) {
    case "income":
      return "text-[var(--success)]";
    case "expense":
      return "text-[var(--danger)]";
    case "transfer":
      return "text-[var(--info)]";
    default:
      return "text-[var(--text-primary)]";
  }
}

export default function TransactionDetail() {
  const { t } = useTranslation("transactions");
  const localName = useLocalizedName();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const nav = useAppNavigation();
  const { data: transaction, loading, error } = useTransactionDetail(id);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageLightboxOpen, setImageLightboxOpen] = useState(false);

  const canEdit = useMemo(() => {
    if (!transaction) return false;
    if (transaction.sourceType !== "manual") return false;
    if (transaction.txnType === "adjustment") return false;
    if ((transaction.references?.reconciliationCount || 0) > 0) return false;
    return true;
  }, [transaction]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("common:status.loading")}
          </p>
        </Card>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {t("detail.title")}
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              {error || t("detail.not_found")}
            </p>
            <Button onClick={nav.goBack} variant="secondary">
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t("common:actions.back")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await transactionsService.deleteTransaction(transaction.id);
      toast.success(t("detail.delete.success"));
      nav.goTransactions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("detail.delete.failed"),
      );
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDuplicate = () => {
    if (transaction.txnType === "transfer") {
      nav.goTo(`/transfer/create?duplicateFrom=${transaction.id}`);
      return;
    }
    nav.goDuplicateTransaction(transaction.id);
  };

  const handleEdit = () => {
    if (transaction.txnType === "transfer") {
      nav.goTo(`/transfer/create?editId=${transaction.id}`);
      return;
    }
    nav.goEditTransaction(transaction.id);
  };

  const renderSignedAmount = () => {
    if (transaction.txnType === "income") {
      return `+${formatMoney(Math.abs(Number(transaction.signedAmountMinor || 0)))}₫`;
    }
    if (transaction.txnType === "expense") {
      return `-${formatMoney(Math.abs(Number(transaction.signedAmountMinor || 0)))}₫`;
    }
    return `${formatMoney(Math.abs(Number(transaction.totalAmountMinor || 0)))}₫`;
  };

  const merchantClickable = Boolean(transaction.merchant?.id);
  const categoryClickable = Boolean(transaction.category?.id);
  const accountClickable = Boolean(transaction.account?.id);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="sticky top-0 z-10 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={nav.goBack}
              className="p-2 -ml-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-[var(--text-primary)]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
              >
                <MoreVertical className="w-6 h-6 text-[var(--text-primary)]" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleEdit();
                    }}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 text-left text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit className="w-4 h-4" />
                    {t("common:actions.edit")}
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDuplicate();
                    }}
                    className="w-full px-4 py-2 text-left text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {t("common:actions.duplicate")}
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 text-left text-[var(--danger)] hover:bg-[var(--surface)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("common:actions.delete")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
              {getTypeIcon(transaction.txnType)}
            </div>

            <div className="flex-1">
              <div className="text-sm text-[var(--text-secondary)] mb-1">
                {getTypeLabel(transaction.txnType)}
              </div>
              <div
                className={`text-3xl font-bold ${getAmountColor(transaction.txnType)}`}
              >
                {renderSignedAmount()}
              </div>
              <div className="text-lg font-medium text-[var(--text-primary)] mt-2">
                {transaction.description || t("detail.fallback_name")}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] divide-y divide-[var(--divider)]">
          <div className="p-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-[var(--text-secondary)]">
                {t("detail.fields.date")}
              </div>
              <div className="font-medium text-[var(--text-primary)] mt-0.5">
                {formatDate(transaction.occurredAt)}
              </div>
              <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {formatDateTime(transaction.occurredAt)}
              </div>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <Tag className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-[var(--text-secondary)]">
                {t("detail.fields.category")}
              </div>

              {transaction.isSplit ? (
                <div className="font-medium text-[var(--text-primary)] mt-0.5 inline-flex items-center gap-1.5">
                  <SplitSquareHorizontal className="w-4 h-4 text-[var(--primary)]" />
                  {t("detail.fields.split", {
                    count: transaction.splitItems?.length || 0,
                  })}
                </div>
              ) : categoryClickable ? (
                <button
                  onClick={() =>
                    nav.goTransactionsByCategory(transaction.category!.id)
                  }
                  className="font-medium text-[var(--primary)] hover:underline mt-0.5"
                >
                  {transaction.category?.name}
                </button>
              ) : (
                <div className="font-medium text-[var(--text-primary)] mt-0.5">
                  {transaction.category?.name || "--"}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-[var(--text-secondary)]">
                {transaction.txnType === "transfer"
                  ? t("detail.fields.from_account")
                  : t("detail.fields.account")}
              </div>

              {accountClickable ? (
                <button
                  onClick={() =>
                    nav.goTransactionsByAccount(transaction.account!.id)
                  }
                  className="font-medium text-[var(--primary)] hover:underline mt-0.5"
                >
                  {transaction.account?.name}
                </button>
              ) : (
                <div className="font-medium text-[var(--text-primary)] mt-0.5">
                  {transaction.account?.name || "--"}
                </div>
              )}
            </div>
          </div>

          {transaction.txnType === "transfer" && transaction.toAccount && (
            <div className="p-4 flex items-center gap-3">
              <Landmark className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)]">
                  {t("detail.fields.to_account")}
                </div>
                <div className="font-medium text-[var(--text-primary)] mt-0.5">
                  {transaction.toAccount.name}
                </div>
              </div>
            </div>
          )}

          {transaction.merchant && (
            <div className="p-4 flex items-center gap-3">
              <Store className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)]">
                  {t("detail.fields.merchant")}
                </div>

                {merchantClickable ? (
                  <button
                    onClick={() =>
                      nav.goTransactionsByMerchant(transaction.merchant!.id)
                    }
                    className="font-medium text-[var(--primary)] hover:underline mt-0.5"
                  >
                    {transaction.merchant.name}
                  </button>
                ) : (
                  <div className="font-medium text-[var(--text-primary)] mt-0.5">
                    {transaction.merchant.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {transaction.note && (
            <div className="p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)]">
                  {t("detail.fields.note")}
                </div>
                <div className="font-medium text-[var(--text-primary)] mt-0.5 whitespace-pre-wrap">
                  {transaction.note}
                </div>
              </div>
            </div>
          )}

          {transaction.imageUrl && (
            <div className="p-4">
              <div className="text-sm text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> {t("detail.image_alt")}
              </div>
              <img
                src={transaction.imageUrl}
                alt={t("detail.image_alt")}
                onClick={() => setImageLightboxOpen(true)}
                className="max-h-60 rounded-[var(--radius-lg)] border border-[var(--border)] object-contain cursor-pointer hover:opacity-90 transition-opacity"
              />
            </div>
          )}

          {transaction.tags?.length > 0 && (
            <div className="p-4">
              <div className="text-sm text-[var(--text-secondary)] mb-3">
                {t("detail.fields.tags")}
              </div>
              <div className="flex flex-wrap gap-2">
                {transaction.tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => nav.goTransactionsByTag(tag.id)}
                    className="rounded-[var(--radius-md)]"
                  >
                    <TagChip
                      name={tag.name}
                      nameEn={tag.nameEn}
                      color={tag.colorHex || "#64748b"}
                      className="hover:scale-[1.02] transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {transaction.isSplit && transaction.splitItems.length > 0 && (
            <div className="p-4">
              <div className="text-sm text-[var(--text-secondary)] mb-3">
                {t("detail.split_details")}
              </div>
              <div className="space-y-2">
                {transaction.splitItems.map((split) => (
                  <div
                    key={split.id}
                    className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-[var(--surface)]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {split.category?.name || "--"}
                      </p>
                      {split.note && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {split.note}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                      {formatMoney(split.amountMinor)}₫
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => void handleDelete()}
        title={t("detail.delete.title")}
        description={t("detail.delete.description", {
          name: transaction.description || t("detail.fallback_name"),
        })}
        confirmLabel={
          deleting ? t("detail.delete.deleting") : t("detail.delete.confirm")
        }
        cancelLabel={t("detail.delete.cancel")}
        isDangerous
      />

      {imageLightboxOpen && transaction.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={() => setImageLightboxOpen(false)}
        >
          <img
            src={transaction.imageUrl}
            alt={t("detail.image_alt")}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[92vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

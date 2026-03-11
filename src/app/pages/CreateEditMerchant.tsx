import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Store } from "lucide-react";
import { useParams } from "react-router";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useMerchantsMeta } from "../hooks/useMerchantsMeta";
import { useMerchantDetail } from "../hooks/useMerchantDetail";
import { merchantsService } from "../services/merchantsService";

interface CreateEditMerchantProps {
  mode?: "create" | "edit";
}

export default function CreateEditMerchant({
  mode = "create",
}: CreateEditMerchantProps) {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();

  const isEditMode = mode === "edit";
  const {
    data: metaData,
    loading: metaLoading,
    error: metaError,
  } = useMerchantsMeta();
  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
  } = useMerchantDetail(isEditMode ? id : undefined);

  const [formData, setFormData] = useState({
    name: "",
    defaultCategoryId: "",
    note: "",
    isHidden: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = useMemo(() => {
    const options = [{ value: "", label: "Không đặt mặc định" }];

    (metaData?.categories || []).forEach((category) => {
      options.push({
        value: category.id,
        label: category.name,
      });
    });

    return options;
  }, [metaData?.categories]);

  useEffect(() => {
    if (!detailData?.merchant || !isEditMode) return;

    setFormData({
      name: detailData.merchant.name,
      defaultCategoryId: detailData.merchant.defaultCategoryId || "",
      note: detailData.merchant.note || "",
      isHidden: detailData.merchant.isHidden,
    });
  }, [detailData, isEditMode]);

  const handleInputChange = (
    field: "name" | "defaultCategoryId" | "note" | "isHidden",
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên merchant";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        defaultCategoryId: formData.defaultCategoryId || null,
        note: formData.note.trim() || null,
        isHidden: formData.isHidden,
      };

      if (isEditMode && id) {
        await merchantsService.updateMerchant(id, payload);
        toast.success("Đã cập nhật merchant");
      } else {
        await merchantsService.createMerchant(payload);
        toast.success("Đã tạo merchant mới");
      }

      nav.goMerchants();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu merchant",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (metaLoading || (isEditMode && detailLoading)) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải dữ liệu merchant...
          </p>
        </Card>
      </div>
    );
  }

  if (metaError || (isEditMode && detailError)) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {metaError || detailError || "Không thể tải dữ liệu merchant"}
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
            onClick={nav.goBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {isEditMode ? "Chỉnh sửa merchant" : "Thêm merchant"}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isEditMode
              ? "Cập nhật thông tin merchant"
              : "Thêm merchant mới để gợi ý category và dùng lại trong form giao dịch"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Thông tin
                </h3>

                <div className="space-y-4">
                  <Input
                    label="Tên merchant"
                    placeholder="VD: Highlands Coffee"
                    value={formData.name}
                    onChange={(event) =>
                      handleInputChange("name", event.target.value)
                    }
                    error={errors.name}
                  />

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Danh mục mặc định
                    </label>
                    <select
                      value={formData.defaultCategoryId}
                      onChange={(event) =>
                        handleInputChange(
                          "defaultCategoryId",
                          event.target.value,
                        )
                      }
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      Dùng để gợi ý category khi chọn merchant này trong form
                      giao dịch.
                    </p>
                  </div>

                  <Input
                    label="Ghi chú"
                    placeholder="Ví dụ: Chuỗi cà phê hay dùng"
                    value={formData.note}
                    onChange={(event) =>
                      handleInputChange("note", event.target.value)
                    }
                  />

                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        Ẩn merchant
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Merchant vẫn tồn tại nhưng không hiện mặc định trong
                        danh sách.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={formData.isHidden}
                      onChange={(event) =>
                        handleInputChange("isHidden", event.target.checked)
                      }
                      className="w-5 h-5"
                    />
                  </label>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Xem trước
                </h3>

                <div className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <div className="w-12 h-12 bg-[var(--background)] rounded-[var(--radius-lg)] flex items-center justify-center">
                    <Store className="w-6 h-6 text-[var(--text-secondary)]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {formData.name || "Tên merchant"}
                      </p>
                      {formData.isHidden && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-tertiary)]">
                          Đã ẩn
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {categoryOptions.find(
                        (item) => item.value === formData.defaultCategoryId,
                      )?.label || "Không đặt mặc định"}
                    </p>

                    {formData.note && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">
                        {formData.note}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {isEditMode && (
                <Card className="bg-[var(--info-light)] border-[var(--info)]">
                  <div className="flex items-start gap-3">
                    <Store className="w-5 h-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)] mb-1">
                        Lưu ý
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Thay đổi danh mục mặc định chỉ ảnh hưởng đến những giao
                        dịch tạo mới sau này.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={nav.goBack}>
              Huỷ
            </Button>
            <Button type="submit" disabled={submitting}>
              <Save className="w-4 h-4" />
              {submitting
                ? "Đang lưu..."
                : isEditMode
                  ? "Lưu thay đổi"
                  : "Tạo merchant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

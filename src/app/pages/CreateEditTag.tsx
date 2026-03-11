import React, { useEffect, useState } from "react";
import { ArrowLeft, Hash, Palette, Save } from "lucide-react";
import { useParams } from "react-router";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { tagsService } from "../services/tagsService";
import { useTagDetail } from "../hooks/useTagDetail";

const COLOR_PALETTE = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#475569",
  "#1e293b",
];

interface CreateEditTagProps {
  mode?: "create" | "edit";
}

function normalizeColor(value: string) {
  if (!value) return "";
  return value.startsWith("#") ? value : `#${value}`;
}

export default function CreateEditTag({ mode = "create" }: CreateEditTagProps) {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();

  const isEditMode = mode === "edit";
  const {
    data: tag,
    loading,
    error,
  } = useTagDetail(isEditMode ? id : undefined);

  const [formData, setFormData] = useState({
    name: "",
    color: "#ef4444",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tag || !isEditMode) return;
    setFormData({
      name: tag.name,
      color: tag.colorHex || tag.color || "#ef4444",
    });
  }, [tag, isEditMode]);

  const handleInputChange = (field: "name" | "color", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên nhãn";
    }

    const normalizedColor = normalizeColor(formData.color);
    if (!/^#[0-9A-Fa-f]{6}$/i.test(normalizedColor)) {
      nextErrors.color = "Màu không hợp lệ (vd: #ef4444)";
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
        colorHex: normalizeColor(formData.color),
      };

      if (isEditMode && id) {
        await tagsService.updateTag(id, payload);
        toast.success("Đã cập nhật nhãn");
      } else {
        await tagsService.createTag(payload);
        toast.success("Đã tạo nhãn mới");
      }

      nav.goTags();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu nhãn");
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditMode && loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải dữ liệu nhãn...
          </p>
        </Card>
      </div>
    );
  }

  if (isEditMode && error) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="mb-6">
          <button
            onClick={nav.goBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {isEditMode ? "Chỉnh sửa nhãn" : "Tạo nhãn mới"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isEditMode
              ? "Cập nhật thông tin nhãn"
              : "Thêm nhãn mới để gắn vào giao dịch"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Tên nhãn
            </h3>
            <Input
              label="Tên"
              placeholder="VD: Công việc, Cần thiết..."
              value={formData.name}
              onChange={(event) =>
                handleInputChange("name", event.target.value)
              }
              error={errors.name}
            />
          </Card>

          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Màu sắc
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-[var(--radius-lg)] border border-[var(--border)] flex items-center justify-center"
                  style={{
                    backgroundColor:
                      normalizeColor(formData.color) || "#ef4444",
                  }}
                >
                  <Hash className="w-8 h-8 text-white opacity-70" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] uppercase">
                    {normalizeColor(formData.color) || "#ef4444"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker((prev) => !prev)}
                    className="text-xs text-[var(--primary)] hover:underline mt-1"
                  >
                    {showColorPicker ? "Ẩn bảng màu" : "Chọn từ bảng màu"}
                  </button>
                </div>
              </div>

              {showColorPicker && (
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  {COLOR_PALETTE.map((color) => {
                    const selected = normalizeColor(formData.color) === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          handleInputChange("color", color);
                          setShowColorPicker(false);
                        }}
                        className={`w-10 h-10 rounded-[var(--radius-md)] transition-transform hover:scale-105 ${
                          selected
                            ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--card)]"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    );
                  })}
                </div>
              )}

              <Input
                label="Mã màu HEX"
                placeholder="#ef4444"
                value={formData.color}
                onChange={(event) =>
                  handleInputChange("color", event.target.value)
                }
                error={errors.color}
              />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Xem trước
            </h3>

            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius-lg)]"
                style={{
                  backgroundColor: `${normalizeColor(formData.color) || "#ef4444"}18`,
                  borderLeft: `4px solid ${normalizeColor(formData.color) || "#ef4444"}`,
                }}
              >
                <Palette
                  className="w-5 h-5"
                  style={{ color: normalizeColor(formData.color) || "#ef4444" }}
                />
                <span
                  className="font-medium"
                  style={{ color: normalizeColor(formData.color) || "#ef4444" }}
                >
                  {formData.name || "Tên nhãn"}
                </span>
              </div>
            </div>
          </Card>

          <div className="flex flex-col-reverse md:flex-row gap-3">
            <Button type="button" variant="secondary" onClick={nav.goBack}>
              Huỷ
            </Button>
            <Button type="submit" disabled={submitting}>
              <Save className="w-4 h-4" />
              {submitting
                ? "Đang lưu..."
                : isEditMode
                  ? "Lưu thay đổi"
                  : "Tạo nhãn"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

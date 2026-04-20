import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  Cloud,
  Crown,
  Eye,
  ExternalLink,
  FileText,
  Upload,
  Lock,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useAppData, type CloudAttachment } from "../contexts/AppDataContext";
import { useToast } from "../contexts/ToastContext";

interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "done" | "failed";
}

interface AttachmentUploadSheetProps {
  txnId: string;
  description: string;
  onClose: () => void;
  onOpenLightbox: (attachments: CloudAttachment[], index: number) => void;
  onNavigateToDetail: (txnId: string) => void;
}

const MAX_FILES = 10;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function AttachmentUploadSheet({
  txnId,
  description,
  onClose,
  onOpenLightbox,
  onNavigateToDetail,
}: AttachmentUploadSheetProps) {
  const { transactions, isPro, setIsPro, updateTransaction } = useAppData();
  const toast = useToast();

  const transaction = transactions.find((t) => t.id === txnId);
  const currentAttachments = transaction?.attachments || [];

  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = MAX_FILES - currentAttachments.length;
  const isLimitReached = remainingSlots <= 0;

  // Simulate upload progress
  useEffect(() => {
    const uploading = uploadQueue.filter((u) => u.status === "uploading");
    if (uploading.length === 0) return;

    const interval = setInterval(() => {
      setUploadQueue((prev) =>
        prev.map((item) => {
          if (item.status !== "uploading") return item;
          const newProgress = Math.min(
            item.progress + Math.random() * 25 + 10,
            100,
          );
          if (newProgress >= 100) {
            // Upload complete — create CloudAttachment and append to transaction
            const newAtt: CloudAttachment = {
              id: `att-upload-${item.id}`,
              name: item.name,
              size: item.size,
              type: item.file.type.startsWith("image/") ? "image" : "pdf",
              url: item.file.type.startsWith("image/")
                ? URL.createObjectURL(item.file)
                : `https://example.com/files/${item.name}`,
              uploadedAt: new Date().toISOString(),
            };
            // Append to transaction
            const txn = transactions.find((t) => t.id === txnId);
            const existing = txn?.attachments || [];
            updateTransaction(txnId, {
              attachments: [...existing, newAtt],
              attachment: true,
            });
            return { ...item, progress: 100, status: "done" as const };
          }
          return { ...item, progress: newProgress };
        }),
      );
    }, 300);

    return () => clearInterval(interval);
  }, [uploadQueue, txnId, transactions, updateTransaction]);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      if (!isPro) {
        setShowUpgradeModal(true);
        return;
      }

      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      let rejected = 0;

      // Check file count limit
      const available =
        MAX_FILES -
        currentAttachments.length -
        uploadQueue.filter((u) => u.status !== "failed").length;

      for (const file of fileArray) {
        if (file.size > MAX_SIZE) {
          toast.warning("File quá lớn (tối đa 10MB).");
          continue;
        }
        if (validFiles.length >= available) {
          rejected++;
          continue;
        }
        // Validate type
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";
        if (!isImage && !isPdf) {
          // Accept but mark as "other"
        }
        validFiles.push(file);
      }

      if (rejected > 0) {
        toast.warning("Tối đa 10 file.");
      }

      if (validFiles.length === 0) return;

      const newItems: UploadItem[] = validFiles.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "uploading" as const,
      }));

      setUploadQueue((prev) => [...prev, ...newItems]);
    },
    [isPro, currentAttachments.length, uploadQueue, toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = () => {
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ""; // Reset
    }
  };

  const removeExistingAttachment = (attId: string) => {
    const txn = transactions.find((t) => t.id === txnId);
    if (!txn) return;
    const updated = (txn.attachments || []).filter((a) => a.id !== attId);
    updateTransaction(txnId, {
      attachments: updated,
      attachment: updated.length > 0,
    });
    toast.success("Đã xoá đính kèm.");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Re-read attachments from current transaction state for live updates
  const liveAttachments =
    transactions.find((t) => t.id === txnId)?.attachments || [];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bg-[var(--card)] w-full max-w-lg rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-[var(--border)]">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Đính kèm
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Tối đa {MAX_FILES} file • {MAX_SIZE / (1024 * 1024)}MB/file
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isPro && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                  <Crown className="w-2.5 h-2.5" /> PRO
                </span>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-tertiary)]" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Upload Zone */}
            <div className="p-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative rounded-[var(--radius-lg)] border-2 border-dashed p-6 text-center transition-all ${
                  !isPro || isLimitReached
                    ? "border-[var(--border)] bg-[var(--surface)] opacity-60"
                    : dragOver
                      ? "border-[var(--primary)] bg-[var(--primary-light)] scale-[1.01]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/30"
                }`}
              >
                {/* Lock overlay for non-PRO or limit reached */}
                {(!isPro || isLimitReached) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface)]/90 rounded-[var(--radius-lg)] z-10">
                    <Lock className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      {!isPro
                        ? "Đính kèm đám mây là PRO"
                        : "Đã đạt giới hạn 10 file"}
                    </p>
                    {!isPro && (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="mt-2 px-4 py-1.5 bg-amber-500 text-white rounded-[var(--radius-lg)] text-sm font-medium hover:bg-amber-600 transition-colors"
                      >
                        Nâng cấp
                      </button>
                    )}
                  </div>
                )}

                <Cloud
                  className={`w-10 h-10 mx-auto mb-2 ${dragOver ? "text-[var(--primary)]" : "text-[var(--text-tertiary)]"}`}
                />
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                  Kéo thả file vào đây
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  Hỗ trợ ảnh và PDF
                </p>
                <button
                  onClick={handleFileSelect}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Chọn file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Upload Progress List */}
            {uploadQueue.length > 0 && (
              <div className="px-4 pb-3">
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Đang tải lên
                </p>
                <div className="space-y-2">
                  {uploadQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 bg-[var(--surface)] rounded-[var(--radius-md)]"
                    >
                      <div className="flex-shrink-0">
                        {item.status === "uploading" && (
                          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                        )}
                        {item.status === "done" && (
                          <CheckCircle className="w-8 h-8 text-[var(--success)]" />
                        )}
                        {item.status === "failed" && (
                          <AlertCircle className="w-8 h-8 text-[var(--danger)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            {formatSize(item.size)}
                          </span>
                          <span
                            className={`text-[10px] font-medium ${
                              item.status === "uploading"
                                ? "text-[var(--primary)]"
                                : item.status === "done"
                                  ? "text-[var(--success)]"
                                  : "text-[var(--danger)]"
                            }`}
                          >
                            {item.status === "uploading"
                              ? "Đang tải lên…"
                              : item.status === "done"
                                ? "Tải lên thành công"
                                : "Tải lên thất bại"}
                          </span>
                        </div>
                        {item.status === "uploading" && (
                          <div className="mt-1.5 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Attachments */}
            {liveAttachments.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Tệp hiện tại ({liveAttachments.length}/{MAX_FILES})
                </p>
                <div className="space-y-1 divide-y divide-[var(--divider)]">
                  {liveAttachments.map((att, idx) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 py-3 first:pt-0"
                    >
                      {/* Thumbnail */}
                      <button
                        onClick={() => {
                          if (att.type === "image") {
                            onOpenLightbox(liveAttachments, idx);
                            onClose();
                          } else {
                            window.open(att.url, "_blank");
                          }
                        }}
                        className="w-12 h-12 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-[var(--primary)] transition-all"
                      >
                        {att.type === "image" ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-[var(--primary)]" />
                          </div>
                        )}
                      </button>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {att.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {formatSize(att.size)} •{" "}
                          {att.type === "image" ? "Hình ảnh" : "PDF"}
                        </p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (att.type === "image") {
                              onOpenLightbox(liveAttachments, idx);
                              onClose();
                            } else {
                              window.open(att.url, "_blank");
                            }
                          }}
                          className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
                          title="Xem"
                        >
                          <Eye className="w-4 h-4 text-[var(--text-tertiary)]" />
                        </button>
                        <button
                          onClick={() => removeExistingAttachment(att.id)}
                          className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--danger-light)] transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="w-4 h-4 text-[var(--text-tertiary)]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {liveAttachments.length === 0 && uploadQueue.length === 0 && (
              <div className="px-4 pb-4 text-center py-4">
                <p className="text-sm text-[var(--text-tertiary)]">
                  Chưa có đính kèm nào
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
              <Cloud className="w-3 h-3" /> {liveAttachments.length} tệp đám mây
            </span>
            <button
              onClick={() => {
                onNavigateToDetail(txnId);
                onClose();
              }}
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Xem chi tiết giao dịch
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="bg-[var(--card)] w-full max-w-sm mx-4 rounded-[var(--radius-xl)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Đính kèm đám mây là PRO
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Nâng cấp lên PRO để lưu trữ hoá đơn và chứng từ trên đám mây,
                đồng bộ trên mọi thiết bị.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
                >
                  Để sau
                </button>
                <button
                  onClick={() => {
                    setIsPro(true);
                    setShowUpgradeModal(false);
                    toast.success("Đã nâng cấp lên PRO!");
                  }}
                  className="flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  Nâng cấp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

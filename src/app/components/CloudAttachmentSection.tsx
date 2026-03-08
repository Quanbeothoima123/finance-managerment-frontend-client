import React, { useState, useRef } from 'react';
import { Paperclip, Plus, X, Lock, Image, FileText, Loader2, ExternalLink, Download, Crown, Cloud } from 'lucide-react';
import { useDemoData, type CloudAttachment } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';

const MAX_FILES = 10;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface Props {
  attachments: CloudAttachment[];
  onChange: (attachments: CloudAttachment[]) => void;
}

export function CloudAttachmentSection({ attachments, onChange }: Props) {
  const { isPro, setIsPro } = useDemoData();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (attachments.length >= MAX_FILES) {
      toast.error('Tài khoản Pro chỉ hỗ trợ tối đa 10 tệp.');
      return;
    }

    const file = files[0];

    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`Tệp "${file.name}" vượt quá 10MB.`);
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      toast.error('Chỉ hỗ trợ hình ảnh và PDF.');
      return;
    }

    // Simulate cloud upload
    setUploading(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        const newAttachment: CloudAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          type: isImage ? 'image' : 'pdf',
          size: file.size,
          url: reader.result as string,
          publicId: `demo/${Date.now()}`,
          uploadedAt: new Date().toISOString(),
        };
        onChange([...attachments, newAttachment]);
        setUploading(null);
        toast.success('Đã tải tệp lên đám mây thành công.');
      }, 1500);
    };
    reader.onerror = () => {
      setUploading(null);
      toast.error('Lỗi tải lên máy chủ. Thử lại sau.');
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (id: string) => {
    onChange(attachments.filter(a => a.id !== id));
    toast.info('Đã xóa tệp khỏi đám mây.');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Free user: show locked card
  if (!isPro) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            Đính kèm
          </label>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            <Crown className="w-3 h-3" /> PRO
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowUpgradeModal(true)}
          className="w-full p-4 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] bg-[var(--surface)] hover:border-amber-400 transition-colors flex flex-col items-center justify-center gap-2 text-[var(--text-tertiary)]"
        >
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Chưa có đính kèm. Chỉ dành cho tài khoản Pro.</p>
          <p className="text-xs text-amber-600 font-medium">Nhấn để nâng cấp</p>
        </button>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowUpgradeModal(false)}>
            <div className="bg-[var(--card)] w-full max-w-md rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] text-center mb-2">Nâng cấp Pro</h3>
              <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
                Nâng cấp Pro để đính kèm hóa đơn & đồng bộ đám mây. Lưu trữ tối đa 10 tệp mỗi giao dịch.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
                >
                  Để sau
                </button>
                <button
                  onClick={() => {
                    setIsPro(true);
                    setShowUpgradeModal(false);
                    toast.success('Đã kích hoạt tài khoản Pro! (Demo)');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-[var(--radius-lg)] font-medium transition-colors"
                >
                  Xem gói Pro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pro user: full attachment section
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            Đính kèm
          </label>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            <Crown className="w-3 h-3" /> PRO
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {attachments.length}/{MAX_FILES}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
          <Cloud className="w-3.5 h-3.5" />
          Đám mây
        </div>
      </div>

      {/* Existing attachments */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {attachments.map(att => (
            <div
              key={att.id}
              className="relative group rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              {att.type === 'image' ? (
                <button
                  type="button"
                  onClick={() => setLightboxUrl(att.url)}
                  className="w-full aspect-square"
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.open(att.url, '_blank')}
                  className="w-full aspect-square flex flex-col items-center justify-center gap-2 p-3"
                >
                  <FileText className="w-8 h-8 text-[var(--primary)]" />
                  <span className="text-xs text-[var(--text-secondary)] truncate w-full text-center">{att.name}</span>
                </button>
              )}
              {/* Size badge */}
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white">
                {formatSize(att.size)}
              </div>
              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemove(att.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--danger)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Uploading indicator */}
          {uploading && (
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] aspect-square flex flex-col items-center justify-center gap-2 p-3">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              <span className="text-xs text-[var(--text-secondary)] truncate w-full text-center">Đang tải lên...</span>
            </div>
          )}
        </div>
      )}

      {/* Uploading indicator when no attachments yet */}
      {attachments.length === 0 && uploading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] aspect-square flex flex-col items-center justify-center gap-2 p-3">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            <span className="text-xs text-[var(--text-secondary)] truncate w-full text-center">Đang tải lên...</span>
          </div>
        </div>
      )}

      {/* Add button */}
      {attachments.length < MAX_FILES && !uploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Thêm đính kèm
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={e => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
            <div className="absolute top-3 right-3 flex gap-2">
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="Mở trong trình duyệt"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <a
                href={lightboxUrl}
                download
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="Tải về"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => setLightboxUrl(null)}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

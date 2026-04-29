import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ChevronDown,
  Image,
  BarChart3,
  Target,
  HelpCircle,
  FileText,
  Globe,
  Users,
  Lock,
  Eye,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import type { PostType, PostAudience } from "../types/community";
import type { RecapCardData } from "../components/social/FinanceRecapCard";
import { useMyProfile } from "../hooks/useMyProfile";
import { useSocialTopics } from "../hooks/useSocialTopics";
import { communityPostsService } from "../services/communityPostsService";
import { AudienceSelector } from "../components/social/AudienceSelector";
import { TopicChip } from "../components/social/TopicChip";
import { FinanceRecapCard } from "../components/social/FinanceRecapCard";
import { SensitiveInfoBanner } from "../components/social/SensitiveInfoBanner";
import { useToast } from "../contexts/ToastContext";
import { useTranslation } from "react-i18next";

interface UploadedImage {
  url: string;
  publicId: string;
  file?: File;
  previewUrl: string;
}

const TOPIC_OPTIONS = [
  "Tiết kiệm",
  "Budget",
  "Mục tiêu",
  "Chi tiêu gia đình",
  "Sinh viên",
  "Thu nhập phụ",
  "Đầu tư cơ bản",
];

export default function CreatePost() {
  const navigate = useNavigate();
  const { t } = useTranslation("community");
  const { data: myProfile } = useMyProfile();
  const { data: topicsList } = useSocialTopics();
  const toast = useToast();

  const POST_TYPES: { type: PostType; label: string; icon: React.ReactNode }[] =
    [
      {
        type: "article",
        label: t("create_post.post_types.article"),
        icon: <FileText className="w-4 h-4" />,
      },
      {
        type: "photo",
        label: t("create_post.post_types.photo"),
        icon: <Image className="w-4 h-4" />,
      },
      {
        type: "recap",
        label: t("create_post.post_types.recap"),
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        type: "milestone",
        label: t("create_post.post_types.milestone"),
        icon: <Target className="w-4 h-4" />,
      },
      {
        type: "question",
        label: t("create_post.post_types.question"),
        icon: <HelpCircle className="w-4 h-4" />,
      },
    ];

  const audienceConfig: Record<
    PostAudience,
    { label: string; icon: React.ReactNode }
  > = {
    public: {
      label: t("create_post.audience.public"),
      icon: <Globe className="w-3.5 h-3.5" />,
    },
    followers: {
      label: t("create_post.audience.followers"),
      icon: <Users className="w-3.5 h-3.5" />,
    },
    private: {
      label: t("create_post.audience.private"),
      icon: <Lock className="w-3.5 h-3.5" />,
    },
  };

  const placeholders: Record<PostType, string> = {
    article: t("create_post.placeholders.article"),
    photo: t("create_post.placeholders.photo"),
    recap: t("create_post.placeholders.recap"),
    milestone: t("create_post.placeholders.milestone"),
    question: t("create_post.placeholders.question"),
  };

  const [postType, setPostType] = useState<PostType>("article");
  const [content, setContent] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [audience, setAudience] = useState<PostAudience>("public");
  const [showAudienceSheet, setShowAudienceSheet] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [attachedRecap, setAttachedRecap] = useState<RecapCardData | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPost = content.trim().length > 0 || images.length > 0;
  const isDraft = audience === "private";

  const topicOptions = topicsList || [];

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId],
    );
  };

  const handlePickImages = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 5 - images.length;
    if (remaining <= 0) {
      toast.error(t("create_post.image_upload.max_error"));
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const result = await communityPostsService.uploadImages(selected);
      if (result?.images) {
        const newImages: UploadedImage[] = result.images.map((img, i) => ({
          url: img.url,
          publicId: img.publicId,
          previewUrl: URL.createObjectURL(selected[i]),
        }));
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch {
      toast.error(t("create_post.image_upload.upload_failed"));
    } finally {
      setUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePost = async () => {
    if (!canPost || submitting) return;
    setSubmitting(true);
    try {
      await communityPostsService.createPost({
        type: postType,
        content: content.trim() || " ",
        audience,
        isDraft,
        topicIds: selectedTopicIds,
        mediaUrls: images.map((img) => img.url),
        ...(attachedRecap
          ? {
              recapData: {
                recapType: attachedRecap.recapType,
                title: attachedRecap.title,
                period: attachedRecap.period || undefined,
                color: attachedRecap.color,
                progressPercent: attachedRecap.progressPercent ?? undefined,
                stats: attachedRecap.stats.map((s, i) => ({
                  label: s.label,
                  value: s.value,
                  trend: s.trend ?? undefined,
                  sortOrder: i,
                })),
              },
            }
          : {}),
      });
      toast.success(
        isDraft
          ? t("create_post.toast.draft_saved")
          : t("create_post.toast.posted"),
      );
      navigate("/community");
    } catch {
      toast.error(t("create_post.toast.post_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await communityPostsService.createPost({
        type: postType,
        content: content.trim(),
        audience: "private",
        isDraft: true,
        topicIds: selectedTopicIds,
      });
      toast.info(t("create_post.toast.draft_save_info"));
      navigate("/community");
    } catch {
      toast.error(t("create_post.toast.draft_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  // Mock attached recap data
  const handleAttachRecap = () => {
    setAttachedRecap({
      recapType: "weekly",
      title: "Recap tuần 11/2026",
      period: "10/03 - 16/03/2026",
      stats: [
        { label: "Thu nhập", value: "***", trend: "up" },
        { label: "Chi tiêu", value: "***", trend: "down" },
        { label: "Tiết kiệm", value: "***", trend: "up" },
      ],
      progressPercent: 72,
      color: "#16A34A",
    });
    toast.success(t("create_post.recap_attach.attach_toast"));
  };

  if (showPreview) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setShowPreview(false)}
              className="text-sm font-medium text-[var(--text-secondary)]"
            >
              {t("create_post.preview.back")}
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">
              {t("create_post.preview.title")}
            </h1>
            <button
              onClick={handlePost}
              disabled={!canPost}
              className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
            >
              {isDraft
                ? t("create_post.save_draft_button")
                : t("create_post.post_button")}
            </button>
          </div>

          <div className="px-4 py-6">
            <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center gap-3">
                <img
                  src={myProfile?.avatarUrl || ""}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">
                    {myProfile?.displayName || myProfile?.username || ""}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {t("create_post.preview.just_now")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        audience === "public"
                          ? "bg-[var(--success-light)] text-[var(--success)]"
                          : audience === "followers"
                            ? "bg-[var(--primary-light)] text-[var(--primary)]"
                            : "bg-[var(--surface)] text-[var(--text-tertiary)]"
                      }`}
                    >
                      {audienceConfig[audience].icon}
                      {audienceConfig[audience].label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                  {content}
                </p>
              </div>
              {images.length > 0 && (
                <div className="px-4 pb-3">
                  <div
                    className={`grid gap-1.5 rounded-xl overflow-hidden ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                  >
                    {images.map((img) => (
                      <img
                        key={img.url}
                        src={img.previewUrl}
                        alt=""
                        className="w-full aspect-square object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              {attachedRecap && (
                <div className="px-4 pb-3">
                  <FinanceRecapCard data={attachedRecap} showPrivacyHint />
                </div>
              )}
              {selectedTopicIds.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {selectedTopicIds.map((tid) => {
                    const t = topicOptions.find((x) => x.id === tid);
                    return (
                      <TopicChip key={tid} label={t?.name || tid} size="sm" />
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] text-center mt-4">
              {t("create_post.preview.footer_hint")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {t("create_post.cancel")}
          </button>
          <h1 className="font-semibold text-[var(--text-primary)]">
            {t("create_post.title")}
          </h1>
          <div className="flex items-center gap-2">
            {canPost && (
              <button
                onClick={() => setShowPreview(true)}
                className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
              >
                <Eye className="w-4.5 h-4.5" />
              </button>
            )}
            <button
              onClick={handlePost}
              disabled={!canPost}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                canPost
                  ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                  : "bg-[var(--surface)] text-[var(--text-tertiary)]"
              }`}
            >
              {isDraft
                ? t("create_post.save_draft_button")
                : t("create_post.post_button")}
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Author Info + Audience */}
          <div className="flex items-center gap-3">
            <img
              src={myProfile?.avatarUrl || ""}
              alt={myProfile?.displayName || ""}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-sm text-[var(--text-primary)]">
                {myProfile?.displayName || myProfile?.username || ""}
              </p>
              <button
                onClick={() => setShowAudienceSheet(true)}
                className={`flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 transition-colors ${
                  audience === "public"
                    ? "bg-[var(--success-light)] text-[var(--success)]"
                    : audience === "followers"
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : "bg-[var(--surface)] text-[var(--text-tertiary)]"
                }`}
              >
                {audienceConfig[audience].icon}
                {audienceConfig[audience].label}
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Post Type Selector */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {POST_TYPES.map((pt) => (
              <button
                key={pt.type}
                onClick={() => setPostType(pt.type)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  postType === pt.type
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
                }`}
              >
                {pt.icon}
                {pt.label}
              </button>
            ))}
          </div>

          {/* Text Area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholders[postType]}
            className="w-full min-h-[180px] bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none outline-none text-sm leading-relaxed"
          />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />

          {/* Image Upload Area */}
          {(postType === "photo" || images.length > 0) && (
            <div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {images.map((img, i) => (
                    <div
                      key={img.url}
                      className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)]"
                    >
                      <img
                        src={img.previewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <button
                      onClick={handlePickImages}
                      disabled={uploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 text-[var(--text-tertiary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-6 h-6" />
                          <span className="text-xs">
                            {t("create_post.image_upload.add_image")}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
              {images.length === 0 && (
                <button
                  onClick={handlePickImages}
                  disabled={uploading}
                  className="w-full p-8 border-2 border-dashed border-[var(--border)] rounded-2xl text-center hover:border-[var(--primary)] transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 mx-auto text-[var(--primary)] animate-spin mb-2" />
                  ) : (
                    <Image className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                  )}
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    {uploading
                      ? t("create_post.image_upload.uploading")
                      : t("create_post.image_upload.choose_image")}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {t("create_post.image_upload.max_hint")}
                  </p>
                </button>
              )}
            </div>
          )}

          {/* Attached Recap Card */}
          {attachedRecap && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {t("create_post.recap_attach.section_label")}
                </p>
                <button
                  onClick={() => navigate("/community/share-recap")}
                  className="text-xs text-[var(--primary)] font-medium"
                >
                  {t("create_post.recap_attach.customize")}
                </button>
              </div>
              <FinanceRecapCard
                data={attachedRecap}
                showPrivacyHint
                onRemove={() => {
                  setAttachedRecap(null);
                  toast.info(t("create_post.recap_attach.detach_toast"));
                }}
              />
            </div>
          )}

          {/* Attach Recap Button */}
          {!attachedRecap &&
            (postType === "recap" || postType === "milestone") && (
              <div className="flex gap-2">
                <button
                  onClick={handleAttachRecap}
                  className="flex-1 p-4 border-2 border-dashed border-[var(--border)] rounded-2xl text-center hover:border-[var(--primary)] transition-colors"
                >
                  <BarChart3 className="w-7 h-7 mx-auto text-[var(--text-tertiary)] mb-1.5" />
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    {postType === "recap"
                      ? t("create_post.recap_attach.attach_recap")
                      : t("create_post.recap_attach.attach_progress")}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    {t("create_post.recap_attach.card_hint")}
                  </p>
                </button>
                <button
                  onClick={() => navigate("/community/share-recap")}
                  className="flex-1 p-4 border-2 border-dashed border-[var(--border)] rounded-2xl text-center hover:border-[var(--primary)] transition-colors"
                >
                  <Target className="w-7 h-7 mx-auto text-[var(--text-tertiary)] mb-1.5" />
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    {t("create_post.recap_attach.customize_recap")}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    {t("create_post.recap_attach.customize_hint")}
                  </p>
                </button>
              </div>
            )}

          {/* Topic Selector */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
              {t("create_post.topics_section")}
            </p>
            <div className="flex flex-wrap gap-2">
              {topicOptions.map((topic) => (
                <TopicChip
                  key={topic.id}
                  label={topic.name}
                  isActive={selectedTopicIds.includes(topic.id)}
                  onClick={() => toggleTopic(topic.id)}
                />
              ))}
            </div>
          </div>

          {/* Safety Hint */}
          <SensitiveInfoBanner />

          {/* Save Draft Button */}
          {canPost && audience !== "private" && (
            <button
              onClick={handleSaveDraft}
              className="w-full py-3 text-sm font-medium text-[var(--text-secondary)] bg-[var(--surface)] rounded-2xl hover:bg-[var(--border)] transition-colors"
            >
              {t("create_post.save_draft_button")}
            </button>
          )}
        </div>

        {/* Audience Bottom Sheet */}
        {showAudienceSheet && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowAudienceSheet(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 bg-[var(--card)] rounded-t-3xl z-50 safe-area-inset-bottom">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
              </div>
              <div className="p-6 pt-4">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  {t("create_post.audience.label")}
                </h3>
                <AudienceSelector
                  value={audience}
                  onChange={(v) => {
                    setAudience(v);
                    setShowAudienceSheet(false);
                  }}
                />
                <button
                  onClick={() => setShowAudienceSheet(false)}
                  className="w-full mt-4 py-3 text-sm font-medium text-[var(--text-secondary)] bg-[var(--surface)] rounded-2xl"
                >
                  {t("create_post.audience.close")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

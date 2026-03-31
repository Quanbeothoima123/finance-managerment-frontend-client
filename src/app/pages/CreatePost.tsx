import React, { useState } from "react";
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

const POST_TYPES: { type: PostType; label: string; icon: React.ReactNode }[] = [
  {
    type: "article",
    label: "Bài viết",
    icon: <FileText className="w-4 h-4" />,
  },
  { type: "photo", label: "Ảnh", icon: <Image className="w-4 h-4" /> },
  { type: "recap", label: "Recap", icon: <BarChart3 className="w-4 h-4" /> },
  { type: "milestone", label: "Cột mốc", icon: <Target className="w-4 h-4" /> },
  {
    type: "question",
    label: "Câu hỏi",
    icon: <HelpCircle className="w-4 h-4" />,
  },
];

const TOPIC_OPTIONS = [
  "Tiết kiệm",
  "Budget",
  "Mục tiêu",
  "Chi tiêu gia đình",
  "Sinh viên",
  "Thu nhập phụ",
  "Đầu tư cơ bản",
];

const audienceConfig: Record<
  PostAudience,
  { label: string; icon: React.ReactNode }
> = {
  public: { label: "Công khai", icon: <Globe className="w-3.5 h-3.5" /> },
  followers: {
    label: "Người theo dõi",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  private: { label: "Riêng tư", icon: <Lock className="w-3.5 h-3.5" /> },
};

const placeholders: Record<PostType, string> = {
  article: "Chia sẻ kinh nghiệm quản lý tài chính của bạn...",
  photo: "Thêm mô tả cho ảnh...",
  recap: "Chia sẻ cảm nghĩ về kết quả tài chính tuần/tháng này...",
  milestone: "Chia sẻ cột mốc tài chính bạn đã đạt được...",
  question: "Bạn muốn hỏi gì về tài chính...",
};

export default function CreatePost() {
  const navigate = useNavigate();
  const { data: myProfile } = useMyProfile();
  const { data: topicsList } = useSocialTopics();
  const toast = useToast();

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

  const canPost = content.trim().length > 0;
  const isDraft = audience === "private";

  const topicOptions = topicsList || [];

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId],
    );
  };

  const handlePost = async () => {
    if (!canPost || submitting) return;
    setSubmitting(true);
    try {
      await communityPostsService.createPost({
        type: postType,
        content: content.trim(),
        audience,
        isDraft,
        topicIds: selectedTopicIds,
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
        isDraft ? "Đã lưu bản nháp!" : "Bài viết đã được đăng thành công!",
      );
      navigate("/community");
    } catch {
      toast.error("Không thể đăng bài viết");
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
      toast.info("Đã lưu bản nháp");
      navigate("/community");
    } catch {
      toast.error("Không thể lưu bản nháp");
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
    toast.success("Đã đính kèm recap tài chính");
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
              ← Chỉnh sửa
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">
              Xem trước
            </h1>
            <button
              onClick={handlePost}
              disabled={!canPost}
              className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
            >
              {isDraft ? "Lưu nháp" : "Đăng"}
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
                      Vừa xong
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
              Đây là cách bài viết sẽ hiển thị trong cộng đồng
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
            Hủy
          </button>
          <h1 className="font-semibold text-[var(--text-primary)]">
            Tạo bài viết
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
              {isDraft ? "Lưu nháp" : "Đăng"}
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

          {/* Attached Recap Card */}
          {attachedRecap && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Recap đính kèm
                </p>
                <button
                  onClick={() => navigate("/community/share-recap")}
                  className="text-xs text-[var(--primary)] font-medium"
                >
                  Tùy chỉnh
                </button>
              </div>
              <FinanceRecapCard
                data={attachedRecap}
                showPrivacyHint
                onRemove={() => {
                  setAttachedRecap(null);
                  toast.info("Đã gỡ recap đính kèm");
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
                      ? "Đính kèm Recap"
                      : "Đính kèm tiến độ"}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Tạo card từ dữ liệu của bạn
                  </p>
                </button>
                <button
                  onClick={() => navigate("/community/share-recap")}
                  className="flex-1 p-4 border-2 border-dashed border-[var(--border)] rounded-2xl text-center hover:border-[var(--primary)] transition-colors"
                >
                  <Target className="w-7 h-7 mx-auto text-[var(--text-tertiary)] mb-1.5" />
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Tùy chỉnh Recap
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Chọn dữ liệu hiển thị
                  </p>
                </button>
              </div>
            )}

          {/* Topic Selector */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
              Chủ đề
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
              Lưu bản nháp
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
                  Ai có thể thấy bài viết này?
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
                  Đóng
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

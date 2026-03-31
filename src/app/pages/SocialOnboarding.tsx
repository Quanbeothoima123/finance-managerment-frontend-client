import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Users, ChevronRight, Sparkles, ShieldCheck } from "lucide-react";
import { useSocialTopics } from "../hooks/useSocialTopics";
import { socialProfilesService } from "../services/socialProfilesService";
import { socialFollowsService } from "../services/socialFollowsService";
import { socialTopicsService } from "../services/socialTopicsService";
import { ProfileRow } from "../components/social/ProfileRow";
import { useToast } from "../contexts/ToastContext";

type Step = "welcome" | "topics" | "people";

export default function SocialOnboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: topicsList } = useSocialTopics();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const topics = topicsList || [];

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId],
    );
  };

  const handleFinish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await socialProfilesService.completeOnboarding({
        topicIds: selectedTopicIds,
      });
      navigate("/community");
    } catch {
      toast.error("Không thể hoàn tất thiết lập");
    } finally {
      setSubmitting(false);
    }
  }, [selectedTopicIds, submitting, navigate, toast]);

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <div className="flex-1 max-w-lg mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-[var(--primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
            Chào mừng đến Cộng đồng!
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs mb-6">
            Chia sẻ hành trình tài chính cá nhân, học hỏi từ cộng đồng và theo
            dõi tiến trình của nhau.
          </p>

          {/* Privacy promise */}
          <div className="w-full bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 mb-8">
            <div className="flex items-center gap-2.5 mb-3">
              <ShieldCheck className="w-5 h-5 text-[var(--success)]" />
              <p className="font-semibold text-sm text-[var(--text-primary)]">
                Cam kết bảo mật
              </p>
            </div>
            <ul className="space-y-2 text-left">
              {[
                "Bạn quyết định chia sẻ gì — mọi bài viết đều có tùy chọn audience",
                "Số liệu tài chính có thể ẩn hoặc chỉ hiển thị phần trăm",
                "Không bao giờ chia sẻ số tài khoản, mật khẩu hay thông tin nhạy cảm",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setStep("topics")}
            className="w-full py-3.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
          >
            Bắt đầu thiết lập <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (step === "topics") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <div className="flex-1 max-w-lg mx-auto px-6 py-12">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            <div className="h-1 flex-1 rounded-full bg-[var(--primary)]" />
            <div className="h-1 flex-1 rounded-full bg-[var(--surface)]" />
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Chọn chủ đề quan tâm
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Chúng tôi sẽ gợi ý nội dung phù hợp với bạn.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicToggle(topic.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedTopicIds.includes(topic.id)
                    ? "border-[var(--primary)] bg-[var(--primary-light)]"
                    : "border-[var(--border)] hover:border-[var(--primary)]"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{
                    backgroundColor: `${topic.color}20`,
                    color: topic.color,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="font-semibold text-sm text-[var(--text-primary)] mb-0.5">
                  #{topic.name}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {topic.postsCount.toLocaleString()} bài viết
                </p>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("people")}
            className="w-full py-3.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
          >
            Tiếp tục <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="w-full py-3 text-sm text-[var(--text-tertiary)] mt-2"
          >
            Bỏ qua
          </button>
        </div>
      </div>
    );
  }

  if (step === "people") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <div className="flex-1 max-w-lg mx-auto px-6 py-12">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            <div className="h-1 flex-1 rounded-full bg-[var(--primary)]" />
            <div className="h-1 flex-1 rounded-full bg-[var(--primary)]" />
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-[var(--success-light)] flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[var(--success)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Theo dõi ai đó
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Gợi ý một số người dùng đang chia sẻ kinh nghiệm tài chính.
            </p>
          </div>

          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] px-4 divide-y divide-[var(--divider)] mb-8">
            <p className="py-4 text-sm text-[var(--text-tertiary)] text-center">
              Bạn sẽ khám phá thêm người dùng sau khi hoàn tất thiết lập.
            </p>
          </div>

          <button
            onClick={handleFinish}
            disabled={submitting}
            className="w-full py-3.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
          >
            Bắt đầu khám phá <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="w-full py-3 text-sm text-[var(--text-tertiary)] mt-2"
          >
            Bỏ qua
          </button>
        </div>
      </div>
    );
  }

  return null;
}

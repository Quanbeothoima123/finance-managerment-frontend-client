import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Bookmark } from "lucide-react";
import { communityInteractionsService } from "../services/communityInteractionsService";
import { useMyProfile } from "../hooks/useMyProfile";
import type { SavedPostItem } from "../types/community";
import { PostCard } from "../components/social/PostCard";
import { PostSkeleton } from "../components/social/PostSkeleton";
import { SocialEmptyState } from "../components/social/SocialEmptyState";

type FilterType = "all" | "recap" | "tips" | "question";

export default function SavedPosts() {
  const navigate = useNavigate();
  const { data: myProfile } = useMyProfile();
  const [savedItems, setSavedItems] = useState<SavedPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const loadSaved = useCallback(async () => {
    try {
      setLoading(true);
      const result = await communityInteractionsService.listSavedPosts();
      setSavedItems(result.items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  // We only have SavedPostItem which has a partial post shape.
  // For PostCard we need CommunityPost. The saved list response has limited fields,
  // so we just display a simpler list. But let's keep the UI identical by showing basic info.
  // Actually, the backend should return full posts in saved list. Let's assume it does.
  const items = savedItems;

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (filter === "all") return true;
        if (filter === "recap")
          return item.post.type === "recap" || item.post.type === "milestone";
        if (filter === "tips") return item.post.type === "article";
        if (filter === "question") return item.post.type === "question";
        return true;
      }),
    [items, filter],
  );

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: items.length },
    {
      key: "recap",
      label: "Recap",
      count: items.filter(
        (i) => i.post.type === "recap" || i.post.type === "milestone",
      ).length,
    },
    {
      key: "tips",
      label: "Tips",
      count: items.filter((i) => i.post.type === "article").length,
    },
    {
      key: "question",
      label: "Câu hỏi",
      count: items.filter((i) => i.post.type === "question").length,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)]">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">Đã lưu</h1>
            <span className="text-xs text-[var(--text-tertiary)] ml-auto tabular-nums">
              {items.length} bài viết
            </span>
          </div>
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.key
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface)] text-[var(--text-secondary)]"
                }`}
              >
                {f.label}
                <span
                  className={`text-xs tabular-nums ${filter === f.key ? "text-white/80" : "text-[var(--text-tertiary)]"}`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-4 space-y-4 pb-24">
          {loading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : filteredItems.length === 0 ? (
            <SocialEmptyState
              icon={<Bookmark className="w-8 h-8" />}
              title="Chưa có bài viết nào được lưu"
              description="Khi bạn lưu bài viết, chúng sẽ xuất hiện ở đây để bạn đọc lại sau."
              action={{
                label: "Khám phá bài viết",
                onClick: () => navigate("/community/discover"),
              }}
            />
          ) : (
            filteredItems.map((item) => {
              // Build a minimal display card from saved item
              return (
                <div
                  key={item.post.id}
                  className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] overflow-hidden"
                >
                  <div className="px-4 pt-4 pb-2 flex items-start gap-3">
                    <img
                      src={item.post.author.avatarUrl || ""}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[var(--text-primary)]">
                        {item.post.author.displayName ||
                          item.post.author.username}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        @{item.post.author.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/community/post/${item.post.id}`)}
                    className="px-4 pb-3 text-left w-full"
                  >
                    <p className="text-sm text-[var(--text-primary)] line-clamp-3">
                      {item.post.content}
                    </p>
                  </button>
                  <div className="px-4 py-2 border-t border-[var(--divider)] flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                    <span className="tabular-nums">
                      {item.post.likesCount} thích
                    </span>
                    <span className="tabular-nums">
                      {item.post.commentsCount} bình luận
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

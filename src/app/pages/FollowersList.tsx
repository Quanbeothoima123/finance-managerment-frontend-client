import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Search, Users, UserPlus } from "lucide-react";
import { usePublicProfile } from "../hooks/usePublicProfile";
import { useMyProfile } from "../hooks/useMyProfile";
import { socialFollowsService } from "../services/socialFollowsService";
import type { FollowerItem, FollowingItem } from "../types/community";
import { ProfileRow } from "../components/social/ProfileRow";
import { SocialEmptyState } from "../components/social/SocialEmptyState";
import { useTranslation } from "react-i18next";

type Tab = "followers" | "following";

export default function FollowersList() {
  const navigate = useNavigate();
  const { t } = useTranslation("community");
  const { id } = useParams<{ id: string }>();
  const { data: profile } = usePublicProfile(id);
  const { data: myProfile } = useMyProfile();
  const [activeTab, setActiveTab] = useState<Tab>(
    window.location.pathname.endsWith("following") ? "following" : "followers",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [followers, setFollowers] = useState<FollowerItem[]>([]);
  const [following, setFollowing] = useState<FollowingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingState, setFollowingState] = useState<Record<string, boolean>>(
    {},
  );

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [fRes, gRes] = await Promise.all([
        socialFollowsService.listFollowers(id),
        socialFollowsService.listFollowing(id),
      ]);
      setFollowers(fRes.items as FollowerItem[]);
      setFollowing(gRes.items as FollowingItem[]);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isMe = myProfile && profile ? profile.id === myProfile.id : false;

  const currentList =
    activeTab === "followers"
      ? followers.map((f) => f.profile)
      : following.map((f) => f.profile);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase();
    return currentList.filter(
      (u) =>
        (u.displayName || "").toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    );
  }, [currentList, searchQuery]);

  if (!profile) return null;

  const handleFollow = async (targetId: string) => {
    const isCurrentlyFollowing = followingState[targetId] ?? false;
    setFollowingState((prev) => ({
      ...prev,
      [targetId]: !isCurrentlyFollowing,
    }));
    try {
      if (isCurrentlyFollowing) await socialFollowsService.unfollow(targetId);
      else await socialFollowsService.follow(targetId);
    } catch {
      setFollowingState((prev) => ({
        ...prev,
        [targetId]: isCurrentlyFollowing,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)]">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">
              {profile.displayName || profile.username}
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab("followers")}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "followers"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-tertiary)]"
              }`}
            >
              <span className="tabular-nums">
                {profile.followersCount.toLocaleString()}
              </span>{" "}
              {t("followers_list.tabs.followers")}
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "following"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-tertiary)]"
              }`}
            >
              <span className="tabular-nums">{profile.followingCount}</span>{" "}
              {t("followers_list.tabs.following")}
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder={t("followers_list.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="px-4 pb-24">
          {filtered.length > 0 ? (
            <div className="divide-y divide-[var(--divider)]">
              {filtered.map((u) => (
                <ProfileRow
                  key={u.id}
                  user={u}
                  isFollowing={followingState[u.id] ?? false}
                  isMe={myProfile?.id === u.id}
                  onClick={() => navigate(`/community/profile/${u.id}`)}
                  onFollow={() => handleFollow(u.id)}
                />
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-tertiary)]">
                Không tìm thấy kết quả cho "{searchQuery}"
              </p>
            </div>
          ) : (
            <SocialEmptyState
              icon={
                activeTab === "followers" ? (
                  <Users className="w-8 h-8" />
                ) : (
                  <UserPlus className="w-8 h-8" />
                )
              }
              title={
                activeTab === "followers"
                  ? isMe
                    ? t("followers_list.empty.no_followers_title")
                    : `${profile.displayName || profile.username} chưa có người theo dõi`
                  : isMe
                    ? t("followers_list.empty.no_following_title")
                    : `${profile.displayName || profile.username} chưa theo dõi ai`
              }
              description={
                activeTab === "followers"
                  ? t("followers_list.empty.no_followers_description")
                  : t("followers_list.empty.no_following_description")
              }
              action={
                isMe
                  ? {
                      label: t("followers_list.empty.discover_action"),
                      onClick: () => navigate("/community/discover"),
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

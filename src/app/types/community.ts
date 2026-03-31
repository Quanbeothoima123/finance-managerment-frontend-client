// ─── Enums / Literals ────────────────────────────────────────
export type PostType = "article" | "photo" | "recap" | "milestone" | "question";

export type PostAudience = "public" | "followers" | "private";

export type RecapType = "weekly" | "monthly" | "goal" | "budget";

export type SocialBadge = "verified" | "expert" | "mentor";

export type NotificationType =
  | "like"
  | "comment"
  | "reply"
  | "follow"
  | "mention";

export type ReportReason =
  | "spam"
  | "inappropriate"
  | "misleading"
  | "harassment"
  | "other";

// ─── Nested / Shared ────────────────────────────────────────

export interface PostAuthor {
  id: string;
  username: string;
  badge: SocialBadge | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface PostMediaItem {
  id: string;
  url: string;
  publicId: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  sortOrder: number;
}

export interface PostTopicRef {
  id: string;
  name: string;
  color: string;
}

export interface RecapStat {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral" | null;
  sortOrder: number;
}

export interface PostRecapData {
  id: string;
  recapType: RecapType;
  title: string;
  period: string | null;
  color: string;
  progressPercent: number | null;
  showExactAmounts: boolean;
  hideSensitiveCategories: boolean;
  stats: RecapStat[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Post ────────────────────────────────────────────────────

export interface CommunityPost {
  id: string;
  authorId: string;
  type: PostType;
  content: string;
  audience: PostAudience;
  isDraft: boolean;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  score: number;
  publishedAt: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  media: PostMediaItem[];
  topics: PostTopicRef[];
  recapData: PostRecapData | null;
  isLiked: boolean;
  isSaved: boolean;
}

export interface FeedResponse {
  items: CommunityPost[];
  pagination: Pagination;
}

export interface FeedQuery {
  tab?: "for-you" | "following";
  topicId?: string;
  page?: number;
  limit?: number;
}

export interface DraftsQuery {
  page?: number;
  limit?: number;
}

export interface UserPostsQuery {
  page?: number;
  limit?: number;
}

export interface CreatePostPayload {
  type: PostType;
  content: string;
  audience?: PostAudience;
  isDraft?: boolean;
  topicIds?: string[];
  mediaUrls?: string[];
  recapData?: {
    recapType: RecapType;
    title: string;
    period?: string;
    color: string;
    progressPercent?: number;
    showExactAmounts?: boolean;
    hideSensitiveCategories?: boolean;
    stats?: {
      label: string;
      value: string;
      trend?: "up" | "down" | "neutral";
      sortOrder?: number;
    }[];
  };
}

export interface UpdatePostPayload {
  content?: string;
  audience?: PostAudience;
  isDraft?: boolean;
  topicIds?: string[];
}

// ─── Comment ─────────────────────────────────────────────────

export interface PostComment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string | null;
  likesCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  isLiked: boolean;
  replies?: PostComment[];
  repliesCount?: number;
}

export interface CommentsListResponse {
  items: PostComment[];
  pagination: Pagination;
}

export interface CommentsListQuery {
  postId: string;
  page?: number;
  limit?: number;
}

export interface CreateCommentPayload {
  postId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentPayload {
  content: string;
}

// ─── Interactions ────────────────────────────────────────────

export interface SavedPostItem {
  savedAt: string;
  post: {
    id: string;
    type: PostType;
    content: string;
    likesCount: number;
    commentsCount: number;
    savesCount: number;
    publishedAt: string | null;
    author: PostAuthor;
  };
}

export interface SavedPostsResponse {
  items: SavedPostItem[];
  pagination: Pagination;
}

export interface ReportPostPayload {
  reason: ReportReason;
  detail?: string;
}

// ─── Social Profile ──────────────────────────────────────────

export interface SocialProfile {
  id: string;
  userId: string;
  username: string;
  bio: string | null;
  badge: SocialBadge | null;
  isPublic: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  onboardingDoneAt: string | null;
  createdAt: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface UpdateProfilePayload {
  username?: string;
  bio?: string;
  isPublic?: boolean;
}

export interface OnboardingPayload {
  topicIds: string[];
}

// ─── Follows ─────────────────────────────────────────────────

export interface FollowProfile {
  id: string;
  username: string;
  badge: SocialBadge | null;
  bio: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface FollowerItem {
  profile: FollowProfile;
  followedAt: string;
}

export interface FollowingItem {
  profile: FollowProfile;
  followedAt: string;
}

export interface FollowListResponse {
  items: FollowerItem[] | FollowingItem[];
  pagination: Pagination;
}

export interface FollowListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Topics ──────────────────────────────────────────────────

export interface SocialTopic {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  postsCount: number;
  followersCount: number;
  isFollowed: boolean;
}

// ─── Notifications ───────────────────────────────────────────

export interface SocialNotification {
  id: string;
  type: NotificationType;
  postId: string | null;
  commentId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  actor: PostAuthor;
}

export interface NotificationsListResponse {
  items: SocialNotification[];
  pagination: Pagination;
}

export interface NotificationsListQuery {
  page?: number;
  limit?: number;
}

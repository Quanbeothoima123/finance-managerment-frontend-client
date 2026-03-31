import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────
export type PostType = 'article' | 'photo' | 'recap' | 'milestone' | 'question';
export type Audience = 'public' | 'followers' | 'private';
export type RecapType = 'weekly' | 'monthly' | 'goal' | 'budget';

export interface SocialUser {
  id: string;
  displayName: string;
  username: string;
  avatar: string;
  bio: string;
  badge?: 'verified' | 'expert' | 'mentor';
  topicTags: string[];
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface FinanceRecapData {
  type: RecapType;
  title: string;
  period?: string;
  stats: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[];
  progress?: number;
  color: string;
}

export interface PostComment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replies?: PostComment[];
}

export interface SocialPost {
  id: string;
  authorId: string;
  type: PostType;
  content: string;
  media?: string[];
  recapData?: FinanceRecapData;
  topics: string[];
  audience: Audience;
  likes: number;
  comments: PostComment[];
  commentsCount: number;
  saves: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  isDraft?: boolean;
}

export interface SocialNotification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'challenge';
  userId: string;
  postId?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface TopicInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  postsCount: number;
  followersCount: number;
  isFollowing: boolean;
  color: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  participantsCount: number;
  color: string;
  icon: string;
}

// ─── Mock Data ───────────────────────────────────────────────
const AVATARS = {
  minhbudget: 'https://images.unsplash.com/photo-1603954698693-b0bcbceb5ad0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwbWFuJTIwY2FzdWFsJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzczNzE1MDUyfDA&ixlib=rb-4.1.0&q=80&w=400',
  linhsaving: 'https://images.unsplash.com/photo-1758600587839-56ba05596c69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwd29tYW4lMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM2Nzk0NzN8MA&ixlib=rb-4.1.0&q=80&w=400',
  anfinance: 'https://images.unsplash.com/photo-1697667409270-8d6dfdc9f09a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG1hbiUyMGdsYXNzZXMlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM3Mzc5NjV8MA&ixlib=rb-4.1.0&q=80&w=400',
  thuytien: 'https://images.unsplash.com/photo-1728226773012-19303e779077?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwd29tYW4lMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzczNjc5NTk2fDA&ixlib=rb-4.1.0&q=80&w=400',
  ducpham: 'https://images.unsplash.com/photo-1647934786533-f3c15896410b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG1hbGUlMjBzdHVkZW50JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzczNzMzMDA2fDA&ixlib=rb-4.1.0&q=80&w=400',
  myprofile: 'https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHdvbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzczNzA1OTM0fDA&ixlib=rb-4.1.0&q=80&w=400',
};

const initialUsers: SocialUser[] = [
  {
    id: 'user-me',
    displayName: 'Hoa Nguyễn',
    username: 'hoa.budget',
    avatar: AVATARS.myprofile,
    bio: 'Yêu thích quản lý tài chính cá nhân. Chia sẻ hành trình tiết kiệm mua nhà.',
    badge: undefined,
    topicTags: ['Tiết kiệm', 'Budget', 'Mục tiêu'],
    postsCount: 12,
    followersCount: 48,
    followingCount: 35,
    isFollowing: false,
  },
  {
    id: 'user-1',
    displayName: 'Minh Trần',
    username: 'minhbudget',
    avatar: AVATARS.minhbudget,
    bio: 'Chia sẻ kinh nghiệm quản lý tài chính cho người mới bắt đầu. 3 năm kinh nghiệm budgeting.',
    badge: 'verified',
    topicTags: ['Budget', 'Tiết kiệm', 'Đầu tư cơ bản'],
    postsCount: 156,
    followersCount: 2340,
    followingCount: 120,
    isFollowing: true,
  },
  {
    id: 'user-2',
    displayName: 'Linh Phạm',
    username: 'linh.saving',
    avatar: AVATARS.linhsaving,
    bio: 'Sinh viên năm 4. Hành trình tiết kiệm từ 0 đồng.',
    badge: 'mentor',
    topicTags: ['Sinh viên', 'Tiết kiệm', 'Chi tiêu gia đình'],
    postsCount: 89,
    followersCount: 1250,
    followingCount: 85,
    isFollowing: false,
  },
  {
    id: 'user-3',
    displayName: 'An Lê',
    username: 'an.finance',
    avatar: AVATARS.anfinance,
    bio: 'Financial planner. Hướng dẫn quản lý tiền cho gia đình trẻ.',
    badge: 'expert',
    topicTags: ['Chi tiêu gia đình', 'Đầu tư cơ bản', 'Budget'],
    postsCount: 234,
    followersCount: 5100,
    followingCount: 42,
    isFollowing: true,
  },
  {
    id: 'user-4',
    displayName: 'Thúy Tiên',
    username: 'thuy.tien',
    avatar: AVATARS.thuytien,
    bio: 'Freelancer. Chia sẻ cách quản lý thu nhập không ổn định.',
    badge: undefined,
    topicTags: ['Thu nhập phụ', 'Tiết kiệm', 'Mục tiêu'],
    postsCount: 45,
    followersCount: 680,
    followingCount: 150,
    isFollowing: false,
  },
  {
    id: 'user-5',
    displayName: 'Đức Phạm',
    username: 'duc.student',
    avatar: AVATARS.ducpham,
    bio: 'Sinh viên CNTT. Tìm hiểu về tài chính cá nhân từ sớm.',
    badge: undefined,
    topicTags: ['Sinh viên', 'Tiết kiệm', 'Đầu tư cơ bản'],
    postsCount: 23,
    followersCount: 320,
    followingCount: 95,
    isFollowing: false,
  },
];

const initialPosts: SocialPost[] = [
  {
    id: 'post-1',
    authorId: 'user-1',
    type: 'article',
    content: 'Tháng này mình giữ được chi tiêu ăn ngoài dưới 2 triệu. Bí quyết là meal prep vào Chủ nhật và mang cơm đi làm. Ai có mẹo gì thêm không?',
    topics: ['Tiết kiệm', 'Budget'],
    audience: 'public',
    likes: 124,
    comments: [
      {
        id: 'cmt-1',
        userId: 'user-2',
        content: 'Hay quá! Mình cũng đang tập meal prep. Bạn có thể chia sẻ thực đơn không?',
        createdAt: '2026-03-16T10:30:00',
        likes: 8,
        isLiked: false,
        replies: [
          {
            id: 'cmt-1-1',
            userId: 'user-1',
            content: 'Mình thường nấu 3 món chính + 2 món rau cho cả tuần. Tuần sau mình sẽ post chi tiết nhé!',
            createdAt: '2026-03-16T11:00:00',
            likes: 3,
            isLiked: false,
          }
        ],
      },
      {
        id: 'cmt-1a',
        userId: 'user-4',
        content: 'Mình thì dùng app ghi lại công thức và lên thực đơn theo tuần, tiết kiệm cả thời gian lẫn tiền!',
        createdAt: '2026-03-16T14:00:00',
        likes: 5,
        isLiked: false,
      },
    ],
    commentsCount: 18,
    saves: 45,
    shares: 12,
    isLiked: true,
    isSaved: false,
    createdAt: '2026-03-16T08:00:00',
  },
  {
    id: 'post-2',
    authorId: 'user-2',
    type: 'recap',
    content: 'Tuần này mình tiết kiệm thêm 500.000đ cho quỹ khẩn cấp. Mục tiêu 10 triệu đã đạt 65%!',
    recapData: {
      type: 'weekly',
      title: 'Recap tuần 11/2026',
      period: '10/03 - 16/03/2026',
      stats: [
        { label: 'Thu nhập', value: '8.500.000đ', trend: 'up' },
        { label: 'Chi tiêu', value: '5.200.000đ', trend: 'down' },
        { label: 'Tiết kiệm', value: '3.300.000đ', trend: 'up' },
      ],
      progress: 65,
      color: '#16A34A',
    },
    topics: ['Tiết kiệm', 'Mục tiêu'],
    audience: 'public',
    likes: 89,
    comments: [],
    commentsCount: 7,
    saves: 32,
    shares: 8,
    isLiked: false,
    isSaved: true,
    createdAt: '2026-03-15T18:00:00',
  },
  {
    id: 'post-3',
    authorId: 'user-3',
    type: 'question',
    content: 'Có ai có mẹo kiểm soát chi tiêu mua sắm không? Mình thường bị "impulse buying" khi lướt Shopee. Đã thử xóa app nhưng vẫn quay lại.',
    topics: ['Budget', 'Chi tiêu gia đình'],
    audience: 'public',
    likes: 67,
    comments: [
      {
        id: 'cmt-2',
        userId: 'user-4',
        content: 'Mình áp dụng quy tắc 72 giờ: khi muốn mua gì, đợi 72 giờ rồi quyết định. 80% trường hợp mình không mua nữa!',
        createdAt: '2026-03-15T14:00:00',
        likes: 23,
        isLiked: true,
      },
    ],
    commentsCount: 24,
    saves: 56,
    shares: 15,
    isLiked: false,
    isSaved: false,
    createdAt: '2026-03-15T12:00:00',
  },
  {
    id: 'post-4',
    authorId: 'user-4',
    type: 'milestone',
    content: 'Mình vừa hoàn thành 40% mục tiêu mua laptop! Còn 6 tháng nữa là đủ. Cảm ơn cộng đồng đã truyền cảm hứng!',
    recapData: {
      type: 'goal',
      title: 'Mục tiêu: Mua MacBook Air',
      stats: [
        { label: 'Đã tiết kiệm', value: '12.000.000đ' },
        { label: 'Mục tiêu', value: '30.000.000đ' },
        { label: 'Còn lại', value: '18.000.000đ' },
      ],
      progress: 40,
      color: '#0066FF',
    },
    topics: ['Mục tiêu', 'Tiết kiệm'],
    audience: 'public',
    likes: 156,
    comments: [],
    commentsCount: 12,
    saves: 28,
    shares: 5,
    isLiked: true,
    isSaved: false,
    createdAt: '2026-03-14T20:00:00',
  },
  {
    id: 'post-5',
    authorId: 'user-5',
    type: 'article',
    content: 'Là sinh viên, mình chia thu nhập thành 3 phần: 50% chi phí bắt buộc, 30% cá nhân, 20% tiết kiệm. Tháng nào cũng giữ được. Chia sẻ cho các bạn sinh viên cùng tham khảo!',
    topics: ['Sinh viên', 'Budget', 'Tiết kiệm'],
    audience: 'public',
    likes: 203,
    comments: [],
    commentsCount: 31,
    saves: 89,
    shares: 24,
    isLiked: false,
    isSaved: true,
    createdAt: '2026-03-14T15:00:00',
  },
  {
    id: 'post-6',
    authorId: 'user-3',
    type: 'recap',
    content: 'Tổng kết tháng 2/2026 của mình. Chi tiêu giảm 15% so với tháng trước, chủ yếu nhờ cắt giảm chi phí ăn ngoài và giải trí.',
    recapData: {
      type: 'monthly',
      title: 'Tổng kết tháng 2/2026',
      period: 'Tháng 02/2026',
      stats: [
        { label: 'Tổng thu', value: '25.000.000đ', trend: 'neutral' },
        { label: 'Tổng chi', value: '18.500.000đ', trend: 'down' },
        { label: 'Tiết kiệm', value: '6.500.000đ', trend: 'up' },
        { label: 'So với T1', value: '-15%', trend: 'down' },
      ],
      color: '#0891B2',
    },
    topics: ['Budget', 'Chi tiêu gia đình'],
    audience: 'followers',
    likes: 95,
    comments: [],
    commentsCount: 8,
    saves: 41,
    shares: 11,
    isLiked: false,
    isSaved: false,
    createdAt: '2026-03-13T09:00:00',
  },
  {
    id: 'post-7',
    authorId: 'user-1',
    type: 'article',
    content: 'Mẹo nhỏ: Mỗi khi nhận lương, mình tự động chuyển 20% vào tài khoản tiết kiệm riêng. "Trả cho bản thân trước" là nguyên tắc quan trọng nhất.',
    topics: ['Tiết kiệm', 'Thu nhập phụ'],
    audience: 'public',
    likes: 312,
    comments: [],
    commentsCount: 42,
    saves: 127,
    shares: 38,
    isLiked: true,
    isSaved: true,
    createdAt: '2026-03-12T07:30:00',
  },
  // ── Followers-only post ──
  {
    id: 'post-8',
    authorId: 'user-1',
    type: 'recap',
    content: 'Chia sẻ chi tiết ngân sách tháng 3 cho nhóm theo dõi. Mình đang thử phương pháp zero-based budgeting.',
    recapData: {
      type: 'budget',
      title: 'Ngân sách tháng 3/2026',
      period: 'Tháng 03/2026',
      stats: [
        { label: 'Ăn uống', value: '3.000.000đ' },
        { label: 'Di chuyển', value: '1.500.000đ' },
        { label: 'Giải trí', value: '1.000.000đ' },
      ],
      progress: 35,
      color: '#EA580C',
    },
    topics: ['Budget'],
    audience: 'followers',
    likes: 45,
    comments: [],
    commentsCount: 3,
    saves: 12,
    shares: 0,
    isLiked: false,
    isSaved: false,
    createdAt: '2026-03-17T06:00:00',
  },
  // ── Private/draft post ──
  {
    id: 'post-9',
    authorId: 'user-me',
    type: 'article',
    content: 'Ghi chú cá nhân: Cần review lại ngân sách Q1 trước khi chia sẻ. Xem lại chi tiêu ăn ngoài tháng 2.',
    topics: ['Budget'],
    audience: 'private',
    isDraft: true,
    likes: 0,
    comments: [],
    commentsCount: 0,
    saves: 0,
    shares: 0,
    isLiked: false,
    isSaved: false,
    createdAt: '2026-03-17T10:00:00',
  },
];

const initialTopics: TopicInfo[] = [
  { id: 'topic-1', name: 'Tiết kiệm', icon: 'piggy-bank', description: 'Chia sẻ mẹo và kinh nghiệm tiết kiệm hiệu quả.', postsCount: 1250, followersCount: 4500, isFollowing: true, color: '#16A34A' },
  { id: 'topic-2', name: 'Budget', icon: 'calculator', description: 'Thảo luận về lập ngân sách và kiểm soát chi tiêu.', postsCount: 980, followersCount: 3200, isFollowing: true, color: '#0066FF' },
  { id: 'topic-3', name: 'Mục tiêu', icon: 'target', description: 'Chia sẻ tiến độ và động viên nhau đạt mục tiêu tài chính.', postsCount: 756, followersCount: 2800, isFollowing: false, color: '#EA580C' },
  { id: 'topic-4', name: 'Chi tiêu gia đình', icon: 'home', description: 'Quản lý tài chính cho gia đình, chi tiêu chung, tiết kiệm cho con cái.', postsCount: 620, followersCount: 2100, isFollowing: false, color: '#DC2626' },
  { id: 'topic-5', name: 'Sinh viên', icon: 'graduation-cap', description: 'Cách quản lý tiền khi là sinh viên, học bổng, làm thêm.', postsCount: 890, followersCount: 3600, isFollowing: false, color: '#8B5CF6' },
  { id: 'topic-6', name: 'Thu nhập phụ', icon: 'briefcase', description: 'Chia sẻ cách tạo thu nhập phụ và quản lý nhiều nguồn thu nhập.', postsCount: 450, followersCount: 1800, isFollowing: false, color: '#0891B2' },
  { id: 'topic-7', name: 'Đầu tư cơ bản', icon: 'trending-up', description: 'Kiến thức cơ bản về đầu tư cho người mới bắt đầu.', postsCount: 340, followersCount: 2400, isFollowing: false, color: '#059669' },
];

const initialChallenges: Challenge[] = [
  { id: 'ch-1', title: 'Tuần không mua sắm', description: 'Thử thách không mua sắm trực tuyến trong 7 ngày', duration: '7 ngày', participantsCount: 1230, color: '#DC2626', icon: 'shopping-cart' },
  { id: 'ch-2', title: '30 ngày tiết kiệm', description: 'Tiết kiệm mỗi ngày một khoản nhỏ, tăng dần theo ngày', duration: '30 ngày', participantsCount: 2456, color: '#16A34A', icon: 'piggy-bank' },
  { id: 'ch-3', title: 'Meal prep master', description: 'Nấu ăn tại nhà trong 2 tuần liên tục', duration: '14 ngày', participantsCount: 890, color: '#EA580C', icon: 'utensils' },
];

const initialNotifications: SocialNotification[] = [
  { id: 'sn-1', type: 'like', userId: 'user-2', postId: 'post-1', message: 'đã thích bài viết của bạn', createdAt: '2026-03-17T09:30:00', isRead: false },
  { id: 'sn-2', type: 'comment', userId: 'user-3', postId: 'post-1', message: 'đã bình luận về bài viết của bạn', createdAt: '2026-03-17T08:15:00', isRead: false },
  { id: 'sn-3', type: 'follow', userId: 'user-5', message: 'đã bắt đầu theo dõi bạn', createdAt: '2026-03-17T07:00:00', isRead: false },
  { id: 'sn-4', type: 'like', userId: 'user-4', postId: 'post-7', message: 'đã thích bài viết của bạn', createdAt: '2026-03-16T22:00:00', isRead: true },
  { id: 'sn-5', type: 'reply', userId: 'user-1', postId: 'post-3', message: 'đã trả lời bình luận của bạn', createdAt: '2026-03-16T18:00:00', isRead: true },
  { id: 'sn-6', type: 'challenge', userId: 'user-1', message: 'Thử thách "30 ngày tiết kiệm" đã bắt đầu!', createdAt: '2026-03-16T06:00:00', isRead: true },
  { id: 'sn-7', type: 'follow', userId: 'user-2', message: 'đã bắt đầu theo dõi bạn', createdAt: '2026-03-15T20:00:00', isRead: true },
  { id: 'sn-8', type: 'comment', userId: 'user-4', postId: 'post-7', message: 'đã bình luận về bài viết của bạn', createdAt: '2026-03-15T14:30:00', isRead: true },
];

// ─── Context ─────────────────────────────────────────────────
interface SocialDataContextType {
  users: SocialUser[];
  posts: SocialPost[];
  topics: TopicInfo[];
  challenges: Challenge[];
  notifications: SocialNotification[];
  currentUser: SocialUser;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
  getUserById: (id: string) => SocialUser | undefined;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (userId: string) => void;
  toggleTopicFollow: (topicId: string) => void;
  addPost: (post: Omit<SocialPost, 'id' | 'likes' | 'comments' | 'commentsCount' | 'saves' | 'shares' | 'isLiked' | 'isSaved' | 'createdAt'>) => void;
  addComment: (postId: string, content: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationsCount: number;
  hidePost: (postId: string) => void;
  reportPost: (postId: string, reason: string) => void;
  blockUser: (userId: string) => void;
  deletePost: (postId: string) => void;
  hiddenPostIds: string[];
  blockedUserIds: string[];
}

const SocialDataContext = createContext<SocialDataContextType | null>(null);

export function useSocialData() {
  const ctx = useContext(SocialDataContext);
  if (!ctx) throw new Error('useSocialData must be used within SocialDataProvider');
  return ctx;
}

export function SocialDataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<SocialUser[]>(initialUsers);
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [topics, setTopics] = useState<TopicInfo[]>(initialTopics);
  const [challenges] = useState<Challenge[]>(initialChallenges);
  const [notifications, setNotifications] = useState<SocialNotification[]>(initialNotifications);
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('social_onboarded') === 'true';
  });

  const currentUser = users.find(u => u.id === 'user-me')!;

  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);

  const toggleLike = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
  }, []);

  const toggleSave = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved, saves: p.isSaved ? p.saves - 1 : p.saves + 1 } : p));
  }, []);

  const toggleFollow = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: !u.isFollowing, followersCount: u.isFollowing ? u.followersCount - 1 : u.followersCount + 1 } : u));
  }, []);

  const toggleTopicFollow = useCallback((topicId: string) => {
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, isFollowing: !t.isFollowing } : t));
  }, []);

  const addPost = useCallback((post: Omit<SocialPost, 'id' | 'likes' | 'comments' | 'commentsCount' | 'saves' | 'shares' | 'isLiked' | 'isSaved' | 'createdAt'>) => {
    const newPost: SocialPost = {
      ...post,
      id: `post-${Date.now()}`,
      likes: 0,
      comments: [],
      commentsCount: 0,
      saves: 0,
      shares: 0,
      isLiked: false,
      isSaved: false,
      createdAt: new Date().toISOString(),
    };
    setPosts(prev => [newPost, ...prev]);
  }, []);

  const addComment = useCallback((postId: string, content: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const newComment: PostComment = {
        id: `cmt-${Date.now()}`,
        userId: 'user-me',
        content,
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
      };
      return { ...p, comments: [...p.comments, newComment], commentsCount: p.commentsCount + 1 };
    }));
  }, []);

  const toggleCommentLike = useCallback((postId: string, commentId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: p.comments.map(c => c.id === commentId ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 } : c),
      };
    }));
  }, []);

  const hidePost = useCallback((postId: string) => {
    setHiddenPostIds(prev => [...prev, postId]);
  }, []);

  const reportPost = useCallback((_postId: string, _reason: string) => {
    // Mock: In production, this would send to backend
  }, []);

  const blockUser = useCallback((userId: string) => {
    setBlockedUserIds(prev => [...prev, userId]);
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const unreadNotificationsCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const handleSetOnboarding = useCallback((v: boolean) => {
    setHasCompletedOnboarding(v);
    localStorage.setItem('social_onboarded', String(v));
  }, []);

  const value = useMemo<SocialDataContextType>(() => ({
    users,
    posts,
    topics,
    challenges,
    notifications,
    currentUser,
    hasCompletedOnboarding,
    setHasCompletedOnboarding: handleSetOnboarding,
    getUserById,
    toggleLike,
    toggleSave,
    toggleFollow,
    toggleTopicFollow,
    addPost,
    addComment,
    toggleCommentLike,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationsCount,
    hidePost,
    reportPost,
    blockUser,
    deletePost,
    hiddenPostIds,
    blockedUserIds,
  }), [users, posts, topics, challenges, notifications, currentUser, hasCompletedOnboarding, handleSetOnboarding, getUserById, toggleLike, toggleSave, toggleFollow, toggleTopicFollow, addPost, addComment, toggleCommentLike, markNotificationRead, markAllNotificationsRead, unreadNotificationsCount, hidePost, reportPost, blockUser, deletePost, hiddenPostIds, blockedUserIds]);

  return (
    <SocialDataContext.Provider value={value}>
      {children}
    </SocialDataContext.Provider>
  );
}
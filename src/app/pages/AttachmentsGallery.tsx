import React, { useState } from "react";
import { X, ChevronRight, Calendar, Filter, Search } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

// Mock attachments data
const mockAttachments = [
  {
    id: "1",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
    date: "2026-02-10",
    amount: 450000,
    transactionId: "t1",
    transactionDescription: "Cơm trưa - Quán Ngon",
    category: "Ăn uống",
    type: "expense",
  },
  {
    id: "2",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1572811165-d03b0e645dc7?w=400",
    date: "2026-02-09",
    amount: 850000,
    transactionId: "t2",
    transactionDescription: "Mua giày thể thao",
    category: "Mua sắm",
    type: "expense",
  },
  {
    id: "3",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
    date: "2026-02-08",
    amount: 125000,
    transactionId: "t3",
    transactionDescription: "Cà phê Highlands",
    category: "Ăn uống",
    type: "expense",
  },
  {
    id: "4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1606166059861-557c93ea2674?w=400",
    date: "2026-02-07",
    amount: 2500000,
    transactionId: "t4",
    transactionDescription: "Tiền điện tháng 2",
    category: "Nhà ở",
    type: "expense",
  },
  {
    id: "5",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=400",
    date: "2026-02-06",
    amount: 680000,
    transactionId: "t5",
    transactionDescription: "Grab - Về nhà",
    category: "Di chuyển",
    type: "expense",
  },
  {
    id: "6",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
    date: "2026-02-05",
    amount: 320000,
    transactionId: "t6",
    transactionDescription: "Đồ ăn trưa",
    category: "Ăn uống",
    type: "expense",
  },
  {
    id: "7",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400",
    date: "2026-02-04",
    amount: 1200000,
    transactionId: "t7",
    transactionDescription: "Mua sách",
    category: "Giải trí",
    type: "expense",
  },
  {
    id: "8",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400",
    date: "2026-02-03",
    amount: 750000,
    transactionId: "t8",
    transactionDescription: "Mua đồ điện tử",
    category: "Mua sắm",
    type: "expense",
  },
];

interface AttachmentDetailPanelProps {
  attachment: (typeof mockAttachments)[0];
  isOpen: boolean;
  onClose: () => void;
}

function AttachmentDetailPanel({
  attachment,
  isOpen,
  onClose,
}: AttachmentDetailPanelProps) {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full bg-[var(--card)] z-50 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } w-full md:w-[600px]`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--divider)]">
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              Chi tiết hoá đơn
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <X className="w-6 h-6 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Image */}
            <div className="rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface)]">
              <img
                src={attachment.thumbnailUrl}
                alt="Receipt"
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Transaction Info */}
            <Card>
              <h4 className="font-semibold text-[var(--text-primary)] mb-4">
                Thông tin giao dịch
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    Mô tả
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {attachment.transactionDescription}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    Số tiền
                  </span>
                  <span className="text-sm font-semibold text-[var(--danger)] tabular-nums">
                    -{formatCurrency(attachment.amount)}₫
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    Danh mục
                  </span>
                  <span className="px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-md)] text-xs font-medium">
                    {attachment.category}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    Ngày
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {formatDate(attachment.date)}
                  </span>
                </div>
              </div>

              <button className="mt-4 w-full flex items-center justify-between px-4 py-3 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] font-medium transition-colors">
                <span>Xem giao dịch</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AttachmentsGallery() {
  const [selectedAttachment, setSelectedAttachment] = useState<
    (typeof mockAttachments)[0] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("2026-02");

  const categories = [
    "all",
    "Ăn uống",
    "Mua sắm",
    "Nhà ở",
    "Di chuyển",
    "Giải trí",
  ];

  const filteredAttachments = mockAttachments.filter((attachment) => {
    const matchesSearch = attachment.transactionDescription
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || attachment.category === selectedCategory;
    const matchesMonth = attachment.date.startsWith(selectedMonth);
    return matchesSearch && matchesCategory && matchesMonth;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Hoá đơn đính kèm
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Quản lý ảnh hoá đơn và chứng từ
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Tổng hoá đơn
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {mockAttachments.length}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Tháng này
            </p>
            <p className="text-2xl font-bold text-[var(--primary)] tabular-nums">
              {filteredAttachments.length}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Tổng chi tiêu
            </p>
            <p className="text-xl font-bold text-[var(--danger)] tabular-nums">
              {formatCurrency(
                filteredAttachments.reduce((sum, a) => sum + a.amount, 0),
              )}
              ₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Dung lượng
            </p>
            <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
              12.4 MB
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm hoá đơn..."
                className="pl-10"
              />
            </div>

            {/* Month & Category Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Tháng
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  <option value="2026-02">Tháng 2, 2026</option>
                  <option value="2026-01">Tháng 1, 2026</option>
                  <option value="2025-12">Tháng 12, 2025</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Danh mục
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categories.slice(1).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Gallery Grid */}
        {filteredAttachments.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAttachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => setSelectedAttachment(attachment)}
                className="group relative aspect-[3/4] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface)] hover:ring-2 hover:ring-[var(--primary)] transition-all"
              >
                {/* Thumbnail */}
                <img
                  src={attachment.thumbnailUrl}
                  alt="Receipt"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                  <p className="text-xs text-white/80 mb-1">
                    {formatDate(attachment.date)}
                  </p>
                  <p className="text-sm font-semibold text-white tabular-nums">
                    {formatCurrency(attachment.amount)}₫
                  </p>
                  <p className="text-xs text-white/70 mt-1 line-clamp-1">
                    {attachment.transactionDescription}
                  </p>
                </div>

                {/* Category Badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-[var(--primary)] text-white rounded-[var(--radius-md)] text-xs font-medium">
                    {attachment.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface)] rounded-full mb-4">
              <Calendar className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              Không tìm thấy hoá đơn
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Thử thay đổi bộ lọc hoặc thêm hoá đơn mới
            </p>
          </Card>
        )}
      </div>

      {/* Detail Panel */}
      {selectedAttachment && (
        <AttachmentDetailPanel
          attachment={selectedAttachment}
          isOpen={!!selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}
    </div>
  );
}

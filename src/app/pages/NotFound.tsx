import React from "react";
import { useNavigate } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/Button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-[var(--text-tertiary)] mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Không tìm thấy trang
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </Button>
          <Button onClick={() => navigate("/home")} variant="secondary">
            <Home className="w-5 h-5" />
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}

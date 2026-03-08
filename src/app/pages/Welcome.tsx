import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { ArrowLeft } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" />
          Trở lại
        </Button>
        <ThemeSwitcher />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary-light)] mb-4">
            <svg
              className="w-8 h-8 text-[var(--primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
            Splash Screen Created!
          </h1>
          
          <p className="text-[var(--text-secondary)] leading-relaxed">
            The responsive Splash screen (A1) has been successfully created with both Light and Dark theme support. 
            The screen features a minimal logo, subtle gradient background, animated loading indicator, and auto-navigation.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              variant="primary"
              onClick={() => navigate('/onboarding/currency-date')}
            >
              Bắt đầu thiết lập
            </Button>
            <Button 
              variant="secondary"
              onClick={() => navigate('/home')}
            >
              Bỏ qua, vào Trang chủ
            </Button>
            <Button 
              variant="secondary"
              onClick={() => navigate('/demo/hub')}
            >
              Demo Hub (QA)
            </Button>
          </div>

          <div className="pt-8 space-y-2">
            <p className="text-sm text-[var(--text-tertiary)]">
              Features implemented:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'Responsive design',
                'Light/Dark themes',
                'Animated logo',
                'Gradient background',
                'Loading indicator',
                'Auto-navigation'
              ].map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1 rounded-full bg-[var(--surface)] text-xs text-[var(--text-secondary)] border border-[var(--border)]"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
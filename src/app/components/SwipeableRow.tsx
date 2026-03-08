import React, { useRef, useState, useCallback } from 'react';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  className?: string;
  actionWidth?: number;
  disabled?: boolean;
}

export function SwipeableRow({
  children,
  actions,
  className = '',
  actionWidth = 72,
  disabled = false,
}: SwipeableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isSwipingRef = useRef(false);
  const isVerticalRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isTouching, setIsTouching] = useState(false);

  const totalActionWidth = actions.length * actionWidth;
  const threshold = totalActionWidth * 0.4;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const touch = e.touches[0];
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      isSwipingRef.current = false;
      isVerticalRef.current = false;
      setIsTouching(true);
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isVerticalRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      // Determine direction on first significant move
      if (!isSwipingRef.current && Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) {
        return;
      }

      if (!isSwipingRef.current) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          isVerticalRef.current = true;
          return;
        }
        isSwipingRef.current = true;
      }

      e.preventDefault();

      let newOffset: number;
      if (isRevealed) {
        newOffset = -totalActionWidth + deltaX;
      } else {
        newOffset = deltaX;
      }

      // Clamp: don't go right past 0, and add resistance past full reveal
      if (newOffset > 0) {
        newOffset = newOffset * 0.2;
      } else if (newOffset < -totalActionWidth) {
        const overshoot = newOffset + totalActionWidth;
        newOffset = -totalActionWidth + overshoot * 0.3;
      }

      currentXRef.current = newOffset;
      setOffset(newOffset);
    },
    [disabled, isRevealed, totalActionWidth]
  );

  const handleTouchEnd = useCallback(() => {
    setIsTouching(false);
    if (disabled || isVerticalRef.current) return;

    if (!isSwipingRef.current) return;

    const finalOffset = currentXRef.current;

    if (isRevealed) {
      // If revealed and swiped right enough, close
      if (finalOffset > -totalActionWidth + threshold) {
        setOffset(0);
        setIsRevealed(false);
      } else {
        setOffset(-totalActionWidth);
        setIsRevealed(true);
      }
    } else {
      // If closed and swiped left enough, reveal
      if (finalOffset < -threshold) {
        setOffset(-totalActionWidth);
        setIsRevealed(true);
      } else {
        setOffset(0);
        setIsRevealed(false);
      }
    }
  }, [disabled, isRevealed, totalActionWidth, threshold]);

  const close = useCallback(() => {
    setOffset(0);
    setIsRevealed(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden md:overflow-visible ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Action buttons (behind the content) */}
      <div className="absolute inset-y-0 right-0 flex md:hidden">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              close();
            }}
            className="flex flex-col items-center justify-center gap-1 transition-colors"
            style={{
              width: actionWidth,
              backgroundColor: action.bgColor,
              color: action.color,
            }}
          >
            {action.icon}
            <span className="text-[10px] font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main content - slides left/right */}
      <div
        className="relative bg-[var(--card)] z-10"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isTouching ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Overlay to close when revealed */}
      {isRevealed && (
        <div
          className="fixed inset-0 z-[5] md:hidden"
          onClick={close}
        />
      )}
    </div>
  );
}

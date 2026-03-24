import React, { useState, useEffect, useRef } from 'react';

interface WindowProps {
  title: string;
  onClose: () => void;
  onFocus: () => void;
  zIndex: number;
  isFocused?: boolean;
  isClosing?: boolean;
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  width?: string;
  height?: string;
  icon?: React.ReactNode;
}

const Window: React.FC<WindowProps> = ({
  title, onClose, onFocus, zIndex, isFocused = false, isClosing = false, children, initialX = 50, initialY = 50, width = 'auto', height = 'auto', icon
}) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile) return; // Disable dragging on mobile
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    onFocus();
    setIsDragging(true);
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMobile) {
        setPos({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMobile]);

  // Mobile: Full-screen styles
  const mobileStyles: React.CSSProperties = isMobile ? {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex: zIndex + 100, // Ensure it's above everything on mobile
  } : {
    left: pos.x,
    top: pos.y,
    zIndex,
    width,
    height,
  };

  return (
    <div
      ref={windowRef}
      className={`flex flex-col bg-[#c0c0c0] font-sans overflow-hidden pointer-events-auto
        ${isMobile ? 'fixed inset-0' : 'absolute'}
        ${isFocused ? 'z-50' : ''}
        ${isClosing ? 'hidden' : ''}
      `}
      style={{
        ...mobileStyles,
        boxShadow: isMobile ? 'none' : 'inset 1px 1px #dfdfdf, inset -1px -1px #000, 1px 1px #000, 2px 2px gray',
        border: '2px solid #dfdfdf',
        borderRightColor: '#404040',
        borderBottomColor: '#404040'
      }}
      onPointerDown={onFocus}
    >
      {/* Title Bar */}
      <div
        className={`px-2 py-1.5 flex items-center justify-between select-none mr-0.5 mt-0.5 ml-0.5
          ${isMobile ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
          ${isFocused ? 'bg-[#000080]' : 'bg-[#808080]'}
        `}
        onPointerDown={handlePointerDown}
      >
        <div className="flex items-center gap-1.5">
          {icon && <div className="w-5 h-5 flex items-center justify-center">{icon}</div>}
          <span className="font-bold text-sm sm:text-base tracking-wide ml-1 text-white font-ms-sans truncate max-w-[50vw] sm:max-w-none">
            {title}
          </span>
        </div>

        {/* Close Button - larger on mobile for touch */}
        <button
          className="w-6 h-6 sm:w-5 sm:h-5 bg-[#c0c0c0] border border-t-white border-l-white border-r-black border-b-black flex items-center justify-center active:border-t-black active:border-l-black active:border-r-white active:border-b-white focus:outline-none"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L11 11M1 11L11 1" stroke="black" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative p-1">
        {children}
      </div>
    </div>
  );
};

export default Window;

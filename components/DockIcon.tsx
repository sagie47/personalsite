import React from 'react';

interface DockIconProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isOpen: boolean;
  color?: string;
}

const DockIcon: React.FC<DockIconProps> = ({ label, icon, onClick, isOpen, color = '#ff1fad' }) => {
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col items-center gap-2 cursor-pointer relative"
    >
      {/* Tooltip */}
      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black border border-[#333] text-xs text-[#e0e0e0] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>

      <div className={`
        w-12 h-12 bg-black/80 backdrop-blur border-2 border-[#333] rounded-lg flex items-center justify-center 
        shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-200 active:scale-95 group-hover:border-[${color}]
        group-hover:shadow-[0_0_10px_${color}40]
        ${isOpen ? `border-b-4 border-b-[${color}]` : 'hover:-translate-y-1'}
      `}>
        <div style={{ color }}>
            {icon}
        </div>
      </div>
      
      {/* Active Indicator */}
      <div className={`w-1 h-1 rounded-full bg-slate-400 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

export default DockIcon;
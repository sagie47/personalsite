import React from 'react';

interface TerminalIconProps {
  onClick: () => void;
  isOpen: boolean;
}

const TerminalIcon: React.FC<TerminalIconProps> = ({ onClick, isOpen }) => {
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col items-center gap-1 cursor-pointer"
    >
      <div className={`
        w-12 h-12 bg-black border-2 border-slate-600 rounded-md flex items-center justify-center 
        shadow-lg transition-transform duration-200 active:scale-95
        ${isOpen ? 'border-b-4 border-b-[#ff1fad]' : 'hover:-translate-y-1'}
      `}>
        <span className="text-[#ff1fad] font-bold text-xl select-none">&gt;_</span>
      </div>
      <div className={`w-1 h-1 rounded-full bg-slate-400 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

export default TerminalIcon;
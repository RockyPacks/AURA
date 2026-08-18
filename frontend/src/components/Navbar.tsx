import React from 'react';
import { AppMode } from '../types';
import { Sparkles, Building2, Shirt, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';

interface NavbarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  isPhase1Approved: boolean;
  onTogglePhase1Approval: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onModeChange,
  isPhase1Approved,
  onTogglePhase1Approval
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 text-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & Identity - Compact on mobile */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div id="brand-logo-container" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-white via-slate-200 to-slate-400 text-black flex items-center justify-center shadow-lg shadow-white/10 ring-1 ring-white/20 font-black text-sm tracking-tighter flex-shrink-0">
            A
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-sans">
                AURA
              </span>
              <span className="hidden sm:inline px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase rounded-full bg-white/10 text-slate-300 border border-white/10">
                Fashion Intelligence
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 font-normal">Invisible Stylist & Wardrobe Memory</p>
          </div>
        </div>

        {/* Mode Switcher - Compact on mobile */}
        <div id="mode-switcher" className="flex items-center p-0.5 sm:p-1 bg-[#121216] rounded-lg sm:rounded-xl border border-white/10 shadow-inner">
          <button
            id="tab-closet-sandbox"
            onClick={() => onModeChange('app_sandbox')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3.5 py-1.5 rounded-md sm:rounded-lg text-xs font-medium transition-all ${
              currentMode === 'app_sandbox'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">AURA</span>
          </button>

          <button
            id="tab-strategy-console"
            onClick={() => onModeChange('strategy')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3.5 py-1.5 rounded-md sm:rounded-lg text-xs font-medium transition-all ${
              currentMode === 'strategy'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Strategy</span>
          </button>
        </div>

        {/* Status Pill - Compact on mobile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            id="phase1-approval-status-btn"
            onClick={onTogglePhase1Approval}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium border transition-all ${
              isPhase1Approved
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            {isPhase1Approved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="hidden sm:inline">Phase 1 Approved</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="hidden sm:inline">Pending CPO Review</span>
                <ChevronRight className="w-3 h-3 text-amber-400 ml-0.5 hidden sm:inline" />
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};

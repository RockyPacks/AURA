import React, { useState } from 'react';
import { AppMode } from './types';
import { Navbar } from './components/Navbar';
import { Phase1ValidationView } from './components/Phase1ValidationView';
import { AuraConsumerApp } from './components/AuraConsumerApp';

export default function App() {
  const [mode, setMode] = useState<AppMode>('app_sandbox');
  const [isPhase1Approved, setIsPhase1Approved] = useState<boolean>(true);

  const togglePhase1Approval = () => {
    setIsPhase1Approved(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-slate-100 selection:bg-white selection:text-black flex flex-col justify-between antialiased">
      <div className="flex-1">
        <Navbar
          currentMode={mode}
          onModeChange={setMode}
          isPhase1Approved={isPhase1Approved}
          onTogglePhase1Approval={togglePhase1Approval}
        />

        <main id="app-main-content">
          {mode === 'strategy' ? (
            <Phase1ValidationView
              isApproved={isPhase1Approved}
              onApprove={() => setIsPhase1Approved(true)}
              onOpenSandbox={() => setMode('app_sandbox')}
            />
          ) : (
            <AuraConsumerApp />
          )}
        </main>
      </div>

      {/* Subtle Footer - Stacks on mobile */}
      <footer id="app-footer" className="border-t border-white/5 py-4 sm:py-6 mt-12 sm:mt-16 bg-[#08080A]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start space-x-2 text-center sm:text-left">
            <span className="font-semibold text-slate-300">AURA</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-slate-400">Personal Fashion Intelligence</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-amber-400/80 font-medium">Apple-Grade Invisible Stylist</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-center">
            <span className="text-[10px] sm:text-[11px]">Johannesburg Sync Active (18°C)</span>
            <button
              onClick={() => setMode(mode === 'app_sandbox' ? 'strategy' : 'app_sandbox')}
              className="text-slate-300 hover:text-white transition-colors underline underline-offset-4 font-medium text-[10px] sm:text-[11px]"
            >
              {mode === 'app_sandbox' ? 'Switch to Strategy' : 'Switch to AURA'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

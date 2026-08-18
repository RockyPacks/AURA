import React, { useState } from 'react';
import { StrategyTab, ADRItem } from '../types';
import { 
  PHASE1_EXECUTIVE_SUMMARY, 
  PHASE1_ADRS, 
  PHASE1_RISK_MATRIX, 
  PHASE1_COMPETITOR_MATRIX 
} from '../data/phase1Data';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  Layers, 
  Scale, 
  DollarSign, 
  Users, 
  Zap, 
  Lock, 
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface Phase1ValidationViewProps {
  isApproved: boolean;
  onApprove: () => void;
  onOpenSandbox: () => void;
}

export const Phase1ValidationView: React.FC<Phase1ValidationViewProps> = ({
  isApproved,
  onApprove,
  onOpenSandbox
}) => {
  const [activeTab, setActiveTab] = useState<StrategyTab>('executive_memo');
  const [selectedAdr, setSelectedAdr] = useState<ADRItem>(PHASE1_ADRS[0]);

  return (
    <div id="phase1-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-100">
      
      {/* Header Banner */}
      <div id="phase1-header-banner" className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/60 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-bold tracking-wider uppercase rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 1 of 25
              </span>
              <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 text-slate-300">
                Business Validation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AURA Strategy Console — Personal Fashion Intelligence
            </h1>
            <p className="mt-1 text-slate-400 text-sm max-w-2xl">
              Co-founder strategic memo, TAM/SAM/SOM market analysis, zero-friction vision thesis, unit economics, risk matrix, and Architecture Decision Records (ADRs).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="header-demo-btn"
              onClick={onOpenSandbox}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Launch AURA Consumer App</span>
            </button>
            <button
              id="header-approve-btn"
              onClick={onApprove}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
                isApproved
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {isApproved ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{isApproved ? 'Phase 1 Approved' : 'Approve Phase 1'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div id="phase1-subnav" className="flex overflow-x-auto space-x-2 pb-2 mb-8 border-b border-slate-800 scrollbar-none">
        <button
          id="tab-memo"
          onClick={() => setActiveTab('executive_memo')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeTab === 'executive_memo'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Executive Thesis</span>
        </button>

        <button
          id="tab-tam"
          onClick={() => setActiveTab('market_tam')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeTab === 'market_tam'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>2. TAM / SAM / SOM</span>
        </button>

        <button
          id="tab-unit-econ"
          onClick={() => setActiveTab('unit_economics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeTab === 'unit_economics'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>3. Unit Economics</span>
        </button>

        <button
          id="tab-risk"
          onClick={() => setActiveTab('risk_matrix')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeTab === 'risk_matrix'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>4. Risk Register</span>
        </button>

        <button
          id="tab-competition"
          onClick={() => setActiveTab('competition')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeTab === 'competition'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>5. Competitive Moat</span>
        </button>

        <button
          id="tab-adrs"
          onClick={() => setActiveTab('adrs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeTab === 'adrs'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>6. ADR Decisions</span>
        </button>

        <button
          id="tab-gate"
          onClick={() => setActiveTab('approval_gate')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeTab === 'approval_gate'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>7. Phase Approval Portal</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. Executive Thesis */}
      {activeTab === 'executive_memo' && (
        <div id="memo-section" className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>YC Partner & Investment Committee Verdict</span>
            </h2>
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-200 text-sm leading-relaxed mb-6">
              {PHASE1_EXECUTIVE_SUMMARY.ycPartnerVerdict}
            </div>
            
            <h3 className="text-base font-semibold text-slate-200 mb-2">The Core Opportunity Thesis</h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              {PHASE1_EXECUTIVE_SUMMARY.coreThesis}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400">Target CAC</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">{PHASE1_EXECUTIVE_SUMMARY.financialMetrics.projectedCac}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">Paid Social + Referral Virality</span>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400">Projected LTV (36 mo)</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{PHASE1_EXECUTIVE_SUMMARY.financialMetrics.projectedLtv}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">Subscription + Affiliate + Resale</span>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400">LTV / CAC Ratio</span>
              <div className="text-2xl font-black text-violet-400 mt-1">{PHASE1_EXECUTIVE_SUMMARY.financialMetrics.ltvCacRatio}</div>
              <span className="text-[11px] text-emerald-400 mt-1 block">Venture Scale Efficiency</span>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400">Payback Period</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{PHASE1_EXECUTIVE_SUMMARY.financialMetrics.paybackPeriod}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">Rapid Capital Recycling</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Market TAM / SAM / SOM */}
      {activeTab === 'market_tam' && (
        <div id="tam-section" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Total Addressable Market (TAM)</div>
              <div className="text-3xl font-black text-white">{PHASE1_EXECUTIVE_SUMMARY.financialMetrics.tam}</div>
              <p className="text-xs text-slate-400 mt-2">{PHASE1_EXECUTIVE_SUMMARY.financialMetrics.tamDescription}</p>
              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                Global consumer expenditure on apparel and footwear. ClosetAI captures transaction intelligence and smart purchase recommendation commissions across this entire ecosystem.
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-900/50 relative overflow-hidden">
              <div className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">Serviceable Addressable Market (SAM)</div>
              <div className="text-3xl font-black text-white">{PHASE1_EXECUTIVE_SUMMARY.financialMetrics.sam}</div>
              <p className="text-xs text-slate-400 mt-2">{PHASE1_EXECUTIVE_SUMMARY.financialMetrics.samDescription}</p>
              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                Total market size for digital styling software, personal styling services, subscription closet utilities, and circular fashion resale platforms.
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-900/50 relative overflow-hidden">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Serviceable Obtainable Market (SOM)</div>
              <div className="text-3xl font-black text-white">{PHASE1_EXECUTIVE_SUMMARY.financialMetrics.som}</div>
              <p className="text-xs text-slate-400 mt-2">{PHASE1_EXECUTIVE_SUMMARY.financialMetrics.somDescription}</p>
              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                Initial 3-year target: 1.5M active paid subscribers across major metropolitan hubs (SF, NY, London, Tokyo, Paris) capturing tech professionals & fashion enthusiasts.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. Unit Economics & Revenue Model */}
      {activeTab === 'unit_economics' && (
        <div id="unit-econ-section" className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Multi-Tier Monetization Architecture</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PHASE1_EXECUTIVE_SUMMARY.revenueStreams.map((stream, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-indigo-400 mb-1">{stream.projection}</div>
                    <h4 className="font-bold text-white text-base mb-2">{stream.name}</h4>
                    <div className="text-sm font-semibold text-slate-300 mb-3">{stream.price}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{stream.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Risk Matrix */}
      {activeTab === 'risk_matrix' && (
        <div id="risk-section" className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Risk Identification & Mitigation Matrix</span>
            </h3>

            <div className="space-y-3">
              {PHASE1_RISK_MATRIX.map((riskItem, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-3">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">{riskItem.category}</span>
                    <span className="text-sm font-semibold text-white">{riskItem.risk}</span>
                  </div>
                  <div className="md:col-span-2 flex space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Impact: {riskItem.impact}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Prob: {riskItem.probability}
                    </span>
                  </div>
                  <div className="md:col-span-7">
                    <span className="text-xs text-slate-300 font-medium block">Mitigation Strategy:</span>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{riskItem.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. Competitive Moat */}
      {activeTab === 'competition' && (
        <div id="competition-section" className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
            <h3 className="text-lg font-bold text-white mb-4">Competitive Analysis & Defensibility Moat</h3>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Ingestion Method</th>
                  <th className="p-3">Friction Level</th>
                  <th className="p-3">AI Intelligence Depth</th>
                  <th className="p-3">ClosetAI Key Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {PHASE1_COMPETITOR_MATRIX.map((comp, idx) => (
                  <tr key={idx} className={comp.name.includes("ClosetAI") ? "bg-indigo-950/40 font-semibold text-white" : ""}>
                    <td className="p-3 font-bold text-white flex items-center space-x-2">
                      {comp.name.includes("ClosetAI") && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                      <span>{comp.name}</span>
                    </td>
                    <td className="p-3 text-slate-300">{comp.ingestion}</td>
                    <td className="p-3">{comp.friction}</td>
                    <td className="p-3 text-slate-400">{comp.aiDepth}</td>
                    <td className="p-3 text-emerald-300 font-medium">{comp.closetAiAdvantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. Architecture Decision Records (ADRs) */}
      {activeTab === 'adrs' && (
        <div id="adrs-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Phase 1 ADR Records</h3>
            {PHASE1_ADRS.map((adr) => (
              <button
                key={adr.id}
                onClick={() => setSelectedAdr(adr)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedAdr.id === adr.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-400">{adr.id}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400">
                    Confidence {adr.confidenceScore}%
                  </span>
                </div>
                <div className="text-xs font-semibold line-clamp-2">{adr.title}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 mb-1">
                <span>{selectedAdr.id}</span>
                <span>•</span>
                <span className="text-emerald-400">{selectedAdr.status}</span>
              </div>
              <h3 className="text-xl font-bold text-white">{selectedAdr.title}</h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-1">Problem Statement:</span>
              <p className="text-sm text-slate-300 leading-relaxed">{selectedAdr.problem}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 block mb-2">Options Considered:</span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {selectedAdr.optionsConsidered.map((opt, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Risk Level</span>
                <span className="font-semibold text-slate-200">{selectedAdr.risk}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Est. Cost</span>
                <span className="font-semibold text-slate-200">{selectedAdr.cost}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Engineering Effort</span>
                <span className="font-semibold text-slate-200">{selectedAdr.effort}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Op Complexity</span>
                <span className="font-semibold text-slate-200">{selectedAdr.operationalComplexity}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
              <span className="text-xs font-bold text-indigo-300 block mb-1">Recommendation & Executive Justification:</span>
              <p className="text-sm font-semibold text-white mb-2">{selectedAdr.recommendation}</p>
              <p className="text-xs text-indigo-200 leading-relaxed">{selectedAdr.why}</p>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 7. Phase Approval Gate */}
      {activeTab === 'approval_gate' && (
        <div id="approval-gate-section" className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white">Phase 1 Sign-Off & Phase 2 Transition Gate</h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              According to project governance guidelines, Phase 1 (Business Validation) must be formally approved before initiating Phase 2 (Product Vision).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Phase 1 Status:</span>
              <span className={`font-bold ${isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isApproved ? 'VERIFIED & APPROVED' : 'PENDING APPROVAL'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Founding Technical Co-Founder Recommendation:</span>
              <span className="text-indigo-400 font-semibold">PROCEED TO PHASE 2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Confidence Score:</span>
              <span className="text-white font-bold">95 / 100</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              id="gate-approve-toggle-btn"
              onClick={onApprove}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
                isApproved
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isApproved ? 'Revoke Approval' : 'Approve Phase 1 Now'}</span>
            </button>

            <button
              id="gate-test-prototype-btn"
              onClick={onOpenSandbox}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30"
            >
              <span>Launch AURA Consumer App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

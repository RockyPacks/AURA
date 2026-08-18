import { ADRItem } from '../types';

export const PHASE1_EXECUTIVE_SUMMARY = {
  title: "Phase 1: Business Validation — AURA Founder Investment Thesis",
  subtitle: "Establishing AURA as the World's First Personal Fashion Intelligence System",
  ycPartnerVerdict: "Strong PASS on traditional closet-tracker apps. Massive BUY on an invisible Personal Fashion Intelligence system that eliminates friction and acts as a continuous style stylist & memory.",
  coreThesis: `Wardrobe apps over the last 10 years (Cladwell, Stylebook, Indyx, Save Your Wardrobe) failed to achieve venture-scale returns because of manual friction: users refuse to spend 8 hours taking flat-lay photos and manually typing metadata for 120+ items. AURA wins by transforming wardrobe ingestion into a single seamless video sweep or multi-photo vision capture, powered by Vision-Language Models (Gemini Flash), zero-shot segmenters, and multi-modal vector embeddings. The wardrobe catalog is merely the initial entry point; the real business is the daily decision layer for fashion (Daily Outfit Stylist, Wardrobe Memory, and High-Affiliate Shopping Intelligence).`,
  
  financialMetrics: {
    tam: "$2.1 Trillion",
    tamDescription: "Global Apparel & Footwear Retail Market",
    sam: "$48 Billion",
    samDescription: "Personal Stylist, Wardrobe Intelligence & AI Fashion Advisory Market",
    som: "$450 Million",
    somDescription: "Tech-forward Gen-Z & Millennial professionals (US, UK, EU, Global Urban markets)",
    projectedLtv: "$288",
    projectedCac: "$32",
    ltvCacRatio: "9.0x",
    paybackPeriod: "3.4 Months"
  },

  revenueStreams: [
    {
      name: "AURA Intelligence Pass (SaaS Subscription)",
      price: "$12.99/mo or $119/year premium tier",
      projection: "65% of Year 2 Net Revenue",
      description: "Unlimited context-aware daily outfit styling, real-time weather & calendar syncing, seamless video sweep ingestion, and infinite style memory."
    },
    {
      name: "Shopping Intelligence & Affiliate Commission",
      price: "10% - 18% net affiliate fee",
      projection: "25% of Year 2 Net Revenue",
      description: "Should I Buy This evaluation: When AURA validates 'This cashmere sweater unlocks 14 new outfits with your existing wardrobe' and user purchases via direct integration."
    },
    {
      name: "Smart Resale & Wardrobe Circulation",
      price: "10% transaction fee",
      projection: "10% of Year 2 Net Revenue",
      description: "Effortless re-circulation for underutilized items ('Item unworn for 90 days. Estimated value $180. Click to auto-list on luxury consignment')."
    }
  ]
};

export const PHASE1_ADRS: ADRItem[] = [
  {
    id: "ADR-001",
    title: "Zero-Friction Vision Pipeline Architecture vs. Manual Categorization",
    problem: "Existing closet apps suffer >85% 30-day dropoff because cataloging 100+ items requires 4-8 hours of manual input.",
    optionsConsidered: [
      "Option A: Manual photo upload with user dropdowns (Status Quo - Low cost, High Friction)",
      "Option B: Single-item photography with classic CNN classifiers (Medium friction)",
      "Option C: Zero-friction continuous video sweep / multi-item image parsing via Gemini VLM + SAM2 (Zero friction, higher compute)"
    ],
    pros: [
      "Eliminates 95% of setup effort (reduces onboarding time from 4 hours to 90 seconds)",
      "Automates color, pattern, brand, fabric, seasonality, and formality extraction in one pass",
      "Creates compounding proprietary dataset of wardrobe embeddings"
    ],
    cons: [
      "Higher API inferencing cost (~$0.02 - $0.05 per item detected)",
      "Requires robust fallback parsing when items overlap in video"
    ],
    risk: "Inference cost at massive scale if users upload 500+ items repeatedly.",
    cost: "~$0.15 onboarding cost per user for initial wardrobe scan (well within $32 target CAC).",
    effort: "3 weeks engineering time for vision ingestion pipeline.",
    operationalComplexity: "Moderate (Async task queue for batch processing).",
    recommendation: "Option C: Mandate Zero-Friction Vision Ingestion using Gemini VLMs + SAM2.",
    why: "Onboarding friction is the single reason 100% of competitors fail to retain users. Solving this creates an insurmountable moat.",
    confidenceScore: 95,
    status: "ACCEPTED"
  },
  {
    id: "ADR-002",
    title: "Initial Tech Architecture: Modular Monolith vs. Serverless Microservices",
    problem: "We have 6 months to MVP with 2 founders, 3 engineers, 1 designer, and a $5,000/mo cloud budget.",
    optionsConsidered: [
      "Option A: Microservices on Kubernetes (EKS/GKE)",
      "Option B: Pure Serverless (AWS Lambda / Vercel Functions)",
      "Option C: Modular Monolith on Cloud Run / Node.js + FastAPI (Shared PostgreSQL + Redis)"
    ],
    pros: [
      "Extreme developer velocity for 3 engineers (single codebase, zero distributed tracing complexity initially)",
      "Simple local development and rapid schema evolution",
      "Substantially lower cloud cost under $5k/mo budget",
      "Easy path to slice out microservices later (e.g., Vision pipeline into FastAPI worker)"
    ],
    cons: [
      "Requires discipline in boundary enforcement between modules"
    ],
    risk: "Coupling modules if boundaries are not strictly defined via Domain Driven Design.",
    cost: "$450/month initial Cloud Run + Supabase/Managed Postgres + Redis hosting.",
    effort: "1 week setup.",
    operationalComplexity: "Low.",
    recommendation: "Option C: Modular Monolith deployed on Cloud Run with FastAPI vision worker.",
    why: "Premature microservice architecture kills early startups via operational overhead. Modular monolith maximizes feature throughput.",
    confidenceScore: 92,
    status: "ACCEPTED"
  },
  {
    id: "ADR-003",
    title: "Context Engine Integration Strategy (Weather + Calendar + Mood + Formality)",
    problem: "How to generate daily outfit recommendations that users actually wear without feeling like robotic suggestions.",
    optionsConsidered: [
      "Option A: Rule-based heuristic matrix (Weather threshold rules)",
      "Option B: Pure LLM prompt generation without vector search",
      "Option C: Hybrid Vector Retrieval (PGVector / Qdrant) + Gemini 2.5 Flash Context Synthesizer"
    ],
    pros: [
      "Sub-200ms recommendation latency",
      "Learns user preferences over time via vector similarity + feedback weights",
      "Adapts dynamically to hyper-local weather (temp, rain, UV) and Google/Outlook calendar events"
    ],
    cons: [
      "Requires weather and calendar API integrations"
    ],
    risk: "Stale recommendations if weather API is slow or offline.",
    cost: "$0.001 per daily outfit recommendation.",
    effort: "2 weeks implementation.",
    operationalComplexity: "Low-medium.",
    recommendation: "Option C: Hybrid Vector Retrieval + Gemini Flash Context Engine.",
    why: "Delivers personalized, weather-appropriate, event-tailored outfits instantly upon waking up.",
    confidenceScore: 90,
    status: "ACCEPTED"
  }
];

export const PHASE1_RISK_MATRIX = [
  {
    category: "User Behavior & Retention",
    risk: "Catalog Abandonment (Users stop logging new clothing purchases)",
    impact: "HIGH",
    probability: "HIGH (Historically across competitors)",
    mitigation: "Zero-Friction Ingestion (batch photo/video scan), Gmail digital receipt parser auto-syncing new online orders, and 'Cost-Per-Wear' gamification."
  },
  {
    category: "Unit Economics",
    risk: "VLM / Multimodal API Costs Escalating with User Scale",
    impact: "MEDIUM",
    probability: "MEDIUM",
    mitigation: "Implement edge visual preprocessing (crop & blur non-clothing), batch item detection into single VLM queries, and cache embedding vectors."
  },
  {
    category: "Technical",
    risk: "Inaccurate Color/Pattern Extraction under Poor Lighting",
    impact: "MEDIUM",
    probability: "HIGH",
    mitigation: "Auto-normalize lighting using canvas shaders; prompt Gemini VLM with color palette anchors and allow quick 1-tap user corrections."
  },
  {
    category: "Market / Competition",
    risk: "E-commerce retailers (SSENSE, Farfetch, Net-a-Porter) building proprietary apps",
    impact: "MEDIUM",
    probability: "LOW",
    mitigation: "Retailers are biased to sell their own inventory. AURA is brand-agnostic and acts as the user's trusted, objective fashion intelligence across all brands and vintage pieces."
  }
];

export const PHASE1_COMPETITOR_MATRIX = [
  {
    name: "Cladwell",
    ingestion: "Manual selection from stock database",
    friction: "High (1-2 hours)",
    aiDepth: "Basic heuristic rules",
    monetization: "$4.99/mo subscription",
    closetAiAdvantage: "10x faster setup via VLM video scan, true AI personalization, context engine"
  },
  {
    name: "Indyx",
    ingestion: "Manual photos + paid digital organizer option ($100+)",
    friction: "High / Expensive",
    aiDepth: "Human digital stylists",
    monetization: "Human styling fees",
    closetAiAdvantage: "Instant zero-cost AI ingestion, 24/7 real-time context styling & continuous memory"
  },
  {
    name: "Save Your Wardrobe",
    ingestion: "Manual photo uploads",
    friction: "High",
    aiDepth: "Low",
    monetization: "B2B repair services",
    closetAiAdvantage: "Consumer-first personal stylist, Smart Shopping cost-per-wear unlock"
  },
  {
    name: "AURA (Our System)",
    ingestion: "Seamless Video Sweep & Vision-Language Photo Scan",
    friction: "Zero (< 30 seconds)",
    aiDepth: "Gemini Vision + Vector Style Memory + Hyper-Local Context Engine",
    monetization: "AURA Pass Subscription + Affiliate Shopping Intelligence + Resale",
    closetAiAdvantage: "Category Creator: Personal Fashion Intelligence with invisible AI and zero manual work"
  }
];

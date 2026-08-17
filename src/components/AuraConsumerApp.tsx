import React, { useState, useEffect } from 'react';
import { 
  WardrobeItem, 
  GeneratedOutfit, 
  SandboxTab, 
  ContextInput, 
  ShoppingAnalysis, 
  ProfileAnalytics, 
  GarmentCategory 
} from '../types';
import { 
  fetchWardrobe, 
  saveWardrobeItem, 
  updateWardrobeItemApi, 
  deleteWardrobeItemApi, 
  analyzeGarmentImageApi, 
  generateOutfitsApi, 
  swapOutfitItemApi, 
  logWearEventApi, 
  analyzeShoppingItemApi, 
  fetchProfileAnalytics 
} from '../services/auraApi';
import { 
  Sparkles, 
  Camera, 
  Upload, 
  Sun, 
  ShoppingBag, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Shirt, 
  Droplets, 
  Check, 
  Layers, 
  Sparkle, 
  Heart, 
  TrendingUp, 
  Clock, 
  Compass, 
  ChevronRight, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowRightLeft, 
  SlidersHorizontal,
  CloudRain,
  CloudSun,
  Wind
} from 'lucide-react';

export const AuraConsumerApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SandboxTab>('home');
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(true);

  // Dynamic Context State
  const [context, setContext] = useState<ContextInput>({
    temperature: '18°C',
    weather: 'Cloudy',
    occasion: 'Work Pitch',
    mood: 'Confident',
    location: 'Johannesburg',
    formalityPreference: 7,
    timeOfDay: 'Morning'
  });
  const [showContextDrawer, setShowContextDrawer] = useState(false);

  // Real Outfit Recommendation state
  const [outfits, setOutfits] = useState<GeneratedOutfit[]>([]);
  const [isGeneratingOutfits, setIsGeneratingOutfits] = useState(false);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [showWornToast, setShowWornToast] = useState(false);
  const [lastWornTitle, setLastWornTitle] = useState('');

  // Item Swapping Modal state
  const [swappingSlot, setSwappingSlot] = useState<{ targetItem: WardrobeItem; outfitIndex: number } | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Selected item modal state & Edit mode
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<WardrobeItem>>({});

  // Scanner & Ingestion Modal state (Multi-image support)
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedQueue, setDetectedQueue] = useState<{ preview: string; data: Partial<WardrobeItem> }[]>([]);
  const [scanStatusText, setScanStatusText] = useState('');

  // Shopping Engine State
  const [shopQuery, setShopQuery] = useState('Acne Studios Oversized Knit Sweater');
  const [shopPrice, setShopPrice] = useState('320');
  const [shopCategory, setShopCategory] = useState<GarmentCategory>('Tops');
  const [shopImagePreview, setShopImagePreview] = useState<string | null>(null);
  const [shoppingAnalysis, setShoppingAnalysis] = useState<ShoppingAnalysis | null>(null);
  const [isAnalyzingShop, setIsAnalyzingShop] = useState(false);

  // Profile Analytics State
  const [profileAnalytics, setProfileAnalytics] = useState<ProfileAnalytics | null>(null);

  // Wardrobe Filter & Search
  const [wardrobeFilter, setWardrobeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Initial Load: Fetch persistent wardrobe & analytics
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoadingWardrobe(true);
    try {
      const items = await fetchWardrobe();
      setWardrobe(items);
      const analytics = await fetchProfileAnalytics();
      setProfileAnalytics(analytics);
      await generateOutfitsForContext(context, items);
    } catch (err) {
      console.error('Error initializing AURA:', err);
    } finally {
      setIsLoadingWardrobe(false);
    }
  };

  // 2. Real Outfit Generation Engine Integration
  const generateOutfitsForContext = async (ctx: ContextInput, currentWardrobe?: WardrobeItem[]) => {
    setIsGeneratingOutfits(true);
    try {
      const generated = await generateOutfitsApi(ctx);
      if (generated.length > 0) {
        setOutfits(generated);
        setCurrentOutfitIndex(0);
      }
    } catch (err) {
      console.error('Failed to generate outfits:', err);
    } finally {
      setIsGeneratingOutfits(false);
    }
  };

  const handleContextChange = (newContext: Partial<ContextInput>) => {
    const updated = { ...context, ...newContext };
    setContext(updated);
    generateOutfitsForContext(updated, wardrobe);
  };

  // 3. Wear Action (Priority 4: AURA Learning Loop)
  const handleWearThis = async () => {
    const activeOutfit = outfits[currentOutfitIndex % outfits.length];
    if (!activeOutfit) return;

    setLastWornTitle(activeOutfit.title);
    setShowWornToast(true);

    try {
      const result = await logWearEventApi(
        activeOutfit.id,
        activeOutfit.title,
        activeOutfit.itemIds,
        context,
        'loved'
      );
      if (result.wardrobe) {
        setWardrobe(result.wardrobe);
      }
      // Refresh profile analytics with real data
      const updatedAnalytics = await fetchProfileAnalytics();
      setProfileAnalytics(updatedAnalytics);
    } catch (err) {
      console.error('Failed to log wear event:', err);
    }

    setTimeout(() => {
      setShowWornToast(false);
    }, 4500);
  };

  // 4. Try Another Look
  const handleNextOption = () => {
    if (outfits.length > 1) {
      setCurrentOutfitIndex(prev => (prev + 1) % outfits.length);
    } else {
      generateOutfitsForContext(context, wardrobe);
    }
  };

  // 5. Garment Ingestion with Multi-Image Support (Priority 2)
  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    setScanStatusText(`Analyzing ${files.length} garment${files.length > 1 ? 's' : ''} with AURA Vision...`);

    const newQueue: { preview: string; data: Partial<WardrobeItem> }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64Data = await readFileAsBase64(file);
        setScanStatusText(`Analyzing item ${i + 1} of ${files.length}...`);
        const result = await analyzeGarmentImageApi(base64Data, file.type);
        const itemData = result?.detectedItems?.[0] || {};
        newQueue.push({
          preview: base64Data,
          data: itemData
        });
      } catch (err) {
        console.warn('Vision parsing failed for file:', file.name, err);
      }
    }

    setDetectedQueue(prev => [...prev, ...newQueue]);
    setIsScanning(false);
    setScanStatusText('');
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const saveDetectedItemToWardrobe = async (index: number) => {
    const target = detectedQueue[index];
    if (!target) return;

    const newItem: WardrobeItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: target.data.name || 'Tailored Garment',
      category: target.data.category || 'Tops',
      subcategory: target.data.subcategory || 'Garment',
      colorPrimary: target.data.colorPrimary || '#1E293B',
      colorSecondary: target.data.colorSecondary,
      pattern: target.data.pattern || 'Solid',
      material: target.data.material || 'Natural Fiber',
      brand: target.data.brand || null,
      formalityScore: target.data.formalityScore || 6,
      seasonality: target.data.seasonality || ['Spring', 'Fall', 'Winter'],
      estimatedValueUSD: target.data.estimatedValueUSD || 150,
      condition: target.data.condition || 'Excellent',
      timesWorn: 0,
      isDirty: false,
      status: 'clean',
      dateAdded: new Date().toISOString().split('T')[0],
      imageUrl: target.preview,
      aiMetadata: {
        confidence: target.data.confidence || 0.88,
        detectedCategory: target.data.category
      }
    };

    const saved = await saveWardrobeItem(newItem);
    setWardrobe(prev => [saved, ...prev]);
    setDetectedQueue(prev => prev.filter((_, i) => i !== index));

    // Refresh analytics & outfits
    const analytics = await fetchProfileAnalytics();
    setProfileAnalytics(analytics);
    generateOutfitsForContext(context, [saved, ...wardrobe]);

    if (detectedQueue.length <= 1) {
      setIsScannerOpen(false);
    }
  };

  // 6. Wardrobe Item CRUD Operations
  const handleToggleLaundryStatus = async (item: WardrobeItem) => {
    const isCurrentlyDirty = item.isDirty || item.status === 'in_wash';
    const newDirty = !isCurrentlyDirty;
    const newStatus = newDirty ? 'in_wash' : 'clean';

    try {
      const updated = await updateWardrobeItemApi(item.id, { isDirty: newDirty, status: newStatus });
      setWardrobe(prev => prev.map(w => w.id === item.id ? updated : w));
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem(updated);
      }
      // Re-run outfit generation to exclude/include item
      generateOutfitsForContext(context);
      const analytics = await fetchProfileAnalytics();
      setProfileAnalytics(analytics);
    } catch (err) {
      console.error('Failed to update laundry status:', err);
    }
  };

  const handleSaveItemEdit = async () => {
    if (!selectedItem) return;
    try {
      const updated = await updateWardrobeItemApi(selectedItem.id, editFormData);
      setWardrobe(prev => prev.map(w => w.id === selectedItem.id ? updated : w));
      setSelectedItem(updated);
      setIsEditingItem(false);
      const analytics = await fetchProfileAnalytics();
      setProfileAnalytics(analytics);
    } catch (err) {
      console.error('Failed to save item edit:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Remove this piece from your AURA wardrobe?')) return;
    try {
      await deleteWardrobeItemApi(id);
      setWardrobe(prev => prev.filter(w => w.id !== id));
      setSelectedItem(null);
      const analytics = await fetchProfileAnalytics();
      setProfileAnalytics(analytics);
      generateOutfitsForContext(context);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // 7. Outfit Swapping Engine (Priority 7)
  const handleOpenSwap = (item: WardrobeItem, outfitIndex: number) => {
    setSwappingSlot({ targetItem: item, outfitIndex });
  };

  const handleExecuteSwap = async (replacementItem: WardrobeItem) => {
    if (!swappingSlot) return;
    const currentOutfit = outfits[swappingSlot.outfitIndex];
    if (!currentOutfit) return;

    setIsSwapping(true);
    try {
      const result = await swapOutfitItemApi(
        currentOutfit.itemIds,
        swappingSlot.targetItem.id,
        replacementItem.id
      );

      const updatedEnsembleItems = result.updatedItemIds
        .map(id => wardrobe.find(w => w.id === id))
        .filter(Boolean) as WardrobeItem[];

      const updatedOutfit: GeneratedOutfit = {
        ...currentOutfit,
        itemIds: result.updatedItemIds,
        items: updatedEnsembleItems,
        itemNames: updatedEnsembleItems.map(i => i.name),
        confidenceScore: result.recalculatedScore,
        confidenceBoostScore: result.recalculatedScore,
        whyReasons: [result.compatibilityNote, ...currentOutfit.whyReasons.slice(0, 2)]
      };

      setOutfits(prev => prev.map((o, idx) => idx === swappingSlot.outfitIndex ? updatedOutfit : o));
      setSwappingSlot(null);
    } catch (err) {
      console.error('Failed to swap garment:', err);
    } finally {
      setIsSwapping(false);
    }
  };

  // 8. Real Shopping Intelligence Analysis (Priority 5)
  const handleEvaluateShopping = async (name: string, price: string, category: GarmentCategory, imageBase64?: string) => {
    setIsAnalyzingShop(true);
    try {
      const result = await analyzeShoppingItemApi(name, parseFloat(price) || 100, category, imageBase64);
      setShoppingAnalysis(result);
    } catch (err) {
      console.error('Shopping evaluation failed:', err);
    } finally {
      setIsAnalyzingShop(false);
    }
  };

  // Filter wardrobe items
  const filteredWardrobe = wardrobe.filter(item => {
    const matchesCat = wardrobeFilter === 'All' || item.category === wardrobeFilter;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.material.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const currentOutfit = outfits[currentOutfitIndex % Math.max(outfits.length, 1)];
  const resolvedOutfitItems = currentOutfit?.itemIds
    ? currentOutfit.itemIds.map(id => wardrobe.find(w => w.id === id)).filter(Boolean) as WardrobeItem[]
    : currentOutfit?.items || [];

  return (
    <div id="aura-consumer-experience" className="max-w-3xl mx-auto px-3 sm:px-6 py-3 sm:py-6 text-slate-100 font-sans selection:bg-white selection:text-black antialiased pb-safe">
      
      {/* Floating Segmented Navigation Bar - Mobile optimized */}
      <div id="aura-floating-navigation" className="sticky top-14 sm:top-16 z-40 mb-6 sm:mb-8 flex justify-center -mx-3 sm:mx-0 px-3 sm:px-0">
        <nav className="inline-flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 rounded-full bg-[#0F0F13]/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/90 ring-1 ring-white/5 overflow-x-auto scrollbar-hide">
          <button
            id="nav-aura-home"
            onClick={() => setActiveTab('home')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden xs:inline">Home</span>
          </button>

          <button
            id="nav-aura-wardrobe"
            onClick={() => setActiveTab('wardrobe')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'wardrobe'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden xs:inline">Wardrobe</span>
            <span className="xs:hidden">({wardrobe.length})</span>
          </button>

          <button
            id="nav-aura-looks"
            onClick={() => setActiveTab('looks')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'looks'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shirt className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden xs:inline">Looks</span>
          </button>

          <button
            id="nav-aura-shop"
            onClick={() => setActiveTab('shop')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'shop'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden xs:inline">Shop</span>
          </button>

          <button
            id="nav-aura-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden xs:inline">Profile</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 1. HOME SCREEN: "WHAT SHOULD I WEAR TODAY?" */}
      {/* ========================================================================= */}
      {activeTab === 'home' && (
        <div id="aura-home-screen" className="space-y-8 animate-fadeIn">
          
          {/* Greeting & Interactive Context Trigger - Mobile optimized */}
          <div className="flex flex-col space-y-3">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
                Today's Styling Engine
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Good morning, Morokolo
              </h1>
            </div>

            <button
              onClick={() => setShowContextDrawer(prev => !prev)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-medium self-start transition-all w-full sm:w-auto justify-center sm:justify-start"
            >
              {context.weather === 'Sunny' ? <Sun className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" /> : 
               context.weather === 'Rain' ? <CloudRain className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" /> : 
               <CloudSun className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />}
              <span className="truncate">{context.location} • {context.temperature} • {context.weather}</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-1 flex-shrink-0" />
            </button>
          </div>

          {/* Context Customizer Drawer - Mobile friendly grid */}
          {showContextDrawer && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0F0F14] border border-white/10 space-y-4 animate-fadeIn shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Context Tuning</span>
                <button 
                  onClick={() => setShowContextDrawer(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1.5">Temperature</label>
                  <select 
                    value={context.temperature} 
                    onChange={e => handleContextChange({ temperature: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-black/60 border border-white/10 text-white"
                  >
                    <option value="12°C">12°C (Crisp / Cold)</option>
                    <option value="18°C">18°C (Mild / Autumn)</option>
                    <option value="24°C">24°C (Warm)</option>
                    <option value="30°C">30°C (Hot)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1.5">Occasion</label>
                  <select 
                    value={context.occasion} 
                    onChange={e => handleContextChange({ occasion: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg bg-black/60 border border-white/10 text-white"
                  >
                    <option value="Work Pitch">Work Pitch / Executive</option>
                    <option value="Casual Coffee">Casual Coffee / Remote</option>
                    <option value="Evening Dinner">Evening Dinner</option>
                    <option value="Weekend Travel">Weekend Travel</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1.5">Weather</label>
                  <select 
                    value={context.weather} 
                    onChange={e => handleContextChange({ weather: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg bg-black/60 border border-white/10 text-white"
                  >
                    <option value="Sunny">Sunny</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Rain">Rain</option>
                    <option value="Windy">Windy</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1.5">Mood</label>
                  <select 
                    value={context.mood} 
                    onChange={e => handleContextChange({ mood: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg bg-black/60 border border-white/10 text-white"
                  >
                    <option value="Confident">Confident</option>
                    <option value="Relaxed">Relaxed</option>
                    <option value="Understated">Understated</option>
                    <option value="Bold">Bold</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="w-full h-px bg-white/10" />

          {/* Today's Look Card */}
          {isGeneratingOutfits ? (
            <div className="rounded-3xl bg-[#0F0F14] border border-white/10 p-12 text-center space-y-4 shadow-2xl">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-300 mx-auto" />
              <h3 className="text-base font-bold text-white">Synthesizing personalized look...</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Filtering available wardrobe pieces, honoring clean laundry status, and balancing {context.temperature} weather.
              </p>
            </div>
          ) : currentOutfit ? (
            <div className="rounded-3xl bg-[#0F0F14] border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-3xl ring-1 ring-white/5">
              
              {/* Header Title */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
                    Today's Ensemble
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {context.occasion} • Confidence {currentOutfit.confidenceScore || 95}%
                </span>
              </div>

              {/* Ensemble Presentation */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{currentOutfit.title}</h2>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold text-amber-300">
                    Formality {currentOutfit.formalityScore}/10
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentOutfit.explanation}
                </p>
              </div>

              {/* Garments in Ensemble (Clickable with Swap capability) */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Garments in Ensemble ({resolvedOutfitItems.length} pieces)
                  </div>
                  <span className="text-[10px] text-slate-500">Tap garment to swap</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {resolvedOutfitItems.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      onClick={() => handleOpenSwap(item, currentOutfitIndex)}
                      className="group p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Shirt className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">{item.category}</span>
                          <span className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                            {item.name}
                          </span>
                        </div>
                      </div>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Reasons */}
              {currentOutfit.whyReasons && currentOutfit.whyReasons.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-white/10 mb-8">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Why AURA Curated This
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {currentOutfit.whyReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center space-x-2 py-0.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toast Notification */}
              {showWornToast && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Logged '{lastWornTitle}' to your style memory. Have a great day!</span>
                </div>
              )}

              {/* Primary Action Buttons - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  id="btn-wear-this-look"
                  onClick={handleWearThis}
                  className="w-full py-3.5 sm:py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-black font-extrabold text-sm sm:text-xs tracking-wide transition-all shadow-xl shadow-white/10 flex items-center justify-center space-x-2 active:scale-98 touch-manipulation"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Wear this look</span>
                </button>

                <button
                  id="btn-try-another-look"
                  onClick={handleNextOption}
                  className="w-full py-3.5 sm:py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-sm sm:text-xs transition-all flex items-center justify-center space-x-2 active:scale-98 touch-manipulation"
                >
                  <RefreshCw className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <span>Try another</span>
                </button>

                <button
                  id="btn-capture-garment"
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full py-3.5 sm:py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold text-sm sm:text-xs transition-all flex items-center justify-center space-x-2 active:scale-98 touch-manipulation"
                >
                  <Camera className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <span>Capture piece</span>
                </button>
              </div>

            </div>
          ) : null}

          {/* Contextual Memory Cards */}
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
              AURA Noticed
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#0F0F14] border border-white/10 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rotation Intelligence</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {profileAnalytics?.leastWornItems[0] ? (
                    <>Your <strong className="text-white">{profileAnalytics.leastWornItems[0].name}</strong> has rested. Today's forecast is ideal.</>
                  ) : (
                    <>AURA balances your rotation so every noble piece gets worn regularly.</>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F0F14] border border-white/10 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Active Wardrobe</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {profileAnalytics?.cleanCount || wardrobe.length} pieces clean & available. Zero friction styling active.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WARDROBE SCREEN: "WHAT DO I OWN?" */}
      {/* ========================================================================= */}
      {activeTab === 'wardrobe' && (
        <div id="aura-wardrobe-screen" className="space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Wardrobe</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {wardrobe.length} pieces digitized • ${profileAnalytics?.totalEstimatedValueUSD || 2840} total value • {profileAnalytics?.cleanCount || 0} clean
              </p>
            </div>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs flex items-center space-x-2 self-start sm:self-auto hover:bg-slate-100 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Capture Pieces</span>
            </button>
          </div>

          {/* Category Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setWardrobeFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    wardrobeFilter === cat
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search fabric, brand, color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Visual Gallery Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredWardrobe.map((item) => (
              <div 
                key={item.id} 
                onClick={() => {
                  setSelectedItem(item);
                  setIsEditingItem(false);
                  setEditFormData(item);
                }}
                className="group relative rounded-2xl overflow-hidden bg-[#0F0F14] border border-white/10 hover:border-white/30 transition-all cursor-pointer shadow-lg hover:shadow-2xl flex flex-col justify-between"
              >
                <div className="aspect-square relative overflow-hidden bg-black">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                      <Shirt className="w-8 h-8" />
                    </div>
                  )}

                  {(item.isDirty || item.status === 'in_wash') && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-500/90 text-black text-[10px] font-extrabold uppercase tracking-wider shadow">
                      In Wash
                    </div>
                  )}

                  {item.brand && (
                    <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] text-slate-300 font-medium">
                      {item.brand}
                    </div>
                  )}
                </div>

                <div className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.category}</span>
                    <span className="text-[10px] text-slate-500">{item.material}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                  
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5">
                    <span>Worn <strong className="text-white">{item.timesWorn || 0}x</strong></span>
                    <span className="text-emerald-400 font-medium">${item.estimatedValueUSD}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LOOKS SCREEN: "WHAT OUTFITS HAS AURA CREATED?" */}
      {/* ========================================================================= */}
      {activeTab === 'looks' && (
        <div id="aura-looks-screen" className="space-y-6 animate-fadeIn">
          
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Style Looks</h2>
            <p className="text-xs text-slate-400">
              Personalized ensembles generated dynamically from your active wardrobe.
            </p>
          </div>

          <div className="space-y-6">
            {outfits.map((outfit, index) => {
              const outfitGarments = outfit.itemIds
                ? outfit.itemIds.map(id => wardrobe.find(w => w.id === id)).filter(Boolean) as WardrobeItem[]
                : outfit.items || [];

              return (
                <div key={outfit.id || index} className="rounded-3xl bg-[#0F0F14] border border-white/10 overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                      Look 0{index + 1} • Formality {outfit.formalityScore}/10
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Confidence {outfit.confidenceScore || 94}%
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{outfit.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{outfit.explanation}</p>
                  </div>

                  {/* Garment Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {outfitGarments.map((g, gIdx) => (
                      <div key={g.id || gIdx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0">
                          {g.imageUrl ? (
                            <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Shirt className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">{g.category}</span>
                          <span className="text-xs font-bold text-white line-clamp-1">{g.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setCurrentOutfitIndex(index);
                        setActiveTab('home');
                      }}
                      className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-slate-100 transition-all flex items-center space-x-1.5"
                    >
                      <Sparkle className="w-3.5 h-3.5" />
                      <span>Wear as Today's Look</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SHOP SCREEN: "SHOULD I BUY THIS?" (Priority 5) */}
      {/* ========================================================================= */}
      {activeTab === 'shop' && (
        <div id="aura-shop-screen" className="space-y-6 animate-fadeIn">
          
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Shopping Intelligence</h2>
            <p className="text-xs text-slate-400 max-w-lg">
              Evaluates prospective purchases against your real wardrobe to identify duplicate silhouettes, outfit synergy, and true cost-per-wear.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">Test Cases</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setShopQuery('Acne Studios Oversized Knit Sweater');
                  setShopPrice('320');
                  setShopCategory('Tops');
                  handleEvaluateShopping('Acne Studios Oversized Knit Sweater', '320', 'Tops');
                }}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-all"
              >
                ✨ Acne Studios Knit ($320)
              </button>
              <button
                onClick={() => {
                  setShopQuery('Italian Wool Blazer in Navy');
                  setShopPrice('450');
                  setShopCategory('Outerwear');
                  handleEvaluateShopping('Italian Wool Blazer in Navy', '450', 'Outerwear');
                }}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-all"
              >
                ⚠️ Duplicate Wool Blazer ($450)
              </button>
              <button
                onClick={() => {
                  setShopQuery('Saint Laurent Suede Chelsea Boots');
                  setShopPrice('890');
                  setShopCategory('Shoes');
                  handleEvaluateShopping('Saint Laurent Suede Chelsea Boots', '890', 'Shoes');
                }}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-all"
              >
                👞 Suede Chelsea Boots ($890)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Input Form */}
            <div className="md:col-span-5 rounded-2xl bg-[#0F0F14] border border-white/10 p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-slate-300 text-xs font-bold uppercase tracking-wider">
                <ShoppingBag className="w-4 h-4 text-amber-300" />
                <span>Prospective Piece</span>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Garment Name</label>
                <input
                  type="text"
                  value={shopQuery}
                  onChange={e => setShopQuery(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:border-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Price ($ USD)</label>
                <input
                  type="number"
                  value={shopPrice}
                  onChange={e => setShopPrice(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:border-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Category</label>
                <select
                  value={shopCategory}
                  onChange={e => setShopCategory(e.target.value as GarmentCategory)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:border-white/30 focus:outline-none"
                >
                  <option value="Tops">Tops</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Bottoms">Bottoms</option>
                  <option value="Shoes">Shoes</option>
                </select>
              </div>

              <button
                id="btn-run-shop-evaluation"
                onClick={() => handleEvaluateShopping(shopQuery, shopPrice, shopCategory)}
                disabled={isAnalyzingShop}
                className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 text-black font-extrabold text-xs transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                {isAnalyzingShop ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Zap className="w-4 h-4 text-black" />
                )}
                <span>{isAnalyzingShop ? 'Evaluating against your wardrobe...' : 'Ask AURA: Should I buy this?'}</span>
              </button>
            </div>

            {/* Verdict Display */}
            <div className="md:col-span-7 rounded-2xl bg-[#0F0F14] border border-white/10 p-6 shadow-xl min-h-[320px] flex flex-col justify-center">
              {shoppingAnalysis ? (
                <div className="space-y-6">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block mb-3 ${
                      shoppingAnalysis.verdictType === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : shoppingAnalysis.verdictType === 'SKIP'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {shoppingAnalysis.verdict}
                    </span>
                    <h3 className="text-2xl font-bold text-white">{shoppingAnalysis.title}</h3>
                  </div>

                  <p className="text-xs text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">
                    {shoppingAnalysis.verdictSub}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Price</span>
                      <span className="text-lg font-black text-white">${shoppingAnalysis.price}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Cost / Wear</span>
                      <span className="text-lg font-black text-emerald-400">${shoppingAnalysis.costPerWear}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Outfits Unlocked</span>
                      <span className="text-lg font-black text-amber-300">+{shoppingAnalysis.unlockedOutfits}</span>
                    </div>
                  </div>

                  {shoppingAnalysis.reasoning && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Analysis Rationale</span>
                      {shoppingAnalysis.reasoning.map((r, i) => (
                        <div key={i} className="flex items-center space-x-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Fill out prospective item details to evaluate wardrobe compatibility.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PROFILE SCREEN: "WHAT DOES AURA KNOW ABOUT MY STYLE?" (Priority 8) */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div id="aura-profile-screen" className="space-y-6 animate-fadeIn">
          
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Style Profile</h2>
            <p className="text-xs text-slate-400">
              The continuous fashion memory layer. AURA calculates your metrics directly from what you own and wear.
            </p>
          </div>

          {/* Archetype & Utilization Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-6 rounded-3xl bg-[#0F0F14] border border-white/10 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block">
                Primary Aesthetic Archetype
              </span>
              <h3 className="text-xl font-bold text-white">{profileAnalytics?.primaryArchetype || 'Quiet Luxury & Modern Minimalist'}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculated from your {wardrobe.length} registered pieces. Natural fibers and architectural tailoring anchor your style profile.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0F0F14] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                  Closet Active Utilization
                </span>
                <span className="text-lg font-black text-white">
                  {profileAnalytics?.activeUtilizationRate || 0}%
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${profileAnalytics?.activeUtilizationRate || 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {profileAnalytics?.isLearningPhase 
                  ? 'Learning your style rotation patterns... Wear more outfits to unlock advanced retention analytics.'
                  : `${profileAnalytics?.cleanCount} pieces in active rotation out of ${profileAnalytics?.totalPieces} total pieces.`}
              </p>
            </div>

          </div>

          {/* Dynamic Category Breakdown */}
          {profileAnalytics?.categoryBreakdown && profileAnalytics.categoryBreakdown.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#0F0F14] border border-white/10 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Wardrobe Breakdown</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {profileAnalytics.categoryBreakdown.map(cat => (
                  <div key={cat.category} className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">{cat.category}</span>
                    <div className="text-base font-bold text-white">{cat.count} pieces</div>
                    <span className="text-[11px] text-emerald-400 font-medium">${cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Resonance / Compliment Memory */}
          <div className="p-6 rounded-3xl bg-[#0F0F14] border border-white/10 space-y-4">
            <div className="flex items-center space-x-2 text-rose-400">
              <Heart className="w-4 h-4 fill-rose-400" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Style Memory & Wear Log</h4>
            </div>
            
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-rose-300 uppercase">Active Wear History</span>
                  <span>{profileAnalytics?.totalWearEvents || 1} logged wears</span>
                </div>
                <p className="text-slate-200">
                  AURA dynamically factors every wear event into tomorrow's outfit selection to prevent repetitive loops.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* GARMENT SWAP MODAL (Priority 7) */}
      {/* ========================================================================= */}
      {swappingSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F0F14] border border-white/10 p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-300" />
                <h3 className="text-base font-bold text-white">Swap {swappingSlot.targetItem.name}</h3>
              </div>
              <button 
                onClick={() => setSwappingSlot(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Choose a clean alternative from your <strong className="text-white">{swappingSlot.targetItem.category}</strong> collection.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {wardrobe
                .filter(item => 
                  item.category === swappingSlot.targetItem.category && 
                  item.id !== swappingSlot.targetItem.id &&
                  !item.isDirty && 
                  item.status !== 'in_wash'
                )
                .map(altItem => (
                  <div 
                    key={altItem.id}
                    onClick={() => handleExecuteSwap(altItem)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer transition-all flex items-center space-x-3 group"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0">
                      {altItem.imageUrl ? (
                        <img src={altItem.imageUrl} alt={altItem.name} className="w-full h-full object-cover" />
                      ) : (
                        <Shirt className="w-6 h-6 text-slate-500 m-auto mt-3" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-300">{altItem.name}</span>
                      <span className="text-[10px] text-slate-400 block">{altItem.material}</span>
                      <span className="text-[10px] text-emerald-400 font-medium">Formality {altItem.formalityScore}/10</span>
                    </div>
                  </div>
                ))}
            </div>

            {isSwapping && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300 flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Rebalancing ensemble harmony...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ITEM DETAIL & EDIT MODAL */}
      {/* ========================================================================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#0F0F14] border border-white/10 p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedItem.category}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditingItem(!isEditingItem)}
                  className="text-xs text-slate-300 hover:text-white p-1 flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingItem ? 'Cancel' : 'Edit'}</span>
                </button>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="aspect-square rounded-2xl overflow-hidden bg-black border border-white/10">
              {selectedItem.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Shirt className="w-12 h-12" />
                </div>
              )}
            </div>

            {isEditingItem ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Brand</label>
                    <input
                      type="text"
                      value={editFormData.brand || ''}
                      onChange={e => setEditFormData({ ...editFormData, brand: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Estimated Value ($)</label>
                    <input
                      type="number"
                      value={editFormData.estimatedValueUSD || 0}
                      onChange={e => setEditFormData({ ...editFormData, estimatedValueUSD: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveItemEdit}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-slate-100 transition-all"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-white">{selectedItem.name}</h3>
                <p className="text-xs text-slate-400">{selectedItem.brand || 'Unspecified Brand'} • {selectedItem.material}</p>
              </div>
            )}

            {/* AURA Intelligence Summary */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300">
                <Sparkle className="w-3.5 h-3.5" />
                <span>AURA says</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Effective cost-per-wear: <strong className="text-emerald-400">${(selectedItem.estimatedValueUSD / Math.max(selectedItem.timesWorn || 1, 1)).toFixed(2)}</strong> ({selectedItem.timesWorn || 0} wears logged).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-500 block text-[10px] uppercase font-medium">Times Worn</span>
                <span className="text-white font-bold text-sm">{selectedItem.timesWorn || 0} times</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-500 block text-[10px] uppercase font-medium">Est. Value</span>
                <span className="text-emerald-400 font-bold text-sm">${selectedItem.estimatedValueUSD}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => handleToggleLaundryStatus(selectedItem)}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${
                  selectedItem.isDirty || selectedItem.status === 'in_wash'
                    ? 'bg-amber-400 text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {selectedItem.isDirty || selectedItem.status === 'in_wash' 
                  ? 'In Wash (Click to Mark Clean)' 
                  : 'Mark Piece as in Wash'}
              </button>

              <button
                onClick={() => handleDeleteItem(selectedItem.id)}
                className="w-full py-2 rounded-xl text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 transition-all flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Piece from Wardrobe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEAMLESS VISION INGESTION MODAL (Priority 2: Multi-Image) */}
      {/* ========================================================================= */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F0F14] border border-white/10 p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-slate-300" />
                <h3 className="text-base font-bold text-white">Capture Garments</h3>
              </div>
              <button 
                onClick={() => {
                  setIsScannerOpen(false);
                  setDetectedQueue([]);
                }}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select one or multiple clothing photos. AURA extracts silhouette, fabric, formality, and wardrobe synergy automatically.
            </p>

            <div className="border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl p-6 text-center transition-all bg-black/40 relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBatchImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs font-bold text-slate-200">Tap or drop photos (single or multiple)</div>
                <div className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP</div>
              </div>
            </div>

            {isScanning && (
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center space-x-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>{scanStatusText}</span>
              </div>
            )}

            {detectedQueue.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-emerald-400">
                  Ready to add ({detectedQueue.length} parsed):
                </span>
                {detectedQueue.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={item.preview} alt="Garment" className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <div className="text-xs font-bold text-white">{item.data.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.data.category} • {item.data.material} • Formality {item.data.formalityScore}/10
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => saveDetectedItemToWardrobe(idx)}
                      className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-slate-100 transition-all shadow"
                    >
                      Save
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

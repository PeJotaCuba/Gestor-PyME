import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import { Layout } from './components/Layout';
import { SetupView } from './views/SetupView';
import { DashboardView } from './views/DashboardView';
import { AddProductView } from './views/AddProductView';
import { ImportView } from './views/ImportView';
import { AddExpenseView } from './views/AddExpenseView';
import { DollarSign, RefreshCw, Globe, CheckCircle, X } from 'lucide-react';

const App = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SETUP);
  const [activeNav, setActiveNav] = useState('home');
  const [businessName, setBusinessName] = useState('');
  
  // Exchange Rate Global State
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(''); // The active rate used for calcs
  const [bccRate, setBccRate] = useState(''); // The fetched BCC rate
  const [isManualRate, setIsManualRate] = useState(false); // Preference flag
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // Function to fetch BCC Rate
  const fetchBCCRate = async () => {
    setIsLoadingRate(true);
    try {
        const targetUrl = 'https://www.bc.gob.cu/tasas-de-cambio';
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if (data.contents) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            const rows = Array.from(doc.querySelectorAll('tr'));
            let foundRate = 0;

            for (const row of rows) {
                const text = row.innerText || row.textContent || '';
                if (text.includes('USD')) {
                    const numbers = text.match(/\d+(\.\d+)?/g);
                    if (numbers) {
                        const values = numbers.map(n => parseFloat(n));
                        const maxVal = Math.max(...values.filter(v => v > 25 && v < 500));
                        if (maxVal > 0 && maxVal !== -Infinity) {
                             foundRate = maxVal;
                             break;
                        }
                    }
                }
            }

            if (foundRate > 0) {
                const strRate = foundRate.toString();
                setBccRate(strRate);
                // Only auto-update active rate if NOT in manual mode
                if (!isManualRate) {
                    setExchangeRate(strRate);
                }
            }
        }
    } catch (error) {
        console.log("BCC fetch failed");
    } finally {
        setIsLoadingRate(false);
    }
  };

  // Initial Load Check
  useEffect(() => {
    let foundConfig = false;
    let configName = '';
    let linkExchange = false;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('Gestor_') && key.endsWith('_config')) {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            configName = key.replace('Gestor_', '').replace('_config', '').replace(/_/g, ' ');
            foundConfig = true;
            linkExchange = data.linkExchangeRate || false;
            break;
        }
    }

    if (foundConfig) {
        setBusinessName(configName);
        setCurrentView(ViewState.DASHBOARD);
        
        if (linkExchange) {
            const safeName = configName.replace(/\s+/g, '_');
            const rateKey = `Gestor_${safeName}_exchangeRate`;
            const rateData = JSON.parse(localStorage.getItem(rateKey) || '{}');
            
            // Restore state
            if (rateData.rate) setExchangeRate(rateData.rate);
            if (rateData.isManual) setIsManualRate(true);

            // Fetch fresh rate in background to display in modal
            fetchBCCRate();

            // Logic: If manual, we trust the stored rate. If not manual, we check date.
            const today = new Date().toISOString().split('T')[0];
            if (!rateData.isManual && rateData.date !== today) {
                setShowExchangeModal(true); // Prompt update
            }
        }
    } else {
        setCurrentView(ViewState.SETUP);
    }
  }, []);

  const handleSetupComplete = (name: string, linkExchangeRate: boolean, initialRate?: string, isManual?: boolean) => {
    setBusinessName(name);
    
    // Save Config
    const safeName = name.replace(/\s+/g, '_');
    localStorage.setItem(`Gestor_${safeName}_config`, JSON.stringify({
        lastAccess: new Date().toISOString(),
        active: true,
        linkExchangeRate: linkExchangeRate
    }));

    if (linkExchangeRate && initialRate) {
        setExchangeRate(initialRate);
        if (isManual) setIsManualRate(true);
        saveRateToStorage(name, initialRate, !!isManual);
    }

    setCurrentView(ViewState.DASHBOARD);
  };

  const saveRateToStorage = (bName: string, rate: string, manual: boolean) => {
      const today = new Date().toISOString().split('T')[0];
      const rateKey = `Gestor_${bName.replace(/\s+/g, '_')}_exchangeRate`;
      localStorage.setItem(rateKey, JSON.stringify({
          date: today,
          rate: rate,
          isManual: manual
      }));
  };

  const handleSaveExchangeRate = () => {
      if(!exchangeRate) return;
      saveRateToStorage(businessName, exchangeRate, isManualRate);
      setShowExchangeModal(false);
  };

  const handleManualToggle = (checked: boolean) => {
      setIsManualRate(checked);
      if (!checked && bccRate) {
          setExchangeRate(bccRate); // Reset to BCC if turning manual off
      }
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.SETUP:
        return <SetupView onComplete={handleSetupComplete} />;
      case ViewState.DASHBOARD:
        return <DashboardView onChangeView={setCurrentView} businessName={businessName} />;
      case ViewState.ADD_PRODUCT:
        return (
            <AddProductView 
                onBack={() => setCurrentView(ViewState.DASHBOARD)} 
                onImportClick={() => setCurrentView(ViewState.IMPORT_PRODUCT)}
                businessName={businessName}
            />
        );
      case ViewState.IMPORT_PRODUCT:
        return <ImportView onBack={() => setCurrentView(ViewState.ADD_PRODUCT)} />;
      case ViewState.ADD_EXPENSE:
        return <AddExpenseView onBack={() => setCurrentView(ViewState.DASHBOARD)} businessName={businessName} />;
      default:
        return <DashboardView onChangeView={setCurrentView} businessName={businessName} />;
    }
  };

  const showNav = currentView === ViewState.DASHBOARD;

  return (
    <Layout 
        showNav={showNav} 
        activeNav={activeNav}
        onNavigate={(nav) => setActiveNav(nav)}
        onAddClick={() => setCurrentView(ViewState.ADD_PRODUCT)}
        currentExchangeRate={exchangeRate} 
        onOpenExchange={() => setShowExchangeModal(true)}
    >
      {renderView()}

      {/* Global Exchange Rate Overlay Modal */}
      {showExchangeModal && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-orange-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-500/20 rounded-full text-orange-500">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Tasa del Día</h2>
                            <p className="text-xs text-slate-400">Gestión de Tasa de Cambio</p>
                        </div>
                    </div>
                    <button onClick={() => setShowExchangeModal(false)} className="text-slate-500 hover:text-white">
                        <X size={20} />
                    </button>
                  </div>
                  
                  {/* BCC Detected Rate Section */}
                  <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase">Tasa BCC (Seg. III)</span>
                          {isLoadingRate && <RefreshCw size={12} className="animate-spin text-orange-500"/>}
                      </div>
                      {bccRate ? (
                          <div className="flex items-end gap-2">
                              <span className="text-2xl font-extrabold text-emerald-400">${bccRate}</span>
                              <span className="text-sm font-bold text-slate-500 mb-1">CUP</span>
                          </div>
                      ) : (
                          <span className="text-sm text-slate-500 italic">Cargando tasa oficial...</span>
                      )}
                      {!isManualRate && bccRate && (
                          <div className="absolute top-2 right-2">
                              <CheckCircle size={16} className="text-emerald-500" />
                          </div>
                      )}
                  </div>

                  {/* Manual Toggle */}
                  <div className="flex items-center justify-between mb-4 px-1">
                      <span className="text-sm font-bold text-white">Editar Tasa Manualmente</span>
                      <div 
                            onClick={() => handleManualToggle(!isManualRate)}
                            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isManualRate ? 'bg-orange-500' : 'bg-slate-600'}`}
                        >
                            <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform ${isManualRate ? 'translate-x-full' : ''}`}></div>
                        </div>
                  </div>
                  
                  {/* Input */}
                  <div className="mb-6 relative">
                      <div className="flex items-center gap-2">
                          <input 
                              type="number" 
                              value={exchangeRate}
                              onChange={(e) => setExchangeRate(e.target.value)}
                              disabled={!isManualRate}
                              className={`w-full border p-4 rounded-xl text-2xl font-bold text-white outline-none transition-all
                                  ${isManualRate 
                                    ? 'bg-slate-900 border-orange-500/50 focus:ring-2 focus:ring-orange-500' 
                                    : 'bg-slate-800/50 border-transparent text-slate-400 cursor-not-allowed'
                                  }`}
                              placeholder="0.00"
                              autoFocus={isManualRate}
                          />
                          <span className="text-xl font-bold text-slate-400">CUP</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                         {isManualRate 
                            ? 'Advertencia: Los cambios en la tasa afectarán los cálculos de costos de productos.' 
                            : 'Usando automáticamente la tasa detectada del BCC.'}
                      </p>
                  </div>

                  <button 
                      onClick={handleSaveExchangeRate}
                      disabled={!exchangeRate}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                  >
                      Confirmar Tasa
                  </button>
              </div>
          </div>
      )}
    </Layout>
  );
};

export default App;
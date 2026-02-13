import React, { useState, useEffect } from 'react';
import { ViewState, BusinessProfile } from './types';
import { Layout } from './components/Layout';
import { SetupView } from './views/SetupView';
import { DashboardView } from './views/DashboardView';
import { AddProductView } from './views/AddProductView';
import { ImportView } from './views/ImportView';
import { AddExpenseView } from './views/AddExpenseView';
import { DollarSign, RefreshCw, Globe } from 'lucide-react';

const App = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SETUP);
  const [activeNav, setActiveNav] = useState('home');
  const [businessName, setBusinessName] = useState('');
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('');
  const [isLoadingRate, setIsLoadingRate] = useState(false);

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
                        // Buscar tasa > 25 para identificar Segmento III (vs Oficial 24)
                        const maxVal = Math.max(...values.filter(v => v > 25 && v < 500));
                        if (maxVal > 0 && maxVal !== -Infinity) {
                             foundRate = maxVal;
                             break;
                        }
                    }
                }
            }

            if (foundRate > 0) {
                setExchangeRate(foundRate.toString());
            }
        }
    } catch (error) {
        console.log("Daily BCC fetch failed or skipped");
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
            const namePart = key.replace('Gestor_', '').replace('_config', '').replace(/_/g, ' ');
            configName = namePart;
            foundConfig = true;
            linkExchange = data.linkExchangeRate || false;
            break;
        }
    }

    if (foundConfig) {
        setBusinessName(configName);
        setCurrentView(ViewState.DASHBOARD);
        
        // Check Daily Exchange Rate
        if (linkExchange) {
            const today = new Date().toISOString().split('T')[0];
            const rateKey = `Gestor_${configName.replace(/\s+/g, '_')}_exchangeRate`;
            const lastRateData = JSON.parse(localStorage.getItem(rateKey) || '{}');
            
            // If date is different (new day), trigger modal
            if (lastRateData.date !== today) {
                setShowExchangeModal(true);
                fetchBCCRate(); // Fetch new rate from web
            }
        }
    } else {
        setCurrentView(ViewState.SETUP);
    }
  }, []);

  // Update handler to receive initialRate from SetupView
  const handleSetupComplete = (name: string, linkExchangeRate: boolean, initialRate?: string) => {
    setBusinessName(name);
    
    // Persist Config
    const safeName = name.replace(/\s+/g, '_');
    const storageKey = `Gestor_${safeName}_config`;
    localStorage.setItem(storageKey, JSON.stringify({
        lastAccess: new Date().toISOString(),
        active: true,
        linkExchangeRate: linkExchangeRate
    }));

    // If initial rate provided, save it as today's rate so modal doesn't pop again immediately
    if (initialRate && linkExchangeRate) {
        const today = new Date().toISOString().split('T')[0];
        const rateKey = `Gestor_${safeName}_exchangeRate`;
        localStorage.setItem(rateKey, JSON.stringify({
            date: today,
            rate: initialRate
        }));
    }

    setCurrentView(ViewState.DASHBOARD);
  };

  const handleSaveExchangeRate = () => {
      if(!exchangeRate) return;
      const today = new Date().toISOString().split('T')[0];
      const rateKey = `Gestor_${businessName.replace(/\s+/g, '_')}_exchangeRate`;
      localStorage.setItem(rateKey, JSON.stringify({
          date: today,
          rate: exchangeRate
      }));
      setShowExchangeModal(false);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.SETUP:
        return <SetupView onComplete={handleSetupComplete} />;
      case ViewState.DASHBOARD:
        return <DashboardView onChangeView={setCurrentView} />;
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
        return <DashboardView onChangeView={setCurrentView} />;
    }
  };

  const showNav = currentView === ViewState.DASHBOARD;

  return (
    <Layout 
        showNav={showNav} 
        activeNav={activeNav}
        onNavigate={(nav) => setActiveNav(nav)}
        onAddClick={() => setCurrentView(ViewState.ADD_PRODUCT)}
    >
      {renderView()}

      {/* Daily Exchange Rate Overlay Modal (Global) */}
      {showExchangeModal && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-orange-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-orange-500/20 rounded-full text-orange-500">
                          <Globe size={24} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-white">Tasa del Día</h2>
                          <p className="text-xs text-slate-400">Actualiza el valor del USD</p>
                      </div>
                  </div>
                  
                  <div className="mb-6 relative">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">1 USD equivale a:</label>
                      <div className="flex items-center gap-2">
                          <input 
                              type="number" 
                              value={exchangeRate}
                              onChange={(e) => setExchangeRate(e.target.value)}
                              className="w-full bg-slate-800 border-none p-4 rounded-xl text-2xl font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none placeholder-slate-600"
                              placeholder={isLoadingRate ? "..." : "0.00"}
                              autoFocus
                          />
                          <span className="text-xl font-bold text-slate-400">CUP</span>
                      </div>
                      <div className="mt-2 flex items-start gap-1.5 text-[10px] text-slate-500">
                          {isLoadingRate ? (
                              <RefreshCw size={12} className="animate-spin text-orange-500 mt-0.5" />
                          ) : (
                              <div className="w-1 h-1 rounded-full bg-orange-500 mt-1.5"></div>
                          )}
                          <p>Consultando bc.gob.cu (Segmento III) vía proxy...</p>
                      </div>
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
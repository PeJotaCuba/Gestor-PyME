import React, { useState, useEffect } from 'react';
import { ViewState, Product } from './types';
import { Layout } from './components/Layout';
import { SetupView } from './views/SetupView';
import { DashboardView } from './views/DashboardView';
import { SalesView } from './views/SalesView';
import { ProductsListView } from './views/ProductsListView';
import { CurrentAccountView } from './views/CurrentAccountView';
import { AddProductView } from './views/AddProductView';
import { ImportView } from './views/ImportView';
import { AddExpenseView } from './views/AddExpenseView';
import { TallerView } from './views/TallerView';
import { PaymentsView } from './views/PaymentsView';
import { DollarSign, RefreshCw, Globe, CheckCircle, X, AlertTriangle, Download, ArrowRight } from 'lucide-react';

const App = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SETUP);
  const [activeNav, setActiveNav] = useState('home');
  const [businessName, setBusinessName] = useState('');
  
  // Exchange Rate Global State
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(''); 
  const [bccRate, setBccRate] = useState('');
  const [isManualRate, setIsManualRate] = useState(false);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [isRateLinked, setIsRateLinked] = useState(false);
  const [lastRateDate, setLastRateDate] = useState('');

  // Backup Modal State
  const [showBackupModal, setShowBackupModal] = useState(false);

  // --- Helper: Multi-Proxy Fetcher to avoid CORS errors ---
  const fetchUrlContent = async (targetUrl: string): Promise<string | null> => {
      const proxies = [
          // Strategy 1: AllOrigins (Returns JSON with 'contents')
          { url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, type: 'json' },
          // Strategy 2: CodeTabs (Returns Raw HTML)
          { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`, type: 'text' },
          // Strategy 3: CorsProxy (Returns Raw HTML)
          { url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, type: 'text' }
      ];

      for (const proxy of proxies) {
          try {
              const response = await fetch(proxy.url);
              if (response.ok) {
                  if (proxy.type === 'json') {
                      const data = await response.json();
                      return data.contents; 
                  } else {
                      return await response.text();
                  }
              }
          } catch (e) {
              console.warn(`Proxy failed: ${proxy.url}`, e);
          }
      }
      return null;
  };

  // --- Logic for BCC/Cubadebate Rate Fetching ---
  const fetchRate = async () => {
      setIsLoadingRate(true);
      let foundRate = 0;
      let source = '';

      // 1. Try BCC (bc.gob.cu)
      try {
          const htmlContent = await fetchUrlContent('https://www.bc.gob.cu/tasas-de-cambio');
          
          if (htmlContent) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlContent, 'text/html');
              
              const rows = Array.from(doc.querySelectorAll('tr'));
              for (const row of rows) {
                  const text = row.innerText || row.textContent || '';
                  if (text.toUpperCase().includes('USD')) {
                       // Extract numbers, handling comma decimals
                       const numbers = text.match(/\d+([.,]\d+)?/g);
                       if (numbers) {
                           const values = numbers.map(n => parseFloat(n.replace(',', '.')));
                           // Look for realistic market rate (e.g. > 60 and < 500)
                           const candidate = values.find(v => v > 60 && v < 500);
                           if (candidate) {
                               foundRate = candidate;
                               source = 'BCC';
                               break;
                           }
                       }
                  }
              }
          }
      } catch (e) {
          console.warn("BCC parsing failed", e);
      }

      // 2. Fallback: Cubadebate (cubadebate.cu)
      if (foundRate === 0) {
          try {
              const htmlContent = await fetchUrlContent('http://www.cubadebate.cu/');

              if(htmlContent) {
                   // Clean up HTML tags to search text
                   const div = document.createElement('div');
                   div.innerHTML = htmlContent;
                   const textContent = div.textContent || div.innerText || "";
                   
                   // Regex patterns for various widget formats
                   const patterns = [
                       /1\s*USD\s*[x=]\s*(\d+([.,]\d+)?)\s*CUP/i,
                       /USD\s*(\d+([.,]\d+)?)\s*CUP/i
                   ];

                   for (const regex of patterns) {
                       const match = textContent.match(regex);
                       if (match && match[1]) {
                           const val = parseFloat(match[1].replace(',', '.'));
                           if (val > 20) {
                               foundRate = val;
                               source = 'Cubadebate';
                               break;
                           }
                       }
                   }
              }
          } catch (e) {
              console.warn("Cubadebate parsing failed", e);
          }
      }

      setIsLoadingRate(false);

      if (foundRate > 0) {
          const strRate = foundRate.toString();
          setBccRate(strRate);
          // Auto-update if not manual
          if (!isManualRate) {
              setExchangeRate(strRate);
          }
          console.log(`Tasa actualizada desde ${source}: ${strRate}`);
      } else {
          console.log("No se pudo detectar la tasa automáticamente. Revise su conexión.");
      }
  };

  // --- Backup Logic ---
  const checkBackupStatus = () => {
      const lastBackup = localStorage.getItem('Gestor_LastBackupTime');
      const lastPrompt = localStorage.getItem('Gestor_LastBackupPrompt');
      const now = new Date();
      const today6am = new Date();
      today6am.setHours(6, 0, 0, 0);
      
      if (now < today6am) return; 

      let shouldPrompt = false;
      if (!lastBackup) {
          shouldPrompt = true;
      } else {
          const lastBackupDate = new Date(lastBackup);
          if (lastBackupDate < today6am) {
              shouldPrompt = true;
          }
      }

      if (shouldPrompt) {
          if (lastPrompt) {
              const lastPromptDate = new Date(lastPrompt);
              const diffHours = (now.getTime() - lastPromptDate.getTime()) / (1000 * 60 * 60);
              if (diffHours < 12) return;
          }
          setShowBackupModal(true);
          localStorage.setItem('Gestor_LastBackupPrompt', now.toISOString());
      }
  };

  const handlePerformBackup = () => {
      let csvContent = "data:text/csv;charset=utf-8,KEY,VALUE_JSON\n";
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('Gestor_')) {
              const val = localStorage.getItem(key);
              if (val) {
                  const escapedVal = val.replace(/"/g, '""');
                  csvContent += `${key},"${escapedVal}"\n`;
              }
          }
      }
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `GestorPyME_Backup_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      localStorage.setItem('Gestor_LastBackupTime', new Date().toISOString());
      setShowBackupModal(false);
  };

  useEffect(() => {
    // Initialization
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
        setIsRateLinked(linkExchange);
        setCurrentView(ViewState.DASHBOARD);
        checkBackupStatus(); 
        
        if (linkExchange) {
            const safeName = configName.replace(/\s+/g, '_');
            const rateKey = `Gestor_${safeName}_exchangeRate`;
            const rateDataRaw = localStorage.getItem(rateKey);
            
            if(rateDataRaw) {
                const rateData = JSON.parse(rateDataRaw);
                if (rateData.rate) setExchangeRate(rateData.rate);
                if (rateData.isManual) setIsManualRate(true);
                setLastRateDate(rateData.date || '');

                // 24 Hour Update Logic (Reset loop if date changed)
                const today = new Date().toISOString().split('T')[0];
                if (rateData.date !== today) {
                    setShowExchangeModal(true); // Force open to update
                    fetchRate(); // Attempt fetch
                }
            } else {
                 setShowExchangeModal(true);
                 fetchRate();
            }
        }
    } else {
        setCurrentView(ViewState.SETUP);
    }

    const interval = setInterval(checkBackupStatus, 3600000);
    return () => clearInterval(interval);
  }, []);

  const handleSetupComplete = (name: string, linkExchangeRate: boolean, initialRate?: string, isManual?: boolean) => {
    setBusinessName(name);
    setIsRateLinked(linkExchangeRate);
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
      const safeName = bName.replace(/\s+/g, '_');
      const rateKey = `Gestor_${safeName}_exchangeRate`;
      
      // Check previous rate to calculate increase percentage
      const prevData = JSON.parse(localStorage.getItem(rateKey) || '{}');
      const prevRate = parseFloat(prevData.rate || '0');
      const newRate = parseFloat(rate);

      localStorage.setItem(rateKey, JSON.stringify({
          date: today,
          rate: rate,
          isManual: manual
      }));
      setLastRateDate(today);

      // --- Product Price Auto-Update Logic ---
      if (prevRate > 0 && newRate > prevRate) {
          const increaseRatio = newRate / prevRate;
          const percentInc = ((increaseRatio - 1) * 100).toFixed(1);
          
          if (window.confirm(`La tasa ha aumentado un ${percentInc}%. ¿Desea ajustar automáticamente los precios de venta de sus productos?`)) {
              const prodKey = `Gestor_${safeName}_products`;
              const products: Product[] = JSON.parse(localStorage.getItem(prodKey) || '[]');
              
              const updatedProducts = products.map(p => ({
                  ...p,
                  sale: parseFloat((p.sale * increaseRatio).toFixed(2)) 
              }));
              
              localStorage.setItem(prodKey, JSON.stringify(updatedProducts));
              alert("Precios actualizados correctamente.");
          }
      }
  };

  const handleSaveExchangeRate = () => {
      if(!exchangeRate) return;
      saveRateToStorage(businessName, exchangeRate, isManualRate);
      setShowExchangeModal(false);
  };

  const handleManualToggle = (checked: boolean) => {
      setIsManualRate(checked);
      if (!checked && bccRate) {
          setExchangeRate(bccRate); 
      }
  };

  const handleNavigation = (nav: string) => {
      setActiveNav(nav);
      if (nav === 'settings') setCurrentView(ViewState.SETUP);
      else if (nav === 'home') setCurrentView(ViewState.DASHBOARD);
      else if (nav === 'sales') setCurrentView(ViewState.SALES);
      else if (nav === 'products') setCurrentView(ViewState.PRODUCTS);
      else if (nav === 'accounts') setCurrentView(ViewState.CURRENT_ACCOUNT);
      else if (nav === 'workshop') setCurrentView(ViewState.WORKSHOP);
      else if (nav === 'payments') setCurrentView(ViewState.PAYMENTS);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.SETUP:
        return <SetupView onComplete={handleSetupComplete} />;
      case ViewState.DASHBOARD:
        return <DashboardView onChangeView={setCurrentView} businessName={businessName} />;
      case ViewState.SALES:
        return <SalesView businessName={businessName} />;
      case ViewState.PRODUCTS:
        return <ProductsListView businessName={businessName} />;
      case ViewState.CURRENT_ACCOUNT:
        return <CurrentAccountView businessName={businessName} />;
      case ViewState.WORKSHOP:
        return <TallerView businessName={businessName} />;
      case ViewState.PAYMENTS:
        return <PaymentsView businessName={businessName} />;
      case ViewState.ADD_PRODUCT:
        return (
            <AddProductView 
                onBack={() => setCurrentView(ViewState.PRODUCTS)} 
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

  const showNav = currentView !== ViewState.ADD_PRODUCT && currentView !== ViewState.IMPORT_PRODUCT && currentView !== ViewState.ADD_EXPENSE && currentView !== ViewState.SETUP;
  const isSetup = currentView === ViewState.SETUP;

  return (
    <Layout 
        showNav={showNav} 
        activeNav={activeNav}
        onNavigate={handleNavigation}
        onAddClick={() => setCurrentView(ViewState.ADD_PRODUCT)}
        currentExchangeRate={isRateLinked ? exchangeRate : undefined} 
        onOpenExchange={() => { setShowExchangeModal(true); fetchRate(); }}
        isSetupMode={isSetup}
        businessName={businessName}
    >
      {renderView()}

      {/* Backup Modal */}
      {showBackupModal && (
          <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle size={32} className="text-red-500" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Copia de Seguridad Necesaria</h2>
                      <p className="text-sm text-slate-400 mt-2">
                          Ha pasado más de un día desde tu último respaldo. Es importante guardar tus datos para evitar pérdidas.
                      </p>
                  </div>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setShowBackupModal(false)} 
                          className="flex-1 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-700"
                      >
                          Más tarde
                      </button>
                      <button 
                          onClick={handlePerformBackup}
                          className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 flex items-center justify-center gap-2"
                      >
                          <Download size={18} />
                          Guardar Ahora
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Exchange Rate Modal */}
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
                            <p className="text-xs text-slate-400">
                                {new Date().toISOString().split('T')[0] === lastRateDate ? 'Actualizada hoy' : 'Requiere actualización'}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setShowExchangeModal(false)} className="text-slate-500 hover:text-white">
                        <X size={20} />
                    </button>
                  </div>
                  
                  {/* Main Rate Display */}
                  <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase">Tasa Detectada</span>
                          {/* Botón de Actualizar al lado de la carga */}
                          <button 
                                onClick={fetchRate} 
                                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-[10px] font-bold text-orange-500 border border-slate-700 transition-colors"
                          >
                                <RefreshCw size={10} className={isLoadingRate ? "animate-spin" : ""} />
                                ACTUALIZAR
                          </button>
                      </div>
                      
                      <div className="flex flex-col">
                        {bccRate ? (
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-extrabold text-emerald-400">${bccRate}</span>
                                <span className="text-sm font-bold text-slate-500 mb-1">CUP</span>
                            </div>
                        ) : (
                            <span className="text-sm text-slate-500 italic py-2">
                                {isLoadingRate ? 'Consultando bancos...' : 'Tasa no disponible. Intente actualizar.'}
                            </span>
                        )}
                        <p className="text-[9px] text-slate-600 mt-1">
                             Fuente: BC.gob.cu / Cubadebate (Alternativa)
                        </p>
                      </div>

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
                  </div>

                  <button 
                      onClick={handleSaveExchangeRate}
                      disabled={!exchangeRate}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                      <span>Confirmar y Guardar</span>
                      <ArrowRight size={18} />
                  </button>
              </div>
          </div>
      )}
    </Layout>
  );
};

export default App;
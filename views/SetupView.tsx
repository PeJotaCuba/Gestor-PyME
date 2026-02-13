import React, { useState } from 'react';
import { Store, Package, Layers, ArrowRight, DollarSign, RefreshCw, X } from 'lucide-react';

interface SetupViewProps {
  onComplete: (name: string, linkExchangeRate: boolean, initialRate?: string) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onComplete }) => {
  const [businessType, setBusinessType] = useState('retail');
  const [name, setName] = useState('');
  
  // Exchange Rate Logic
  const [linkExchangeRate, setLinkExchangeRate] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('');
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // Fetch BCC Rate Logic
  const fetchBCCRate = async () => {
    setIsLoadingRate(true);
    setExchangeRate('');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
        // Fetch from the specific requested URL
        const response = await fetch('https://api.bc.gob.cu/v1/tasas-de-cambio/activas', {
            signal: controller.signal
        });
        
        if (response.ok) {
            const data = await response.json();
            let foundRate = 0;

            // Helper function to extract numeric rate safely
            const parseRate = (item: any) => {
                return parseFloat(item?.Tasa || item?.rate || item?.venta || '0');
            };
            
            if (Array.isArray(data)) {
                // Filter specifically for USD
                const usdItems = data.filter((item: any) => 
                    item.Moneda === 'USD' || item.currency === 'USD'
                );
                
                if (usdItems.length > 0) {
                    // Logic: PyMEs typically need the "CADECA" or "Población" rate (Segment 3), 
                    // which is usually higher than the fixed official accounting rate (24).
                    // We sort descending and pick the highest available rate.
                    const maxRateItem = usdItems.reduce((prev, current) => {
                        return parseRate(current) > parseRate(prev) ? current : prev;
                    });
                    foundRate = parseRate(maxRateItem);
                }
            } else if (data && typeof data === 'object') {
                 // Fallback for object-keyed structure
                 if (data.USD) foundRate = parseRate(data.USD);
            }

            if (foundRate > 0) {
                setExchangeRate(foundRate.toString());
            }
        }
    } catch (error) {
        console.warn("Error obteniendo tasa BCC o bloqueo CORS", error);
    } finally {
        clearTimeout(timeoutId);
        setIsLoadingRate(false);
    }
  };

  const handleToggleExchange = () => {
      if (!linkExchangeRate) {
          // Turning ON: Show modal and fetch
          setLinkExchangeRate(true);
          setShowRateModal(true);
          fetchBCCRate();
      } else {
          // Turning OFF
          setLinkExchangeRate(false);
          setExchangeRate('');
      }
  };

  const confirmRate = () => {
      setShowRateModal(false);
      // Link stays true
  };

  const cancelRate = () => {
      setShowRateModal(false);
      setLinkExchangeRate(false); // Revert toggle
      setExchangeRate('');
  };

  return (
    <div className="flex flex-col min-h-full px-6 pt-10 pb-12 relative">
      
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold mb-3 text-white leading-tight">
          Bienvenido a <span className="text-orange-500">GestorPyME</span>
        </h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          Configuremos el perfil de tu negocio para comenzar a calcular tus márgenes reales.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300 ml-1">Nombre del Negocio</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
            placeholder="ej. Comercializadora Azul"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300 ml-1">Moneda Local</label>
          <div className="relative">
            <select className="w-full appearance-none bg-slate-800 border-slate-700 rounded-xl px-4 py-4 pr-10 text-white focus:ring-2 focus:ring-orange-500 outline-none">
              <option value="CUP">CUP - Peso Cubano</option>
              <option value="USD">USD - Dólar Estadounidense</option>
              <option value="EUR">EUR - Euro</option>
              <option value="MXN">MXN - Peso Mexicano</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between transition-colors hover:bg-slate-800">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="font-bold text-sm text-white">Vincular a Tasa de Cambio</p>
                    <p className="text-xs text-slate-400">Actualizar tasa CUP/USD diariamente</p>
                </div>
            </div>
            <div 
                onClick={handleToggleExchange}
                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${linkExchangeRate ? 'bg-orange-500' : 'bg-slate-700'}`}
            >
                <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-6 w-6 transition-transform ${linkExchangeRate ? 'translate-x-full' : ''}`}></div>
            </div>
        </div>
        
        {/* Helper text showing current rate if set */}
        {linkExchangeRate && exchangeRate && !showRateModal && (
            <div className="px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <p className="text-xs text-emerald-400 font-medium">Tasa configurada: <strong>1 USD = ${exchangeRate} CUP</strong></p>
            </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-300 ml-1">Tipo de Negocio</label>
          
          <div 
            onClick={() => setBusinessType('retail')}
            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${businessType === 'retail' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-800'}`}
          >
            <div className={`p-2 rounded-lg mr-3 ${businessType === 'retail' ? 'bg-orange-500/20' : 'bg-slate-700'}`}>
              <Store className={businessType === 'retail' ? 'text-orange-500' : 'text-slate-400'} size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">Minorista</p>
            </div>
            {businessType === 'retail' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
          </div>

          <div 
            onClick={() => setBusinessType('wholesale')}
            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${businessType === 'wholesale' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-800'}`}
          >
            <div className={`p-2 rounded-lg mr-3 ${businessType === 'wholesale' ? 'bg-orange-500/20' : 'bg-slate-700'}`}>
              <Package className={businessType === 'wholesale' ? 'text-orange-500' : 'text-slate-400'} size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">Mayorista</p>
            </div>
            {businessType === 'wholesale' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
          </div>
          
           <div 
            onClick={() => setBusinessType('mixed')}
            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${businessType === 'mixed' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-800'}`}
          >
            <div className={`p-2 rounded-lg mr-3 ${businessType === 'mixed' ? 'bg-orange-500/20' : 'bg-slate-700'}`}>
              <Layers className={businessType === 'mixed' ? 'text-orange-500' : 'text-slate-400'} size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">Modelo Mixto</p>
            </div>
            {businessType === 'mixed' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
          </div>

        </div>
      </div>

      {/* Bottom Button */}
      <div className="mt-8">
        <button 
            onClick={() => onComplete(name || 'Mi Negocio', linkExchangeRate, exchangeRate)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
        >
            <span>Continuar</span>
            <ArrowRight size={20} />
        </button>
      </div>

       {/* Inline Modal for Exchange Rate */}
       {showRateModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-6 rounded-3xl animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-800 border border-orange-500/30 p-6 rounded-2xl w-full shadow-2xl relative">
                  <button onClick={cancelRate} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                      <X size={20} />
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-orange-500/20 rounded-full text-orange-500">
                          <DollarSign size={24} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-white">Configurar Tasa</h2>
                          <p className="text-xs text-slate-400">Valor inicial del USD</p>
                      </div>
                  </div>
                  
                  <div className="mb-6 relative">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">1 USD equivale a:</label>
                      <div className="flex items-center gap-2">
                          <input 
                              type="number" 
                              value={exchangeRate}
                              onChange={(e) => setExchangeRate(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-2xl font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none placeholder-slate-600"
                              placeholder={isLoadingRate ? "..." : "0.00"}
                              autoFocus
                          />
                          <span className="text-xl font-bold text-slate-400">CUP</span>
                      </div>
                      <div className="mt-3 flex items-start gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                          {isLoadingRate ? (
                              <RefreshCw size={14} className="animate-spin text-orange-500 mt-0.5 shrink-0" />
                          ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
                          )}
                          <p className="text-[10px] text-slate-400 leading-tight">
                              Se intenta tomar por defecto la tasa del BCC (Banco Central de Cuba). Verifique si el valor es correcto antes de confirmar.
                          </p>
                      </div>
                  </div>

                  <button 
                      onClick={confirmRate}
                      disabled={!exchangeRate}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                  >
                      Confirmar y Vincular
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};
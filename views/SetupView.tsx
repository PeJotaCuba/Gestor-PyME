import React, { useState, useEffect } from 'react';
import { Store, Package, Layers, ArrowRight, DollarSign, X, RefreshCw, Globe, CheckCircle } from 'lucide-react';

interface SetupViewProps {
  onComplete: (name: string, linkExchangeRate: boolean, initialRate?: string, isManual?: boolean) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onComplete }) => {
  const [businessType, setBusinessType] = useState('retail');
  const [name, setName] = useState('');
  
  // Exchange Rate Logic
  const [linkExchangeRate, setLinkExchangeRate] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  
  // Dual State for Rate
  const [exchangeRate, setExchangeRate] = useState(''); // The active rate value
  const [bccRate, setBccRate] = useState(''); // The detected BCC rate
  const [isManual, setIsManual] = useState(false); // Toggle state
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // Check for existing business name on mount
  useEffect(() => {
    // Search for any existing config key
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('Gestor_') && key.endsWith('_config')) {
            // Extract name from key: Gestor_Nombre_Negocio_config
            const rawName = key.replace('Gestor_', '').replace('_config', '').replace(/_/g, ' ');
            if (rawName) {
                setName(rawName);
                // Also try to load previous exchange settings if available
                const rateKey = `Gestor_${rawName.replace(/\s+/g, '_')}_exchangeRate`;
                const rateData = localStorage.getItem(rateKey);
                if (rateData) {
                    const parsed = JSON.parse(rateData);
                    setLinkExchangeRate(true);
                    setExchangeRate(parsed.rate);
                    setIsManual(parsed.isManual);
                }
            }
            break;
        }
    }
  }, []);

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
                setBccRate(foundRate.toString());
                if (!isManual) {
                    setExchangeRate(foundRate.toString());
                }
            }
        }
    } catch (error) {
        console.warn("Error leyendo sitio BCC", error);
    } finally {
        setIsLoadingRate(false);
    }
  };

  const handleToggleExchange = () => {
      if (!linkExchangeRate) {
          // Turning ON
          setLinkExchangeRate(true);
          setShowRateModal(true);
          fetchBCCRate();
      } else {
          // Turning OFF
          setLinkExchangeRate(false);
          setExchangeRate('');
          setBccRate('');
      }
  };

  const confirmRate = () => {
      setShowRateModal(false);
  };

  const cancelRate = () => {
      setShowRateModal(false);
      setLinkExchangeRate(false);
      setExchangeRate('');
  };

  const handleManualToggle = (checked: boolean) => {
      setIsManual(checked);
      if (!checked && bccRate) {
          // If turning manual OFF, revert to BCC rate
          setExchangeRate(bccRate);
      }
  };

  const isValid = name.trim().length > 0;

  return (
    <div className="flex flex-col min-h-full px-6 pt-10 pb-12 relative max-w-lg mx-auto w-full">
      
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
          <label className="block text-sm font-semibold text-slate-300 ml-1">
            Nombre del Negocio <span className="text-orange-500">*</span>
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full bg-slate-800 border rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all duration-200 ${!isValid && name !== '' ? 'border-red-500/50' : 'border-slate-700'}`}
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
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between transition-colors hover:bg-slate-800">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <Globe size={24} />
                </div>
                <div>
                    <p className="font-bold text-sm text-white">Vincular a Tasa de Cambio</p>
                    <p className="text-xs text-slate-400">BCC Segmento III (Población)</p>
                </div>
            </div>
            <div 
                onClick={handleToggleExchange}
                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${linkExchangeRate ? 'bg-orange-500' : 'bg-slate-700'}`}
            >
                <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-6 w-6 transition-transform ${linkExchangeRate ? 'translate-x-full' : ''}`}></div>
            </div>
        </div>
        
        {/* Helper text */}
        {linkExchangeRate && exchangeRate && !showRateModal && (
            <div className="px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <p className="text-xs text-emerald-400 font-medium">
                     Tasa: <strong>${exchangeRate}</strong> {isManual ? '(Manual)' : '(BCC)'}
                 </p>
            </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-300 ml-1">Tipo de Negocio</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['retail', 'wholesale', 'mixed'].map((type) => (
                  <div 
                    key={type}
                    onClick={() => setBusinessType(type)}
                    className={`flex md:flex-col md:text-center md:justify-center items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${businessType === type ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-800'}`}
                  >
                    <div className={`p-2 rounded-lg mr-3 md:mr-0 md:mb-2 ${businessType === type ? 'bg-orange-500/20' : 'bg-slate-700'}`}>
                      {type === 'retail' && <Store className={businessType === type ? 'text-orange-500' : 'text-slate-400'} size={20} />}
                      {type === 'wholesale' && <Package className={businessType === type ? 'text-orange-500' : 'text-slate-400'} size={20} />}
                      {type === 'mixed' && <Layers className={businessType === type ? 'text-orange-500' : 'text-slate-400'} size={20} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm capitalize">{type === 'mixed' ? 'Modelo Mixto' : (type === 'retail' ? 'Minorista' : 'Mayorista')}</p>
                    </div>
                    <div className="md:hidden">
                        {businessType === type && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
                    </div>
                  </div>
              ))}
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="mt-8">
        <button 
            onClick={() => isValid && onComplete(name, linkExchangeRate, exchangeRate, isManual)}
            disabled={!isValid}
            className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 
                ${isValid 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-[0.98]' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-70'}`}
        >
            <span>Continuar</span>
            <ArrowRight size={20} />
        </button>
      </div>

       {/* Enhanced Exchange Rate Modal */}
       {showRateModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-6 rounded-3xl animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-800 border border-orange-500/30 p-6 rounded-2xl w-full shadow-2xl relative max-w-sm mx-auto">
                  <button onClick={cancelRate} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                      <X size={20} />
                  </button>
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-orange-500/20 rounded-full text-orange-500">
                          <Globe size={24} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-white">Configurar Tasa</h2>
                          <p className="text-xs text-slate-400">Actualiza el valor del USD</p>
                      </div>
                  </div>
                  
                  {/* BCC Rate Display */}
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
                      {!isManual && bccRate && (
                          <div className="absolute top-2 right-2">
                              <CheckCircle size={16} className="text-emerald-500" />
                          </div>
                      )}
                  </div>

                  {/* Manual Toggle */}
                  <div className="flex items-center justify-between mb-4 px-1">
                      <span className="text-sm font-bold text-white">Editar Tasa Manualmente</span>
                      <div 
                            onClick={() => handleManualToggle(!isManual)}
                            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isManual ? 'bg-orange-500' : 'bg-slate-600'}`}
                        >
                            <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform ${isManual ? 'translate-x-full' : ''}`}></div>
                        </div>
                  </div>
                  
                  <div className="mb-6 relative">
                      <div className="flex items-center gap-2">
                          <input 
                              type="number" 
                              value={exchangeRate}
                              onChange={(e) => setExchangeRate(e.target.value)}
                              disabled={!isManual}
                              className={`w-full border p-4 rounded-xl text-2xl font-bold text-white outline-none transition-all
                                  ${isManual 
                                    ? 'bg-slate-900 border-orange-500/50 focus:ring-2 focus:ring-orange-500' 
                                    : 'bg-slate-800/50 border-transparent text-slate-400 cursor-not-allowed'
                                  }`}
                              placeholder="0.00"
                          />
                          <span className="text-xl font-bold text-slate-400">CUP</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                          {isManual 
                            ? 'Estás editando la tasa manualmente. Este valor anulará la tasa oficial.' 
                            : 'Usando la tasa detectada automáticamente del Banco Central de Cuba.'}
                      </p>
                  </div>

                  <button 
                      onClick={confirmRate}
                      disabled={!exchangeRate}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                  >
                      Confirmar
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};
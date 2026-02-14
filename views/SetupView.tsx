
import React, { useState, useEffect, useRef } from 'react';
import { Store, Package, Layers, ArrowRight, DollarSign, X, RefreshCw, Globe, CheckCircle, Database, Upload, Download } from 'lucide-react';

interface SetupViewProps {
  onComplete: (name: string, linkExchangeRate: boolean, initialRate?: string, isManual?: boolean) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onComplete }) => {
  const [businessType, setBusinessType] = useState('retail');
  const [name, setName] = useState('');
  
  // Exchange Rate Logic - DEFAULT OFF
  const [linkExchangeRate, setLinkExchangeRate] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  
  // Dual State for Rate
  const [exchangeRate, setExchangeRate] = useState(''); // The active rate value
  const [bccRate, setBccRate] = useState(''); // The detected BCC rate
  const [isManual, setIsManual] = useState(false); // Toggle state
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for existing business name on mount
  useEffect(() => {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('Gestor_') && key.endsWith('_config')) {
            const rawName = key.replace('Gestor_', '').replace('_config', '').replace(/_/g, ' ');
            if (rawName) {
                setName(rawName);
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

  // --- Helper: Multi-Proxy Fetcher ---
  const fetchUrlContent = async (targetUrl: string): Promise<string | null> => {
      const proxies = [
          { url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, type: 'json' },
          { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`, type: 'text' },
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

  const fetchBCCRate = async () => {
    setIsLoadingRate(true);
    let foundRate = 0;

      try {
          const htmlContent = await fetchUrlContent('https://www.bc.gob.cu/tasas-de-cambio');
          if (htmlContent) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlContent, 'text/html');
              const rows = Array.from(doc.querySelectorAll('tr'));
              for (const row of rows) {
                  const text = row.innerText || row.textContent || '';
                  if (text.toUpperCase().includes('USD')) {
                       const numbers = text.match(/\d+([.,]\d+)?/g);
                       if (numbers) {
                           const values = numbers.map(n => parseFloat(n.replace(',', '.')));
                           const candidate = values.find(v => v > 60 && v < 500);
                           if (candidate) { foundRate = candidate; break; }
                       }
                  }
              }
          }
      } catch (e) { console.warn("BCC failed, trying Cubadebate..."); }

      if (foundRate === 0) {
          try {
              const htmlContent = await fetchUrlContent('http://www.cubadebate.cu/');
              if(htmlContent) {
                   const div = document.createElement('div');
                   div.innerHTML = htmlContent;
                   const textContent = div.textContent || "";
                   const regex = /1\s*USD\s*[x=]\s*(\d+([.,]\d+)?)\s*CUP/i;
                   const match = textContent.match(regex);
                   if (match && match[1]) {
                       const val = parseFloat(match[1].replace(',', '.'));
                       if (val > 20) foundRate = val;
                   }
              }
          } catch (e) { console.warn("Cubadebate failed."); }
      }

    setIsLoadingRate(false);
    if (foundRate > 0) {
        setBccRate(foundRate.toString());
        if (!isManual) setExchangeRate(foundRate.toString());
    }
  };

  const handleToggleExchange = () => {
      if (!linkExchangeRate) {
          setLinkExchangeRate(true);
          setShowRateModal(true);
          fetchBCCRate();
      } else {
          setLinkExchangeRate(false);
          setExchangeRate('');
          setBccRate('');
      }
  };

  const confirmRate = () => setShowRateModal(false);
  const cancelRate = () => { setShowRateModal(false); setLinkExchangeRate(false); setExchangeRate(''); };

  const handleManualToggle = (checked: boolean) => {
      setIsManual(checked);
      if (!checked && bccRate) setExchangeRate(bccRate);
  };

  // --- Backup & Restore Logic ---
  const handleBackup = () => {
      let csvContent = "data:text/csv;charset=utf-8,KEY,VALUE_JSON\n";
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('Gestor_')) {
              const val = localStorage.getItem(key);
              if (val) {
                  const escapedVal = val.replace(/"/g, '""');
                  csvContent += `${key},"${escapedVal}"\n`;
                  count++;
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
      alert(`Copia de seguridad generada con ${count} registros.`);
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          if (!content) return;
          const lines = content.split('\n');
          let restoredCount = 0;
          try {
              const keysToRemove = [];
              for(let i=0; i<localStorage.length; i++) {
                  const k = localStorage.key(i);
                  if(k && k.startsWith('Gestor_')) keysToRemove.push(k);
              }
              keysToRemove.forEach(k => localStorage.removeItem(k));

              lines.forEach((line, index) => {
                  if (index === 0) return; 
                  if (!line.trim()) return;
                  const firstCommaIndex = line.indexOf(',');
                  if (firstCommaIndex > -1) {
                      const key = line.substring(0, firstCommaIndex).trim();
                      let val = line.substring(firstCommaIndex + 1).trim();
                      if (val.startsWith('"') && val.endsWith('"')) {
                          val = val.substring(1, val.length - 1);
                          val = val.replace(/""/g, '"');
                      }
                      if (key && val && key.startsWith('Gestor_')) {
                          localStorage.setItem(key, val);
                          restoredCount++;
                      }
                  }
              });
              alert(`Restauración completada. Se recuperaron ${restoredCount} registros.`);
              window.location.reload();
          } catch (error) {
              alert("Error al procesar el archivo.");
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isValid = name.trim().length > 0;

  return (
    <div className="flex flex-col min-h-full px-6 pt-10 pb-12 relative max-w-lg mx-auto w-full">
      
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold mb-3 text-slate-900 dark:text-white leading-tight">
          Bienvenido a <span className="text-orange-500">GestorPyME</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
          Configuremos el perfil de tu negocio para comenzar a calcular tus márgenes reales.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            Nombre del Negocio <span className="text-orange-500">*</span>
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full bg-white dark:bg-slate-800 border rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all duration-200 ${!isValid && name !== '' ? 'border-red-500/50' : 'border-slate-200 dark:border-slate-700'}`}
            placeholder="ej. Comercializadora Azul"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Moneda Local</label>
          <div className="relative">
            <select className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none">
              <option value="CUP">CUP - Peso Cubano</option>
              <option value="USD">USD - Dólar Estadounidense</option>
              <option value="EUR">EUR - Euro</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <ArrowRight size={16} className="rotate-90" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between transition-colors shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <Globe size={24} />
                </div>
                <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Vincular a Tasa de Cambio</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">BCC o Cubadebate (Automático)</p>
                </div>
            </div>
            <div 
                onClick={handleToggleExchange}
                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${linkExchangeRate ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
                <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-6 w-6 transition-transform shadow-sm ${linkExchangeRate ? 'translate-x-full' : ''}`}></div>
            </div>
        </div>
        
        {/* Helper text */}
        {linkExchangeRate && exchangeRate && !showRateModal && (
            <div className="px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                     Tasa: <strong>${exchangeRate}</strong> {isManual ? '(Manual)' : '(Auto)'}
                 </p>
            </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Tipo de Negocio</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['retail', 'wholesale', 'mixed'].map((type) => (
                  <div 
                    key={type}
                    onClick={() => setBusinessType(type)}
                    className={`flex md:flex-col md:text-center md:justify-center items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${businessType === type ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800'}`}
                  >
                    <div className={`p-2 rounded-lg mr-3 md:mr-0 md:mb-2 ${businessType === type ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                      {type === 'retail' && <Store size={20} />}
                      {type === 'wholesale' && <Package size={20} />}
                      {type === 'mixed' && <Layers size={20} />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-sm capitalize ${businessType === type ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {type === 'mixed' ? 'Modelo Mixto' : (type === 'retail' ? 'Minorista' : 'Mayorista')}
                      </p>
                    </div>
                    <div className="md:hidden">
                        {businessType === type && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
                    </div>
                  </div>
              ))}
          </div>
        </div>

        {/* Data Management Section */}
        <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
             <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                <Database size={16} />
                Gestión de Datos
             </label>
             <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={handleBackup}
                    className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white transition-all shadow-sm"
                 >
                     <Download size={16} />
                     Copia Seguridad
                 </button>
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-orange-500 transition-all shadow-sm"
                 >
                     <Upload size={16} />
                     Restaurar
                 </button>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleRestore} 
                    accept=".csv" 
                    className="hidden" 
                 />
             </div>
             <p className="text-[10px] text-slate-400 text-center">Formato .CSV compatible con Excel para restaurar base de datos completa.</p>
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
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'}`}
        >
            <span>Continuar</span>
            <ArrowRight size={20} />
        </button>
      </div>

       {/* Enhanced Exchange Rate Modal */}
       {showRateModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-6 rounded-3xl animate-in fade-in zoom-in duration-200">
              <div className="bg-white dark:bg-slate-800 border border-orange-500/30 p-6 rounded-2xl w-full shadow-2xl relative max-w-sm mx-auto">
                  <button onClick={cancelRate} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X size={20} />
                  </button>
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-orange-500/20 rounded-full text-orange-500">
                          <Globe size={24} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configurar Tasa</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Actualiza el valor del USD</p>
                      </div>
                  </div>
                  
                  {/* BCC Rate Display */}
                  <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase">Tasa Detectada</span>
                          {/* Botón Manual de Actualizar */}
                          <button 
                                onClick={fetchBCCRate} 
                                className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-[10px] font-bold text-orange-500 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                          >
                                <RefreshCw size={10} className={isLoadingRate ? "animate-spin" : ""} />
                                ACTUALIZAR
                          </button>
                      </div>
                      {bccRate ? (
                          <div className="flex items-end gap-2">
                              <span className="text-2xl font-extrabold text-emerald-500 dark:text-emerald-400">${bccRate}</span>
                              <span className="text-sm font-bold text-slate-500 mb-1">CUP</span>
                          </div>
                      ) : (
                          <span className="text-sm text-slate-500 italic">
                               {isLoadingRate ? 'Consultando fuentes...' : 'Tasa no disponible. Intente actualizar.'}
                          </span>
                      )}
                      {!isManual && bccRate && (
                          <div className="absolute top-2 right-2">
                              <CheckCircle size={16} className="text-emerald-500" />
                          </div>
                      )}
                      <p className="text-[9px] text-slate-500 dark:text-slate-600 mt-1">Fuente: BC.gob.cu / Cubadebate</p>
                  </div>

                  {/* Manual Toggle */}
                  <div className="flex items-center justify-between mb-4 px-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Editar Tasa Manualmente</span>
                      <div 
                            onClick={() => handleManualToggle(!isManual)}
                            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isManual ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                            <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform shadow-sm ${isManual ? 'translate-x-full' : ''}`}></div>
                        </div>
                  </div>
                  
                  <div className="mb-6 relative">
                      <div className="flex items-center gap-2">
                          <input 
                              type="number" 
                              value={exchangeRate}
                              onChange={(e) => setExchangeRate(e.target.value)}
                              disabled={!isManual}
                              className={`w-full border p-4 rounded-xl text-2xl font-bold text-slate-900 dark:text-white outline-none transition-all
                                  ${isManual 
                                    ? 'bg-white dark:bg-slate-900 border-orange-500/50 focus:ring-2 focus:ring-orange-500' 
                                    : 'bg-slate-100 dark:bg-slate-800/50 border-transparent text-slate-400 cursor-not-allowed'
                                  }`}
                              placeholder="0.00"
                          />
                          <span className="text-xl font-bold text-slate-400">CUP</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                          {isManual 
                            ? 'Estás editando la tasa manualmente. Este valor anulará la tasa oficial.' 
                            : 'Usando la tasa detectada automáticamente.'}
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

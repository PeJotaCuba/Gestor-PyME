import React, { useState } from 'react';
import { ChevronLeft, Check, Info, ArrowRight, Eye, FileText, UploadCloud, Mic } from 'lucide-react';

interface ImportViewProps {
    onBack: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({ onBack }) => {
    const [step, setStep] = useState(1);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Mock Steps
    const handleNextStep = () => {
        if (step < 3) setStep(step + 1);
        if (step === 2) setPreviewOpen(true);
    };

    const handleUpload = () => {
        setStep(2);
    };

    const handleVoiceRecord = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Tu navegador no soporta grabación de voz. Intenta usar Chrome.");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);

        recognition.onresult = (event: any) => {
            const speechToText = event.results[0][0].transcript;
            console.log("Texto detectado:", speechToText);
            // Aquí iría la lógica para convertir este texto a formato tabular
            alert("Voz detectada: " + speechToText);
            setIsListening(false);
            setStep(2); // Simular éxito y pasar a mapeo
        };

        recognition.onerror = (event: any) => {
            console.error(event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 max-w-2xl mx-auto w-full">
             {/* Header */}
             <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
                <button onClick={onBack} className="text-orange-500">
                    <ChevronLeft />
                </button>
                <h1 className="text-lg font-bold text-white">Importar Productos</h1>
                <button onClick={onBack} className="text-orange-500 font-semibold text-sm">Cancelar</button>
            </header>

            {/* Stepper */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900">
                <div className={`flex flex-col items-center gap-1 ${step >= 1 ? '' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step > 1 ? 'bg-orange-500 text-white' : 'bg-orange-500/20 text-orange-500'} `}>
                        {step > 1 ? <Check size={14} /> : <span className="text-sm font-bold">1</span>}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${step === 1 ? 'text-orange-500' : 'text-slate-400'}`}>Cargar</span>
                </div>
                <div className={`h-[2px] flex-1 mx-2 mb-4 ${step > 1 ? 'bg-orange-500' : 'bg-slate-800'}`}></div>
                
                <div className={`flex flex-col items-center gap-1 ${step >= 2 ? '' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step > 2 ? 'bg-orange-500 text-white' : (step === 2 ? 'bg-orange-500 text-white ring-4 ring-orange-500/20' : 'bg-slate-800 text-slate-500')}`}>
                         {step > 2 ? <Check size={14} /> : <span className="text-sm font-bold">2</span>}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${step === 2 ? 'text-orange-500' : 'text-slate-400'}`}>Mapear</span>
                </div>
                <div className={`h-[2px] flex-1 mx-2 mb-4 ${step > 2 ? 'bg-orange-500' : 'bg-slate-800'}`}></div>
                
                <div className={`flex flex-col items-center gap-1 ${step >= 3 ? '' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 3 ? 'bg-orange-500 text-white ring-4 ring-orange-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        <span className="text-sm font-bold">3</span>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${step === 3 ? 'text-orange-500' : 'text-slate-400'}`}>Revisar</span>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto px-6 py-6 pb-32">
                 
                 {/* Step 1: Upload */}
                 {step === 1 && (
                     <div className="flex flex-col items-center justify-center h-full space-y-6 pt-6">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-600">
                            <FileText size={40} className="text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white text-center">Sube tu archivo TXT</h2>
                        <p className="text-slate-400 text-center text-sm max-w-xs">
                            Asegúrate de que tu archivo de texto esté delimitado por tabulaciones, comas o punto y coma.
                        </p>
                        
                        <button 
                            onClick={handleUpload}
                            className="w-full max-w-xs bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 mt-4"
                        >
                            <UploadCloud size={20} />
                            <span>Seleccionar Archivo .TXT</span>
                        </button>

                         <div className="w-full max-w-xs border-t border-slate-800 my-4 relative">
                            <span className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-xs text-slate-500">O</span>
                         </div>

                        <button 
                            onClick={handleVoiceRecord}
                            className={`w-full max-w-xs ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-800'} hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-slate-700 transition-all active:scale-[0.98] flex items-center justify-center space-x-2`}
                        >
                            <Mic size={20} className={isListening ? 'text-white' : 'text-orange-500'} />
                            <span>{isListening ? 'Escuchando...' : 'Grabar Voz a Texto'}</span>
                        </button>
                        <p className="text-[10px] text-slate-500 max-w-xs text-center">Formato sugerido: "Nombre producto [pausa] precio"</p>

                     </div>
                 )}

                 {/* Step 2: Map */}
                 {step >= 2 && (
                    <>
                        {/* File Info */}
                        <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20 mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                    <FileText className="text-orange-500" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">inventario_t3.txt</p>
                                    <p className="text-xs opacity-60 text-slate-300">1.2 MB • 450 filas detectadas</p>
                                </div>
                            </div>
                            <button onClick={() => setStep(1)} className="text-orange-500 text-sm font-semibold">Cambiar</button>
                        </div>

                        {/* Delimiter */}
                        <div className="mb-8">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block text-slate-400">Delimitador Detectado</label>
                            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-800/50 rounded-lg">
                                <button className="py-2 text-xs font-bold bg-slate-700 rounded shadow-sm text-orange-400 ring-1 ring-orange-500/50">Coma</button>
                                <button className="py-2 text-xs font-bold opacity-60 text-slate-400">Punto y coma</button>
                                <button className="py-2 text-xs font-bold opacity-60 text-slate-400">Tabulación</button>
                            </div>
                        </div>

                        {/* Mapping */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-slate-400">Mapeo de Columnas</label>
                                <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full font-bold">3/5 Coincidencias</span>
                            </div>

                            <div className="space-y-3">
                                {/* Map Item */}
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                            <span className="text-sm font-bold text-white">Nombre del Producto</span>
                                            <span className="text-[10px] text-orange-500/80 font-medium tracking-tighter">*Requerido</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <select className="w-full bg-slate-900 border-none rounded-lg text-sm font-medium py-3 px-4 appearance-none focus:ring-2 focus:ring-orange-500/50 text-white outline-none">
                                            <option>item_title</option>
                                            <option>product_name</option>
                                            <option>description</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Map Item 2 */}
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 ring-1 ring-orange-500/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                            <span className="text-sm font-bold text-white">Costo Unitario</span>
                                        </div>
                                        <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">Auto-asociado</span>
                                    </div>
                                    <div className="relative">
                                        <select className="w-full bg-slate-900 border-none rounded-lg text-sm font-medium py-3 px-4 appearance-none focus:ring-2 focus:ring-orange-500/50 text-white outline-none">
                                            <option>cost_price</option>
                                            <option>purchase_price</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                 )}
            </main>

            {/* Bottom Actions */}
            {step >= 2 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900 border-t border-slate-800 z-40 max-w-md mx-auto">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1 mb-1">
                            <Info size={14} />
                            <span>Podrás prorratear gastos en la siguiente pantalla.</span>
                        </div>
                        <button 
                            onClick={handleNextStep}
                            className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                        >
                            {step === 2 ? 'Continuar a Revisión' : 'Finalizar Importación'}
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-t-[2rem] p-6 max-h-[80vh] overflow-hidden flex flex-col border-t border-slate-800 max-w-2xl mx-auto w-full">
                        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6"></div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Vista Previa</h2>
                            <button onClick={() => setPreviewOpen(false)} className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                        <div className="overflow-x-auto no-scrollbar -mx-6 md:mx-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest opacity-60 text-slate-300">Fila</th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest opacity-60 text-slate-300">Nombre</th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest opacity-60 text-slate-300">Costo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-white">
                                    <tr>
                                        <td className="px-6 py-4 text-sm opacity-60">1</td>
                                        <td className="px-6 py-4 text-sm font-medium">Silla de Bambú Eco</td>
                                        <td className="px-6 py-4 text-sm font-bold">$45.00</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm opacity-60">2</td>
                                        <td className="px-6 py-4 text-sm font-medium">Lámpara Escritorio</td>
                                        <td className="px-6 py-4 text-sm font-bold">$12.50</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm opacity-60">3</td>
                                        <td className="px-6 py-4 text-sm font-medium">Alfombra Algodón</td>
                                        <td className="px-6 py-4 text-sm font-bold">$120.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                         <div className="mt-8">
                            <button onClick={() => { setPreviewOpen(false); setStep(3); }} className="w-full py-4 bg-orange-500 rounded-xl font-bold text-white shadow-lg">Confirmar Importación</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
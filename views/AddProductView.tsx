import React, { useState } from 'react';
import { ChevronRight, Wallet, Layers, ScanBarcode, Truck } from 'lucide-react';

interface AddProductViewProps {
    onBack: () => void;
    onImportClick: () => void;
    businessName: string;
}

export const AddProductView: React.FC<AddProductViewProps> = ({ onBack, onImportClick, businessName }) => {
    const [purchasePrice, setPurchasePrice] = useState<number>(0);
    const [margin, setMargin] = useState<number>(35);
    const [transportAssociated, setTransportAssociated] = useState(false);
    
    // Simulación de costo de transporte prorrateado (traído del backend/storage)
    const estimatedTransportCost = transportAssociated ? 5.50 : 0;
    
    // Derived state
    const landedCost = purchasePrice + estimatedTransportCost;
    const salePrice = landedCost > 0 ? landedCost / (1 - (margin / 100)) : 0;
    const profit = salePrice - landedCost;

    const saveProduct = () => {
        // Lógica de guardado en "carpeta" (LocalStorage con prefijo)
        const storageKey = `Gestor_${businessName.replace(/\s+/g, '_')}_products`;
        const products = JSON.parse(localStorage.getItem(storageKey) || '[]');
        products.push({
            id: Date.now(),
            price: purchasePrice,
            transport: estimatedTransportCost,
            sale: salePrice,
            date: new Date().toISOString()
        });
        localStorage.setItem(storageKey, JSON.stringify(products));
        onBack();
    };

    return (
        <div className="pb-24 pt-2 max-w-2xl mx-auto w-full">
            {/* Custom Nav */}
            <div className="flex items-center justify-between px-4 py-2 sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 mb-6">
                <button onClick={onBack} className="text-orange-500 font-medium text-sm">Cancelar</button>
                <h1 className="font-bold text-white text-base">Nuevo Producto</h1>
                <button onClick={saveProduct} className="bg-orange-500 text-white px-4 py-1.5 rounded-full font-bold text-xs">Guardar</button>
            </div>

            <div className="p-4 space-y-6">
                
                {/* Switch to Import */}
                <div 
                    onClick={onImportClick}
                    className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-orange-900/30 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500 text-white p-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Importación Masiva</p>
                            <p className="text-xs text-orange-300">Cargar vía archivo .TXT</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-orange-400" />
                </div>

                {/* General Info */}
                <section className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Información General</h2>
                    <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 shadow-sm">
                        <div className="p-4 border-b border-slate-700/50">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Producto</label>
                            <input type="text" className="w-full bg-transparent border-none p-0 focus:ring-0 text-base text-white placeholder-slate-600 outline-none" placeholder="ej. Auriculares Inalámbricos" />
                        </div>
                        <div className="p-4">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
                            {/* Color options set to gray-900 (dark) for better visibility on white bg dropdowns or custom styled */}
                            <select className="w-full bg-transparent border-none p-0 focus:ring-0 text-base text-white appearance-none outline-none">
                                <option className="bg-slate-800 text-white">Electrónica</option>
                                <option className="bg-slate-800 text-white">Ropa de Mujer</option>
                                <option className="bg-slate-800 text-white">Ropa de Hombre</option>
                                <option className="bg-slate-800 text-white">Hogar y Cocina</option>
                                <option className="bg-slate-800 text-white">Juguetes</option>
                                <option className="bg-slate-800 text-white">Deportes</option>
                                <option className="bg-slate-800 text-white">Salud y Belleza</option>
                                <option className="bg-slate-800 text-white">Automotriz</option>
                                <option className="bg-slate-800 text-white">Mascotas</option>
                                <option className="bg-slate-800 text-white">Herramientas</option>
                            </select>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Costs */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Costos Directos</h2>
                            <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-bold">POR UNIDAD</span>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 shadow-sm h-full">
                            <div className="p-4 border-b border-slate-700/50">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Precio Compra</label>
                                <div className="flex items-center">
                                    <span className="text-slate-500 mr-1">$</span>
                                    <input 
                                        type="number" 
                                        value={purchasePrice || ''}
                                        onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-base font-semibold text-white placeholder-slate-600 outline-none" 
                                        placeholder="0.00" 
                                    />
                                </div>
                            </div>
                            
                            {/* Transport Toggle */}
                            <div className="p-4 bg-slate-900/30 flex items-center justify-between h-full">
                                <div className="flex items-center gap-3">
                                    <Truck size={20} className={transportAssociated ? "text-orange-500" : "text-slate-600"} />
                                    <div>
                                        <label className="block text-sm font-medium text-white">Transporte Asociado</label>
                                        <p className="text-[10px] text-slate-500">Asociar gasto del día ({new Date().toLocaleDateString()})</p>
                                    </div>
                                </div>
                                <div 
                                    onClick={() => setTransportAssociated(!transportAssociated)}
                                    className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${transportAssociated ? 'bg-orange-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform ${transportAssociated ? 'translate-x-full' : ''}`}></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Pricing Strategy */}
                    <section className="space-y-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Estrategia de Precios</h2>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 shadow-sm space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-semibold text-white">Margen de Ganancia</label>
                                    <span className="text-orange-500 font-bold text-lg">{margin}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={margin}
                                    onChange={(e) => setMargin(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Landed Cost Summary */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-medium text-orange-400 uppercase tracking-tight">Costo Total Puesto</p>
                        <p className="text-2xl font-bold text-orange-500">${landedCost.toFixed(2)}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Wallet className="text-orange-500" size={20} />
                    </div>
                </div>

                {/* Result Card */}
                <div className="pt-2">
                    <div className="flex justify-between items-center bg-orange-600 rounded-xl p-5 text-white shadow-lg shadow-orange-900/50">
                        <div>
                            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Precio de Venta Sugerido</p>
                            <p className="text-3xl font-bold">${salePrice.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Ganancia/Unidad</p>
                            <p className="text-lg font-bold text-white/90">${profit.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Variants */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                            <Layers className="text-pink-500" size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Variantes de Producto</p>
                            <p className="text-xs text-slate-500">Tallas, colores, materiales</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                </div>

                {/* Bottom Actions */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <button className="py-3 px-4 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Guardar Borrador</button>
                    <button onClick={saveProduct} className="py-3 px-4 rounded-xl font-bold text-white bg-orange-500 shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors">Publicar</button>
                </div>
            </div>
        </div>
    );
};
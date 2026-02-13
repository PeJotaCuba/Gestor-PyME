import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Save, Trash2, ArrowRight, Package } from 'lucide-react';
import { Product, StockMovement } from '../types';

interface TallerViewProps {
    businessName: string;
}

interface MaterialInput {
    id: number;
    name: string;
    cost: number;
    qty: number;
}

export const TallerView: React.FC<TallerViewProps> = ({ businessName }) => {
    const [materials, setMaterials] = useState<MaterialInput[]>([
        { id: Date.now(), name: '', cost: 0, qty: 1 }
    ]);
    const [finalProductName, setFinalProductName] = useState('');
    const [finalProductQty, setFinalProductQty] = useState(1);
    const [margin, setMargin] = useState(30);

    const addMaterial = () => {
        setMaterials([...materials, { id: Date.now(), name: '', cost: 0, qty: 1 }]);
    };

    const removeMaterial = (id: number) => {
        setMaterials(materials.filter(m => m.id !== id));
    };

    const updateMaterial = (id: number, field: keyof MaterialInput, value: any) => {
        setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    // Calculate Total Cost of Inputs
    const totalInputCost = materials.reduce((sum, m) => sum + (m.cost * m.qty), 0);
    // Cost Per Unit of Finished Product
    const costPerUnit = finalProductQty > 0 ? totalInputCost / finalProductQty : 0;
    
    // Suggest Sale Price
    const suggestedPrice = costPerUnit / (1 - (margin/100));

    const handleCreateProduct = () => {
        if (!finalProductName || totalInputCost <= 0) return;

        const storageKeyProd = `Gestor_${businessName.replace(/\s+/g, '_')}_products`;
        const storageKeyMov = `Gestor_${businessName.replace(/\s+/g, '_')}_movements`;
        
        const products: Product[] = JSON.parse(localStorage.getItem(storageKeyProd) || '[]');
        const movements: StockMovement[] = JSON.parse(localStorage.getItem(storageKeyMov) || '[]');

        const newId = Date.now();
        const newProduct: Product = {
            id: newId,
            name: finalProductName,
            category: 'Taller',
            price: costPerUnit,
            transport: 0, 
            sale: suggestedPrice,
            date: new Date().toISOString()
        };

        const newMovement: StockMovement = {
            id: Date.now() + 1,
            productId: newId,
            type: 'IN',
            quantity: finalProductQty,
            date: new Date().toISOString(),
            reason: 'WORKSHOP_OUTPUT'
        };

        products.push(newProduct);
        movements.push(newMovement);

        localStorage.setItem(storageKeyProd, JSON.stringify(products));
        localStorage.setItem(storageKeyMov, JSON.stringify(movements));

        alert("Producto creado y añadido al inventario.");
        
        // Reset
        setMaterials([{ id: Date.now(), name: '', cost: 0, qty: 1 }]);
        setFinalProductName('');
        setFinalProductQty(1);
    };

    return (
        <div className="flex flex-col h-full space-y-6 pb-24 px-1">
            <header className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-500">
                    <Wrench size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">Taller de Producción</h1>
                    <p className="text-xs text-slate-400">Formación de costo por insumos</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs Section */}
                <section className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-300 text-sm uppercase">Insumos / Materias Primas</h3>
                        <button onClick={addMaterial} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded flex items-center gap-1">
                            <Plus size={12} /> Agregar
                        </button>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {materials.map((m, idx) => (
                            <div key={m.id} className="grid grid-cols-12 gap-2 items-center bg-slate-900/50 p-2 rounded-lg">
                                <span className="col-span-1 text-slate-500 text-xs font-mono">{idx + 1}</span>
                                <div className="col-span-5">
                                    <input 
                                        type="text" 
                                        placeholder="Nombre Insumo"
                                        value={m.name}
                                        onChange={(e) => updateMaterial(m.id, 'name', e.target.value)}
                                        className="w-full bg-transparent text-sm text-white outline-none placeholder-slate-600"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <input 
                                        type="number" 
                                        placeholder="$ Costo"
                                        value={m.cost || ''}
                                        onChange={(e) => updateMaterial(m.id, 'cost', parseFloat(e.target.value))}
                                        className="w-full bg-slate-800 rounded px-2 py-1 text-sm text-white outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                     <input 
                                        type="number" 
                                        placeholder="Cant"
                                        value={m.qty}
                                        onChange={(e) => updateMaterial(m.id, 'qty', parseFloat(e.target.value))}
                                        className="w-full bg-slate-800 rounded px-2 py-1 text-sm text-white outline-none text-center"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <button onClick={() => removeMaterial(m.id)} className="text-slate-600 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400">Costo Total Insumos</span>
                        <span className="text-lg font-bold text-white">${totalInputCost.toFixed(2)}</span>
                    </div>
                </section>

                {/* Output Section */}
                <section className="bg-slate-800/50 p-4 rounded-2xl border border-blue-500/20 flex flex-col justify-between">
                    <div>
                         <h3 className="font-bold text-blue-400 text-sm uppercase mb-4 flex items-center gap-2">
                             <Package size={16} /> Producto Resultante
                         </h3>
                         <div className="space-y-4">
                             <div>
                                 <label className="text-xs text-slate-400 font-bold block mb-1">Nombre del Producto</label>
                                 <input 
                                    type="text"
                                    value={finalProductName}
                                    onChange={(e) => setFinalProductName(e.target.value)}
                                    placeholder="ej. Silla Artesanal"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                                 />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="text-xs text-slate-400 font-bold block mb-1">Cantidad Producida</label>
                                     <input 
                                        type="number"
                                        min="1"
                                        value={finalProductQty}
                                        onChange={(e) => setFinalProductQty(parseFloat(e.target.value))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none"
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs text-slate-400 font-bold block mb-1">Margen %</label>
                                     <input 
                                        type="number"
                                        value={margin}
                                        onChange={(e) => setMargin(parseFloat(e.target.value))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none"
                                     />
                                 </div>
                             </div>
                         </div>
                    </div>

                    <div className="mt-6 bg-blue-900/20 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Costo Unitario</span>
                            <span className="text-sm font-bold text-white">${costPerUnit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Precio Venta Sugerido</span>
                            <span className="text-xl font-bold text-blue-400">${suggestedPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCreateProduct}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Guardar en Inventario
                    </button>
                </section>
            </div>
        </div>
    );
};

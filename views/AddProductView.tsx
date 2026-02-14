
import React, { useState, useEffect } from 'react';
import { ChevronRight, Wallet, Layers, ScanBarcode, Truck, Plus, Minus, Tag, Percent } from 'lucide-react';
import { Product, StockMovement } from '../types';

interface AddProductViewProps {
    onBack: () => void;
    onImportClick: () => void;
    businessName: string;
}

export const AddProductView: React.FC<AddProductViewProps> = ({ onBack, onImportClick, businessName }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('General');
    const [purchasePrice, setPurchasePrice] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(1);
    const [margin, setMargin] = useState<number>(30);
    const [manualSalePrice, setManualSalePrice] = useState<number>(0);
    const [isManualPrice, setIsManualPrice] = useState(false);
    
    // Calculated Costs
    const [proratedCost, setProratedCost] = useState<number>(0);
    const [totalTaxAmount, setTotalTaxAmount] = useState<number>(0);

    // Calculate Everything (useEffect logic same as before)
    useEffect(() => {
        if (purchasePrice <= 0) return;

        const storageKeyExp = `Gestor_${businessName.replace(/\s+/g, '_')}_expenses`;
        const expenses: Record<string, any> = JSON.parse(localStorage.getItem(storageKeyExp) || '{}');
        let totalFixedExpenses = 0;
        let totalTaxPercent = 0;

        if (expenses.taxes && expenses.taxes.taxList) {
             expenses.taxes.taxList.forEach((t: any) => {
                 totalTaxPercent += (parseFloat(t.percent) || 0);
             });
        } else {
            if (expenses.taxes?.salesTax) totalTaxPercent += parseFloat(expenses.taxes.salesTax);
            if (expenses.taxes?.incomeTax) totalTaxPercent += parseFloat(expenses.taxes.incomeTax);
            if (totalTaxPercent === 0) totalTaxPercent = 20; 
        }

        Object.entries(expenses).forEach(([key, val]: [string, any]) => {
            if (key !== 'taxes' && val.amount && val.isFixed) {
                const amount = parseFloat(val.amount);
                if (!isNaN(amount)) totalFixedExpenses += amount;
            }
        });

        const storageKeyProd = `Gestor_${businessName.replace(/\s+/g, '_')}_products`;
        const storageKeyMov = `Gestor_${businessName.replace(/\s+/g, '_')}_movements`;
        const products: Product[] = JSON.parse(localStorage.getItem(storageKeyProd) || '[]');
        const movements: StockMovement[] = JSON.parse(localStorage.getItem(storageKeyMov) || '[]');
        
        let totalInventoryValue = 0;
        products.forEach(p => {
             const inQty = movements.filter(m => m.productId === p.id && m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
             const outQty = movements.filter(m => m.productId === p.id && m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
             const stock = inQty - outQty;
             if (stock > 0) {
                 totalInventoryValue += (stock * (p.price + (p.transport || 0)));
             }
        });

        let allocationFactor = 0;
        if (totalInventoryValue > 0) {
            allocationFactor = purchasePrice / totalInventoryValue; 
        } else {
            allocationFactor = purchasePrice / 100000; 
        }

        const calculatedProration = totalFixedExpenses * allocationFactor;
        setProratedCost(calculatedProration);

        const baseCost = purchasePrice + calculatedProration;
        const provisionalPrice = baseCost / (1 - (margin / 100));
        const calculatedTax = provisionalPrice * (totalTaxPercent / 100);
        setTotalTaxAmount(calculatedTax);

        if (!isManualPrice) {
            setManualSalePrice(provisionalPrice + calculatedTax);
        }

    }, [purchasePrice, margin, businessName, isManualPrice]);

    const handleSave = () => {
        if (!name || purchasePrice <= 0) return;

        const storageKeyProd = `Gestor_${businessName.replace(/\s+/g, '_')}_products`;
        const storageKeyMov = `Gestor_${businessName.replace(/\s+/g, '_')}_movements`;
        
        const products: Product[] = JSON.parse(localStorage.getItem(storageKeyProd) || '[]');
        const movements: StockMovement[] = JSON.parse(localStorage.getItem(storageKeyMov) || '[]');

        const newId = Date.now();

        const newProduct: Product = {
            id: newId,
            name,
            category,
            price: purchasePrice,
            transport: proratedCost,
            sale: manualSalePrice,
            date: new Date().toISOString()
        };

        const newMovement: StockMovement = {
            id: Date.now() + 1,
            productId: newId,
            type: 'IN',
            quantity: quantity,
            date: new Date().toISOString(),
            reason: 'PROVISION'
        };

        products.push(newProduct);
        movements.push(newMovement);

        localStorage.setItem(storageKeyProd, JSON.stringify(products));
        localStorage.setItem(storageKeyMov, JSON.stringify(movements));
        
        onBack();
    };

    return (
        <div className="pb-24 pt-2 max-w-2xl mx-auto w-full px-4">
            {/* Custom Nav */}
            <div className="flex items-center justify-between py-4 sticky top-0 z-20 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 mb-6 transition-colors">
                <button onClick={onBack} className="text-orange-500 font-medium text-sm">Cancelar</button>
                <h1 className="font-bold text-slate-900 dark:text-white text-base">Nuevo Producto</h1>
                <button onClick={handleSave} className="bg-orange-500 text-white px-4 py-1.5 rounded-full font-bold text-xs">Guardar</button>
            </div>

            <div className="space-y-6">
                
                {/* Switch to Import */}
                <div 
                    onClick={onImportClick}
                    className="bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-500/30 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500 text-white p-2 rounded-lg">
                            <Tag size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Importación Masiva</p>
                            <p className="text-xs text-orange-600 dark:text-orange-300">Cargar vía archivo .TXT</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-orange-400" />
                </div>

                {/* General Info */}
                <section className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Información Básica</h2>
                    <div className="bg-white dark:bg-slate-800/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Producto</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-colors" 
                                placeholder="ej. Auriculares Inalámbricos" 
                            />
                        </div>
                         <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                            <label className="block text-xs font-medium text-slate-400">Cantidad Inicial</label>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"><Minus size={16}/></button>
                                <span className="text-xl font-bold text-slate-900 dark:text-white w-8 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"><Plus size={16}/></button>
                            </div>
                        </div>
                        <div className="p-4">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-base text-slate-900 dark:text-white appearance-none outline-none transition-colors"
                            >
                                <option className="bg-white dark:bg-slate-800" value="General">General</option>
                                <option className="bg-white dark:bg-slate-800" value="Alimentos">Alimentos</option>
                                <option className="bg-white dark:bg-slate-800" value="Electrónica">Electrónica</option>
                                <option className="bg-white dark:bg-slate-800" value="Ropa">Ropa</option>
                                <option className="bg-white dark:bg-slate-800" value="Hogar">Hogar</option>
                            </select>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Costs */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Costo Unitario</h2>
                        </div>
                        <div className="bg-white dark:bg-slate-800/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm h-full transition-colors">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Precio de Compra</label>
                                <div className="flex items-center">
                                    <span className="text-slate-500 mr-1">$</span>
                                    <input 
                                        type="number" 
                                        value={purchasePrice || ''}
                                        onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-colors" 
                                        placeholder="0.00" 
                                    />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Truck size={18} className="text-orange-500" />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-white">Prorrateo Gastos</label>
                                        <p className="text-[10px] text-slate-500">{(proratedCost > 0 ? 'Aplicado por valor' : 'Sin impacto significativo')}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-orange-500 text-sm">+${proratedCost.toFixed(2)}</span>
                            </div>
                            
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <Percent size={18} className="text-blue-500" />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-white">Impuestos</label>
                                        <p className="text-[10px] text-slate-500">Total Impuestos Configurados</p>
                                    </div>
                                </div>
                                <span className="font-bold text-blue-500 text-sm">+${totalTaxAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Pricing Strategy */}
                    <section className="space-y-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Formación de Precio</h2>
                        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-6 transition-colors">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-white">Margen de Ganancia</label>
                                    <span className="text-orange-500 font-bold text-lg">{margin}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={margin}
                                    onChange={(e) => { setMargin(parseInt(e.target.value)); setIsManualPrice(false); }}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Landed Cost Summary */}
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center shadow-sm">
                     <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">Costo Total (c/Impuestos)</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">${(purchasePrice + proratedCost + totalTaxAmount).toFixed(2)}</p>
                    </div>
                </div>

                {/* Result Card */}
                <div className="pt-2">
                    <div className="bg-orange-500 rounded-xl p-5 text-white shadow-lg shadow-orange-500/20">
                        <div className="flex justify-between items-start mb-2">
                             <p className="text-[10px] font-bold uppercase opacity-80">Precio de Venta Final</p>
                             {isManualPrice && <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded">Manual</span>}
                        </div>
                        <div className="flex items-center text-4xl font-bold">
                            <span>$</span>
                            <input 
                                type="number" 
                                value={manualSalePrice.toFixed(2)}
                                onChange={(e) => { setManualSalePrice(parseFloat(e.target.value) || 0); setIsManualPrice(true); }}
                                className="bg-transparent border-none text-white w-full outline-none p-0 ml-1 font-bold"
                            />
                        </div>
                        <p className="text-[10px] mt-1 opacity-70">Puedes editar este precio final manualmente.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

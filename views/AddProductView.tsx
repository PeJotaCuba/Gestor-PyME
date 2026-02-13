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
    const [taxes, setTaxes] = useState({ sales: 0, income: 0 }); // Amounts

    // Calculate Everything
    useEffect(() => {
        if (purchasePrice <= 0) return;

        // 1. Calculate Prorated Expenses (Fixed monthly expenses allocated to this product)
        const storageKeyExp = `Gestor_${businessName.replace(/\s+/g, '_')}_expenses`;
        const expenses: Record<string, any> = JSON.parse(localStorage.getItem(storageKeyExp) || '{}');
        let totalFixedExpenses = 0;
        let taxRates = { sales: 0.10, income: 0.10 };

        Object.entries(expenses).forEach(([key, val]: [string, any]) => {
            if (key === 'taxes') {
                if (val.salesTax) taxRates.sales = parseFloat(val.salesTax) / 100;
                if (val.incomeTax) taxRates.income = parseFloat(val.incomeTax) / 100;
            } else if (val.amount && val.isFixed) {
                const amount = parseFloat(val.amount);
                if (!isNaN(amount)) totalFixedExpenses += amount;
            }
        });

        // Get Total Inventory Value to determine weight
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

        // Add current item to potential inventory value to prevent division by zero or skewing
        // Formula: (Unit Purchase Price / Total Inventory Value) * Total Fixed Monthly Expenses
        // Note: Total Inventory Value includes existing inventory.
        // If inventory is empty, current item carries 100% of weight? No, that's unrealistic for the first item.
        // We use a safe fallback if inventory is 0.
        
        let allocationFactor = 0;
        if (totalInventoryValue > 0) {
            allocationFactor = purchasePrice / totalInventoryValue; 
        } else {
            // First item fallback: negligible allocation or manual policy. 
            // Using purchasePrice as a tiny fraction of a hypothetical target inventory (e.g. 100k) to avoid huge costs
            allocationFactor = purchasePrice / 100000; 
        }

        const calculatedProration = totalFixedExpenses * allocationFactor;
        setProratedCost(calculatedProration);

        // 2. Base Price Calculation (Cost + Proration)
        const baseCost = purchasePrice + calculatedProration;

        // 3. Provisional Price with Margin
        // Price = Cost / (1 - margin%)
        const provisionalPrice = baseCost / (1 - (margin / 100));

        // 4. Calculate Taxes based on Provisional Price
        const salesTaxAmount = provisionalPrice * taxRates.sales;
        const incomeTaxAmount = provisionalPrice * taxRates.income;
        
        setTaxes({ sales: salesTaxAmount, income: incomeTaxAmount });

        // 5. Set Final Suggested Price
        if (!isManualPrice) {
            setManualSalePrice(provisionalPrice + salesTaxAmount + incomeTaxAmount);
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
            transport: proratedCost, // Storing allocated overhead
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
        <div className="pb-24 pt-2 max-w-2xl mx-auto w-full">
            {/* Custom Nav */}
            <div className="flex items-center justify-between px-4 py-2 sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 mb-6">
                <button onClick={onBack} className="text-orange-500 font-medium text-sm">Cancelar</button>
                <h1 className="font-bold text-white text-base">Nuevo Producto</h1>
                <button onClick={handleSave} className="bg-orange-500 text-white px-4 py-1.5 rounded-full font-bold text-xs">Guardar</button>
            </div>

            <div className="p-4 space-y-6">
                
                {/* Switch to Import */}
                <div 
                    onClick={onImportClick}
                    className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-orange-900/30 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500 text-white p-2 rounded-lg">
                            <Tag size={16} />
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
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Información Básica</h2>
                    <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 shadow-sm">
                        <div className="p-4 border-b border-slate-700/50">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Producto</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-base text-white placeholder-slate-600 outline-none" 
                                placeholder="ej. Auriculares Inalámbricos" 
                            />
                        </div>
                         <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                            <label className="block text-xs font-medium text-slate-400">Cantidad Inicial</label>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white hover:bg-slate-600"><Minus size={16}/></button>
                                <span className="text-xl font-bold text-white w-8 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600"><Plus size={16}/></button>
                            </div>
                        </div>
                        <div className="p-4">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-base text-white appearance-none outline-none"
                            >
                                <option className="bg-slate-800 text-white" value="General">General</option>
                                <option className="bg-slate-800 text-white" value="Alimentos">Alimentos</option>
                                <option className="bg-slate-800 text-white" value="Electrónica">Electrónica</option>
                                <option className="bg-slate-800 text-white" value="Ropa">Ropa</option>
                                <option className="bg-slate-800 text-white" value="Hogar">Hogar</option>
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
                        <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 shadow-sm h-full">
                            <div className="p-4 border-b border-slate-700/50">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Precio de Compra</label>
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
                            
                            <div className="p-4 bg-slate-900/30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Truck size={18} className="text-orange-500" />
                                    <div>
                                        <label className="block text-sm font-medium text-white">Prorrateo Gastos</label>
                                        <p className="text-[10px] text-slate-500">{(proratedCost > 0 ? 'Aplicado por valor' : 'Sin impacto significativo')}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-orange-500 text-sm">+${proratedCost.toFixed(2)}</span>
                            </div>
                            
                            <div className="p-4 bg-slate-900/30 flex items-center justify-between border-t border-slate-800">
                                <div className="flex items-center gap-3">
                                    <Percent size={18} className="text-blue-500" />
                                    <div>
                                        <label className="block text-sm font-medium text-white">Impuestos Est.</label>
                                        <p className="text-[10px] text-slate-500">Ventas + Ingresos (20% aprox)</p>
                                    </div>
                                </div>
                                <span className="font-bold text-blue-500 text-sm">+${(taxes.sales + taxes.income).toFixed(2)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Pricing Strategy */}
                    <section className="space-y-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Formación de Precio</h2>
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
                                    onChange={(e) => { setMargin(parseInt(e.target.value)); setIsManualPrice(false); }}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Landed Cost Summary */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                     <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-tight">Costo Total (c/Impuestos)</p>
                        <p className="text-lg font-bold text-white">${(purchasePrice + proratedCost + taxes.sales + taxes.income).toFixed(2)}</p>
                    </div>
                </div>

                {/* Result Card */}
                <div className="pt-2">
                    <div className="bg-orange-600 rounded-xl p-5 text-white shadow-lg shadow-orange-900/50">
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
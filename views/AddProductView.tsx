
import React, { useState, useEffect } from 'react';
import { ChevronRight, Tag, Percent, Truck, CheckSquare, Square } from 'lucide-react';
import { Product, StockMovement } from '../types';

interface AddProductViewProps {
    onBack: () => void;
    onImportClick: () => void;
    businessName: string;
    editProduct?: Product;
}

export const AddProductView: React.FC<AddProductViewProps> = ({ onBack, onImportClick, businessName, editProduct }) => {
    const [name, setName] = useState(editProduct ? editProduct.name : '');
    const [category, setCategory] = useState(editProduct ? editProduct.category || 'General' : 'General');
    const [purchasePrice, setPurchasePrice] = useState<number>(editProduct ? editProduct.price : 0);
    
    // Quantity is editable and affects proration weight
    const [quantity, setQuantity] = useState<number>(editProduct && editProduct.stock ? editProduct.stock : 1);
    
    const [margin, setMargin] = useState<number>(30);
    const [manualSalePrice, setManualSalePrice] = useState<number>(editProduct ? editProduct.sale : 0);
    const [isManualPrice, setIsManualPrice] = useState(editProduct ? true : false);
    
    // Selective Expenses State
    const [availableExpenses, setAvailableExpenses] = useState<any[]>([]);
    const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);

    // Calculated Costs
    const [proratedCost, setProratedCost] = useState<number>(0);
    const [totalTaxAmount, setTotalTaxAmount] = useState<number>(0);
    const [inventoryWeight, setInventoryWeight] = useState<number>(0); // To display the % representation

    // Initialize Expenses
    useEffect(() => {
        const storageKeyExp = `Gestor_${businessName.replace(/\s+/g, '_')}_expenses`;
        const expenses: Record<string, any> = JSON.parse(localStorage.getItem(storageKeyExp) || '{}');
        
        const expenseList: any[] = [];
        Object.entries(expenses).forEach(([key, val]: [string, any]) => {
            if (key !== 'taxes' && val.amount) {
                const amount = parseFloat(val.amount);
                if (!isNaN(amount) && amount > 0) {
                    expenseList.push({ id: key, label: key === 'transport' ? 'Transporte' : key, ...val });
                }
            }
        });
        setAvailableExpenses(expenseList);

        if (editProduct && editProduct.applicableExpenses) {
            setSelectedExpenses(editProduct.applicableExpenses);
        } else {
             // Default: Select all relevant expenses
             setSelectedExpenses(expenseList.map(e => e.id));
        }
    }, [businessName, editProduct]);

    // --- CORE COST CALCULATION LOGIC ---
    useEffect(() => {
        if (purchasePrice < 0) return;

        // 1. Load Data
        const storageKeyProd = `Gestor_${businessName.replace(/\s+/g, '_')}_products`;
        const storageKeyMov = `Gestor_${businessName.replace(/\s+/g, '_')}_movements`;
        const storageKeyExp = `Gestor_${businessName.replace(/\s+/g, '_')}_expenses`;
        
        const products: Product[] = JSON.parse(localStorage.getItem(storageKeyProd) || '[]');
        const movements: StockMovement[] = JSON.parse(localStorage.getItem(storageKeyMov) || '[]');
        const expenses: Record<string, any> = JSON.parse(localStorage.getItem(storageKeyExp) || '{}');

        // 2. Calculate Total Existing Inventory Value (excluding current product if editing)
        let existingInventoryValue = 0;
        products.forEach(p => {
             // If we are editing, we ignore the OLD version of this product in the sum
             // to recalculate with the NEW values (price/qty)
             if (editProduct && p.id === editProduct.id) return;

             const inQty = movements.filter(m => m.productId === p.id && m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
             const outQty = movements.filter(m => m.productId === p.id && m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
             const stock = inQty - outQty;
             
             if (stock > 0) {
                 existingInventoryValue += (stock * p.price);
             }
        });

        // 3. Calculate Current Batch Value
        // If quantity is 0 (edge case), assume 1 for weight calculation to avoid NaN
        const calcQty = quantity > 0 ? quantity : 1;
        const currentBatchValue = purchasePrice * calcQty;
        
        // 4. Total Projected Inventory Value
        const totalInventoryValue = existingInventoryValue + currentBatchValue;
        
        // 5. Calculate Weight Factor (The % this product represents in total inventory)
        // Factor = (Price * Qty) / TotalInventoryValue
        let allocationFactor = 0;
        if (totalInventoryValue > 0) {
            allocationFactor = currentBatchValue / totalInventoryValue;
        } else {
            allocationFactor = 1; // It's the only thing in inventory
        }
        setInventoryWeight(allocationFactor * 100);

        // 6. Calculate Proration
        let totalApplicableFixedExpenses = 0;
        const productDate = editProduct ? new Date(editProduct.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        availableExpenses.forEach(exp => {
            if (selectedExpenses.includes(exp.id)) {
                if (exp.id === 'transport') {
                    // Transport applies if dates match
                    if (exp.date === productDate) {
                        totalApplicableFixedExpenses += parseFloat(exp.amount);
                    }
                } else if (exp.isFixed) {
                    // Fixed Expenses
                    totalApplicableFixedExpenses += parseFloat(exp.amount);
                }
            }
        });

        // The "Share" of the expense for this BATCH
        const batchExpenseShare = totalApplicableFixedExpenses * allocationFactor;
        
        // The "Unit" proration
        const calcUnitProration = batchExpenseShare / calcQty;
        const finalProration = Math.round(calcUnitProration * 100) / 100;
        setProratedCost(finalProration);

        // 7. Calculate Taxes & Price
        let totalTaxPercent = 0;
        if (expenses.taxes && expenses.taxes.taxList) {
             expenses.taxes.taxList.forEach((t: any) => {
                 totalTaxPercent += (parseFloat(t.percent) || 0);
             });
        } else {
            // Fallback for legacy data
            if (expenses.taxes?.salesTax) totalTaxPercent += parseFloat(expenses.taxes.salesTax);
            if (expenses.taxes?.incomeTax) totalTaxPercent += parseFloat(expenses.taxes.incomeTax);
            if (totalTaxPercent === 0) totalTaxPercent = 20; 
        }

        const baseCost = purchasePrice + finalProration;
        // Formula: Price = Cost / (1 - Margin%)
        const provisionalPrice = baseCost / (1 - (margin / 100));
        
        // Tax Amount (Cost component derived from Sale Price)
        const calculatedTax = Math.round((provisionalPrice * (totalTaxPercent / 100)) * 100) / 100;
        setTotalTaxAmount(calculatedTax);

        if (!isManualPrice) {
            // Final Price = Base + Markup + Tax
            // But usually Price includes Tax. 
            // If Price = Cost / (1-M), that's the price BEFORE tax if tax is added later?
            // Prompt says: "costo final suma... el por ciento aplicado de impuestos".
            // So Final Displayed Cost = Initial + Proration + Tax.
            // And Sale Price = Provisional + Tax.
            setManualSalePrice(Math.round((provisionalPrice + calculatedTax) * 100) / 100);
        }

    }, [purchasePrice, quantity, margin, businessName, isManualPrice, availableExpenses, selectedExpenses, editProduct]);

    const toggleExpense = (id: string) => {
        if (selectedExpenses.includes(id)) {
            setSelectedExpenses(prev => prev.filter(e => e !== id));
        } else {
            setSelectedExpenses(prev => [...prev, id]);
        }
    };

    const handleSave = () => {
        if (!name || purchasePrice <= 0) return;

        const storageKeyProd = `Gestor_${businessName.replace(/\s+/g, '_')}_products`;
        const storageKeyMov = `Gestor_${businessName.replace(/\s+/g, '_')}_movements`;
        
        const products: Product[] = JSON.parse(localStorage.getItem(storageKeyProd) || '[]');
        const movements: StockMovement[] = JSON.parse(localStorage.getItem(storageKeyMov) || '[]');

        if (editProduct) {
            // Update existing
            const updatedProducts = products.map(p => {
                if (p.id === editProduct.id) {
                    return {
                        ...p,
                        name,
                        category,
                        price: purchasePrice,
                        transport: proratedCost,
                        sale: manualSalePrice,
                        stock: quantity, // Update stock directly on edit if requested
                        applicableExpenses: selectedExpenses
                    };
                }
                return p;
            });
            localStorage.setItem(storageKeyProd, JSON.stringify(updatedProducts));
        } else {
            // Create New
            const newId = Date.now();
            const newProduct: Product = {
                id: newId,
                name,
                category,
                price: purchasePrice,
                transport: proratedCost,
                sale: manualSalePrice,
                date: new Date().toISOString(),
                applicableExpenses: selectedExpenses
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
        }
        
        onBack();
    };

    return (
        <div className="pb-24 pt-2 max-w-2xl mx-auto w-full px-4">
            {/* Custom Nav */}
            <div className="flex items-center justify-between py-4 sticky top-0 z-20 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 mb-6 transition-colors">
                <button onClick={onBack} className="text-orange-500 font-medium text-sm">Cancelar</button>
                <h1 className="font-bold text-slate-900 dark:text-white text-base">{editProduct ? 'Editar Producto' : 'Nuevo Producto'}</h1>
                <button onClick={handleSave} className="bg-orange-500 text-white px-4 py-1.5 rounded-full font-bold text-xs">
                    {editProduct ? 'Actualizar' : 'Guardar'}
                </button>
            </div>

            <div className="space-y-6">
                
                {/* Switch to Import (Only if new) */}
                {!editProduct && (
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
                )}

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
                            <label className="block text-xs font-medium text-slate-400">Cantidad (Stock)</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                    className="w-24 bg-slate-100 dark:bg-slate-700 rounded-lg p-2 text-center text-slate-900 dark:text-white font-bold outline-none border border-transparent focus:border-orange-500"
                                />
                                <span className="text-xs text-slate-500">unid.</span>
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
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ficha de Costo</h2>
                            <span className="text-[10px] text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full font-bold">
                                Peso en Inv: {inventoryWeight.toFixed(2)}%
                            </span>
                        </div>
                        <div className="bg-white dark:bg-slate-800/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm h-full transition-colors">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Costo Inicial (Compra)</label>
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
                            
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Truck size={18} className="text-orange-500" />
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-white">Prorrateo Unitario</label>
                                            <p className="text-[10px] text-slate-500">
                                                Basado en peso del inventario
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-orange-500 text-sm">+${proratedCost.toFixed(2)}</span>
                                </div>
                                
                                {/* Expense Selection Toggles */}
                                {availableExpenses.length > 0 && (
                                    <div className="pl-8 space-y-2 mt-2 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                                        {availableExpenses.map(exp => {
                                            const isSelected = selectedExpenses.includes(exp.id);
                                            return (
                                                <div 
                                                    key={exp.id} 
                                                    onClick={() => toggleExpense(exp.id)}
                                                    className="flex items-center justify-between cursor-pointer group"
                                                >
                                                    <span className={`text-[10px] ${isSelected ? 'text-slate-700 dark:text-slate-300 font-bold' : 'text-slate-400 line-through'}`}>
                                                        {exp.label} {exp.id === 'transport' ? `(${exp.date})` : ''}
                                                    </span>
                                                    {isSelected 
                                                        ? <CheckSquare size={12} className="text-orange-500" /> 
                                                        : <Square size={12} className="text-slate-300" />
                                                    }
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <Percent size={18} className="text-blue-500" />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-white">Impuestos Aplicados</label>
                                        <p className="text-[10px] text-slate-500">Calculado sobre precio venta</p>
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
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">Costo Total Final</p>
                        <p className="text-xs text-slate-400"> (Inicial + Prorrateo + Impuestos)</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">${(purchasePrice + proratedCost + totalTaxAmount).toFixed(2)}</p>
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

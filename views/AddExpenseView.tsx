
import React, { useState, useEffect } from 'react';
import { Home, Zap, CreditCard, Wifi, Droplets, Settings, Info, CheckCircle, Lightbulb, ChevronLeft, ChevronRight, Plus, Truck, Megaphone, Percent, Trash2, Edit2 } from 'lucide-react';

interface AddExpenseViewProps {
    onBack: () => void;
    businessName: string;
}

type TaxItem = {
    id: number;
    name: string;
    percent: number;
};

type ExpenseData = {
    amount: string;
    isFixed: boolean;
    prorationMethod: string;
    date?: string; 
    taxList?: TaxItem[]; // New structure for taxes
};

export const AddExpenseView: React.FC<AddExpenseViewProps> = ({ onBack, businessName }) => {
    const categories = [
        { id: 'transport', label: 'Transporte', icon: Truck },
        { id: 'marketing', label: 'Marketing', icon: Megaphone },
        { id: 'taxes', label: 'Impuestos', icon: Percent },
        { id: 'rent', label: 'Renta', icon: Home },
        { id: 'power', label: 'Luz', icon: Zap },
        { id: 'salaries', label: 'Salarios', icon: CreditCard },
        { id: 'internet', label: 'Internet', icon: Wifi },
        { id: 'water', label: 'Agua', icon: Droplets },
    ];

    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
    
    // Store data per category ID
    const [expensesData, setExpensesData] = useState<Record<string, ExpenseData>>({
        // Default taxes now use a list
        taxes: { 
            amount: '0', 
            isFixed: false, 
            prorationMethod: 'value', 
            taxList: [
                { id: 1, name: 'Sobre Ventas', percent: 10 },
                { id: 2, name: 'Ingresos Personales', percent: 10 }
            ] 
        },
        transport: { amount: '', isFixed: false, prorationMethod: 'units', date: new Date().toISOString().split('T')[0] } 
    });

    // Load existing data
    useEffect(() => {
        const storageKey = `Gestor_${businessName.replace(/\s+/g, '_')}_expenses`;
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            // Migrate old structure if needed
            if (parsed.taxes && !parsed.taxes.taxList) {
                parsed.taxes.taxList = [
                     { id: 1, name: 'Sobre Ventas', percent: parseFloat(parsed.taxes.salesTax || '10') },
                     { id: 2, name: 'Ingresos Personales', percent: parseFloat(parsed.taxes.incomeTax || '10') }
                ];
            }
            setExpensesData(prev => ({ ...prev, ...parsed }));
        }
    }, [businessName]);

    const currentCategory = categories[selectedCategoryIndex];
    const currentValues = expensesData[currentCategory?.id] || { 
        amount: '', 
        isFixed: true, 
        prorationMethod: 'value' 
    };

    // Tax UI State
    const [newTaxName, setNewTaxName] = useState('');
    const [newTaxPercent, setNewTaxPercent] = useState('');
    const [editingTaxId, setEditingTaxId] = useState<number | null>(null);

    const updateCurrentExpense = (field: keyof ExpenseData, value: any) => {
        if (!currentCategory) return;
        setExpensesData(prev => ({
            ...prev,
            [currentCategory.id]: {
                ...currentValues,
                [field]: value
            }
        }));
    };

    const handleAddTax = () => {
        if (!newTaxName || !newTaxPercent) return;
        const percent = parseFloat(newTaxPercent);
        if (isNaN(percent)) return;

        const currentList = currentValues.taxList || [];
        
        if (editingTaxId) {
             const updatedList = currentList.map(t => t.id === editingTaxId ? { ...t, name: newTaxName, percent } : t);
             updateCurrentExpense('taxList', updatedList);
             setEditingTaxId(null);
        } else {
             const newTax: TaxItem = { id: Date.now(), name: newTaxName, percent };
             updateCurrentExpense('taxList', [...currentList, newTax]);
        }
        
        setNewTaxName('');
        setNewTaxPercent('');
    };

    const handleEditTax = (tax: TaxItem) => {
        setNewTaxName(tax.name);
        setNewTaxPercent(tax.percent.toString());
        setEditingTaxId(tax.id);
    };

    const handleDeleteTax = (id: number) => {
        const currentList = currentValues.taxList || [];
        updateCurrentExpense('taxList', currentList.filter(t => t.id !== id));
    };

    const handlePrev = () => {
        setSelectedCategoryIndex(prev => (prev > 0 ? prev - 1 : categories.length - 1));
    };

    const handleNext = () => {
        setSelectedCategoryIndex(prev => (prev < categories.length - 1 ? prev + 1 : 0));
    };

    const handleValidate = () => {
        const finalData = { ...expensesData };
        if (finalData.salaries && finalData.salaries.amount) {
            const rawSalary = parseFloat(finalData.salaries.amount);
            finalData.salaries.amount = (rawSalary * 1.05).toFixed(2);
        }

        const storageKey = `Gestor_${businessName.replace(/\s+/g, '_')}_expenses`;
        localStorage.setItem(storageKey, JSON.stringify(finalData));
        onBack();
    };

    const getDisplayAmount = () => {
        if (currentCategory.id === 'salaries' && currentValues.amount) {
            return (parseFloat(currentValues.amount) * 1.05).toFixed(2);
        }
        return currentValues.amount;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 max-w-2xl mx-auto w-full transition-colors">
            <header className="px-6 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 border-b border-slate-200 dark:border-slate-800/50 mb-6 transition-colors">
                <button onClick={onBack} className="text-orange-500 font-medium text-sm">Cancelar</button> 
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Gastos Generales</h1>
                <button 
                    onClick={handleValidate} 
                    className="text-emerald-500 font-bold text-sm bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 active:scale-95 transition-transform"
                >
                    Validar
                </button>
            </header>

            <main className="flex-1 overflow-y-auto px-6 py-4 space-y-8 no-scrollbar pb-32">
                
                <section className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Seleccionar Categoría</label>
                    <div className="flex items-center justify-between gap-2">
                        <button onClick={handlePrev} className="p-2 shrink-0 rounded-full border border-slate-200 dark:border-slate-700 text-orange-500 bg-white dark:bg-slate-800 active:scale-95 transition-transform"><ChevronLeft size={20} /></button>
                        <div className="flex-1 overflow-hidden relative h-24 bg-white dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-transparent">
                             <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center transition-all duration-300">
                                <div className="flex flex-col items-center space-y-2 w-24 flex-shrink-0 cursor-pointer transition-all animate-in fade-in zoom-in duration-300" key={currentCategory.id}>
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg bg-orange-500 text-white shadow-orange-500/30 scale-105">
                                        <currentCategory.icon size={28} />
                                    </div>
                                    <span className="text-[10px] whitespace-nowrap font-bold text-slate-900 dark:text-white">{currentCategory.label}</span>
                                </div>
                             </div>
                        </div>
                        <button onClick={handleNext} className="p-2 shrink-0 rounded-full border border-slate-200 dark:border-slate-700 text-orange-500 bg-white dark:bg-slate-800 active:scale-95 transition-transform"><ChevronRight size={20} /></button>
                    </div>
                </section>

                {currentCategory.id === 'taxes' ? (
                     <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Percent size={16} className="text-orange-500"/>
                                Gestión de Impuestos
                            </h2>
                            
                            {/* Add/Edit Form */}
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        placeholder="Nombre del Impuesto"
                                        value={newTaxName}
                                        onChange={(e) => setNewTaxName(e.target.value)}
                                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm outline-none transition-colors"
                                    />
                                    <div className="relative w-24">
                                        <input 
                                            type="number" 
                                            placeholder="%"
                                            value={newTaxPercent}
                                            onChange={(e) => setNewTaxPercent(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm outline-none pr-6 transition-colors"
                                        />
                                        <span className="absolute right-2 top-2 text-slate-500 text-xs">%</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAddTax}
                                    className="w-full py-2 bg-orange-500 rounded-lg text-white font-bold text-xs hover:bg-orange-600 transition-colors"
                                >
                                    {editingTaxId ? 'Actualizar Impuesto' : 'Agregar Impuesto'}
                                </button>
                            </div>

                            {/* List */}
                            <div className="space-y-2">
                                {(currentValues.taxList || []).map(tax => (
                                    <div key={tax.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <span className="text-sm text-slate-900 dark:text-white font-medium">{tax.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-orange-500 font-bold">{tax.percent}%</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEditTax(tax)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Edit2 size={14}/></button>
                                                <button onClick={() => handleDeleteTax(tax.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!currentValues.taxList || currentValues.taxList.length === 0) && (
                                    <p className="text-center text-xs text-slate-500 italic">No hay impuestos configurados.</p>
                                )}
                            </div>
                        </div>
                     </section>
                ) : (
                    <>
                        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="text-center py-6">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                                    {currentCategory.id === 'transport' ? 'Costo Transporte (Por Fecha)' : `Monto Mensual (${currentCategory?.label})`}
                                </label>
                                <div className="flex items-center justify-center space-x-1">
                                    <span className="text-4xl font-extrabold text-orange-500">$</span>
                                    <input 
                                        type="number"
                                        value={currentValues.amount}
                                        onChange={(e) => updateCurrentExpense('amount', e.target.value)}
                                        className="bg-transparent border-none text-5xl font-extrabold focus:ring-0 w-48 text-center placeholder-slate-300 dark:placeholder-slate-800 text-slate-900 dark:text-white outline-none transition-all"
                                        placeholder="0.00" 
                                    />
                                </div>
                                {currentCategory.id === 'salaries' && currentValues.amount && (
                                    <p className="text-xs text-emerald-500 mt-2 font-bold animate-pulse">
                                        +5% aplicado: Total ${getDisplayAmount()}
                                    </p>
                                )}
                            </div>

                            {currentCategory.id === 'transport' ? (
                                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">Fecha del Gasto</label>
                                    <input 
                                        type="date" 
                                        value={currentValues.date || new Date().toISOString().split('T')[0]}
                                        onChange={(e) => updateCurrentExpense('date', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-2">Los productos ingresados en esta fecha asumirán este costo prorrateado.</p>
                                </div>
                            ) : (
                                <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl flex border border-slate-200 dark:border-slate-700/50">
                                    <button className="flex-1 py-2 text-sm font-bold bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-900 dark:text-white transition-all">Mensual</button>
                                    <button className="flex-1 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Diario</button>
                                </div>
                            )}
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                        <Settings size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">Gasto Fijo</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">No cambia con el volumen de ventas</p>
                                    </div>
                                </div>
                                <div 
                                    onClick={() => updateCurrentExpense('isFixed', !currentValues.isFixed)}
                                    className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${currentValues.isFixed ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform ${currentValues.isFixed ? 'translate-x-full' : ''}`}></div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Método de Distribución</label>
                                    <Info size={16} className="text-orange-500" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div 
                                        onClick={() => updateCurrentExpense('prorationMethod', 'value')}
                                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${currentValues.prorationMethod === 'value' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">Prorrateo por Valor</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Los productos más caros absorben más gasto</p>
                                        </div>
                                        {currentValues.prorationMethod === 'value' ? <CheckCircle className="text-orange-500" size={20}/> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>}
                                    </div>

                                    <div 
                                        onClick={() => updateCurrentExpense('prorationMethod', 'units')}
                                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${currentValues.prorationMethod === 'units' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">Prorrateo por Unidades</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">División igualitaria entre cantidad producida</p>
                                        </div>
                                        {currentValues.prorationMethod === 'units' ? <CheckCircle className="text-orange-500" size={20}/> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {currentValues.amount && currentCategory.id !== 'taxes' && (
                     <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 animate-pulse">
                        <div className="flex space-x-3">
                            <Lightbulb className="text-orange-500" size={20} />
                            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                <strong>${getDisplayAmount()}</strong> de {currentCategory?.label} impactará tus costos unitarios.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

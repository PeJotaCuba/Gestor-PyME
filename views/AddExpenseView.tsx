import React, { useState } from 'react';
import { Home, Zap, CreditCard, Wifi, Droplets, Settings, Info, CheckCircle, Lightbulb, ChevronLeft, ChevronRight, Plus, Truck, Megaphone, Percent } from 'lucide-react';

interface AddExpenseViewProps {
    onBack: () => void;
    businessName: string;
}

// Define the structure for expense data
type ExpenseData = {
    amount: string;
    isFixed: boolean;
    prorationMethod: string;
    date?: string; // For Transport
    salesTax?: string; // For Taxes
    incomeTax?: string; // For Taxes
};

export const AddExpenseView: React.FC<AddExpenseViewProps> = ({ onBack, businessName }) => {
    // Updated Categories definition
    const categories = [
        { id: 'transport', label: 'Transporte', icon: Truck }, // Added Transport
        { id: 'marketing', label: 'Marketing', icon: Megaphone }, // Added Marketing
        { id: 'taxes', label: 'Impuestos', icon: Percent }, // Added Taxes
        { id: 'rent', label: 'Renta', icon: Home },
        { id: 'power', label: 'Luz', icon: Zap },
        { id: 'salaries', label: 'Salarios', icon: CreditCard },
        { id: 'internet', label: 'Internet', icon: Wifi },
        { id: 'water', label: 'Agua', icon: Droplets },
    ];

    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
    
    // Store data per category ID
    const [expensesData, setExpensesData] = useState<Record<string, ExpenseData>>({
        // Initialize default taxes
        taxes: { amount: '0', isFixed: false, prorationMethod: 'value', salesTax: '10', incomeTax: '10' },
        // Initialize Transport with today's date
        transport: { amount: '', isFixed: false, prorationMethod: 'units', date: new Date().toISOString().split('T')[0] } 
    });

    const currentCategory = categories[selectedCategoryIndex];
    
    // Get current values or defaults
    const currentValues = expensesData[currentCategory?.id] || { 
        amount: '', 
        isFixed: true, 
        prorationMethod: 'value' 
    };

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

    const handlePrev = () => {
        if (selectedCategoryIndex > 0) {
            setSelectedCategoryIndex(selectedCategoryIndex - 1);
        } else {
             // Loop to end for continuity feel
             setSelectedCategoryIndex(categories.length - 1);
        }
    };

    const handleNext = () => {
        if (selectedCategoryIndex < categories.length - 1) {
            setSelectedCategoryIndex(selectedCategoryIndex + 1);
        } else {
            // Loop to start for continuity feel
            setSelectedCategoryIndex(0);
        }
    };

    const handleValidate = () => {
        // Apply 5% logic to Salary before saving
        const finalData = { ...expensesData };
        if (finalData.salaries && finalData.salaries.amount) {
            const rawSalary = parseFloat(finalData.salaries.amount);
            finalData.salaries.amount = (rawSalary * 1.05).toFixed(2);
        }

        console.log("Saving to folder:", `Gestor_${businessName}_expenses`, finalData);
        // Save to LocalStorage "folder"
        const storageKey = `Gestor_${businessName.replace(/\s+/g, '_')}_expenses`;
        localStorage.setItem(storageKey, JSON.stringify(finalData));
        
        onBack();
    };

    // Helper to calculate display amount (especially for salary preview)
    const getDisplayAmount = () => {
        if (currentCategory.id === 'salaries' && currentValues.amount) {
            return (parseFloat(currentValues.amount) * 1.05).toFixed(2);
        }
        return currentValues.amount;
    };

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <header className="px-6 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-slate-900 z-10 border-b border-slate-800/50">
                <div className="w-16"></div> 
                <h1 className="text-lg font-bold text-white">Gastos Generales</h1>
                <button 
                    onClick={handleValidate} 
                    className="text-emerald-500 font-bold text-sm bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 active:scale-95 transition-transform"
                >
                    Validar
                </button>
            </header>

            <main className="flex-1 overflow-y-auto px-6 py-4 space-y-8 no-scrollbar pb-32">
                
                {/* Category Navigation - Adjusted for stability */}
                <section className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Seleccionar Categoría</label>
                    <div className="flex items-center justify-between gap-2">
                        <button 
                            onClick={handlePrev}
                            className="p-2 shrink-0 rounded-full border border-slate-700 text-orange-500 bg-slate-800 active:scale-95 transition-transform"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex-1 overflow-hidden relative h-24 bg-slate-800/20 rounded-xl">
                             <div 
                                className="absolute top-0 left-0 w-full h-full flex items-center justify-center transition-all duration-300"
                             >
                                {/* Render Previous, Current, Next for visual continuity feeling, but keep simple state */}
                                <div className="flex flex-col items-center space-y-2 w-24 flex-shrink-0 cursor-pointer transition-all animate-in fade-in zoom-in duration-300" key={currentCategory.id}>
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg bg-orange-500 text-white shadow-orange-500/30 scale-105">
                                        <currentCategory.icon size={28} />
                                    </div>
                                    <span className="text-[10px] whitespace-nowrap font-bold text-white">{currentCategory.label}</span>
                                </div>
                             </div>
                        </div>

                        <button 
                            onClick={handleNext}
                            className="p-2 shrink-0 rounded-full border border-slate-700 text-orange-500 bg-slate-800 active:scale-95 transition-transform"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </section>

                {/* Dynamic Content based on Category */}
                {currentCategory.id === 'taxes' ? (
                     <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Percent size={16} className="text-orange-500"/>
                                Configuración de Impuestos
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Impuesto sobre Ventas (%)</label>
                                    <div className="flex items-center space-x-2">
                                        <input 
                                            type="number"
                                            value={currentValues.salesTax || '10'}
                                            onChange={(e) => updateCurrentExpense('salesTax', e.target.value)}
                                            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xl font-bold text-white w-full outline-none focus:border-orange-500"
                                        />
                                        <span className="text-xl font-bold text-slate-500">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Ingresos Personales (%)</label>
                                    <div className="flex items-center space-x-2">
                                        <input 
                                            type="number"
                                            value={currentValues.incomeTax || '10'}
                                            onChange={(e) => updateCurrentExpense('incomeTax', e.target.value)}
                                            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xl font-bold text-white w-full outline-none focus:border-orange-500"
                                        />
                                        <span className="text-xl font-bold text-slate-500">%</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-4 italic">Estos porcentajes se aplicarán automáticamente al cálculo del precio de venta de cada producto.</p>
                        </div>
                     </section>
                ) : (
                    <>
                        {/* Standard Amount Input */}
                        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="text-center py-6">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                    {currentCategory.id === 'transport' ? 'Costo Transporte (Por Fecha)' : `Monto Mensual (${currentCategory?.label})`}
                                </label>
                                <div className="flex items-center justify-center space-x-1">
                                    <span className="text-4xl font-extrabold text-orange-500">$</span>
                                    <input 
                                        type="number"
                                        value={currentValues.amount}
                                        onChange={(e) => updateCurrentExpense('amount', e.target.value)}
                                        className="bg-transparent border-none text-5xl font-extrabold focus:ring-0 w-48 text-center placeholder-slate-800 text-white outline-none transition-all"
                                        placeholder="0.00" 
                                    />
                                </div>
                                {currentCategory.id === 'salaries' && currentValues.amount && (
                                    <p className="text-xs text-emerald-500 mt-2 font-bold animate-pulse">
                                        +5% aplicado: Total ${getDisplayAmount()}
                                    </p>
                                )}
                            </div>

                            {/* Specific Controls for Transport vs Others */}
                            {currentCategory.id === 'transport' ? (
                                <div className="bg-slate-800/50 p-4 rounded-xl">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Fecha del Gasto</label>
                                    <input 
                                        type="date" 
                                        value={currentValues.date || new Date().toISOString().split('T')[0]}
                                        onChange={(e) => updateCurrentExpense('date', e.target.value)}
                                        className="w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-2">Los productos ingresados en esta fecha asumirán este costo prorrateado.</p>
                                </div>
                            ) : (
                                <div className="bg-slate-800/50 p-1 rounded-xl flex">
                                    <button className="flex-1 py-2 text-sm font-bold bg-slate-700 rounded-lg shadow-sm text-white transition-all">Mensual</button>
                                    <button className="flex-1 py-2 text-sm font-bold text-slate-500 hover:text-slate-300">Diario</button>
                                </div>
                            )}
                        </section>

                        {/* Classification - Now includes Transport for proration settings */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                        <Settings size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">Gasto Fijo</p>
                                        <p className="text-xs text-slate-400">No cambia con el volumen de ventas</p>
                                    </div>
                                </div>
                                <div 
                                    onClick={() => updateCurrentExpense('isFixed', !currentValues.isFixed)}
                                    className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${currentValues.isFixed ? 'bg-orange-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform ${currentValues.isFixed ? 'translate-x-full' : ''}`}></div>
                                </div>
                            </div>

                            {/* Distribution Method */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Método de Distribución</label>
                                    <Info size={16} className="text-orange-500" />
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div 
                                        onClick={() => updateCurrentExpense('prorationMethod', 'value')}
                                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${currentValues.prorationMethod === 'value' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-800/30 hover:bg-slate-800'}`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-white">Prorrateo por Valor</p>
                                            <p className="text-xs text-slate-400">Los productos más caros absorben más gasto</p>
                                        </div>
                                        {currentValues.prorationMethod === 'value' ? <CheckCircle className="text-orange-500" size={20}/> : <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>}
                                    </div>

                                    <div 
                                        onClick={() => updateCurrentExpense('prorationMethod', 'units')}
                                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${currentValues.prorationMethod === 'units' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-800/30 hover:bg-slate-800'}`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-white">Prorrateo por Unidades</p>
                                            <p className="text-xs text-slate-400">División igualitaria entre cantidad producida</p>
                                        </div>
                                        {currentValues.prorationMethod === 'units' ? <CheckCircle className="text-orange-500" size={20}/> : <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {/* Insight */}
                {currentValues.amount && currentCategory.id !== 'taxes' && (
                     <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 animate-pulse">
                        <div className="flex space-x-3">
                            <Lightbulb className="text-orange-500" size={20} />
                            <p className="text-xs leading-relaxed text-slate-300">
                                <strong>${getDisplayAmount()}</strong> de {currentCategory?.label} impactará tus costos unitarios.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

import React, { useRef, useState, useEffect } from 'react';
import { Wallet, Package, PlusSquare, Receipt, TrendingUp, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { ViewState, Product, StockMovement, ContractSale, DailySale } from '../types';

interface DashboardViewProps {
  onChangeView: (view: ViewState) => void;
  businessName: string;
}

const COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#10b981'];

export const DashboardView: React.FC<DashboardViewProps> = ({ onChangeView, businessName }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showFullName, setShowFullName] = useState(false);
  
  // Real Calculated State
  const [inventoryValue, setInventoryValue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [pendingReceivables, setPendingReceivables] = useState(0);
  
  // Chart Data
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([]);
  const [barData, setBarData] = useState<{name: string, amt: number}[]>([]);

  // Calculate All Data
  useEffect(() => {
    const storageKeyProd = `Gestor_${businessName.replace(/\s+/g, '_')}_products`;
    const storageKeyMov = `Gestor_${businessName.replace(/\s+/g, '_')}_movements`;
    const storageKeyExp = `Gestor_${businessName.replace(/\s+/g, '_')}_expenses`;
    const storageKeyContract = `Gestor_${businessName.replace(/\s+/g, '_')}_sales_contract`;
    const storageKeyDaily = `Gestor_${businessName.replace(/\s+/g, '_')}_sales_daily`;
    
    // Load Data
    const products: Product[] = JSON.parse(localStorage.getItem(storageKeyProd) || '[]');
    const movements: StockMovement[] = JSON.parse(localStorage.getItem(storageKeyMov) || '[]');
    const expenses: Record<string, any> = JSON.parse(localStorage.getItem(storageKeyExp) || '{}');
    const contracts: ContractSale[] = JSON.parse(localStorage.getItem(storageKeyContract) || '[]');
    const dailies: DailySale[] = JSON.parse(localStorage.getItem(storageKeyDaily) || '[]');

    // 1. Calculate Inventory Value
    let totalVal = 0;
    products.forEach(p => {
        const inQty = movements.filter(m => m.productId === p.id && m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
        const outQty = movements.filter(m => m.productId === p.id && m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
        const stock = inQty - outQty;
        const cost = (p.price || 0) + (p.transport || 0);
        if (stock > 0) totalVal += (stock * cost);
    });
    setInventoryValue(totalVal);

    // 2. Calculate Expenses
    let calcExpenses = 0;
    const pieBreakdown: {name: string, value: number}[] = [];
    Object.entries(expenses).forEach(([key, val]: [string, any]) => {
        // Skip taxes as they are percentage based on sales
        if(key !== 'taxes' && val.amount) {
            const amount = parseFloat(val.amount);
            if(!isNaN(amount)) {
                calcExpenses += amount;
                let label = key;
                if(key === 'rent') label = 'Renta';
                if(key === 'salaries') label = 'Salarios';
                if(key === 'transport') label = 'Transporte';
                if(key === 'marketing') label = 'Marketing';
                if(key === 'power') label = 'Luz';
                
                pieBreakdown.push({ name: label, value: amount });
            }
        }
    });
    setTotalExpenses(calcExpenses);
    setPieData(pieBreakdown.length > 0 ? pieBreakdown : [{name: 'Sin datos', value: 1}]);

    // 3. Calculate Pending Receivables
    const pending = contracts
        .filter(c => c.status === 'PENDING')
        .reduce((sum, c) => sum + c.total, 0);
    setPendingReceivables(pending);

    // 4. Calculate Bar Data (Sales by Month)
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const salesByMonth = new Array(12).fill(0);
    
    dailies.forEach(s => {
        const d = new Date(s.date);
        salesByMonth[d.getMonth()] += s.total;
    });
    contracts.filter(c => c.status === 'PAID').forEach(s => {
        const d = new Date(s.date);
        salesByMonth[d.getMonth()] += s.total;
    });

    const chartData = salesByMonth.map((amt, index) => ({
        name: monthNames[index],
        amt: amt
    })).filter(d => d.amt > 0); 

    setBarData(chartData.length > 0 ? chartData : [{name: 'Sin datos', amt: 0}]);

  }, [businessName]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getInitials = (name: string) => {
      if (!name) return 'GP';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="px-5 pt-2 pb-32 md:pb-8 md:px-0 space-y-6">
      {/* Mobile-Only Header */}
      <header className="flex md:hidden justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Resumen Financiero</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Analítica PyME • CUP</p>
        </div>
        
        <div className="flex items-center space-x-3">
            {/* Initials / Full Name Toggle */}
            <div 
                onClick={() => setShowFullName(!showFullName)}
                className={`h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative shadow-sm
                    ${showFullName ? 'px-4 w-auto' : 'w-10'}`}
            >
                <div className={`flex items-center justify-center whitespace-nowrap transition-all duration-300`}>
                    {showFullName ? (
                        <span className="text-xs font-bold text-slate-900 dark:text-white animate-in fade-in slide-in-from-right-2">{businessName}</span>
                    ) : (
                        <span className="text-sm font-bold text-orange-500">{getInitials(businessName)}</span>
                    )}
                </div>
            </div>

             {/* Settings Button */}
             <button 
                onClick={() => onChangeView(ViewState.SETUP)}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Configurar Negocio"
            >
                <Settings size={20} />
            </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="relative">
        <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-500">RESUMEN GENERAL (CUP)</span>
            <div className="flex gap-2 md:hidden">
                <button onClick={() => scroll('left')} className="p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <ChevronLeft size={16} />
                </button>
                <button onClick={() => scroll('right')} className="p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>

        <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory"
        >
            {/* Inventory Card */}
            <div className="min-w-[280px] md:min-w-[300px] snap-center p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Valor de Inventario</p>
                        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">${inventoryValue.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                        <Package className="text-orange-600 dark:text-orange-500" size={24} />
                    </div>
                </div>
                <div className="flex gap-2 mt-auto">
                    <button 
                        onClick={() => onChangeView(ViewState.ADD_PRODUCT)} 
                        className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 transition-colors"
                    >
                        <PlusSquare size={14} /> Nuevo Prod.
                    </button>
                </div>
            </div>

            {/* Expenses Card */}
            <div className="min-w-[280px] md:min-w-[300px] snap-center p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Gastos Fijos Mes</p>
                        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">${totalExpenses.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-pink-500/10 rounded-xl group-hover:bg-pink-500/20 transition-colors">
                        <Receipt className="text-pink-600 dark:text-pink-500" size={24} />
                    </div>
                </div>
                <div className="flex gap-2 mt-auto">
                    <button 
                        onClick={() => onChangeView(ViewState.ADD_EXPENSE)}
                        className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 transition-colors"
                    >
                        <Settings size={14} /> Gestionar
                    </button>
                </div>
            </div>

            {/* Receivables Card */}
            <div className="min-w-[280px] md:min-w-[300px] snap-center p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Por Cobrar</p>
                        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">${pendingReceivables.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                        <Wallet className="text-purple-600 dark:text-purple-500" size={24} />
                    </div>
                </div>
                 <div className="flex gap-2 mt-auto">
                    <button 
                        onClick={() => onChangeView(ViewState.SALES)}
                        className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 transition-colors"
                    >
                        <TrendingUp size={14} /> Ver Ventas
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* Analytics Charts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <h3 className="text-slate-900 dark:text-white font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={20} />
                  Ventas Mensuales
              </h3>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}} 
                            dy={10}
                          />
                          <Tooltip 
                            contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                            cursor={{fill: 'transparent'}}
                          />
                          <Bar dataKey="amt" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Expenses Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <h3 className="text-slate-900 dark:text-white font-bold mb-6 flex items-center gap-2">
                  <Receipt className="text-pink-500" size={20} />
                  Desglose de Gastos
              </h3>
              <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                          >
                              {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {pieData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/30 px-2 py-1 rounded-md">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{entry.name}</span>
                      </div>
                  ))}
              </div>
          </div>
      </section>
    </div>
  );
};

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
        // Skip taxes as they are percentage based on sales, not direct fixed expenses usually shown in total sum
        if(key !== 'taxes' && val.amount) {
            const amount = parseFloat(val.amount);
            if(!isNaN(amount)) {
                calcExpenses += amount;
                
                // Map keys to labels for Pie Chart
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
    
    // Process Daily Sales
    dailies.forEach(s => {
        const d = new Date(s.date);
        salesByMonth[d.getMonth()] += s.total;
    });
    // Process Paid Contract Sales (Counts as realized income)
    contracts.filter(c => c.status === 'PAID').forEach(s => {
        const d = new Date(s.date);
        salesByMonth[d.getMonth()] += s.total;
    });

    const chartData = salesByMonth.map((amt, index) => ({
        name: monthNames[index],
        amt: amt
    })).filter(d => d.amt > 0); // Only show months with data, or show all if preferred

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
          <h1 className="text-2xl font-bold tracking-tight text-white">Resumen Financiero</h1>
          <p className="text-xs text-slate-400 font-medium">Analítica PyME • CUP</p>
        </div>
        
        <div className="flex items-center space-x-3">
            {/* Initials / Full Name Toggle */}
            <div 
                onClick={() => setShowFullName(!showFullName)}
                className={`h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative shadow-lg
                    ${showFullName ? 'px-4 w-auto' : 'w-10'}`}
            >
                <div className={`flex items-center justify-center whitespace-nowrap transition-all duration-300`}>
                    {showFullName ? (
                        <span className="text-xs font-bold text-white animate-in fade-in slide-in-from-right-2">{businessName}</span>
                    ) : (
                        <span className="text-sm font-bold text-orange-500">{getInitials(businessName)}</span>
                    )}
                </div>
            </div>

             {/* Settings Button */}
             <button 
                onClick={() => onChangeView(ViewState.SETUP)}
                className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="Configurar Negocio"
            >
                <Settings size={20} />
            </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="relative">
        <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-500">RESUMEN GENERAL (CUP)</span>
            <div className="flex gap-2 md:hidden">
                <button onClick={() => scroll('left')} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700">
                    <ChevronLeft size={16} />
                </button>
                <button onClick={() => scroll('right')} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
        
        <div 
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2 md:grid md:grid-cols-3 md:space-x-0 md:mx-0 md:px-0 md:gap-6 md:overflow-visible"
        >
          <div className="min-w-[280px] bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm shrink-0 md:w-auto md:min-w-0 hover:bg-slate-800 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <Wallet size={20} />
              </div>
            </div>
            <p className="text-sm text-slate-400 font-medium">Gastos Generales</p>
            <h2 className="text-2xl font-extrabold mt-1 text-white">${totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2})}</h2>
            <div className="mt-4 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 w-full opacity-50"></div>
            </div>
          </div>

          <div className="min-w-[280px] bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm shrink-0 md:w-auto md:min-w-0 hover:bg-slate-800 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                <Package size={20} />
              </div>
            </div>
            <p className="text-sm text-slate-400 font-medium">Valor de Inventario</p>
            <h2 className="text-2xl font-extrabold mt-1 text-white">${inventoryValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
            <div className="mt-4 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-1/2"></div>
            </div>
          </div>

           <div className="min-w-[280px] bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm shrink-0 md:w-auto md:min-w-0 hover:bg-slate-800 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                <Receipt size={20} />
              </div>
            </div>
            <p className="text-sm text-slate-400 font-medium">Cuentas por Cobrar</p>
            <h2 className="text-2xl font-extrabold mt-1 text-white">${pendingReceivables.toLocaleString('en-US', {minimumFractionDigits: 2})}</h2>
            <div className="mt-4 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-1/4"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 shadow-sm md:col-span-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-white">Desglose de Gastos</h3>
            </div>
            
            <div className="h-48 relative">
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
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Total</span>
                <span className="text-xl font-extrabold text-white">${totalExpenses.toLocaleString()}</span>
              </div>
            </div>
            {pieData.length > 0 && pieData[0].name !== 'Sin datos' && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {pieData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                            <span>{entry.name}</span>
                        </div>
                    ))}
                </div>
            )}
          </section>

          <div className="md:col-span-2 space-y-6 flex flex-col h-full">
              <section className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => onChangeView(ViewState.ADD_PRODUCT)}
                    className="flex flex-col items-center justify-center p-6 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-transform hover:bg-orange-600"
                >
                    <PlusSquare size={32} className="mb-2" />
                    <span className="font-bold text-base">Agregar Producto</span>
                </button>
                <button 
                    onClick={() => onChangeView(ViewState.ADD_EXPENSE)}
                    className="flex flex-col items-center justify-center p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white active:scale-95 transition-transform hover:bg-slate-800"
                >
                    <Receipt size={32} className="mb-2 text-orange-500" />
                    <span className="font-bold text-base">Nuevo Gasto</span>
                </button>
              </section>

              <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 shadow-sm flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-orange-500" />
                    <h3 className="font-bold text-lg text-white">Ventas Mensuales</h3>
                </div>
                </div>
                <div className="h-32 w-full flex-1 min-h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: 'white'}}
                            itemStyle={{color: '#f97316'}}
                            cursor={{fill: '#334155', opacity: 0.2}}
                        />
                        <Bar dataKey="amt" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                </div>
              </section>
          </div>
      </div>
    </div>
  );
};
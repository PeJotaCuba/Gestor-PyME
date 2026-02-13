import React, { useRef, useState } from 'react';
import { Wallet, Package, PlusSquare, Receipt, Zap, Truck, TrendingUp, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ViewState } from '../types';

interface DashboardViewProps {
  onChangeView: (view: ViewState) => void;
  businessName: string;
}

// Mock Data
const pieData = [
  { name: 'Costos Fijos', value: 27852 },
  { name: 'Variables', value: 14998 },
];
const COLORS = ['#f97316', '#ec4899'];

const barData = [
  { name: 'Ene', amt: 2400 },
  { name: 'Feb', amt: 1398 },
  { name: 'Mar', amt: 9800 },
  { name: 'Abr', amt: 3908 },
  { name: 'May', amt: 4800 },
  { name: 'Jun', amt: 3800 },
  { name: 'Jul', amt: 4300 },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onChangeView, businessName }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showFullName, setShowFullName] = useState(false);

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
    <div className="px-5 pt-2 pb-32 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tablero de Control</h1>
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

      {/* Horizontal Cards with Arrows */}
      <section className="relative">
        <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-500">RESUMEN FINANCIERO (CUP)</span>
            <div className="flex gap-2">
                <button 
                    onClick={() => scroll('left')} 
                    className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 active:scale-95 transition-all"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={() => scroll('right')} 
                    className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 active:scale-95 transition-all"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
        
        <div 
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2"
        >
          <div className="min-w-[280px] bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <Wallet size={20} />
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+12.4%</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">Gastos Generales</p>
            <h2 className="text-2xl font-extrabold mt-1 text-white">$42,850.00</h2>
            <div className="mt-4 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 w-3/4"></div>
            </div>
          </div>

          <div className="min-w-[280px] bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                <Package size={20} />
              </div>
              <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full">-2.1%</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">Valor de Inventario</p>
            <h2 className="text-2xl font-extrabold mt-1 text-white">$128,400.00</h2>
            <div className="mt-4 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-1/2"></div>
            </div>
          </div>

           <div className="min-w-[280px] bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                <Receipt size={20} />
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+5.0%</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">Cuentas por Cobrar</p>
            <h2 className="text-2xl font-extrabold mt-1 text-white">$15,230.00</h2>
            <div className="mt-4 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-1/4"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Donut Chart */}
      <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-white">Desglose de Costos</h3>
          <button className="text-orange-500 text-sm font-semibold">Detalles</button>
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
            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Proporción</span>
            <span className="text-2xl font-extrabold text-white">65%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 rounded-full bg-orange-500 mt-1"></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Costos Fijos</p>
              <p className="font-bold text-base text-white">$27,852</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 rounded-full bg-pink-500 mt-1"></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Variables</p>
              <p className="font-bold text-base text-white">$14,998</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="font-bold text-lg mb-4 text-white">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onChangeView(ViewState.ADD_PRODUCT)}
            className="flex flex-col items-center justify-center p-4 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
          >
            <PlusSquare size={28} className="mb-2" />
            <span className="font-bold text-sm">Agregar Producto</span>
          </button>
          <button 
            onClick={() => onChangeView(ViewState.ADD_EXPENSE)}
            className="flex flex-col items-center justify-center p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white active:scale-95 transition-transform"
          >
            <Receipt size={28} className="mb-2 text-orange-500" />
            <span className="font-bold text-sm">Nuevo Gasto</span>
          </button>
        </div>
      </section>

      {/* Bar Chart Trend */}
      <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-500" />
            <h3 className="font-bold text-lg text-white">Tendencia de Gastos</h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">ÚLTIMOS 30 DÍAS</span>
        </div>
        <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <Bar dataKey="amt" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Lists */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-white">Prorrateos Recientes</h3>
          <button className="text-orange-500 text-sm font-semibold">Ver Todo</button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 mr-4">
              <Zap size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-white">Servicios Mensuales</p>
              <p className="text-xs text-slate-500">Costo Fijo • Asignado</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-white">-$1,240</p>
              <p className="text-[10px] text-emerald-500 font-bold">ASIGNADO</p>
            </div>
          </div>
          
           <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mr-4">
              <Truck size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-white">Logística y Fletes</p>
              <p className="text-xs text-slate-500">Variable • Pendiente</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-white">-$890</p>
              <p className="text-[10px] text-amber-500 font-bold">EN ESPERA</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
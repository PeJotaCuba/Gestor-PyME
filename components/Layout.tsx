import React from 'react';
import { Signal, Wifi, Battery, DollarSign, RefreshCw } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  onNavigate?: (nav: string) => void;
  onAddClick?: () => void;
  activeNav?: string;
  // New props for global exchange rate
  currentExchangeRate?: string;
  onOpenExchange?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showNav = false, 
  onNavigate, 
  onAddClick,
  activeNav = 'home',
  currentExchangeRate,
  onOpenExchange
}) => {
  return (
    <div className="min-h-screen w-full flex justify-center bg-black">
      <div className="w-full max-w-md bg-slate-900 h-screen relative flex flex-col overflow-hidden shadow-2xl sm:rounded-3xl sm:h-[95vh] sm:mt-[2.5vh] border-slate-800 sm:border">
        
        {/* iOS Status Bar Simulation + Global Rate Trigger */}
        <div className="h-14 flex items-center justify-between px-6 pt-2 shrink-0 z-50 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800/50">
          <span className="text-white text-sm font-semibold">9:41</span>
          
          <div className="flex items-center gap-4">
             {/* Global Exchange Rate Pill */}
             {currentExchangeRate && (
                 <button 
                    onClick={onOpenExchange}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full py-1 px-2.5 transition-all active:scale-95"
                 >
                    <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                        <DollarSign size={10} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-bold text-white">1 = ${parseFloat(currentExchangeRate).toFixed(0)}</span>
                 </button>
             )}

             <div className="flex items-center space-x-2 text-white">
                <Signal size={16} fill="currentColor" />
                <Wifi size={16} />
                <Battery size={20} />
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative bg-slate-900 text-white">
          {children}
        </div>

        {/* Bottom Navigation */}
        {showNav && (
          <div className="h-20 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 flex justify-between items-center px-8 pb-2 absolute bottom-0 w-full z-40">
            <button 
              onClick={() => onNavigate?.('home')}
              className={`flex flex-col items-center ${activeNav === 'home' ? 'text-orange-500' : 'text-slate-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
              <span className="text-[10px] font-bold mt-1">Inicio</span>
            </button>
            
            <button 
              onClick={() => onNavigate?.('analytics')}
              className={`flex flex-col items-center ${activeNav === 'analytics' ? 'text-orange-500' : 'text-slate-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
              <span className="text-[10px] font-bold mt-1">Reportes</span>
            </button>

            <button 
              onClick={() => onNavigate?.('products')}
              className={`flex flex-col items-center ${activeNav === 'products' ? 'text-orange-500' : 'text-slate-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              <span className="text-[10px] font-bold mt-1">Productos</span>
            </button>

            <button 
               onClick={() => onNavigate?.('settings')}
               className={`flex flex-col items-center ${activeNav === 'settings' ? 'text-orange-500' : 'text-slate-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              <span className="text-[10px] font-bold mt-1">Ajustes</span>
            </button>
          </div>
        )}

        {/* iOS Home Indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700 rounded-full z-50"></div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Signal, Wifi, Battery, DollarSign, Home, BarChart2, Package, Settings, LogOut, Menu, ChevronLeft, CreditCard, ShoppingBag, Wrench, Banknote } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  onNavigate?: (nav: string) => void;
  onAddClick?: () => void;
  activeNav?: string;
  currentExchangeRate?: string;
  onOpenExchange?: () => void;
  isSetupMode?: boolean;
  businessName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showNav = false, 
  onNavigate, 
  onAddClick,
  activeNav = 'home',
  currentExchangeRate,
  onOpenExchange,
  isSetupMode = false,
  businessName = ''
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showFullNamePC, setShowFullNamePC] = useState(false);

  const getInitials = (name: string) => {
      if (!name) return 'GP';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex justify-center md:justify-start transition-all duration-300">
      
      {/* DESKTOP SIDEBAR */}
      {!isSetupMode && (
        <aside className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 h-screen sticky top-0 z-50 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
           <div className={`p-6 pb-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isSidebarCollapsed && (
                  <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 animate-in fade-in duration-300">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-lg">G</span>
                    </div>
                    <span className="whitespace-nowrap">Gestor<span className="text-orange-500">PyME</span></span>
                  </h1>
              )}
              {isSidebarCollapsed && (
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shrink-0 cursor-pointer" onClick={() => setIsSidebarCollapsed(false)}>
                      <span className="text-white font-bold text-xl">G</span>
                  </div>
              )}
              
              {!isSidebarCollapsed && (
                  <button onClick={() => setIsSidebarCollapsed(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                      <ChevronLeft size={20} />
                  </button>
              )}
           </div>

           {!isSidebarCollapsed && (
               <div className="px-8 mb-4 animate-in fade-in duration-300">
                    <p className="text-xs text-slate-500 font-medium">Versión Escritorio v1.4</p>
               </div>
           )}

           <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto no-scrollbar">
              <DesktopNavItem 
                icon={<Home size={20}/>} 
                label="Resumen Financiero" 
                active={activeNav === 'home'} 
                onClick={() => onNavigate?.('home')} 
                collapsed={isSidebarCollapsed}
              />
              <DesktopNavItem 
                icon={<ShoppingBag size={20}/>} 
                label="Ventas" 
                active={activeNav === 'sales'} 
                onClick={() => onNavigate?.('sales')} 
                collapsed={isSidebarCollapsed}
              />
              <DesktopNavItem 
                icon={<Package size={20}/>} 
                label="Productos" 
                active={activeNav === 'products'} 
                onClick={() => onNavigate?.('products')} 
                collapsed={isSidebarCollapsed}
              />
              <DesktopNavItem 
                icon={<Wrench size={20}/>} 
                label="Taller" 
                active={activeNav === 'workshop'} 
                onClick={() => onNavigate?.('workshop')} 
                collapsed={isSidebarCollapsed}
              />
              {/* Reordered: Accounts first, then Payments */}
              <DesktopNavItem 
                icon={<CreditCard size={20}/>} 
                label="Cuenta Corriente" 
                active={activeNav === 'accounts'} 
                onClick={() => onNavigate?.('accounts')} 
                collapsed={isSidebarCollapsed}
              />
              <DesktopNavItem 
                icon={<Banknote size={20}/>} 
                label="Pagos" 
                active={activeNav === 'payments'} 
                onClick={() => onNavigate?.('payments')} 
                collapsed={isSidebarCollapsed}
              />
              <div className="h-px bg-slate-800 my-2"></div>
              <DesktopNavItem 
                icon={<Settings size={20}/>} 
                label="Configuración" 
                active={activeNav === 'settings'} 
                onClick={() => onNavigate?.('settings')} 
                collapsed={isSidebarCollapsed}
              />
           </nav>
        </aside>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="w-full h-full flex-1 relative flex flex-col min-h-screen transition-all duration-300">
        
        {/* RESPONSIVE CONTAINER */}
        <div className={`
            w-full relative flex flex-col overflow-hidden mx-auto transition-all duration-300
            ${isSetupMode 
                ? 'md:max-w-lg md:h-auto md:min-h-0 md:bg-slate-900 md:rounded-3xl md:border md:border-slate-800 md:shadow-2xl md:my-auto' // Setup Mode Desktop Style
                : 'md:max-w-full md:h-[100dvh] md:bg-slate-900 md:rounded-none md:border-none md:shadow-none' // Dashboard Mode Desktop Style (Dynamic Viewport Height)
            }
            bg-slate-900 shadow-2xl h-[100dvh] sm:rounded-3xl sm:h-[95vh] sm:mt-[2.5vh] sm:border border-slate-800 max-w-md
        `}>
          
          {/* HEADER SECTION */}
          <div className="shrink-0 z-40 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800/50 relative">
            
            {/* MOBILE HEADER (iOS Style) */}
            <div className="h-14 flex md:hidden items-center justify-between px-6 pt-2">
              <span className="text-white text-sm font-semibold">9:41</span>
              <div className="flex items-center gap-4">
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

            {/* DESKTOP HEADER */}
            {!isSetupMode && (
                <div className="hidden md:flex h-20 items-center justify-between px-8 bg-slate-900">
                     <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {activeNav === 'home' && 'Resumen Financiero'}
                                {activeNav === 'sales' && 'Ventas'}
                                {activeNav === 'products' && 'Productos'}
                                {activeNav === 'accounts' && 'Cuenta Corriente'}
                                {activeNav === 'workshop' && 'Taller'}
                                {activeNav === 'payments' && 'Pagos'}
                                {activeNav === 'settings' && 'Configuración'}
                            </h2>
                            <p className="text-xs text-slate-400">Panel de Control</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                         {currentExchangeRate && (
                             <div 
                                onClick={onOpenExchange}
                                className="cursor-pointer flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 hover:bg-slate-700 transition-all"
                             >
                                <div className="bg-orange-500/20 p-2 rounded-lg text-orange-500">
                                    <DollarSign size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Tasa de Cambio</p>
                                    <p className="text-lg font-bold text-white leading-none">1 USD = ${parseFloat(currentExchangeRate).toFixed(0)} CUP</p>
                                </div>
                             </div>
                         )}
                         
                         {/* CLICKABLE INITIALS */}
                         <div 
                            onClick={() => setShowFullNamePC(!showFullNamePC)}
                            className={`h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20 cursor-pointer transition-all duration-300 overflow-hidden ${showFullNamePC ? 'px-4 w-auto' : 'w-10'}`}
                         >
                             {showFullNamePC ? (
                                <span className="text-sm whitespace-nowrap animate-in fade-in slide-in-from-right-2">{businessName}</span>
                             ) : (
                                getInitials(businessName)
                             )}
                         </div>
                     </div>
                </div>
            )}
          </div>

          {/* MAIN CONTENT SCROLL AREA */}
          <div className={`flex-1 overflow-y-auto no-scrollbar relative bg-slate-900 text-white ${!isSetupMode ? 'md:p-8' : ''}`}>
             <div className={`w-full h-full pb-24 md:pb-8 ${!isSetupMode ? 'md:max-w-7xl md:mx-auto' : ''}`}>
                {children}
             </div>
          </div>

          {/* MOBILE BOTTOM NAVIGATION */}
          {showNav && (
            <div className="md:hidden h-20 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 flex justify-between items-center px-6 pb-2 absolute bottom-0 w-full z-40 overflow-x-auto">
              <MobileNavIcon 
                  active={activeNav === 'home'} 
                  onClick={() => onNavigate?.('home')}
                  icon={<Home size={20} />}
                  label="Resumen"
              />
              <MobileNavIcon 
                  active={activeNav === 'sales'} 
                  onClick={() => onNavigate?.('sales')}
                  icon={<ShoppingBag size={20} />}
                  label="Ventas"
              />
               <MobileNavIcon 
                  active={activeNav === 'products'} 
                  onClick={() => onNavigate?.('products')}
                  icon={<Package size={20} />}
                  label="Prod."
              />
               <MobileNavIcon 
                  active={activeNav === 'workshop'} 
                  onClick={() => onNavigate?.('workshop')}
                  icon={<Wrench size={20} />}
                  label="Taller"
              />
              {/* Reordered for Mobile too */}
              <MobileNavIcon 
                  active={activeNav === 'accounts'} 
                  onClick={() => onNavigate?.('accounts')}
                  icon={<CreditCard size={20} />}
                  label="Cuentas"
              />
               <MobileNavIcon 
                  active={activeNav === 'payments'} 
                  onClick={() => onNavigate?.('payments')}
                  icon={<Banknote size={20} />}
                  label="Pagos"
              />
            </div>
          )}

          {/* iOS Home Indicator */}
          <div className="md:hidden absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700 rounded-full z-50"></div>
        </div>
      </div>
    </div>
  );
};

const DesktopNavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }> = ({ icon, label, active, onClick, collapsed }) => (
    <div 
        onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all 
            ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
            ${collapsed ? 'justify-center' : ''}
        `}
        title={label}
    >
        {icon}
        {!collapsed && <span className="font-bold text-sm whitespace-nowrap animate-in fade-in duration-200">{label}</span>}
        {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>}
    </div>
);

const MobileNavIcon: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center min-w-[50px] ${active ? 'text-orange-500' : 'text-slate-500'}`}
    >
      {icon}
      <span className="text-[10px] font-bold mt-1 whitespace-nowrap">{label}</span>
    </button>
);
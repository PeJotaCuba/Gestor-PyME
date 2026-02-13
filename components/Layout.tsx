import React, { useState } from 'react';
import { Signal, Wifi, Battery, DollarSign, Home, BarChart2, Package, Settings, LogOut, Menu, ChevronLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  onNavigate?: (nav: string) => void;
  onAddClick?: () => void;
  activeNav?: string;
  currentExchangeRate?: string;
  onOpenExchange?: () => void;
  isSetupMode?: boolean; // New prop to control sidebar visibility
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showNav = false, 
  onNavigate, 
  onAddClick,
  activeNav = 'home',
  currentExchangeRate,
  onOpenExchange,
  isSetupMode = false
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex justify-center md:justify-start transition-all duration-300">
      
      {/* DESKTOP SIDEBAR - Visible only on MD screens and up, AND if NOT in setup mode */}
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
                    <p className="text-xs text-slate-500 font-medium">Versión Escritorio v1.2</p>
               </div>
           )}

           <nav className="flex-1 px-4 space-y-2 mt-2">
              <DesktopNavItem 
                icon={<Home size={20}/>} 
                label="Inicio" 
                active={activeNav === 'home'} 
                onClick={() => onNavigate?.('home')} 
                collapsed={isSidebarCollapsed}
              />
              <DesktopNavItem 
                icon={<BarChart2 size={20}/>} 
                label="Reportes" 
                active={activeNav === 'analytics'} 
                onClick={() => onNavigate?.('analytics')} 
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
                icon={<Settings size={20}/>} 
                label="Configuración" 
                active={activeNav === 'settings'} 
                onClick={() => onNavigate?.('settings')} 
                collapsed={isSidebarCollapsed}
              />
           </nav>

           <div className="p-4 border-t border-slate-800">
               <button 
                  className={`flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full p-2 rounded-lg hover:bg-slate-800 ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title="Cerrar Sesión"
               >
                  <LogOut size={20} />
                  {!isSidebarCollapsed && <span className="text-sm font-bold whitespace-nowrap">Cerrar Sesión</span>}
               </button>
               
               {isSidebarCollapsed && (
                    <button onClick={() => setIsSidebarCollapsed(false)} className="mt-4 w-full flex justify-center p-2 text-slate-500 hover:text-white">
                        <Menu size={20} />
                    </button>
               )}
           </div>
        </aside>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="w-full h-full flex-1 relative flex flex-col min-h-screen transition-all duration-300">
        
        {/* RESPONSIVE CONTAINER */}
        <div className={`
            w-full relative flex flex-col overflow-hidden mx-auto transition-all duration-300
            ${isSetupMode 
                ? 'md:max-w-lg md:h-auto md:min-h-0 md:bg-slate-900 md:rounded-3xl md:border md:border-slate-800 md:shadow-2xl md:my-auto' // Setup Mode Desktop Style
                : 'md:max-w-full md:h-screen md:bg-slate-900 md:rounded-none md:border-none md:shadow-none' // Dashboard Mode Desktop Style
            }
            bg-slate-900 shadow-2xl h-screen sm:rounded-3xl sm:h-[95vh] sm:mt-[2.5vh] sm:border border-slate-800 max-w-md
        `}>
          
          {/* HEADER SECTION */}
          <div className="shrink-0 z-40 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800/50 relative">
            
            {/* MOBILE HEADER (iOS Style) */}
            <div className="h-14 flex md:hidden items-center justify-between px-6 pt-2">
              <span className="text-white text-sm font-semibold">9:41</span>
              <div className="flex items-center gap-4">
                 {/* Mobile Rate Widget */}
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

            {/* DESKTOP HEADER - Hidden in Setup Mode */}
            {!isSetupMode && (
                <div className="hidden md:flex h-20 items-center justify-between px-8 bg-slate-900">
                     <div className="flex items-center gap-4">
                        {isSidebarCollapsed && (
                            <button onClick={() => setIsSidebarCollapsed(false)} className="text-slate-400 hover:text-white transition-colors">
                                <Menu size={24} />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-white">Panel de Control</h2>
                            <p className="text-xs text-slate-400">Bienvenido de nuevo</p>
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
                         <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
                             GP
                         </div>
                     </div>
                </div>
            )}
          </div>

          {/* MAIN CONTENT SCROLL AREA */}
          <div className={`flex-1 overflow-y-auto no-scrollbar relative bg-slate-900 text-white ${!isSetupMode ? 'md:p-8' : ''}`}>
             {/* Content Constraint for Desktop Readability */}
             <div className={`w-full h-full ${!isSetupMode ? 'md:max-w-7xl md:mx-auto' : ''}`}>
                {children}
             </div>
          </div>

          {/* MOBILE BOTTOM NAVIGATION - Hidden on Desktop */}
          {showNav && (
            <div className="md:hidden h-20 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 flex justify-between items-center px-8 pb-2 absolute bottom-0 w-full z-40">
              <MobileNavIcon 
                  active={activeNav === 'home'} 
                  onClick={() => onNavigate?.('home')}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>}
                  label="Inicio"
              />
              <MobileNavIcon 
                  active={activeNav === 'analytics'} 
                  onClick={() => onNavigate?.('analytics')}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>}
                  label="Reportes"
              />
              <MobileNavIcon 
                  active={activeNav === 'products'} 
                  onClick={() => onNavigate?.('products')}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>}
                  label="Productos"
              />
              <MobileNavIcon 
                  active={activeNav === 'settings'} 
                  onClick={() => onNavigate?.('settings')}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>}
                  label="Ajustes"
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
      className={`flex flex-col items-center ${active ? 'text-orange-500' : 'text-slate-500'}`}
    >
      {icon}
      <span className="text-[10px] font-bold mt-1">{label}</span>
    </button>
);
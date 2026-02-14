
import React, { useState, useEffect } from 'react';
import { Signal, Wifi, Battery, DollarSign, Home, BarChart2, Package, Settings, LogOut, Menu, ChevronLeft, CreditCard, ShoppingBag, Wrench, Banknote, Sun, Moon, UserCircle, Terminal, X, ChevronRight } from 'lucide-react';
import { UserRole } from '../types';

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
  userRole?: UserRole;
  onLogout?: () => void;
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
  businessName = '',
  userRole = UserRole.LEADER,
  onLogout
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showFullNamePC, setShowFullNamePC] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Estado para el menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const getInitials = (name: string) => {
      if (!name) return 'GP';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleMobileNavigate = (nav: string) => {
      if (onNavigate) onNavigate(nav);
      setIsMobileMenuOpen(false);
  };

  const handleMobileLogout = () => {
      if (onLogout) onLogout();
      setIsMobileMenuOpen(false);
  };

  // Developer has same access as Leader, plus Dev Panel
  const isLeaderOrDev = userRole === UserRole.LEADER || userRole === UserRole.DEVELOPER;

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex justify-center md:justify-start transition-colors duration-300">
      
      {/* --- MOBILE DRAWER (MENU LATERAL DESLIZANTE) --- */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-visibility duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible delay-300'}`}>
         
         {/* Backdrop (Fondo Oscuro) */}
         <div 
            className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsMobileMenuOpen(false)}
         />
         
         {/* Panel Lateral */}
         <div className={`absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-out flex flex-col h-full ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
             
             {/* Cabecera del Drawer */}
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-950/50">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/20">
                        {getInitials(businessName)}
                    </div>
                    <div>
                        <h2 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight truncate max-w-[150px]">{businessName || 'Gestor PyME'}</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            {userRole === UserRole.DEVELOPER ? 'Desarrollador' : (userRole === UserRole.ASSISTANT ? 'Asistente' : 'Líder')}
                        </p>
                    </div>
                 </div>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                     <X size={24} />
                 </button>
             </div>

             {/* Lista de Navegación */}
             <div className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
                
                <div className="px-4 py-2 mt-2 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal</p>
                </div>
                
                {isLeaderOrDev && (
                    <MobileDrawerItem 
                        icon={<Home size={22} />} 
                        label="Resumen Financiero" 
                        active={activeNav === 'home'} 
                        onClick={() => handleMobileNavigate('home')}
                    />
                )}
                
                <MobileDrawerItem 
                    icon={<ShoppingBag size={22} />} 
                    label="Punto de Venta" 
                    active={activeNav === 'sales'} 
                    onClick={() => handleMobileNavigate('sales')}
                />
                
                <MobileDrawerItem 
                    icon={<Package size={22} />} 
                    label="Inventario" 
                    active={activeNav === 'products'} 
                    onClick={() => handleMobileNavigate('products')}
                />

                {isLeaderOrDev && (
                    <>
                        <div className="my-4 border-t border-slate-100 dark:border-slate-800 mx-4"></div>
                        <div className="px-4 py-2 mb-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión Operativa</p>
                        </div>

                        <MobileDrawerItem 
                            icon={<Wrench size={22} />} 
                            label="Taller de Producción" 
                            active={activeNav === 'workshop'} 
                            onClick={() => handleMobileNavigate('workshop')}
                        />
                        <MobileDrawerItem 
                            icon={<CreditCard size={22} />} 
                            label="Cuentas y Caja" 
                            active={activeNav === 'accounts'} 
                            onClick={() => handleMobileNavigate('accounts')}
                        />
                        <MobileDrawerItem 
                            icon={<Banknote size={22} />} 
                            label="Gastos y Pagos" 
                            active={activeNav === 'payments'} 
                            onClick={() => handleMobileNavigate('payments')}
                        />
                        <MobileDrawerItem 
                            icon={<Settings size={22} />} 
                            label="Configuración" 
                            active={activeNav === 'settings'} 
                            onClick={() => handleMobileNavigate('settings')}
                        />
                    </>
                )}

                {userRole === UserRole.DEVELOPER && (
                    <>
                        <div className="my-4 border-t border-slate-100 dark:border-slate-800 mx-4"></div>
                        <MobileDrawerItem 
                            icon={<Terminal size={22} className="text-red-500" />} 
                            label="Panel Dev" 
                            active={activeNav === 'dev_panel'} 
                            onClick={() => handleMobileNavigate('dev_panel')}
                            isDanger
                        />
                    </>
                )}
             </div>

             {/* Footer del Drawer */}
             <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
                <button 
                    onClick={handleMobileLogout}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:scale-[0.98]"
                >
                    <div className="flex items-center gap-3">
                        <LogOut size={20} />
                        <span className="font-bold text-sm">Cerrar Sesión</span>
                    </div>
                    <ChevronRight size={16} className="opacity-50" />
                </button>
                <p className="text-center text-[10px] text-slate-400 mt-4 font-medium">Gestor PyME v1.2.0</p>
             </div>
         </div>
      </div>


      {/* --- DESKTOP SIDEBAR (Sin cambios mayores) --- */}
      {!isSetupMode && (
        <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 z-50 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
           <div className={`p-6 pb-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isSidebarCollapsed && (
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 animate-in fade-in duration-300">
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
                  <button onClick={() => setIsSidebarCollapsed(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <ChevronLeft size={20} />
                  </button>
              )}
           </div>

           {!isSidebarCollapsed && (
               <div className="px-8 mb-4 animate-in fade-in duration-300">
                    <p className="text-xs text-slate-500 font-medium">
                        {userRole === UserRole.DEVELOPER ? 'Modo Desarrollador' : (userRole === UserRole.ASSISTANT ? 'Modo Asistente' : 'Modo Líder')}
                    </p>
               </div>
           )}

           <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto no-scrollbar">
              {isLeaderOrDev && (
                  <DesktopNavItem 
                    icon={<Home size={20}/>} 
                    label="Resumen Financiero" 
                    active={activeNav === 'home'} 
                    onClick={() => onNavigate?.('home')} 
                    collapsed={isSidebarCollapsed}
                  />
              )}
              
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

              {isLeaderOrDev && (
                  <>
                      <DesktopNavItem 
                        icon={<Wrench size={20}/>} 
                        label="Taller" 
                        active={activeNav === 'workshop'} 
                        onClick={() => onNavigate?.('workshop')} 
                        collapsed={isSidebarCollapsed}
                      />
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
                  </>
              )}
              
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2"></div>
              
              {isLeaderOrDev && (
                  <DesktopNavItem 
                    icon={<Settings size={20}/>} 
                    label="Configuración" 
                    active={activeNav === 'settings'} 
                    onClick={() => onNavigate?.('settings')} 
                    collapsed={isSidebarCollapsed}
                  />
              )}

              {userRole === UserRole.DEVELOPER && (
                  <DesktopNavItem 
                    icon={<Terminal size={20} className="text-red-500"/>} 
                    label="Panel Dev" 
                    active={activeNav === 'dev_panel'} 
                    onClick={() => onNavigate?.('dev_panel')} 
                    collapsed={isSidebarCollapsed}
                  />
              )}

              <div 
                  onClick={onLogout}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500
                      ${isSidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title="Cerrar Sesión"
              >
                  <LogOut size={20}/>
                  {!isSidebarCollapsed && <span className="font-bold text-sm whitespace-nowrap">Salir</span>}
              </div>
           </nav>
        </aside>
      )}

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="w-full h-full flex-1 relative flex flex-col min-h-screen transition-all duration-300">
        
        {/* RESPONSIVE CONTAINER */}
        <div className={`
            w-full relative flex flex-col overflow-hidden mx-auto transition-all duration-300
            ${isSetupMode 
                ? 'md:max-w-lg md:h-auto md:min-h-0 md:bg-white dark:md:bg-slate-900 md:rounded-3xl md:border md:border-slate-200 dark:md:border-slate-800 md:shadow-2xl md:my-auto'
                : 'md:max-w-full md:h-[100dvh] md:bg-slate-50 dark:md:bg-slate-900 md:rounded-none md:border-none md:shadow-none'
            }
            bg-slate-50 dark:bg-slate-900 shadow-2xl h-[100dvh] sm:rounded-3xl sm:h-[95vh] sm:mt-[2.5vh] sm:border border-slate-200 dark:border-slate-800 max-w-md
        `}>
          
          {/* HEADER SECTION */}
          <div className="shrink-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800/50 relative transition-colors duration-300">
            
            {/* MOBILE HEADER (Actualizado: Botón Menú Izquierda) */}
            <div className="h-16 flex md:hidden items-center justify-between px-4 pt-1">
              
              <div className="flex items-center gap-3">
                  {/* Hamburguesa Trigger */}
                  {showNav && (
                      <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                      >
                          <Menu size={28} strokeWidth={2.5} />
                      </button>
                  )}
                  
                  {/* Mobile Branding */}
                  <div className="flex items-center gap-1.5">
                     <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">Gestor<span className="text-orange-500">PyME</span></span>
                  </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center gap-2">
                 <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-orange-500 transition-colors">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>
                 {currentExchangeRate && isLeaderOrDev && (
                     <button 
                        onClick={onOpenExchange}
                        className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-1.5 px-3 transition-all active:scale-95"
                     >
                        <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                            <DollarSign size={10} strokeWidth={3} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-white">1=${parseFloat(currentExchangeRate).toFixed(0)}</span>
                     </button>
                 )}
              </div>
            </div>

            {/* DESKTOP HEADER */}
            {!isSetupMode && (
                <div className="hidden md:flex h-20 items-center justify-between px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
                     <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {activeNav === 'home' && 'Resumen Financiero'}
                                {activeNav === 'sales' && 'Ventas'}
                                {activeNav === 'products' && 'Productos'}
                                {activeNav === 'accounts' && 'Cuenta Corriente'}
                                {activeNav === 'workshop' && 'Taller'}
                                {activeNav === 'payments' && 'Pagos'}
                                {activeNav === 'settings' && 'Configuración'}
                                {activeNav === 'dev_panel' && 'Panel Desarrollador'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {userRole === UserRole.DEVELOPER ? 'Acceso Total + Dev' : (isLeaderOrDev ? 'Modo Líder' : 'Modo Asistente')}
                            </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <button 
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                         {currentExchangeRate && isLeaderOrDev && (
                             <div 
                                onClick={onOpenExchange}
                                className="cursor-pointer flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                             >
                                <div className="bg-orange-500/20 p-2 rounded-lg text-orange-500">
                                    <DollarSign size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Tasa de Cambio</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">1 USD = ${parseFloat(currentExchangeRate).toFixed(0)} CUP</p>
                                </div>
                             </div>
                         )}
                         
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
          <div className={`flex-1 overflow-y-auto no-scrollbar relative bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300 ${!isSetupMode ? 'md:p-8' : ''}`}>
             <div className={`w-full h-full pb-6 md:pb-8 ${!isSetupMode ? 'md:max-w-7xl md:mx-auto' : ''}`}>
                {children}
             </div>
          </div>

          {/* iOS Home Indicator */}
          <div className="md:hidden absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full z-[80]"></div>
        </div>
      </div>
    </div>
  );
};

const DesktopNavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }> = ({ icon, label, active, onClick, collapsed }) => (
    <div 
        onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all 
            ${active 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
            ${collapsed ? 'justify-center' : ''}
        `}
        title={label}
    >
        {icon}
        {!collapsed && <span className="font-bold text-sm whitespace-nowrap animate-in fade-in duration-200">{label}</span>}
        {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>}
    </div>
);

const MobileDrawerItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, isDanger?: boolean }> = ({ icon, label, active, onClick, isDanger }) => (
    <div 
        onClick={onClick}
        className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] mb-1
            ${active 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                : isDanger 
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}
        `}
    >
        {icon}
        <span className="font-bold text-sm">{label}</span>
        {active && <ChevronRight size={18} className="ml-auto text-white" />}
    </div>
);

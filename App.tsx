
import React, { useState, useEffect } from 'react';
import { ViewState, Product, UserRole, CloudUser } from './types';
import { Layout } from './components/Layout';
import { AuthView } from './views/AuthView';
import { DevPanelView } from './views/DevPanelView';
import { SetupView } from './views/SetupView';
import { DashboardView } from './views/DashboardView';
import { SalesView } from './views/SalesView';
import { ProductsListView } from './views/ProductsListView';
import { CurrentAccountView } from './views/CurrentAccountView';
import { AddProductView } from './views/AddProductView';
import { ImportView } from './views/ImportView';
import { AddExpenseView } from './views/AddExpenseView';
import { TallerView } from './views/TallerView';
import { PaymentsView } from './views/PaymentsView';
import { ChatView } from './views/ChatView';
import { RefreshCw, Key, Lock, ShieldCheck } from 'lucide-react';
import { CloudService } from './services/firebase'; // Ahora es servicio local

const App = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.AUTH);
  const [activeNav, setActiveNav] = useState('home');
  const [businessName, setBusinessName] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [currentUser, setCurrentUser] = useState<CloudUser | null>(null);
  const [licenseInput, setLicenseInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Exchange Rate State
  const [currentExchangeRate, setCurrentExchangeRate] = useState('');

  useEffect(() => {
    // Simular carga inicial rápida (ya no hay handshake con Firebase)
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  useEffect(() => {
    if (currentUser && currentView !== ViewState.AUTH && currentView !== ViewState.DEV_PANEL) {
        checkTrialStatus();
    }
  }, [currentUser, currentView]);

  const checkTrialStatus = () => {
    if (currentUser?.licenseValidated) return;
    
    if (currentUser?.trialUntil) {
        const until = new Date(currentUser.trialUntil);
        if (new Date() > until) {
            setCurrentView(ViewState.TRIAL_EXPIRED);
        }
    }
  };

  const handleActivateLicense = async () => {
      if (!licenseInput || !currentUser?.uid) return;
      setIsActivating(true);
      const success = await CloudService.activateLicense(currentUser.uid, licenseInput);
      if (success) {
          alert("¡Licencia validada con éxito! Reiniciando...");
          // Actualizar estado local del usuario
          setCurrentUser({ ...currentUser, licenseValidated: true });
          checkAppInitialization(currentUser.role);
      } else {
          alert("La clave de licencia no es válida o no corresponde a este usuario.");
      }
      setIsActivating(false);
  };

  const handleAuthSuccess = async (role: UserRole, key: string, syncData = false, userData?: CloudUser) => {
      setUserRole(role);
      setLicenseKey(key);
      if (userData) setCurrentUser(userData);
      checkAppInitialization(role);
  };

  const handleDevLogin = () => {
      setUserRole(UserRole.DEVELOPER);
      setCurrentView(ViewState.DEV_PANEL);
  };

  const checkAppInitialization = (role: UserRole) => {
    let foundConfig = false;
    let configName = '';
    // Buscar configuración en localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('Gestor_') && key.endsWith('_config')) {
            configName = key.replace('Gestor_', '').replace('_config', '').replace(/_/g, ' ');
            foundConfig = true; break;
        }
    }

    if (foundConfig) {
        setBusinessName(configName);
        // Cargar tasa de cambio si existe
        const rateKey = `Gestor_${configName.replace(/\s+/g, '_')}_exchangeRate`;
        const rateData = localStorage.getItem(rateKey);
        if (rateData) {
            const parsed = JSON.parse(rateData);
            setCurrentExchangeRate(parsed.rate);
        }
        setCurrentView(role === UserRole.ASSISTANT ? ViewState.SALES : ViewState.DASHBOARD);
    } else {
        setCurrentView(ViewState.SETUP);
    }
  };

  const handleLogout = async () => {
      await CloudService.logout();
      setUserRole(null);
      setLicenseKey('');
      setCurrentUser(null);
      setCurrentView(ViewState.AUTH);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <RefreshCw className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  const renderView = () => {
    if (currentView === ViewState.TRIAL_EXPIRED) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 dark:bg-slate-950">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                    <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Período de Prueba Expirado</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">Tus 7 días han terminado. Ingresa tu clave de licencia para recuperar el acceso.</p>
                <div className="w-full max-w-sm space-y-4">
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            value={licenseInput}
                            onChange={(e) => setLicenseInput(e.target.value)}
                            placeholder="Clave de Licencia (GP-XXX-...)"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 dark:text-white"
                        />
                    </div>
                    <button 
                        onClick={handleActivateLicense}
                        disabled={isActivating}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        {isActivating ? <RefreshCw className="animate-spin" /> : <ShieldCheck />}
                        Validar Licencia
                    </button>
                    <button onClick={handleLogout} className="text-slate-500 font-bold text-sm">Cerrar Sesión</button>
                </div>
            </div>
        );
    }

    switch (currentView) {
      case ViewState.AUTH: return <AuthView onSuccess={handleAuthSuccess} onDevLogin={handleDevLogin} />;
      case ViewState.DEV_PANEL: return <DevPanelView onLogout={handleLogout} />;
      case ViewState.SETUP: return <SetupView onComplete={(name) => { setBusinessName(name); checkAppInitialization(userRole!); }} />;
      case ViewState.DASHBOARD: return <DashboardView onChangeView={setCurrentView} businessName={businessName} userRole={userRole} />;
      case ViewState.SALES: return <SalesView businessName={businessName} />;
      case ViewState.PRODUCTS: return <ProductsListView businessName={businessName} />;
      case ViewState.CURRENT_ACCOUNT: return <CurrentAccountView businessName={businessName} />;
      case ViewState.WORKSHOP: return <TallerView businessName={businessName} />;
      case ViewState.PAYMENTS: return <PaymentsView businessName={businessName} />;
      case ViewState.CHAT: return currentUser ? <ChatView currentUser={currentUser} onBack={() => setCurrentView(ViewState.DASHBOARD)} /> : null;
      case ViewState.ADD_PRODUCT: return <AddProductView onBack={() => setCurrentView(ViewState.PRODUCTS)} onImportClick={() => setCurrentView(ViewState.IMPORT_PRODUCT)} businessName={businessName} />;
      case ViewState.IMPORT_PRODUCT: return <ImportView onBack={() => setCurrentView(ViewState.ADD_PRODUCT)} />;
      case ViewState.ADD_EXPENSE: return <AddExpenseView onBack={() => setCurrentView(ViewState.DASHBOARD)} businessName={businessName} />;
      default: return <DashboardView onChangeView={setCurrentView} businessName={businessName} userRole={userRole} />;
    }
  };

  const showNav = ![ViewState.AUTH, ViewState.DEV_PANEL, ViewState.SETUP, ViewState.TRIAL_EXPIRED, ViewState.ADD_PRODUCT, ViewState.IMPORT_PRODUCT, ViewState.ADD_EXPENSE].includes(currentView);

  return (
    <Layout 
        showNav={showNav || currentView === ViewState.CHAT} 
        activeNav={activeNav}
        onNavigate={(nav) => {
            setActiveNav(nav);
            if (nav === 'dev_panel') setCurrentView(ViewState.DEV_PANEL);
            else if (nav === 'home') setCurrentView(ViewState.DASHBOARD);
            else if (nav === 'sales') setCurrentView(ViewState.SALES);
            else if (nav === 'products') setCurrentView(ViewState.PRODUCTS);
            else if (nav === 'accounts') setCurrentView(ViewState.CURRENT_ACCOUNT);
            else if (nav === 'workshop') setCurrentView(ViewState.WORKSHOP);
            else if (nav === 'payments') setCurrentView(ViewState.PAYMENTS);
            else if (nav === 'chat') setCurrentView(ViewState.CHAT);
        }}
        businessName={businessName}
        userRole={userRole || UserRole.LEADER}
        onLogout={handleLogout}
        currentExchangeRate={currentExchangeRate}
        onOpenExchange={() => { /* Lógica de tasa */ }}
    >
      {renderView()}
    </Layout>
  );
};

export default App;

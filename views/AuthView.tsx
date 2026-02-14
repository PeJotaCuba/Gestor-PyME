
import React, { useState } from 'react';
import { ShieldCheck, User, Users, Key, Terminal, ArrowRight, AlertCircle, LogIn, Lock, ChevronLeft, Cloud } from 'lucide-react';
import { UserRole } from '../types';
import { CloudService } from '../services/firebase';

interface AuthViewProps {
  onSuccess: (role: UserRole, licenseKey: string, syncData?: boolean) => void;
  onDevLogin: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onDevLogin }) => {
  const [step, setStep] = useState<'ROLE_SELECT' | 'LICENSE' | 'LOGIN' | 'DEV_LOGIN'>('ROLE_SELECT');
  const [licenseKey, setLicenseKey] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Login Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Dev Login
  const [devUser, setDevUser] = useState('');
  const [devPass, setDevPass] = useState('');

  const handleRoleSelect = (role: UserRole) => {
      setSelectedRole(role);
      if (role === UserRole.DEVELOPER) {
          setStep('DEV_LOGIN');
      } else if (role === UserRole.LEADER) {
          setStep('LOGIN'); 
      } else {
          setStep('LICENSE'); 
      }
  };

  // Logic for Assistant (Legacy/Simple)
  const handleValidateLicense = () => {
      const normalizedKey = licenseKey.trim().toUpperCase();
      const generatedLicenses = JSON.parse(localStorage.getItem('Gestor_Dev_Licenses') || '[]');
      const isValidGenerated = generatedLicenses.some((l: any) => l.key === normalizedKey);
      const isMasterKey = normalizedKey === 'G-PYME-FEBE-BAYA-0001';

      if (isMasterKey || isValidGenerated) {
          onSuccess(UserRole.ASSISTANT, normalizedKey, false);
      } else {
          alert('Licencia inválida.');
      }
  };

  // Logic for Leader (Cloud Auth)
  const handleLeaderLogin = async () => {
      if (!username || !password) {
          alert("Ingresa usuario y contraseña.");
          return;
      }
      setIsLoading(true);
      
      // 1. Check Cloud Service
      const user = await CloudService.login(username, password);
      
      if (user) {
          console.log("Logged in from Cloud:", user);
          onSuccess(UserRole.LEADER, user.licenseKey, true); 
      } else {
          const localConfig = localStorage.getItem(`Gestor_Config_${username}`);
          if (localConfig) {
              const config = JSON.parse(localConfig);
              if (config.password === password) {
                  onSuccess(UserRole.LEADER, config.licenseKey, false);
              } else {
                  alert("Usuario o contraseña incorrectos (Local).");
              }
          } else {
              alert("Usuario o contraseña incorrectos. Si es tu primera vez en este dispositivo, asegúrate de tener conexión.");
          }
      }
      setIsLoading(false);
  };

  const handleDevLogin = () => {
      if (devUser === 'des26' && devPass === 'Gpymedes*26') {
          onDevLogin();
      } else {
          alert("Credenciales incorrectas");
      }
  };

  // --- DEVELOPER LOGIN (No License Required) ---
  if (step === 'DEV_LOGIN') {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
            <div className="max-w-sm w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Terminal size={32} className="text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Modo Desarrollador</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Acceso directo sin licencia.</p>
                </div>
                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Usuario Dev"
                        value={devUser}
                        onChange={(e) => setDevUser(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors placeholder-slate-400"
                    />
                    <input 
                        type="password" 
                        placeholder="Contraseña"
                        value={devPass}
                        onChange={(e) => setDevPass(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors placeholder-slate-400"
                    />
                    <button onClick={handleDevLogin} className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-500/20">
                        Ingresar
                    </button>
                    <button onClick={() => setStep('ROLE_SELECT')} className="w-full py-3 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold text-sm">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- ROLE SELECTION ---
  if (step === 'ROLE_SELECT') {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
              <div className="max-w-md w-full">
                  <div className="text-center mb-10">
                      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Gestor<span className="text-orange-500">PyME</span></h1>
                      <p className="text-slate-500 dark:text-slate-400">Selecciona tu modo de acceso</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={() => handleRoleSelect(UserRole.LEADER)}
                        className="flex items-center p-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-3xl group transition-all text-left shadow-sm hover:shadow-xl"
                      >
                          <div className="p-4 bg-orange-100 dark:bg-orange-500/20 rounded-2xl mr-5 group-hover:bg-orange-500 group-hover:text-white text-orange-600 dark:text-orange-500 transition-colors">
                              <User size={28} />
                          </div>
                          <div>
                              <h3 className="font-bold text-xl text-slate-900 dark:text-white">Soy Líder</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Acceso total. Sincronización nube.</p>
                          </div>
                      </button>

                      <button 
                        onClick={() => handleRoleSelect(UserRole.ASSISTANT)}
                        className="flex items-center p-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl group transition-all text-left shadow-sm hover:shadow-xl"
                      >
                          <div className="p-4 bg-blue-100 dark:bg-blue-500/20 rounded-2xl mr-5 group-hover:bg-blue-500 group-hover:text-white text-blue-600 dark:text-blue-500 transition-colors">
                              <Users size={28} />
                          </div>
                          <div>
                              <h3 className="font-bold text-xl text-slate-900 dark:text-white">Soy Asistente</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ventas e inventario local.</p>
                          </div>
                      </button>

                      <div className="pt-6 flex justify-center">
                          <button onClick={() => handleRoleSelect(UserRole.DEVELOPER)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold flex items-center gap-2">
                                <Terminal size={14} /> MODO DESARROLLADOR
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- LOGIN STEP FOR LEADER ---
  if (step === 'LOGIN') {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
              <div className="max-w-sm w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
                  <div className="mb-6">
                      <button onClick={() => setStep('ROLE_SELECT')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm font-bold mb-4">
                          <ChevronLeft size={16} /> Atrás
                      </button>
                      <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acceso Líder</h2>
                          <Cloud size={20} className="text-orange-500 animate-pulse" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Ingresa tus credenciales para sincronizar.
                      </p>
                  </div>

                  <div className="space-y-4">
                      <input 
                          type="text" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Usuario (ej. JuanPerez)"
                          className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                      />
                      <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Contraseña"
                          className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                      />
                      <button 
                        onClick={handleLeaderLogin}
                        disabled={isLoading}
                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                      >
                          {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- LICENSE STEP FOR ASSISTANT ---
  return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="mb-6">
                  <button onClick={() => setStep('ROLE_SELECT')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm font-bold mb-4">
                      <ChevronLeft size={16} /> Atrás
                  </button>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Licencia Asistente</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Ingresa la clave del negocio para validar acceso.
                  </p>
              </div>

              <div className="space-y-4">
                  <div className="relative">
                    <Key className="absolute left-4 top-4 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value)}
                        placeholder="G-PYME-XXXX-XXXX-XXXX"
                        className="w-full pl-12 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-slate-400"
                    />
                  </div>
                  <button 
                    onClick={handleValidateLicense}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                  >
                      <span>Entrar</span>
                      <ArrowRight size={20} />
                  </button>
              </div>
          </div>
      </div>
  );
};

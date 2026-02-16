
import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Users, Key, Terminal, ArrowRight, AlertCircle, LogIn, Lock, ChevronLeft, Cloud, Eye, EyeOff, MessageCircle, Check } from 'lucide-react';
import { UserRole, CloudUser } from '../types';
import { CloudService } from '../services/firebase';
import { Logo } from '../components/Logo';

interface AuthViewProps {
  onSuccess: (role: UserRole, licenseKey: string, syncData?: boolean, userData?: CloudUser) => void;
  onDevLogin: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onDevLogin }) => {
  const [step, setStep] = useState<'ROLE_SELECT' | 'LICENSE' | 'LOGIN' | 'DEV_LOGIN' | 'DEV_VERIFY'>('ROLE_SELECT');
  const [licenseKey, setLicenseKey] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Login Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dev Login
  const [devUser, setDevUser] = useState('');
  const [devPass, setDevPass] = useState('');
  const [showDevPass, setShowDevPass] = useState(false);
  
  // Dev Verification
  const [verificationCode, setVerificationCode] = useState('');
  const [authCodeInput, setAuthCodeInput] = useState('');

  // Generate 4 numbers and 2 letters intercalated code (N-L-N-L-N-N)
  const generateDevCode = () => {
      const n = () => Math.floor(Math.random() * 10).toString();
      const l = () => String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
      return `${n()}${l()}${n()}${l()}${n()}${n()}`;
  };

  useEffect(() => {
      if (step === 'DEV_VERIFY') {
          setVerificationCode(generateDevCode());
      }
  }, [step]);

  const handleRoleSelect = (role: UserRole) => {
      setSelectedRole(role);
      if (role === UserRole.DEVELOPER) {
          setStep('DEV_LOGIN');
      } else {
          setStep('LOGIN'); 
      }
  };

  const handleGeneralLogin = async () => {
      if (!username || !password) {
          alert("Ingresa usuario y contraseña.");
          return;
      }
      setIsLoading(true);
      
      const response = await CloudService.login(username, password);
      
      if (response.user) {
          const user = response.user;
          console.log("Logged in:", user);
          onSuccess(user.role, user.licenseKey, user.role === UserRole.LEADER, user); 
      } else {
          alert(response.error || "Credenciales incorrectas.");
      }
      setIsLoading(false);
  };

  const handleDevLogin = async () => {
      // Intento de login como Dev
      const response = await CloudService.login(devUser, devPass);
      
      if (response.user) {
          onDevLogin(); // Login exitoso directo (dispositivo conocido)
      } else if (response.requireDevVerify) {
          setStep('DEV_VERIFY'); // Dispositivo nuevo -> Verificar
      } else {
          alert(response.error || "Credenciales incorrectas");
      }
  };

  const handleVerifyDevCode = async () => {
      // Simplificado para la demo: La respuesta correcta es el código invertido
      const expected = verificationCode.split('').reverse().join('');
      
      if (authCodeInput.toUpperCase() === expected) {
          const success = await CloudService.registerDevDevice(devUser);
          if (success) {
              onDevLogin();
          } else {
              alert("Error al registrar dispositivo.");
          }
      } else {
          alert("Código de autorización incorrecto.");
      }
  };

  if (step === 'DEV_VERIFY') {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
            <div className="max-w-sm w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-white rounded-xl shadow-lg shadow-orange-500/20">
                        <Logo className="w-12 h-12" onlyIcon={true} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verificación de Seguridad</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Dispositivo no reconocido. Verifica tu identidad.</p>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Tu Código de Seguridad</p>
                        <p className="text-3xl font-mono font-black text-slate-800 dark:text-white tracking-widest">{verificationCode}</p>
                    </div>

                    <a 
                        href={`https://wa.me/5354413935?text=Solicito autorización para dispositivo Dev. Código: ${verificationCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                    >
                        <MessageCircle size={18} />
                        Enviar por WhatsApp
                    </a>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <label className="text-xs font-bold text-slate-500 mb-2 block">Código de Autorización</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={authCodeInput}
                                onChange={(e) => setAuthCodeInput(e.target.value)}
                                placeholder="Recibido del Admin"
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                            />
                            <button 
                                onClick={handleVerifyDevCode}
                                className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600"
                            >
                                <Check size={20} />
                            </button>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 text-center italic">Para pruebas: Ingrese el código al revés.</p>
                    </div>
                    
                    <button onClick={() => setStep('DEV_LOGIN')} className="w-full text-slate-400 text-xs font-bold hover:text-slate-600">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
      );
  }

  if (step === 'DEV_LOGIN') {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
            <div className="max-w-sm w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center mb-8">
                     <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-white rounded-2xl shadow-lg shadow-orange-500/20">
                        <Logo className="w-16 h-16" onlyIcon={true} />
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
                    <div className="relative">
                        <input 
                            type={showDevPass ? "text" : "password"} 
                            placeholder="Contraseña"
                            value={devPass}
                            onChange={(e) => setDevPass(e.target.value)}
                            className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors placeholder-slate-400"
                        />
                        <button 
                            onClick={() => setShowDevPass(!showDevPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                            {showDevPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>
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

  if (step === 'ROLE_SELECT') {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
              <div className="max-w-md w-full">
                  <div className="text-center mb-10">
                      <div className="flex justify-center mb-4">
                          <Logo className="h-16 w-auto" />
                      </div>
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
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestión local y compartida.</p>
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

  return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
          <div className="max-sm w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="mb-6">
                  <button onClick={() => setStep('ROLE_SELECT')} className="text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm font-bold mb-4">
                      <ChevronLeft size={16} /> Atrás
                  </button>
                  <div className="flex items-center gap-3 mb-1">
                      <Logo className="h-8 w-auto" onlyIcon={true} />
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Iniciar Sesión</h2>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Accede a tu cuenta de {selectedRole === UserRole.LEADER ? 'Líder' : 'Asistente'}.
                  </p>
              </div>

              <div className="space-y-4">
                  <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Usuario o Teléfono"
                      className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                  />
                  <div className="relative">
                      <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Contraseña"
                          className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                      />
                      <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                  </div>
                  <button 
                    onClick={handleGeneralLogin}
                    disabled={isLoading}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                  >
                      {isLoading ? 'Conectando...' : 'Entrar'}
                  </button>
              </div>
          </div>
      </div>
  );
};

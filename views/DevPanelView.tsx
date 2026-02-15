
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Plus, ShieldCheck, MapPin, User, Phone, Mail, Lock, AlertCircle, Loader2, Link as LinkIcon, Users, Download, Upload, FileText } from 'lucide-react';
import { CloudService } from '../services/firebase';
import { UserRole, CloudUser } from '../types';

interface DevPanelViewProps {
    onLogout: () => void;
}

export const DevPanelView: React.FC<DevPanelViewProps> = ({ onLogout }) => {
    // Form States
    const [cityInput, setCityInput] = useState('');
    const [phoneInput, setPhoneInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [passInput, setPassInput] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [roleInput, setRoleInput] = useState<UserRole>(UserRole.LEADER);
    const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
    
    // Data & UI States
    const [leaders, setLeaders] = useState<CloudUser[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Refs for file inputs
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const txtInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        CloudService.getLeaders().then(setLeaders);
    };

    // --- MANUAL CREATION ---
    const handleCreateUser = async () => {
        if (!phoneInput || !emailInput || !passInput || !nameInput) {
            setStatusMsg({ type: 'error', text: 'Completa los campos obligatorios.' });
            return;
        }

        if (roleInput === UserRole.LEADER && !cityInput) {
            setStatusMsg({ type: 'error', text: 'La ciudad es obligatoria para líderes.' });
            return;
        }

        if (roleInput === UserRole.ASSISTANT && !selectedLeaderId) {
            setStatusMsg({ type: 'error', text: 'Debes vincular al asistente con un líder.' });
            return;
        }

        setIsProcessing(true);
        setStatusMsg(null);

        try {
            let finalLicense = "";
            let finalLeaderId = "";

            if (roleInput === UserRole.LEADER) {
                const cityCode = cityInput.substring(0, 3).toUpperCase().padEnd(3, 'X');
                const year = new Date().getFullYear();
                const randomID = Math.floor(1000 + Math.random() * 9000);
                finalLicense = `GP-${cityCode}-${year}-${randomID}`;
            } else {
                const leader = leaders.find(l => l.uid === selectedLeaderId);
                finalLicense = leader?.licenseKey || "";
                finalLeaderId = selectedLeaderId;
            }

            const result = await CloudService.createUser({
                username: emailInput,
                password: passInput,
                name: nameInput,
                phone: phoneInput,
                licenseKey: finalLicense,
                role: roleInput,
                linkedLeaderId: finalLeaderId
            });

            if (result.success) {
                setStatusMsg({ type: 'success', text: `Usuario creado: ${finalLicense}` });
                // Reset Fields
                setCityInput(''); setPhoneInput(''); setEmailInput(''); setPassInput(''); setNameInput('');
                loadData();
            } else {
                setStatusMsg({ type: 'error', text: result.message });
            }
        } catch (error) {
            setStatusMsg({ type: 'error', text: "Error al crear usuario." });
        } finally {
            setIsProcessing(false);
        }
    };

    // --- JSON DB MANAGEMENT ---
    const handleExportDB = () => {
        CloudService.exportDatabase();
    };

    const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            if (content) {
                const success = await CloudService.importDatabase(content);
                if (success) {
                    alert("Base de datos de usuarios restaurada correctamente.");
                    loadData();
                } else {
                    alert("Formato de JSON inválido.");
                }
            }
        };
        reader.readAsText(file);
        if (jsonInputRef.current) jsonInputRef.current.value = '';
    };

    // --- TXT BULK IMPORT ---
    const handleImportTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            if (content) {
                const result = await CloudService.parseTxtAndImport(content);
                alert(`Importación TXT: ${result.added} usuarios añadidos. ${result.errors} duplicados o errores.`);
                loadData();
            }
        };
        reader.readAsText(file);
        if (txtInputRef.current) txtInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 overflow-y-auto no-scrollbar">
            <header className="flex items-center justify-between mb-8 max-w-6xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-500 p-3 rounded-2xl shadow-xl shadow-orange-500/20">
                        <Terminal className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Panel Local</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gestión de Usuarios Offline</p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <input type="file" ref={jsonInputRef} onChange={handleImportDB} accept=".json" className="hidden" />
                    <button onClick={() => jsonInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">
                        <Upload size={14} /> Cargar DB (JSON)
                    </button>
                    
                    <button onClick={handleExportDB} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">
                        <Download size={14} /> Guardar DB (JSON)
                    </button>

                    <button onClick={onLogout} className="px-4 py-2 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors">
                        Salir
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                {/* --- LEFT: Create User Form --- */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Manual Creation Card */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                                <Plus size={24} className="text-orange-500" />
                                Crear Usuario Manual
                            </h2>
                            {/* TXT Import Trigger */}
                            <div>
                                <input type="file" ref={txtInputRef} onChange={handleImportTxt} accept=".txt" className="hidden" />
                                <button onClick={() => txtInputRef.current?.click()} className="flex items-center gap-2 text-xs font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition-colors">
                                    <FileText size={14} /> Importar desde TXT
                                </button>
                            </div>
                        </div>

                        {statusMsg && (
                            <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                                {statusMsg.type === 'success' ? <ShieldCheck size={20} className="mt-0.5" /> : <AlertCircle size={20} className="mt-0.5" />}
                                <span className="text-sm font-bold leading-tight">{statusMsg.text}</span>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Role Select */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
                                    <select 
                                        value={roleInput}
                                        onChange={(e) => setRoleInput(e.target.value as UserRole)}
                                        className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold outline-none text-slate-900 dark:text-white"
                                    >
                                        <option value={UserRole.LEADER}>Líder</option>
                                        <option value={UserRole.ASSISTANT}>Asistente</option>
                                    </select>
                                </div>

                                {roleInput === UserRole.LEADER ? (
                                    <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="text"
                                                value={cityInput}
                                                onChange={(e) => setCityInput(e.target.value)}
                                                placeholder="Ej: Habana"
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular a</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select 
                                                value={selectedLeaderId}
                                                onChange={(e) => setSelectedLeaderId(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold outline-none text-slate-900 dark:text-white appearance-none"
                                            >
                                                <option value="">Selecciona Líder...</option>
                                                {leaders.map(l => (
                                                    <option key={l.uid} value={l.uid}>{l.name} ({l.licenseKey})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Nombre completo" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Usuario)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="usuario@gestor.com" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" value={passInput} onChange={(e) => setPassInput(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleCreateUser} disabled={isProcessing} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-orange-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                                Guardar Usuario en Local
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: List of Users --- */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full max-h-[600px]">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Users size={18} className="text-orange-500" />
                            DB Usuarios ({leaders.length})
                        </h3>
                        <div className="space-y-3 overflow-y-auto no-scrollbar flex-1">
                            {leaders.length === 0 && <p className="text-slate-500 text-sm italic">Base de datos vacía.</p>}
                            {leaders.map(l => (
                                <div key={l.uid} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                    <p className="text-white font-bold text-sm truncate">{l.name}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-[10px] text-orange-500 font-black tracking-widest">{l.licenseKey}</p>
                                        <p className="text-[9px] text-slate-500">{l.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-orange-500/10 p-6 rounded-[2rem] border border-orange-500/20">
                        <h4 className="font-bold text-orange-600 text-xs mb-2">Modo 100% Local</h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            Los datos se guardan en este navegador. Para moverlos a otro equipo, usa los botones de <strong>Guardar/Cargar DB</strong> en la cabecera.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

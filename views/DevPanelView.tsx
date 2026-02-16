
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Plus, ShieldCheck, MapPin, User, Phone, Mail, Lock, AlertCircle, Loader2, Link as LinkIcon, Users, Download, Upload, FileText, Store, Eye, EyeOff, Edit2, Trash2, X, Save } from 'lucide-react';
import { CloudService } from '../services/firebase';
import { UserRole, CloudUser } from '../types';

interface DevPanelViewProps {
    onLogout: () => void;
}

export const DevPanelView: React.FC<DevPanelViewProps> = ({ onLogout }) => {
    // Form States
    const [cityInput, setCityInput] = useState('');
    const [phoneInput, setPhoneInput] = useState('');
    const [usernameInput, setUsernameInput] = useState('');
    const [passInput, setPassInput] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [businessNameInput, setBusinessNameInput] = useState('');
    const [roleInput, setRoleInput] = useState<UserRole>(UserRole.LEADER);
    const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
    const [autoAssistants, setAutoAssistants] = useState<0 | 1 | 2>(0);
    const [showPassword, setShowPassword] = useState(false);
    
    // Edit/Delete State
    const [editingUser, setEditingUser] = useState<CloudUser | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Data & UI States
    const [users, setUsers] = useState<CloudUser[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Refs for file inputs
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const txtInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        CloudService.getLeaders().then(setUsers); // Gets all users actually
    };

    const leaders = users.filter(u => u.role === UserRole.LEADER);

    // --- MANUAL CREATION ---
    const handleCreateUser = async () => {
        if (!phoneInput || !usernameInput || !passInput || !nameInput) {
            setStatusMsg({ type: 'error', text: 'Completa los campos obligatorios.' });
            return;
        }

        if (roleInput === UserRole.LEADER && (!cityInput || !businessNameInput)) {
            setStatusMsg({ type: 'error', text: 'Ciudad y Nombre del Negocio obligatorios para líderes.' });
            return;
        }

        if (roleInput === UserRole.ASSISTANT && !selectedLeaderId) {
            setStatusMsg({ type: 'error', text: 'Debes vincular al asistente con un líder.' });
            return;
        }

        setIsProcessing(true);
        setStatusMsg(null);

        try {
            // 1. Create Main User (Leader or Assistant)
            let finalLicense = "";
            let finalLeaderId = "";

            if (roleInput === UserRole.LEADER) {
                const cityCode = cityInput.substring(0, 3).toUpperCase().padEnd(3, 'X');
                const year = new Date().getFullYear();
                const randomID = Math.floor(1000 + Math.random() * 9000);
                finalLicense = `GP-${cityCode}-${year}-${randomID}`;
            } else {
                const leader = users.find(l => l.uid === selectedLeaderId);
                finalLicense = leader?.licenseKey || "";
                finalLeaderId = selectedLeaderId;
            }

            const mainUserResult = await CloudService.createUser({
                username: usernameInput,
                password: passInput,
                name: nameInput,
                businessName: businessNameInput,
                phone: phoneInput,
                licenseKey: finalLicense,
                role: roleInput,
                linkedLeaderId: finalLeaderId
            });

            if (!mainUserResult.success) {
                setStatusMsg({ type: 'error', text: mainUserResult.message });
                setIsProcessing(false);
                return;
            }

            // 2. Create Auto Assistants (If Leader & Option Selected)
            let assistantMsg = "";
            if (roleInput === UserRole.LEADER && autoAssistants > 0 && mainUserResult.user) {
                const now = new Date();
                const month = now.toLocaleString('es-ES', { month: 'short' });
                const year = now.getFullYear();
                // Clean business name for credentials: "Mi Tienda" -> "MiTienda"
                const cleanBusiness = businessNameInput.replace(/\s+/g, '');
                const credentialBase = `${cleanBusiness}${month.charAt(0).toUpperCase() + month.slice(1)}${year}`; // e.g. TiendaNov2023

                for (let i = 1; i <= autoAssistants; i++) {
                    await CloudService.createUser({
                        username: `asistente${i}_${cleanBusiness.toLowerCase()}`,
                        password: credentialBase,
                        name: `Asistente ${i} - ${businessNameInput}`,
                        businessName: businessNameInput,
                        phone: phoneInput, // Inherit phone for simplicity
                        licenseKey: finalLicense,
                        role: UserRole.ASSISTANT,
                        linkedLeaderId: mainUserResult.user.uid
                    });
                }
                assistantMsg = ` + ${autoAssistants} Asistentes creados (Clave: ${credentialBase})`;
            }

            setStatusMsg({ type: 'success', text: `Usuario creado: ${finalLicense}${assistantMsg}` });
            resetForm();
            loadData();

        } catch (error) {
            setStatusMsg({ type: 'error', text: "Error al crear usuario." });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser || !editingUser.uid) return;
        
        setIsProcessing(true);
        const result = await CloudService.updateUser(editingUser.uid, {
            name: nameInput,
            username: usernameInput,
            password: passInput,
            phone: phoneInput,
            city: cityInput, 
            businessName: businessNameInput
        } as any);

        if (result.success) {
            setStatusMsg({ type: 'success', text: "Usuario actualizado correctamente." });
            loadData();
            resetForm();
        } else {
            setStatusMsg({ type: 'error', text: result.message });
        }
        setIsProcessing(false);
    };

    const handleDeleteUser = async (uid: string) => {
        if (!confirm("¿Eliminar usuario? Si es líder, se eliminarán sus asistentes.")) return;
        
        const result = await CloudService.deleteUser(uid);
        if (result.success) {
            loadData();
        } else {
            alert(result.message);
        }
    };

    const startEdit = (user: CloudUser) => {
        setIsEditMode(true);
        setEditingUser(user);
        
        setRoleInput(user.role);
        setNameInput(user.name);
        setUsernameInput(user.username);
        setPassInput(user.password || '');
        setPhoneInput(user.phone);
        setBusinessNameInput(user.businessName || '');
        // City extraction from license if leader
        if (user.role === UserRole.LEADER) {
             setCityInput(''); 
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setCityInput(''); setPhoneInput(''); setUsernameInput(''); setPassInput(''); setNameInput(''); setBusinessNameInput('');
        setIsEditMode(false);
        setEditingUser(null);
        setAutoAssistants(0);
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
                    alert("Base de datos restaurada.");
                    loadData();
                } else {
                    alert("Formato inválido.");
                }
            }
        };
        reader.readAsText(file);
        if (jsonInputRef.current) jsonInputRef.current.value = '';
    };

    const handleImportTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            if (content) {
                const result = await CloudService.parseTxtAndImport(content);
                alert(`Importación TXT: ${result.added} usuarios. ${result.errors} errores.`);
                loadData();
            }
        };
        reader.readAsText(file);
        if (txtInputRef.current) txtInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 overflow-y-auto no-scrollbar">
            
            {/* Header Redesigned */}
            <div className="max-w-6xl mx-auto w-full mb-8">
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-xl shadow-lg shadow-orange-500/10 border border-slate-100 dark:border-slate-800">
                             <Terminal className="text-red-500" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Panel Local</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gestión de Usuarios Offline</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="px-4 py-2 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors">
                        Salir
                    </button>
                </header>

                {/* DB Actions Row */}
                <div className="flex flex-wrap gap-3 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <input type="file" ref={jsonInputRef} onChange={handleImportDB} accept=".json" className="hidden" />
                    <button onClick={() => jsonInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">
                        <Upload size={14} /> Cargar DB (JSON)
                    </button>
                    
                    <button onClick={handleExportDB} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">
                        <Download size={14} /> Guardar DB (JSON)
                    </button>

                    <input type="file" ref={txtInputRef} onChange={handleImportTxt} accept=".txt" className="hidden" />
                    <button onClick={() => txtInputRef.current?.click()} className="flex items-center gap-2 text-xs font-bold text-orange-500 bg-orange-500/10 px-4 py-2 rounded-xl hover:bg-orange-500/20 transition-colors border border-transparent">
                        <FileText size={14} /> Importar TXT
                    </button>
                </div>
            </div>

            <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                {/* --- LEFT: Create/Edit User Form --- */}
                <div className="lg:col-span-7 space-y-8">
                    
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative">
                        {isEditMode && (
                            <button onClick={resetForm} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"><X size={24} /></button>
                        )}
                        <h2 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white mb-6">
                            {isEditMode ? <Edit2 size={24} className="text-blue-500"/> : <Plus size={24} className="text-orange-500" />}
                            {isEditMode ? 'Editar Usuario' : 'Crear Usuario'}
                        </h2>

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
                                        disabled={isEditMode} // Cannot change role while editing usually simplifies logic
                                        className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold outline-none text-slate-900 dark:text-white disabled:opacity-50"
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
                                                    <option key={l.uid} value={l.uid}>{l.name} ({l.businessName})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Business Name (Only Leader) */}
                            {roleInput === UserRole.LEADER && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Negocio</label>
                                    <div className="relative">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            value={businessNameInput} 
                                            onChange={(e) => setBusinessNameInput(e.target.value)} 
                                            placeholder="Ej: Cafetería Central" 
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" 
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Nombre completo" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Usuario (Login)</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="Ej: admin2023" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            value={passInput} 
                                            onChange={(e) => setPassInput(e.target.value)} 
                                            className="w-full pl-12 pr-10 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" 
                                        />
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <button 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                        >
                                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
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

                            {/* Auto Assistants Option */}
                            {roleInput === UserRole.LEADER && !isEditMode && (
                                <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-3">Crear Asistentes Automáticos</p>
                                    <div className="flex gap-2">
                                        {[0, 1, 2].map(num => (
                                            <button 
                                                key={num}
                                                onClick={() => setAutoAssistants(num as 0|1|2)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${autoAssistants === num ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                            >
                                                {num === 0 ? 'Ninguno' : `${num} Asistente${num > 1 ? 's' : ''}`}
                                            </button>
                                        ))}
                                    </div>
                                    {autoAssistants > 0 && (
                                        <p className="text-[10px] text-slate-500 mt-2">
                                            Se crearán usuarios con clave predeterminada: <span className="font-mono bg-white dark:bg-slate-900 px-1 rounded">[Negocio][Mes][Año]</span>
                                        </p>
                                    )}
                                </div>
                            )}

                            <button 
                                onClick={isEditMode ? handleUpdateUser : handleCreateUser} 
                                disabled={isProcessing} 
                                className={`w-full text-white font-black py-5 rounded-2xl shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3
                                    ${isEditMode ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'}
                                `}
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (isEditMode ? <Save size={20}/> : <ShieldCheck size={20} />)}
                                {isEditMode ? 'Guardar Cambios' : 'Guardar Usuario en Local'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: List of Users --- */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full max-h-[700px]">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Users size={18} className="text-orange-500" />
                            DB Usuarios ({users.length})
                        </h3>
                        <div className="space-y-3 overflow-y-auto no-scrollbar flex-1">
                            {users.length === 0 && <p className="text-slate-500 text-sm italic">Base de datos vacía.</p>}
                            {users.map(u => (
                                <div key={u.uid} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors group relative">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-white font-bold text-sm truncate max-w-[150px]">{u.name}</p>
                                            <p className="text-[10px] text-slate-400">{u.role} {u.businessName ? `• ${u.businessName}` : ''}</p>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(u)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white"><Edit2 size={14}/></button>
                                            <button onClick={() => handleDeleteUser(u.uid!)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/50">
                                        <p className="text-[10px] text-orange-500 font-black tracking-widest">{u.licenseKey}</p>
                                        <p className="text-[9px] text-slate-500">{u.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};


import React, { useState, useEffect } from 'react';
import { Terminal, Plus, ShieldCheck, MapPin, User, Phone, Mail, Lock, AlertCircle, Loader2, Link as LinkIcon, Users } from 'lucide-react';
import { CloudService } from '../services/firebase';
import { UserRole, CloudUser } from '../types';

interface DevPanelViewProps {
    onLogout: () => void;
}

export const DevPanelView: React.FC<DevPanelViewProps> = ({ onLogout }) => {
    const [cityInput, setCityInput] = useState('');
    const [phoneInput, setPhoneInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [passInput, setPassInput] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [roleInput, setRoleInput] = useState<UserRole>(UserRole.LEADER);
    const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
    const [leaders, setLeaders] = useState<CloudUser[]>([]);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

    useEffect(() => {
        CloudService.getLeaders().then(setLeaders);
    }, []);

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

        setIsGenerating(true);
        setStatusMsg(null);

        let finalLicense = "";
        let finalLeaderId = "";

        if (roleInput === UserRole.LEADER) {
            const cityCode = cityInput.substring(0, 3).toUpperCase().padEnd(3, 'X');
            const monthCode = new Date().toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
            const randomID = Math.floor(1000 + Math.random() * 9000);
            finalLicense = `GP-${cityCode}-${monthCode}-${randomID}`;
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
            setStatusMsg({ type: 'success', text: result.message });
            setCityInput(''); setPhoneInput(''); setEmailInput(''); setPassInput(''); setNameInput('');
            CloudService.getLeaders().then(setLeaders);
        } else {
            setStatusMsg({ type: 'error', text: result.message });
        }
        setIsGenerating(false);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 overflow-y-auto no-scrollbar">
            <header className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-500 p-3 rounded-2xl shadow-xl shadow-orange-500/20">
                        <Terminal className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cloud Dev Panel</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Vinculación Manual y Licencias</p>
                    </div>
                </div>
                <button onClick={onLogout} className="px-4 py-2 text-slate-500 hover:text-red-500 font-bold text-sm transition-colors border border-slate-200 dark:border-slate-800 rounded-xl">Cerrar</button>
            </header>

            <main className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 pb-20">
                {/* Formulario */}
                <div className="md:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
                        <Plus size={24} className="text-orange-500" />
                        Aprovisionar Nuevo Usuario
                    </h2>

                    {statusMsg && (
                        <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                            {statusMsg.type === 'success' ? <ShieldCheck size={20} className="mt-0.5" /> : <AlertCircle size={20} className="mt-0.5" />}
                            <span className="text-sm font-bold leading-tight">{statusMsg.text}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Usuario</label>
                                <select 
                                    value={roleInput}
                                    onChange={(e) => setRoleInput(e.target.value as UserRole)}
                                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold outline-none text-slate-900 dark:text-white"
                                >
                                    <option value={UserRole.LEADER}>Líder (Genera Licencia)</option>
                                    <option value={UserRole.ASSISTANT}>Asistente (Vinculado)</option>
                                </select>
                            </div>

                            {roleInput === UserRole.LEADER ? (
                                <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad de Origen</label>
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular a Líder</label>
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Nombre del usuario" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email / Login</label>
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

                        <button onClick={handleCreateUser} disabled={isGenerating} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-orange-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                            Crear y Vincular en Nube
                        </button>
                    </div>
                </div>

                {/* Lista de Líderes */}
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[600px]">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Users size={18} className="text-orange-500" />
                            Líderes Activos
                        </h3>
                        <div className="space-y-3 overflow-y-auto no-scrollbar">
                            {leaders.map(l => (
                                <div key={l.uid} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                    <p className="text-white font-bold text-sm truncate">{l.name}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-[10px] text-orange-500 font-black tracking-widest">{l.licenseKey}</p>
                                        <p className="text-[9px] text-slate-500">{l.username.split('@')[0]}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-orange-500/10 p-6 rounded-[2rem] border border-orange-500/20">
                        <h4 className="font-bold text-orange-600 text-xs mb-2">Período de Prueba</h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            Todos los usuarios creados aquí tienen <span className="font-bold">7 días de prueba</span>. La comunicación entre Líder y Asistente funcionará desde el primer login gracias a la vinculación manual que realizas ahora.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

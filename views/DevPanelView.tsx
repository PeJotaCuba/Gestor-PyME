
import React, { useState, useEffect } from 'react';
import { Terminal, Key, Plus, Trash2, LogOut, Copy, MapPin, User, Phone, Lock, Save, Cloud } from 'lucide-react';
import { CloudService, CloudUser } from '../services/firebase';

interface DevPanelViewProps {
    onLogout: () => void;
}

export const DevPanelView: React.FC<DevPanelViewProps> = ({ onLogout }) => {
    const [licenses, setLicenses] = useState<{key: string, created: string, assignedTo?: string}[]>([]);
    
    // Form Inputs
    const [cityInput, setCityInput] = useState('');
    const [phoneInput, setPhoneInput] = useState('');
    const [userInput, setUserInput] = useState('');
    const [passInput, setPassInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('Gestor_Dev_Licenses') || '[]');
        setLicenses(stored);
    }, []);

    const generateLicenseAndUser = async () => {
        if (!cityInput || cityInput.length < 3) {
            alert("Ingresa una ciudad válida.");
            return;
        }
        if (!phoneInput || !userInput || !passInput) {
            alert("Debes completar los datos del Líder (Teléfono, Usuario, Contraseña) para asignarle la licencia.");
            return;
        }

        setIsGenerating(true);

        // 1. Generate License Key
        const monthName = new Date().toLocaleString('es-ES', { month: 'long' });
        const monthCode = monthName.substring(0, 4).toUpperCase(); 
        const cityCode = cityInput.substring(0, 4).toUpperCase().padEnd(4, 'X'); 
        const randomID = Math.floor(1000 + Math.random() * 9000);
        
        // Format: G-PYME-[CITY]-[MONTH]-[ID]
        const newKey = `G-PYME-${cityCode}-${monthCode}-${randomID}`;

        // 2. Create Cloud User
        const newUser: CloudUser = {
            username: userInput,
            password: passInput,
            phone: phoneInput,
            licenseKey: newKey,
            role: 'LEADER'
        };

        const success = await CloudService.createUser(newUser);

        if (success) {
            // 3. Save License Locally for reference
            const newEntry = { 
                key: newKey, 
                created: new Date().toLocaleDateString(),
                assignedTo: userInput 
            };
            
            const updated = [newEntry, ...licenses];
            setLicenses(updated);
            localStorage.setItem('Gestor_Dev_Licenses', JSON.stringify(updated));
            
            // Clear
            setCityInput('');
            setPhoneInput('');
            setUserInput('');
            setPassInput('');
            alert(`Licencia Generada y Usuario '${newUser.username}' creado en la nube.`);
        } else {
            alert("Error al crear usuario en la nube.");
        }
        setIsGenerating(false);
    };

    const deleteLicense = (key: string) => {
        if(!confirm("¿Eliminar licencia? Esto no borra el usuario de la nube (por seguridad), solo la referencia local.")) return;
        const updated = licenses.filter(l => l.key !== key);
        setLicenses(updated);
        localStorage.setItem('Gestor_Dev_Licenses', JSON.stringify(updated));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado!');
    };

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 max-w-4xl mx-auto transition-colors">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                        <Terminal className="text-orange-500" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Panel de Desarrollador</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Gestión de Licencias y Usuarios Nube</p>
                    </div>
                </div>
                <button onClick={onLogout} className="text-red-500 hover:text-red-700 dark:hover:text-white flex items-center gap-2 font-bold text-sm bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg transition-colors">
                    <LogOut size={16} /> Salir
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Generation Form */}
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-orange-500" />
                        Nueva Asignación
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Datos de Licencia</label>
                            <div className="relative mt-1">
                                <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input 
                                    type="text"
                                    value={cityInput}
                                    onChange={(e) => setCityInput(e.target.value)}
                                    placeholder="Ciudad (ej. Bayamo)"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Credenciales Líder (Nube)</label>
                            <div className="grid grid-cols-1 gap-3 mt-1">
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <input 
                                        type="tel"
                                        value={phoneInput}
                                        onChange={(e) => setPhoneInput(e.target.value)}
                                        placeholder="Teléfono (+53...)"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                                    />
                                </div>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <input 
                                        type="text"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder="Nombre Usuario"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <input 
                                        type="text" // Visible for Dev to see what they are assigning
                                        value={passInput}
                                        onChange={(e) => setPassInput(e.target.value)}
                                        placeholder="Contraseña Inicial"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={generateLicenseAndUser}
                            disabled={isGenerating}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                        >
                            {isGenerating ? 'Procesando...' : 'Generar Licencia y Crear Usuario'}
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Key size={20} className="text-emerald-500" />
                        Licencias Activas ({licenses.length})
                    </h2>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 max-h-[400px]">
                        {licenses.length === 0 && <p className="text-center text-slate-500 italic py-10">No hay licencias generadas.</p>}
                        {licenses.map((l, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{l.key}</p>
                                        <p className="text-xs text-slate-500">Asignada a: <span className="font-bold text-slate-700 dark:text-slate-300">{l.assignedTo || 'N/A'}</span></p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => copyToClipboard(l.key)} className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Copiar">
                                            <Copy size={14} />
                                        </button>
                                        <button onClick={() => deleteLicense(l.key)} className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <Cloud size={10} />
                                    <span>Sincronizado en Nube</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
             <div className="mt-auto text-center">
                 <p className="text-xs text-slate-400 mb-1">Clave Maestra Dev</p>
                 <code className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300">
                     G-PYME-FEBE-BAYA-0001
                 </code>
             </div>
        </div>
    );
};

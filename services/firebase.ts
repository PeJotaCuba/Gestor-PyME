
import { UserRole, CloudUser, Message } from '../types';

// Clave para guardar la "Base de Datos" de usuarios en el navegador
const DB_USERS_KEY = 'Gestor_Users_DB';
const DB_CHATS_PREFIX = 'Gestor_Chat_';
const SESSION_KEY = 'Gestor_Current_Session';
const DEVICE_ID_KEY = 'Gestor_Device_ID';

// Helpers internos
const safeJSONParse = <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.error(`Error parsing ${key}:`, error);
        return fallback;
    }
};

const getLocalDB = (): CloudUser[] => {
    return safeJSONParse<CloudUser[]>(DB_USERS_KEY, []);
};

const saveLocalDB = (users: CloudUser[]) => {
    try {
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error("Error saving to localStorage", e);
    }
};

// Generar o recuperar ID único del dispositivo
const getDeviceId = (): string => {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
};

export const CloudService = {
    // --- AUTENTICACIÓN LOCAL ---
    
    // Recuperar sesión persistente
    getSession: async (): Promise<CloudUser | null> => {
        const session = safeJSONParse<CloudUser | null>(SESSION_KEY, null);
        if (session) {
            // Verificar que el usuario aún existe en la DB y actualizar datos
            const users = getLocalDB();
            // Si es el usuario maestro hardcoded, permitirlo
            if (session.username === 'des26') return session;

            const freshUser = users.find(u => u.uid === session.uid);
            return freshUser || null;
        }
        return null;
    },

    login: async (identifier: string, password: string): Promise<{user: CloudUser | null, error?: string, requireDevVerify?: boolean}> => {
        // Simular retardo de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // --- CREDENCIALES MAESTRAS DE DESARROLLADOR ---
        if (identifier === 'des26' && password === 'Gpymedes*26') {
             const masterDev: CloudUser = {
                uid: 'master_dev_id',
                username: 'des26',
                name: 'Admin Desarrollador',
                phone: '50000000',
                role: UserRole.DEVELOPER,
                licenseKey: 'DEV-MASTER-ACCESS',
                licenseValidated: true,
                activeSessions: [getDeviceId()] 
            };
            // Guardar sesión
            localStorage.setItem(SESSION_KEY, JSON.stringify(masterDev));
            return { user: masterDev };
        }

        const users = getLocalDB();
        const deviceId = getDeviceId();
        
        // Buscar por Nombre de Usuario O Teléfono
        const userIndex = users.findIndex(u => 
            (u.username.toLowerCase() === identifier.toLowerCase() || u.phone === identifier) && 
            u.password === password
        );
        
        const user = users[userIndex];
        
        if (user) {
            // VERIFICACIÓN DE LICENCIA DEL LÍDER (Si es asistente)
            if (user.role === UserRole.ASSISTANT && user.linkedLeaderId) {
                const leader = users.find(u => u.uid === user.linkedLeaderId);
                if (leader) {
                    if (!leader.licenseValidated && leader.trialUntil) {
                        const now = new Date();
                        const trialEnd = new Date(leader.trialUntil);
                        if (now > trialEnd) {
                            return { user: null, error: "La licencia del Líder ha expirado. El Asistente no puede acceder." };
                        }
                    }
                } else {
                    return { user: null, error: "El Líder asociado a esta cuenta no existe." };
                }
            }

            // GESTIÓN DE DISPOSITIVOS Y SESIONES
            const sessions = user.activeSessions || [];
            const isKnownDevice = sessions.includes(deviceId);

            // Reglas de límites de dispositivos
            if (!isKnownDevice) {
                if (user.role === UserRole.LEADER && sessions.length >= 2) {
                    return { user: null, error: "Has alcanzado el límite de 2 dispositivos para cuenta Líder." };
                }
                if (user.role === UserRole.ASSISTANT && sessions.length >= 1) {
                    return { user: null, error: "Has alcanzado el límite de 1 dispositivo para cuenta Asistente." };
                }
                
                // Si es Desarrollador en dispositivo nuevo -> Requiere verificación
                if (user.role === UserRole.DEVELOPER) {
                    return { user: null, requireDevVerify: true }; // Trigger UI flow
                }

                // Registrar nuevo dispositivo si pasa las reglas
                users[userIndex].activeSessions = [...sessions, deviceId];
            }

            // Lógica de Primer Acceso Local (Para Líderes)
            if (user.role === UserRole.LEADER && !user.firstLogin) {
                const now = new Date();
                const trialUntil = new Date();
                trialUntil.setDate(now.getDate() + 7);
                
                users[userIndex].firstLogin = now.toISOString();
                users[userIndex].trialUntil = trialUntil.toISOString();
            }

            // Guardar cambios en DB
            saveLocalDB(users);
            
            // Iniciar Sesión Persistente
            const finalUser = users[userIndex];
            localStorage.setItem(SESSION_KEY, JSON.stringify(finalUser));

            return { user: finalUser, error: undefined };
        }
        return { user: null, error: "Credenciales incorrectas." };
    },

    // Función especial para confirmar dispositivo Dev
    registerDevDevice: async (identifier: string): Promise<boolean> => {
        const users = getLocalDB();
        const deviceId = getDeviceId();
        const index = users.findIndex(u => u.username === identifier || u.phone === identifier);
        
        if (index !== -1 && users[index].role === UserRole.DEVELOPER) {
            const sessions = users[index].activeSessions || [];
            if (!sessions.includes(deviceId)) {
                users[index].activeSessions = [...sessions, deviceId];
                saveLocalDB(users);
                // Auto login after verify
                localStorage.setItem(SESSION_KEY, JSON.stringify(users[index]));
                return true;
            }
        }
        return false;
    },

    logout: async () => {
        localStorage.removeItem(SESSION_KEY);
        return Promise.resolve();
    },

    getUserProfile: async (uid: string): Promise<CloudUser | null> => {
        const users = getLocalDB();
        return users.find(u => u.uid === uid) || null;
    },

    // --- GESTIÓN DE USUARIOS (DEV PANEL) ---
    createUser: async (user: CloudUser): Promise<{success: boolean, message: string, user?: CloudUser}> => {
        try {
            const users = getLocalDB();
            
            // Verificar duplicados por username
            if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
                return { success: false, message: `El usuario "${user.username}" ya existe.` };
            }

            const newUser: CloudUser = {
                ...user,
                uid: `local_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                firstLogin: null, // Se activará al primer login
                licenseValidated: false,
                activeSessions: [] // Init sessions
            };

            users.push(newUser);
            saveLocalDB(users);
            
            return { success: true, message: 'Usuario creado localmente.', user: newUser };
        } catch (e) {
            return { success: false, message: 'Error al guardar en almacenamiento local.' };
        }
    },

    updateUser: async (uid: string, data: Partial<CloudUser>): Promise<{success: boolean, message: string}> => {
        try {
            const users = getLocalDB();
            const index = users.findIndex(u => u.uid === uid);
            if (index === -1) return { success: false, message: 'Usuario no encontrado' };

            // Verificar si el nuevo username ya existe (si se está cambiando)
            if (data.username && data.username !== users[index].username) {
                if (users.some(u => u.username.toLowerCase() === data.username?.toLowerCase() && u.uid !== uid)) {
                     return { success: false, message: 'El nombre de usuario ya está en uso.' };
                }
            }

            users[index] = { ...users[index], ...data };
            saveLocalDB(users);
            return { success: true, message: 'Usuario actualizado.' };
        } catch (e) {
            return { success: false, message: 'Error al actualizar.' };
        }
    },

    deleteUser: async (uid: string): Promise<{success: boolean, message: string}> => {
        try {
            let users = getLocalDB();
            // Si es líder, eliminar también sus asistentes vinculados (opcional, pero limpio)
            const userToDelete = users.find(u => u.uid === uid);
            
            users = users.filter(u => u.uid !== uid);
            
            // Si eliminamos un líder, eliminamos sus asistentes
            if (userToDelete?.role === UserRole.LEADER) {
                users = users.filter(u => u.linkedLeaderId !== uid);
            }

            saveLocalDB(users);
            return { success: true, message: 'Usuario eliminado.' };
        } catch (e) {
            return { success: false, message: 'Error al eliminar.' };
        }
    },

    getLeaders: async (): Promise<CloudUser[]> => {
        const users = getLocalDB();
        // Devolver TODOS los usuarios para gestión, no solo líderes
        return users; 
    },

    activateLicense: async (uid: string, key: string): Promise<boolean> => {
        const users = getLocalDB();
        const userIndex = users.findIndex(u => u.uid === uid);
        
        if (userIndex !== -1) {
            if (users[userIndex].licenseKey === key) {
                users[userIndex].licenseValidated = true;
                saveLocalDB(users);
                return true;
            }
        }
        return false;
    },

    // --- IMPORTACIÓN / EXPORTACIÓN ---
    exportDatabase: () => {
        const users = getLocalDB();
        const dataStr = JSON.stringify(users, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `usuariopyme_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    importDatabase: async (jsonContent: string): Promise<boolean> => {
        try {
            const parsed = JSON.parse(jsonContent);
            if (Array.isArray(parsed)) {
                saveLocalDB(parsed);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    },

    parseTxtAndImport: async (txtContent: string): Promise<{added: number, errors: number}> => {
        const blocks = txtContent.split('_________________________________');
        const users = getLocalDB();
        let addedCount = 0;
        let errorCount = 0;

        blocks.forEach(block => {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length < 3) return; // Bloque vacío o incompleto

            const getVal = (key: string) => {
                const line = lines.find(l => l.startsWith(key));
                return line ? line.split(':')[1].trim() : '';
            };

            const city = getVal('Ciudad de Origen');
            const name = getVal('Nombre Completo');
            // Usamos campo Email del TXT como Usuario
            const email = getVal('Email') || getVal('Usuario'); 
            const pass = getVal('Contraseña');
            const phone = getVal('Teléfono');

            if (name && email && pass) {
                // Verificar duplicados
                if (!users.some(u => u.username.toLowerCase() === email.toLowerCase())) {
                    // Generar Licencia si es Líder (Si tiene Ciudad)
                    let licenseKey = '';
                    let role = UserRole.ASSISTANT; // Default
                    
                    if (city) {
                        role = UserRole.LEADER;
                        const cityCode = city.substring(0, 3).toUpperCase().padEnd(3, 'X');
                        const randomID = Math.floor(1000 + Math.random() * 9000);
                        licenseKey = `GP-${cityCode}-${new Date().getFullYear()}-${randomID}`;
                    }

                    const newUser: CloudUser = {
                        uid: `imp_${Date.now()}_${addedCount}`,
                        username: email,
                        password: pass,
                        name: name,
                        phone: phone || '',
                        role: role,
                        licenseKey: licenseKey, 
                        firstLogin: null,
                        licenseValidated: false,
                        activeSessions: []
                    };
                    
                    users.push(newUser);
                    addedCount++;
                } else {
                    errorCount++; // Duplicado
                }
            }
        });

        saveLocalDB(users);
        return { added: addedCount, errors: errorCount };
    },

    // --- CHAT LOCAL (Simulado) ---
    sendMessage: async (licenseKey: string, message: Message) => {
        const key = `${DB_CHATS_PREFIX}${licenseKey}`;
        const existing = localStorage.getItem(key);
        const messages: Message[] = existing ? JSON.parse(existing) : [];
        
        const newMessage = {
            ...message,
            timestamp: new Date().toISOString()
        };
        messages.push(newMessage);
        localStorage.setItem(key, JSON.stringify(messages));
        
        window.dispatchEvent(new Event('storage'));
    },

    subscribeToMessages: (licenseKey: string, callback: (messages: Message[]) => void) => {
        const key = `${DB_CHATS_PREFIX}${licenseKey}`;
        
        const load = () => {
            const existing = localStorage.getItem(key);
            try {
                callback(existing ? JSON.parse(existing) : []);
            } catch (e) {
                callback([]);
            }
        };

        load(); 
        const interval = setInterval(load, 1000); 
        return () => clearInterval(interval);
    },

    uploadFile: async (licenseKey: string, file: File): Promise<string> => {
        return URL.createObjectURL(file);
    }
};

export const auth = { currentUser: null };

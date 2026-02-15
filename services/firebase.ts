
import { UserRole, CloudUser, Message } from '../types';

// Clave para guardar la "Base de Datos" de usuarios en el navegador
const DB_USERS_KEY = 'Gestor_Users_DB';
const DB_CHATS_PREFIX = 'Gestor_Chat_';

// Helpers internos
const getLocalDB = (): CloudUser[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(DB_USERS_KEY);
    return data ? JSON.parse(data) : [];
};

const saveLocalDB = (users: CloudUser[]) => {
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
};

export const CloudService = {
    // --- AUTENTICACIÓN LOCAL ---
    login: async (email: string, password: string): Promise<CloudUser | null> => {
        // Simular retardo de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const users = getLocalDB();
        const user = users.find(u => u.username === email && u.password === password);
        
        if (user) {
            // Lógica de Primer Acceso Local
            if (!user.firstLogin) {
                const now = new Date();
                const trialUntil = new Date();
                trialUntil.setDate(now.getDate() + 7);
                
                user.firstLogin = now.toISOString();
                user.trialUntil = trialUntil.toISOString();
                
                // Actualizar usuario en DB
                const updatedUsers = users.map(u => u.uid === user.uid ? user : u);
                saveLocalDB(updatedUsers);
            }
            return user;
        }
        return null;
    },

    logout: async () => {
        // No hay sesión real que matar, solo limpieza de estado en App
        return Promise.resolve();
    },

    getUserProfile: async (uid: string): Promise<CloudUser | null> => {
        const users = getLocalDB();
        return users.find(u => u.uid === uid) || null;
    },

    // --- GESTIÓN DE USUARIOS (DEV PANEL) ---
    createUser: async (user: CloudUser): Promise<{success: boolean, message: string}> => {
        try {
            const users = getLocalDB();
            
            if (users.some(u => u.username === user.username)) {
                return { success: false, message: 'El usuario ya existe.' };
            }

            const newUser = {
                ...user,
                uid: `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                firstLogin: null, // Se activará al primer login
                licenseValidated: false
            };

            users.push(newUser);
            saveLocalDB(users);
            
            return { success: true, message: 'Usuario creado localmente.' };
        } catch (e) {
            return { success: false, message: 'Error al guardar en almacenamiento local.' };
        }
    },

    getLeaders: async (): Promise<CloudUser[]> => {
        const users = getLocalDB();
        return users.filter(u => u.role === UserRole.LEADER);
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
            const email = getVal('Email');
            const pass = getVal('Contraseña');
            const phone = getVal('Teléfono');

            if (name && email && pass) {
                // Verificar duplicados
                if (!users.some(u => u.username === email)) {
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
                        licenseKey: licenseKey, // Si es asistente, quedará vacía hasta vincular manual, o asumimos lógica
                        firstLogin: null,
                        licenseValidated: false
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
        
        // Disparar evento de storage para actualizar otras pestañas si están abiertas
        window.dispatchEvent(new Event('storage'));
    },

    subscribeToMessages: (licenseKey: string, callback: (messages: Message[]) => void) => {
        const key = `${DB_CHATS_PREFIX}${licenseKey}`;
        
        const load = () => {
            const existing = localStorage.getItem(key);
            callback(existing ? JSON.parse(existing) : []);
        };

        load(); // Carga inicial

        // Escuchar cambios (esto funciona entre pestañas, o podemos usar un intervalo para la misma pestaña si no hay reactividad real de storage event en el mismo documento)
        const interval = setInterval(load, 1000); 

        return () => clearInterval(interval);
    },

    uploadFile: async (licenseKey: string, file: File): Promise<string> => {
        // Simular subida devolviendo un objeto URL local (solo funciona en la sesión actual del navegador)
        return URL.createObjectURL(file);
    }
};

// Mock Auth export para compatibilidad con imports existentes, aunque no se use
export const auth = { currentUser: null }; 

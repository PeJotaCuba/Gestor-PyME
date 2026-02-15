
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, addDoc, orderBy, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserRole, CloudUser, Message } from '../types';

const firebaseConfig = {
  apiKey: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || "AIzaSy...", 
  authDomain: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || "tu-proyecto.firebaseapp.com",
  projectId: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "tu-proyecto",
  storageBucket: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || "tu-proyecto.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const CloudService = {
    login: async (email: string, password: string): Promise<CloudUser | null> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const data = userDoc.data() as CloudUser;
                
                // Lógica de Primer Acceso
                if (!data.firstLogin) {
                    const now = new Date();
                    const trialUntil = new Date();
                    trialUntil.setDate(now.getDate() + 7);
                    
                    await updateDoc(userRef, {
                        firstLogin: serverTimestamp(),
                        trialUntil: trialUntil
                    });
                    data.firstLogin = now;
                    data.trialUntil = trialUntil;
                }

                const idTokenResult = await user.getIdTokenResult(true);
                return { 
                    uid: user.uid, 
                    ...data,
                    licenseValidated: idTokenResult.claims.licenseValidated as boolean
                };
            }
            return null;
        } catch (error) {
            console.error("Login Error:", error);
            return null;
        }
    },

    getUserProfile: async (uid: string): Promise<CloudUser | null> => {
        try {
            const userDoc = await getDoc(doc(db, "usuarios", uid));
            if (userDoc.exists()) {
                 const data = userDoc.data() as CloudUser;
                 const user = auth.currentUser;
                 let licenseValidated = false;
                 if (user) {
                     const token = await user.getIdTokenResult();
                     licenseValidated = token.claims.licenseValidated as boolean;
                 }
                 return { uid, ...data, licenseValidated };
            }
            return null;
        } catch (error) {
            console.error("Get Profile Error:", error);
            return null;
        }
    },

    activateLicense: async (uid: string, key: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/activate-license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, licenseKey: key })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            return false;
        }
    },

    // Obtener todos los líderes para vinculación manual en el panel dev
    getLeaders: async (): Promise<CloudUser[]> => {
        const q = query(collection(db, "usuarios"), where("role", "==", UserRole.LEADER));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ uid: d.id, ...d.data() } as CloudUser));
    },

    createUser: async (user: CloudUser): Promise<{success: boolean, message: string}> => {
        const response = await fetch('/api/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        return await response.json();
    },

    sendMessage: async (licenseKey: string, message: Message) => {
        const chatRef = collection(db, "chats", licenseKey, "mensajes");
        await addDoc(chatRef, { ...message, timestamp: serverTimestamp() });
    },

    subscribeToMessages: (licenseKey: string, callback: (messages: Message[]) => void) => {
        const q = query(collection(db, "chats", licenseKey, "mensajes"), orderBy("timestamp", "asc"));
        return onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() } as Message));
            callback(msgs);
        });
    },

    uploadFile: async (licenseKey: string, file: File): Promise<string> => {
        const fileRef = ref(storage, `compartidos/${licenseKey}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    },
    
    logout: async () => {
        await signOut(auth);
    }
};


// This file handles the "Cloud" connection.
// In a production environment, you would fill in the firebaseConfig with real keys from Firebase Console.
// For now, we implement a "Mock Cloud" that persists to LocalStorage but simulates network delays and structure.

export interface CloudUser {
    username: string;
    password?: string;
    phone: string;
    licenseKey: string;
    role: 'LEADER' | 'ASSISTANT' | 'DEVELOPER';
}

// MOCK DATABASE IMPL (To replace with real Firebase Firestore)
const MOCK_DB_DELAY = 800; // Simulate network lag

export const CloudService = {
    
    // 1. Create a User (Called by Developer when assigning license)
    createUser: async (user: CloudUser): Promise<boolean> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const users = JSON.parse(localStorage.getItem('CLOUD_USERS_DB') || '[]');
                // Check if user exists
                if (users.find((u: CloudUser) => u.username === user.username)) {
                    alert('El usuario ya existe en la nube.');
                    resolve(false);
                    return;
                }
                users.push(user);
                localStorage.setItem('CLOUD_USERS_DB', JSON.stringify(users));
                console.log("Cloud: User Created", user);
                resolve(true);
            }, MOCK_DB_DELAY);
        });
    },

    // 2. Login (Called by AuthView)
    login: async (username: string, password: string): Promise<CloudUser | null> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const users = JSON.parse(localStorage.getItem('CLOUD_USERS_DB') || '[]');
                const user = users.find((u: CloudUser) => u.username === username && u.password === password);
                
                if (user) {
                    console.log("Cloud: Login Success", user);
                    resolve(user);
                } else {
                    console.log("Cloud: Login Failed");
                    resolve(null);
                }
            }, MOCK_DB_DELAY);
        });
    },

    // 3. Sync Data UP (Upload local data to cloud)
    uploadData: async (licenseKey: string, dataKey: string, data: any) => {
        // In real Firebase: await setDoc(doc(db, "businesses", licenseKey), { [dataKey]: data }, { merge: true });
        console.log(`Cloud: Uploading ${dataKey} for ${licenseKey}...`);
        const cloudStore = JSON.parse(localStorage.getItem(`CLOUD_DATA_${licenseKey}`) || '{}');
        cloudStore[dataKey] = data;
        cloudStore.lastUpdated = new Date().toISOString();
        localStorage.setItem(`CLOUD_DATA_${licenseKey}`, JSON.stringify(cloudStore));
    },

    // 4. Sync Data DOWN (Download cloud data to local)
    downloadData: async (licenseKey: string): Promise<any> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const data = localStorage.getItem(`CLOUD_DATA_${licenseKey}`);
                resolve(data ? JSON.parse(data) : null);
            }, MOCK_DB_DELAY);
        });
    }
};

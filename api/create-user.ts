
import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize only if not already done, inside a try block
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
  } catch (e) {
    console.error("Firebase Admin Init Error:", e);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

  // Ensure admin is initialized
  if (!admin.apps.length) {
      return res.status(500).json({ success: false, message: 'Error de servidor: Firebase no inicializado. Verifique variables de entorno.' });
  }

  const db = admin.firestore();
  const auth = admin.auth();

  const { username, password, name, phone, licenseKey, role } = req.body;

  if (!username || !password || !licenseKey || !role) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
  }

  try {
    // 1. Verificar si el usuario ya existe en Auth
    try {
        await auth.getUserByEmail(username);
        return res.status(400).json({ success: false, message: 'El correo ya está registrado.' });
    } catch (e) {
        // Usuario no existe, procedemos
    }

    // 2. Crear el usuario en Auth
    const userRecord = await auth.createUser({
      email: username,
      password: password,
      displayName: name,
    });

    // 3. Asignar Custom Claims (Role e ID de Licencia para aislamiento de seguridad)
    await auth.setCustomUserClaims(userRecord.uid, {
      role: role,
      licenseKey: licenseKey
    });

    // 4. Guardar Perfil Público en Firestore
    await db.collection('usuarios').doc(userRecord.uid).set({
      name,
      username,
      phone,
      licenseKey,
      role,
      uid: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 5. Asegurar que la licencia exista en la DB
    await db.collection('licencias').doc(licenseKey).set({
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      city: licenseKey.split('-')[1] || 'Unknown'
    }, { merge: true });

    return res.status(200).json({ 
        success: true, 
        message: `Cuenta para "${name}" creada y vinculada a licencia ${licenseKey}.` 
    });

  } catch (error: any) {
    console.error("Error en API Create User:", error);
    return res.status(500).json({ success: false, message: error.message || 'Error interno del servidor.' });
  }
}

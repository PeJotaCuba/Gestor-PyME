
import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
  } catch (e) {
    console.error("Firebase Admin Init Error:", e);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

  const { username, password, name, phone, licenseKey, role } = req.body;

  if (!username || !password || !licenseKey || !role) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
  }

  try {
    // 1. Verificar si el usuario ya existe en Auth
    let userRecord;
    try {
        userRecord = await auth.getUserByEmail(username);
        return res.status(400).json({ success: false, message: 'El correo ya está registrado.' });
    } catch (e) {
        // Usuario no existe, procedemos
    }

    // 2. Crear el usuario en Auth
    userRecord = await auth.createUser({
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

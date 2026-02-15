
import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { uid, licenseKey } = req.body;

  try {
    const userRef = admin.firestore().collection('usuarios').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    
    const userData = userDoc.data();
    
    // Verificación crítica: ¿La clave ingresada coincide con la pre-asignada por el Dev?
    if (userData?.licenseKey !== licenseKey) {
        return res.status(403).json({ success: false, message: 'Clave de licencia incorrecta para este equipo' });
    }

    // 1. Marcar como validado en Firestore
    await userRef.update({ licenseValidated: true });

    // 2. Inyectar Custom Claim permanente
    await admin.auth().setCustomUserClaims(uid, {
      ... (await admin.auth().getUser(uid)).customClaims,
      licenseValidated: true
    });

    return res.status(200).json({ success: true, message: 'Licencia activada correctamente' });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

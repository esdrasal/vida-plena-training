# Vida Plena ⚽ — Training Checklist

Checklist de entrenamiento del equipo (para el sábado, entre semana y otros pendientes), con inicio de sesión con Google y sincronización entre dispositivos vía Firebase.

## Desarrollo local

```bash
npm install
cp .env.local.example .env.local   # completa con tus credenciales de Firebase
npm run dev
```

Si `.env.local` no está configurado, la app funciona igual pero guarda los datos solo en este dispositivo (localStorage).

## Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com) y crea un proyecto.
2. Agrega una app web y copia las credenciales (`firebaseConfig`) a `.env.local`.
3. Activa **Authentication → Sign-in method → Google**.
4. Activa **Firestore Database** (modo producción, con reglas que restrinjan cada documento a su propio usuario, ver abajo).

Reglas de Firestore recomendadas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/checklists/{weekId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Despliegue

El workflow `.github/workflows/deploy.yml` construye y publica el sitio en GitHub Pages en cada push a `main`. Las credenciales de Firebase se inyectan desde **Settings → Secrets and variables → Actions** del repositorio (mismos nombres que en `.env.local.example`) — nunca se suben al código.

## Estructura de datos

Cada usuario tiene un documento por semana en `users/{uid}/checklists/{week-YYYY-W}` con:

```json
{ "sabado": { "Balones": true }, "semana": {}, "otros": [{ "text": "...", "done": false }] }
```

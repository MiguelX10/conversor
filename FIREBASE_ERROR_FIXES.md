# 🔧 SOLUCIÓN A ERRORES DE FIREBASE AUTH

## ❌ ERRORES DETECTADOS:

1. **`auth/operation-not-allowed`** - Facebook no habilitado
2. **`Missing or insufficient permissions`** - Firestore rules muy restrictivas
3. **`popup-closed-by-user`** - Usuario cerró el popup

## ✅ SOLUCIONES:

### 1. HABILITAR FACEBOOK EN FIREBASE CONSOLE

```
Ve a: https://console.firebase.google.com/project/conversor-3b620/authentication/providers

1. Click en "Facebook"
2. Enable: ON
3. App ID: [Necesitas crear app en Facebook Developers]
4. App Secret: [Desde Facebook Developers]
5. Save
```

### 2. CONFIGURAR FIRESTORE DATABASE

```
Ve a: https://console.firebase.google.com/project/conversor-3b620/firestore

1. Create Database
2. Start in TEST mode (por ahora)
3. Default location: us-central

4. Security Rules (cambiar a):
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura para usuarios autenticados
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }

    // Permitir lectura básica para todos (opcional)
    match /public/{document} {
      allow read: if true;
    }
  }
}
```

### 3. CONFIGURAR DOMINIOS AUTORIZADOS

```
Firebase Console > Authentication > Settings > Authorized domains

Agregar:
✅ localhost
✅ conversor-3b620.web.app
✅ tu-dominio-personalizado.com
```

### 4. CREAR APP FACEBOOK (Si quieres Facebook Login)

```
1. Ve a: https://developers.facebook.com/apps/
2. Create App > Consumer
3. Add Product > Facebook Login
4. Settings:
   - Valid OAuth Redirect URIs:
     https://conversor-3b620.firebaseapp.com/__/auth/handler
   - Valid Origins:
     https://localhost:5174
     https://conversor-3b620.web.app
```

## 🚀 CAMBIOS YA APLICADOS EN EL CÓDIGO:

✅ **Firestore opcional**: Si no hay permisos, usa perfil local
✅ **Mejor manejo de errores**: No falla si Firestore no funciona
✅ **Fallback automático**: Crea perfil básico si hay problemas

## 🎯 DESPUÉS DE ESTOS PASOS:

1. **Solo Google funcionará** (hasta configurar Facebook)
2. **Login persistirá** entre recargas de página
3. **Sin errores de permisos** en consola
4. **Usuario se guardará** cuando Firestore esté configurado

## ⚡ PRUEBA AHORA:

1. Ve a http://localhost:5174
2. Click "Registrarse"
3. Click "Continuar con Google"
4. ¡Debería funcionar sin errores!

---

**Estado actual**: Google Auth ✅ | Facebook ⏳ | Firestore ⏳
**Próximo**: Configurar Firestore Database (5 min)
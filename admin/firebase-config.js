// DO NOT COMMIT THIS FILE — LOCAL Firebase web config for this machine.
// Copy the config from Firebase Console → Project settings → Your apps
// and paste it here. Keep this file out of version control (it's in .gitignore).

window.firebaseConfig = {
  apiKey: "AIzaSyBiLBCZZVBlnPYw7786L_7bg51QrcPS4h4",
  authDomain: "deluxebouquet-a76c7.firebaseapp.com",
  projectId: "deluxebouquet-a76c7",
  // Use the canonical Firebase Storage bucket so uploads work reliably
  storageBucket: "deluxebouquet-a76c7.firebasestorage.app",
  messagingSenderId: "297472593094",
  appId: "1:297472593094:web:64553c3cba3047f5545bc7",
  measurementId: "G-2HM3PQYQ7Q"
};

// Helpful runtime warning for debugging
if (!window.firebaseConfig || !window.firebaseConfig.projectId) {
  console.warn('admin/firebase-config.js: Firebase config is empty or missing. Paste your Firebase web config here.');
}

// NOTE: This file is loaded as a classic <script>. Do NOT use `export` here —
// other scripts rely on `window.firebaseConfig` being present as a global.

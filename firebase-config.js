// 1) Crea un progetto Firebase.
// 2) Aggiungi una Web App.
// 3) Copia qui la configurazione che Firebase ti mostra.
// La configurazione Firebase non è una password: la sicurezza vera sta nelle regole Firestore.

export const firebaseConfig = {
  apiKey: "AIzaSyDxJ33z3PungAedogFX1mk5-hxQk3fjADw",
  authDomain: "lista-nascita-theo.firebaseapp.com",
  projectId: "lista-nascita-theo",
  storageBucket: "lista-nascita-theo.firebasestorage.app",
  messagingSenderId: "972224539509",
  appId: "1:972224539509:web:53036b24545cdab4b0413c",
  measurementId: "G-6B81NZMRTH"
};

export const siteSettings = {
  title: "Aspettando il nostro piccolo amore",
  intro: "Scegliete un regalo dalla lista, aprite il link del negozio e prenotatelo per evitare doppioni.",
  familyName: "Nicoleta e Michele",
  // Numero con prefisso internazionale, senza + e senza spazi. Esempio: 393331234567
  whatsappNumber: "393927571480"
};

export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith("INSERISCI_") &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.startsWith("INSERISCI_")
  );
}

// 1) Crea un progetto Firebase.
// 2) Aggiungi una Web App.
// 3) Copia qui la configurazione che Firebase ti mostra.
// La configurazione Firebase non è una password: la sicurezza vera sta nelle regole Firestore.

export const firebaseConfig = {
  apiKey: "INSERISCI_API_KEY",
  authDomain: "INSERISCI_PROJECT_ID.firebaseapp.com",
  projectId: "INSERISCI_PROJECT_ID",
  storageBucket: "INSERISCI_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "INSERISCI_SENDER_ID",
  appId: "INSERISCI_APP_ID"
};

export const siteSettings = {
  title: "Aspettando il nostro piccolo amore",
  intro: "Scegliete un regalo dalla lista, aprite il link del negozio e prenotatelo per evitare doppioni.",
  familyName: "Mamma e Papà",
  // Numero con prefisso internazionale, senza + e senza spazi. Esempio: 393331234567
  whatsappNumber: "393331234567"
};

export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith("INSERISCI_") &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.startsWith("INSERISCI_")
  );
}

# Lista Nascita con database Firebase + GitHub Pages

Questa versione è pensata per funzionare su GitHub Pages.

GitHub Pages ospita file statici: HTML, CSS e JavaScript. Il database viene quindi gestito da Firebase Firestore.

## Cosa include

- `index.html` - pagina pubblica della lista nascita
- `admin.html` - pannello per aggiungere/modificare/eliminare regali
- `public.js` - lettura regali e prenotazione pubblica
- `admin.js` - gestione admin con login Google
- `firebase-config.js` - configurazione del progetto Firebase
- `firestore.rules` - regole sicurezza Firestore
- `style.css` - grafica del sito

## Funzioni

- Aggiunta oggetti dalla pagina admin
- Modifica oggetti
- Eliminazione oggetti
- Link esterni verso Amazon o altri negozi
- Prenotazione regalo dal sito pubblico
- Stato in tempo reale: Disponibile / Prenotato
- Compatibile con GitHub Pages

## 1. Crea il progetto Firebase

1. Vai su Firebase Console.
2. Crea un nuovo progetto.
3. Aggiungi una Web App.
4. Copia la configurazione Firebase e incollala nel file `firebase-config.js`.

Esempio:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 2. Attiva Firestore

1. In Firebase apri Firestore Database.
2. Crea il database.
3. Scegli una regione.
4. Parti pure in modalità produzione.
5. Incolla le regole contenute nel file `firestore.rules`.

## 3. Attiva login Google per l'admin

1. In Firebase vai su Authentication.
2. Abilita il provider Google.
3. In Authentication > Settings > Authorized domains aggiungi:
   - `localhost` per test locale
   - `TUO-USERNAME.github.io` per GitHub Pages

## 4. Autorizza il tuo utente admin

1. Pubblica o apri `admin.html`.
2. Fai accesso con Google.
3. La pagina mostra il tuo UID.
4. Vai in Firestore e crea:
   - collection: `admins`
   - document ID: il tuo UID
   - campo: `role`
   - valore: `owner`

Dopo questo passaggio puoi aggiungere e modificare regali.

## 5. Test locale

Per testare sul computer, meglio usare un piccolo server locale.

Se hai Python:

```bash
python -m http.server 8000
```

Poi apri:

```text
http://localhost:8000
```

## 6. Pubblicazione su GitHub Pages

1. Crea un repository GitHub, per esempio `lista-nascita`.
2. Carica tutti i file del progetto.
3. Vai su Settings > Pages.
4. In "Build and deployment" scegli:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /root
5. Salva.

Il sito sarà disponibile su un link tipo:

```text
https://TUO-USERNAME.github.io/lista-nascita/
```

## Nota sulla sicurezza

Il file `firebase-config.js` può essere pubblico: non è una password.

La sicurezza si gestisce con le regole Firestore. In questa versione:
- chiunque può leggere la lista
- chiunque può prenotare solo un regalo ancora disponibile
- solo gli admin autorizzati possono aggiungere, modificare, eliminare o liberare regali

## Personalizzazione

Nel file `firebase-config.js` puoi modificare anche:

```js
export const siteSettings = {
  title: "Aspettando il nostro piccolo amore",
  intro: "Scegliete un regalo dalla lista...",
  familyName: "Mamma e Papà",
  whatsappNumber: "393331234567"
};
```

Il numero WhatsApp deve avere il prefisso internazionale senza `+` e senza spazi.

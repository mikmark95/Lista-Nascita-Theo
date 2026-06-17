import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const setupWarning = document.querySelector("#setupWarning");
const loginBtn = document.querySelector("#loginBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const loginStatus = document.querySelector("#loginStatus");
const uidBox = document.querySelector("#uidBox");
const uidValue = document.querySelector("#uidValue");
const adminContent = document.querySelector("#adminContent");
const giftForm = document.querySelector("#giftForm");
const formHeading = document.querySelector("#formHeading");
const resetFormBtn = document.querySelector("#resetForm");
const adminList = document.querySelector("#adminList");
const seedBtn = document.querySelector("#seedBtn");
const toast = document.querySelector("#toast");

let app = null;
let db = null;
let auth = null;
let gifts = [];
let currentUser = null;

const sampleGifts = [
  {
    name: "Passeggino leggero",
    category: "passeggio",
    price: "€199",
    shop: "Amazon",
    description: "Comodo, leggero e facile da chiudere.",
    link: "https://www.amazon.it/",
    image: "",
    status: "available",
    priority: 10
  },
  {
    name: "Culla next to me",
    category: "cameretta",
    price: "€149",
    shop: "Shop esterno",
    description: "Culla pratica da tenere vicino al letto nei primi mesi.",
    link: "https://www.google.com/search?q=culla+next+to+me",
    image: "",
    status: "available",
    priority: 20
  },
  {
    name: "Set bagnetto neonato",
    category: "bagnetto",
    price: "€45",
    shop: "Negozio online",
    description: "Set utile per il bagnetto quotidiano.",
    link: "https://www.google.com/search?q=set+bagnetto+neonato",
    image: "",
    status: "available",
    priority: 30
  }
];

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 3500);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function getCategoryLabel(category) {
  const labels = {
    passeggio: "Passeggio",
    cameretta: "Cameretta",
    bagnetto: "Bagnetto",
    abbigliamento: "Abbigliamento",
    pappa: "Pappa",
    giochi: "Giochi",
    altro: "Altro"
  };
  return labels[category] || category || "Altro";
}

function resetForm() {
  giftForm.reset();
  document.querySelector("#giftId").value = "";
  document.querySelector("#priority").value = "100";
  formHeading.textContent = "Aggiungi regalo";
}

function formDataToGift() {
  return {
    name: document.querySelector("#name").value.trim(),
    category: document.querySelector("#category").value,
    price: document.querySelector("#price").value.trim(),
    shop: document.querySelector("#shop").value.trim(),
    link: document.querySelector("#link").value.trim(),
    image: document.querySelector("#image").value.trim(),
    description: document.querySelector("#description").value.trim(),
    status: document.querySelector("#status").value,
    priority: Number(document.querySelector("#priority").value || 100),
    updatedAt: serverTimestamp()
  };
}

function editGift(gift) {
  document.querySelector("#giftId").value = gift.id;
  document.querySelector("#name").value = gift.name || "";
  document.querySelector("#category").value = gift.category || "altro";
  document.querySelector("#price").value = gift.price || "";
  document.querySelector("#shop").value = gift.shop || "";
  document.querySelector("#link").value = gift.link || "";
  document.querySelector("#image").value = gift.image || "";
  document.querySelector("#description").value = gift.description || "";
  document.querySelector("#status").value = gift.status || "available";
  document.querySelector("#priority").value = gift.priority || 100;
  formHeading.textContent = "Modifica regalo";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAdminList() {
  if (!gifts.length) {
    adminList.innerHTML = `<p class="small">Nessun regalo inserito. Puoi aggiungerne uno dal modulo oppure caricare gli esempi.</p>`;
    return;
  }

  adminList.innerHTML = gifts.map((gift) => {
    const reserved = gift.status === "reserved";
    return `
      <article class="admin-item">
        <div class="admin-item-head">
          <div>
            <h3>${escapeHtml(gift.name)}</h3>
            <p>${escapeHtml(getCategoryLabel(gift.category))} · ${escapeHtml(gift.price || "Prezzo non indicato")}</p>
            <p><strong>Stato:</strong> ${reserved ? "Prenotato" : "Disponibile"}</p>
            ${reserved ? `<p><strong>Da:</strong> ${escapeHtml(gift.reservedBy || "Non indicato")}</p>` : ""}
            ${reserved && gift.reservedContact ? `<p><strong>Contatto:</strong> ${escapeHtml(gift.reservedContact)}</p>` : ""}
            ${reserved && gift.reservedMessage ? `<p><strong>Nota:</strong> ${escapeHtml(gift.reservedMessage)}</p>` : ""}
          </div>
          <span class="status ${reserved ? "reserved" : ""}">${reserved ? "Prenotato" : "Disponibile"}</span>
        </div>
        <div class="admin-item-actions">
          <button class="button ghost small-button edit-btn" data-id="${gift.id}">Modifica</button>
          ${reserved ? `<button class="button ghost small-button free-btn" data-id="${gift.id}">Libera</button>` : ""}
          <a class="button ghost small-button" href="${escapeHtml(gift.link)}" target="_blank" rel="noopener">Apri link</a>
          <button class="button danger small-button delete-btn" data-id="${gift.id}">Elimina</button>
        </div>
      </article>
    `;
  }).join("");

  adminList.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const gift = gifts.find((item) => item.id === button.dataset.id);
      if (gift) editGift(gift);
    });
  });

  adminList.querySelectorAll(".free-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Vuoi rendere di nuovo disponibile questo regalo?")) return;
      try {
        await updateDoc(doc(db, "gifts", button.dataset.id), {
          status: "available",
          reservedBy: "",
          reservedContact: "",
          reservedMessage: "",
          reservedAt: null,
          updatedAt: serverTimestamp()
        });
        showToast("Regalo liberato.");
      } catch (error) {
        console.error(error);
        showToast("Non riesco a liberare il regalo. Controlla i permessi admin.");
      }
    });
  });

  adminList.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Eliminare definitivamente questo regalo?")) return;
      try {
        await deleteDoc(doc(db, "gifts", button.dataset.id));
        showToast("Regalo eliminato.");
      } catch (error) {
        console.error(error);
        showToast("Non riesco a eliminare il regalo. Controlla i permessi admin.");
      }
    });
  });
}

giftForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const giftId = document.querySelector("#giftId").value;
  const giftData = formDataToGift();

  if (!giftData.name || !giftData.link) {
    showToast("Nome e link sono obbligatori.");
    return;
  }

  try {
    if (giftId) {
      await updateDoc(doc(db, "gifts", giftId), giftData);
      showToast("Regalo aggiornato.");
    } else {
      await addDoc(collection(db, "gifts"), {
        ...giftData,
        createdAt: serverTimestamp()
      });
      showToast("Regalo aggiunto.");
    }
    resetForm();
  } catch (error) {
    console.error(error);
    showToast("Errore salvataggio: controlla di essere admin nelle regole Firebase.");
  }
});

resetFormBtn.addEventListener("click", resetForm);

seedBtn.addEventListener("click", async () => {
  if (!confirm("Caricare 3 regali di esempio?")) return;

  try {
    const snapshot = await getDocs(collection(db, "gifts"));
    if (!snapshot.empty && !confirm("La lista non è vuota. Vuoi aggiungere comunque gli esempi?")) return;

    const batch = writeBatch(db);
    sampleGifts.forEach((gift) => {
      const ref = doc(collection(db, "gifts"));
      batch.set(ref, {
        ...gift,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
    showToast("Esempi caricati.");
  } catch (error) {
    console.error(error);
    showToast("Non riesco a caricare gli esempi. Controlla i permessi admin.");
  }
});

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (error) {
    console.error(error);
    showToast("Accesso non riuscito.");
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

function listenGifts() {
  const giftsQuery = query(collection(db, "gifts"), orderBy("priority", "asc"));
  onSnapshot(giftsQuery, (snapshot) => {
    gifts = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    renderAdminList();
  }, (error) => {
    console.error(error);
    adminList.innerHTML = `
      <div class="alert">
        Accesso al database negato. Se hai appena fatto login, copia il tuo UID e crea il documento
        <strong>admins/&lt;TUO_UID&gt;</strong> in Firestore.
      </div>
    `;
  });
}

function init() {
  if (!isFirebaseConfigured()) {
    setupWarning.classList.remove("hidden");
    loginBtn.disabled = true;
    return;
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (!user) {
      loginStatus.textContent = "Accedi con Google. Poi autorizza il tuo UID in Firestore come spiegato nel README.";
      uidBox.classList.add("hidden");
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
      adminContent.classList.add("hidden");
      return;
    }

    loginStatus.textContent = `Accesso effettuato come ${user.email}.`;
    uidValue.textContent = user.uid;
    uidBox.classList.remove("hidden");
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    adminContent.classList.remove("hidden");

    listenGifts();
  });
}

init();

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, siteSettings, isFirebaseConfigured } from "./firebase-config.js";

const giftGrid = document.querySelector("#giftGrid");
const loading = document.querySelector("#loading");
const emptyState = document.querySelector("#emptyState");
const setupWarning = document.querySelector("#setupWarning");
const filtersEl = document.querySelector("#filters");
const toast = document.querySelector("#toast");

const reserveDialog = document.querySelector("#reserveDialog");
const reserveForm = document.querySelector("#reserveForm");
const reserveGiftName = document.querySelector("#reserveGiftName");
const closeReserveDialog = document.querySelector("#closeReserveDialog");
const cancelReserve = document.querySelector("#cancelReserve");

let gifts = [];
let activeCategory = "tutti";
let selectedGift = null;
let db = null;

document.querySelector("#siteTitle").textContent = siteSettings.title;
document.querySelector("#siteIntro").textContent = siteSettings.intro;
document.querySelector("#familyName").textContent = siteSettings.familyName;

const whatsappMessage = encodeURIComponent("Ciao! Vorrei informazioni sulla lista nascita.");
document.querySelector("#whatsappGeneral").href = `https://wa.me/${siteSettings.whatsappNumber}?text=${whatsappMessage}`;

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

function renderFilters() {
  const categories = ["tutti", ...new Set(gifts.map((gift) => gift.category || "altro"))];
  filtersEl.innerHTML = categories.map((category) => `
    <button class="filter ${category === activeCategory ? "active" : ""}" data-category="${escapeHtml(category)}">
      ${category === "tutti" ? "Tutti" : escapeHtml(getCategoryLabel(category))}
    </button>
  `).join("");

  filtersEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      render();
    });
  });
}

function render() {
  renderFilters();

  const filtered = activeCategory === "tutti"
    ? gifts
    : gifts.filter((gift) => gift.category === activeCategory);

  loading.classList.add("hidden");
  emptyState.classList.toggle("hidden", gifts.length > 0);
  giftGrid.classList.toggle("hidden", filtered.length === 0);

  giftGrid.innerHTML = filtered.map((gift) => {
    const isReserved = gift.status === "reserved";
    const image = gift.image
      ? `<img src="${escapeHtml(gift.image)}" alt="${escapeHtml(gift.name)}" loading="lazy">`
      : `<div class="placeholder-image" aria-hidden="true">🎁</div>`;

    return `
      <article class="gift-card">
        <div class="gift-image">${image}</div>
        <div class="gift-body">
          <div class="gift-meta">
            <span>${escapeHtml(gift.shop || getCategoryLabel(gift.category))}</span>
            <span class="price">${escapeHtml(gift.price || "")}</span>
          </div>
          <h3>${escapeHtml(gift.name)}</h3>
          <p>${escapeHtml(gift.description || "Regalo utile per il bambino.")}</p>
          <span class="status ${isReserved ? "reserved" : ""}">
            ${isReserved ? "Prenotato" : "Disponibile"}
          </span>
          ${isReserved && gift.reservedBy ? `<p class="small">Prenotato da: ${escapeHtml(gift.reservedBy)}</p>` : ""}
          <div class="card-actions">
            <a class="button shop" href="${escapeHtml(gift.link)}" target="_blank" rel="noopener">Apri il link</a>
            <button class="button ${isReserved ? "ghost" : "primary"} reserve-btn" data-id="${gift.id}" ${isReserved ? "disabled" : ""}>
              ${isReserved ? "Già prenotato" : "Prenota questo regalo"}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  giftGrid.querySelectorAll(".reserve-btn").forEach((button) => {
    button.addEventListener("click", () => openReserveDialog(button.dataset.id));
  });
}

function openReserveDialog(giftId) {
  selectedGift = gifts.find((gift) => gift.id === giftId);
  if (!selectedGift) return;
  reserveGiftName.textContent = `Prenota: ${selectedGift.name}`;
  reserveForm.reset();
  reserveDialog.showModal();
}

function closeDialog() {
  reserveDialog.close();
  selectedGift = null;
}

closeReserveDialog.addEventListener("click", closeDialog);
cancelReserve.addEventListener("click", closeDialog);

reserveForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedGift || !db) return;

  const reservedBy = document.querySelector("#reservedBy").value.trim();
  const reservedContact = document.querySelector("#reservedContact").value.trim();
  const reservedMessage = document.querySelector("#reservedMessage").value.trim();

  if (reservedBy.length < 2) {
    showToast("Inserisci un nome valido.");
    return;
  }

  try {
    await updateDoc(doc(db, "gifts", selectedGift.id), {
      status: "reserved",
      reservedBy,
      reservedContact,
      reservedMessage,
      reservedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const msg = encodeURIComponent(`Ciao! Ho prenotato il regalo: ${selectedGift.name}. Nome: ${reservedBy}`);
    const url = `https://wa.me/${siteSettings.whatsappNumber}?text=${msg}`;

    showToast("Regalo prenotato correttamente.");
    closeDialog();

    // Apre WhatsApp come conferma extra, ma la prenotazione è già salvata nel database.
    window.open(url, "_blank", "noopener");
  } catch (error) {
    console.error(error);
    showToast("Errore: il regalo potrebbe essere già prenotato oppure mancano i permessi.");
  }
});

function init() {
  if (!isFirebaseConfigured()) {
    setupWarning.classList.remove("hidden");
    loading.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  const giftsQuery = query(collection(db, "gifts"), orderBy("priority", "asc"));

  onSnapshot(giftsQuery, (snapshot) => {
    gifts = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    render();
  }, (error) => {
    console.error(error);
    loading.textContent = "Errore nel caricamento dei regali. Controlla configurazione e regole Firebase.";
  });
}

init();

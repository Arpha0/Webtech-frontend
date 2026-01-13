<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, ref, type Ref } from "vue";

// Typ-Definitionen
type Rezept = {
  id?: number; nameRezept: string; anleitungRezept: string;
  bild?: string; kategorie: string; dauer?: string; userId?: number;
}
type User = { id: number; username: string; }

// --- Konstanten & Refs ---
const kategorienAuswahl = ['Frühstück', 'Hauptgericht', 'Dessert', 'Snack', 'Getränk'];
const Rezepte: Ref<Rezept[]> = ref([]);
const nameEingabe = ref('');
const anleitungEingabe = ref('');
const bildEingabe = ref('');
const kategorieEingabe = ref(kategorienAuswahl[1]);
const dauerEingabe = ref('');
const editId = ref<number | null>(null);

// UI & Auth States
const selectedRecipeDetail = ref<Rezept | null>(null);
const isDarkMode = ref(true);
const isLoggedIn = ref(false);
const currentUserId = ref<number | null>(null);
const currentUsername = ref('');

const users = ref<User[]>([]);
const selectedAccount = ref<User | null>(null);
const inputPassword = ref('');
const authUser = ref('');
const authPassword = ref('');

const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080';
const suchbegriff = ref('');
const activeFilter = ref('Alle');

// Hilfsfunktion für Auto-Resize der Textarea
const autoGrow = (event: Event) => {
  const element = event.target as HTMLTextAreaElement;
  element.style.height = "auto";
  element.style.height = element.scrollHeight + "px";
};

const visibleRezepte = computed(() => {
  if (!isLoggedIn.value) return [];
  let gefilterteListe = Rezepte.value.filter(r => r.userId === currentUserId.value);
  if (activeFilter.value !== 'Alle') {
    gefilterteListe = gefilterteListe.filter(r => r.kategorie === activeFilter.value);
  }
  if (suchbegriff.value.trim() !== '') {
    const term = suchbegriff.value.toLowerCase();
    gefilterteListe = gefilterteListe.filter(r =>
      r.nameRezept.toLowerCase().includes(term) || r.anleitungRezept.toLowerCase().includes(term)
    );
  }
  return gefilterteListe;
});

// --- API Funktionen ---
function loadUsers() { axios.get<User[]>(`${baseUrl}/api/v1/users`).then(res => users.value = res.data); }

function handleLogin() {
  if (!selectedAccount.value) return;
  axios.post(`${baseUrl}/api/v1/users/login`, { username: selectedAccount.value.username, password: inputPassword.value })
    .then(res => {
      currentUserId.value = res.data.id;
      currentUsername.value = res.data.username;
      isLoggedIn.value = true;
      requestRezepte();
      inputPassword.value = '';
    }).catch(() => alert("Falsches Passwort!"));
}

function handleSignUp() {
  if (!authUser.value || !authPassword.value) return;
  axios.post(`${baseUrl}/api/v1/users/register`, { username: authUser.value, password: authPassword.value })
    .then(() => { alert("Account erstellt! Bitte jetzt einloggen."); loadUsers(); authUser.value = ''; authPassword.value = ''; });
}

function forgotPassword() {
  if (!selectedAccount.value) return;
  const newPass = prompt(`Neues Passwort für "${selectedAccount.value.username}":`);
  if (newPass) {
    axios.post(`${baseUrl}/api/v1/users/reset-password`, { username: selectedAccount.value.username, password: newPass })
      .then(() => alert("Passwort geändert!"));
  }
}

function logout() { isLoggedIn.value = false; currentUserId.value = null; selectedAccount.value = null; Rezepte.value = []; }

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (!file.type.startsWith('image/')) { alert("Bitte nur Bilder!"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { bildEingabe.value = e.target?.result as string; };
    reader.readAsDataURL(file);
  }
}

function requestRezepte() { axios.get<Rezept[]>(`${baseUrl}/api/v1/rezepte`).then(res => Rezepte.value = res.data); }

function sendRezept() {
  const r = { nameRezept: nameEingabe.value, anleitungRezept: anleitungEingabe.value, bild: bildEingabe.value, kategorie: kategorieEingabe.value, dauer: dauerEingabe.value, userId: currentUserId.value };
  if (editId.value) {
    axios.put(`${baseUrl}/api/v1/rezepte/${editId.value}`, r).then(() => { requestRezepte(); resetForm(); });
  } else {
    axios.post(`${baseUrl}/api/v1/rezepte`, r).then(() => { requestRezepte(); resetForm(); });
  }
}

function startEdit(r: Rezept) {
  nameEingabe.value = r.nameRezept; anleitungEingabe.value = r.anleitungRezept;
  bildEingabe.value = r.bild || ''; kategorieEingabe.value = r.kategorie;
  dauerEingabe.value = r.dauer || ''; editId.value = r.id || null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() { nameEingabe.value = ''; anleitungEingabe.value = ''; bildEingabe.value = ''; editId.value = null; dauerEingabe.value = ''; }

onMounted(() => { loadUsers(); })
</script>

<template>
  <div class="page-wrapper" :class="{ 'light-theme': !isDarkMode }">
    <header class="app-header">
      <div class="header-left">
        <div v-if="!isLoggedIn" class="login-zone">
          <select v-model="selectedAccount" class="user-select-head">
            <option :value="null" disabled>Account wählen</option>
            <option v-for="u in users" :key="u.id" :value="u">{{ u.username }}</option>
          </select>
          <div v-if="selectedAccount" class="pass-box">
            <input v-model="inputPassword" type="password" placeholder="Passwort" class="mini-input-head" />
            <button @click="handleLogin" class="mini-btn-head">Login</button>
            <span @click="forgotPassword" class="forgot-link">Passwort vergessen?</span>
          </div>
        </div>
        <div v-else class="logged-in-zone">
          <button @click="logout" class="mini-btn-head grey">Abmelden</button>
          <span class="user-badge">{{ currentUsername }}</span>
          <button @click="axios.delete(`${baseUrl}/api/v1/users/${currentUserId}`).then(() => logout())" class="icon-btn-head-del">🗑️</button>
        </div>
      </div>

      <h1 class="centered-title">Meine Rezepte</h1>

      <div class="header-right">
        <div v-if="!isLoggedIn" class="register-mini">
          <input v-model="authUser" placeholder="Name" class="mini-input-head" />
          <input v-model="authPassword" type="password" placeholder="Passwort" class="mini-input-head" />
          <button @click="handleSignUp" class="mini-btn-head signup-btn">Sign up</button>
        </div>
        <button @click="isDarkMode = !isDarkMode" class="theme-btn">{{ isDarkMode ? '☀️' : '🌙' }}</button>
      </div>
    </header>

    <div class="container">
      <div v-if="isLoggedIn">
        <div class="search-container">
          <input v-model="suchbegriff" placeholder="🔍 Rezept suchen..." class="search-input" />
        </div>

        <div class="filter-bar">
          <button @click="activeFilter = 'Alle'" :class="['filter-pill', { active: activeFilter === 'Alle' }]">Alles</button>
          <button v-for="kat in kategorienAuswahl" :key="kat" @click="activeFilter = kat" :class="['filter-pill', { active: activeFilter === kat }]">{{ kat }}</button>
        </div>

        <div class="card input-card">
          <h2>{{ editId ? 'Rezept bearbeiten' : 'Neues Rezept' }}</h2>
          <div class="form-grid">
            <div class="text-inputs">
              <input v-model="nameEingabe" placeholder="Rezept Name" class="input-field" />
              <div class="sub-input-grid">
                <select v-model="kategorieEingabe" class="input-field">
                  <option v-for="kat in kategorienAuswahl" :key="kat" :value="kat">{{ kat }}</option>
                </select>
                <input v-model="dauerEingabe" placeholder="⏱️ Zeit (z.B. 35min)" class="input-field" />
              </div>
              <textarea v-model="anleitungEingabe" @input="autoGrow" placeholder="Zubereitungsschritte..." class="input-field area-grow"></textarea>
            </div>
            <div class="upload-section">
              <label class="upload-btn">📷 Bild wählen<input type="file" @change="onFileSelected" accept="image/*" style="display:none" /></label>
              <div v-if="bildEingabe" class="preview-box">
                <img :src="bildEingabe" class="mini-preview" />
                <button @click="bildEingabe = ''" class="remove-x">❌</button>
              </div>
            </div>
          </div>
          <button @click="sendRezept" class="btn-save">{{ editId ? 'Speichern' : 'Hinzufügen' }}</button>
        </div>

        <TransitionGroup name="list" tag="div" class="recipe-grid">
          <div v-for="rezept in visibleRezepte" :key="rezept.id" class="recipe-card" @click="selectedRecipeDetail = rezept">
            <div class="card-image-wrapper">
              <span class="category-badge">{{ rezept.kategorie }}</span>
              <img v-if="rezept.bild" :src="rezept.bild" class="card-img" />
              <div v-else class="no-img">🍽️</div>
            </div>
            <div class="card-content">
              <h3>{{ rezept.nameRezept }}</h3>
              <div class="card-meta">
                <span v-if="rezept.dauer">⏱️ {{ rezept.dauer }}</span>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
      <div v-else class="card welcome-card">
        <h2>Willkommen!</h2>
        <p>Logge dich ein oder erstelle einen Account (Sign up).</p>
      </div>
    </div>

    <Transition name="modal-fade">
      <div v-if="selectedRecipeDetail" class="modal-overlay" @click.self="selectedRecipeDetail = null">
        <div class="modal-card">
          <button class="close-modal" @click="selectedRecipeDetail = null">✕</button>
          <div class="modal-header-info">
            <h1>{{ selectedRecipeDetail.nameRezept }}</h1>
            <div class="info-bar">
              <span class="info-item">🏷️ {{ selectedRecipeDetail.kategorie }}</span>
              <span class="info-item" v-if="selectedRecipeDetail.dauer">⏱️ {{ selectedRecipeDetail.dauer }}</span>
              <span class="info-item">🍳 Einfach</span>
            </div>
          </div>
          <div class="modal-main-content">
            <img v-if="selectedRecipeDetail.bild" :src="selectedRecipeDetail.bild" class="detail-img" />
            <div class="detail-text-box">
              <h3>Zubereitung</h3>
              <p class="anleitung-display">{{ selectedRecipeDetail.anleitungRezept }}</p>
            </div>
          </div>
          <div class="modal-actions">
            <button @click.stop="startEdit(selectedRecipeDetail); selectedRecipeDetail = null" class="btn-edit">✏️ Bearbeiten</button>
            <button @click.stop="axios.delete(`${baseUrl}/api/v1/rezepte/${selectedRecipeDetail.id}`).then(() => { requestRezepte(); selectedRecipeDetail = null; })" class="icon-btn-plain">🗑️</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Variablen & Dark Mode */
.page-wrapper {
  --bg-color: #121212; --text-main: #ffffff; --text-sec: #aaaaaa;
  --card-bg: #1e1e1e; --input-bg: #2a2a2a; --border-color: #333; --accent: #42b983;
  background-color: var(--bg-color); color: var(--text-main); min-height: 100vh; transition: 0.3s;
}
.page-wrapper.light-theme {
  --bg-color: #f4f6f8; --text-main: #2c3e50; --text-sec: #7f8c8d;
  --card-bg: #ffffff; --input-bg: #ffffff; --border-color: #ddd;
}

.app-header { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 20px; background: var(--card-bg); border-bottom: 1px solid var(--border-color); }
.centered-title { position: absolute; left: 50%; transform: translateX(-50%); margin: 0; color: var(--accent); font-size: 1.8rem; }
.header-left, .header-right, .register-mini, .login-zone, .pass-box, .logged-in-zone { display: flex; gap: 10px; align-items: center; }

.user-badge { margin-left: 15px; color: var(--accent); font-weight: bold; }
.forgot-link { font-size: 0.7rem; color: var(--text-sec); cursor: pointer; text-decoration: underline; }

.user-select-head, .mini-input-head { background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border-color); padding: 6px; border-radius: 6px; outline: none; }
.mini-btn-head { background: var(--accent); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; }

/* FIX: Mülleimer-Icon ohne schwarzen Filter und ohne weißen Hintergrund */
.icon-btn-head-del, .icon-btn-plain {
  background: transparent !important;
  border: none !important;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  line-height: 1;
  transition: transform 0.2s;
}
.icon-btn-head-del:hover, .icon-btn-plain:hover { transform: scale(1.1); }

.container { max-width: 1000px; margin: 0 auto; padding: 20px; }
.search-input { width: 100%; padding: 12px; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 25px; outline: none; margin-bottom: 20px; }

.filter-bar { display: flex; gap: 10px; margin-bottom: 25px; justify-content: center; }
.filter-pill { background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-sec); padding: 8px 18px; border-radius: 20px; cursor: pointer; }
.filter-pill.active { background: var(--accent); color: white; border-color: var(--accent); }

.input-card { background: var(--card-bg); border-radius: 12px; padding: 25px; border: 1px solid var(--border-color); margin-bottom: 40px; }
.form-grid { display: flex; gap: 20px; }
.text-inputs { flex: 2; }
.sub-input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.input-field { background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 10px; outline: none; }
.area-grow { min-height: 100px; overflow-y: hidden; resize: none; }
.upload-section { flex: 1; display: flex; flex-direction: column; align-items: center; }
.upload-btn { width: 100%; background: var(--input-bg); padding: 10px; border: 1px dashed #555; border-radius: 8px; text-align: center; cursor: pointer; color: var(--text-sec); }
.preview-box { position: relative; margin-top: 15px; width: 150px; height: 150px; }
.mini-preview { width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color); }
.remove-x { position: absolute; top: -10px; right: -10px; background: #ff4d4d; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }

.recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.recipe-card { background: var(--card-bg); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); cursor: pointer; transition: 0.3s; position: relative; }
.recipe-card:hover { transform: translateY(-5px); }
.card-image-wrapper { height: 180px; background: #252525; position: relative; }
.card-img { width: 100%; height: 100%; object-fit: cover; }
.category-badge { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: var(--accent); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; border: 1px solid var(--accent); }
.card-content { padding: 15px; }

/* Modal Detail & Text Fix */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { background: var(--card-bg); width: 100%; max-width: 800px; max-height: 90vh; border-radius: 15px; position: relative; padding: 30px; overflow-y: auto; border: 1px solid var(--border-color); }
.anleitung-display { line-height: 1.6; white-space: pre-wrap; font-size: 1.1rem; word-break: break-word; overflow-wrap: break-word; max-width: 100%; }

/* Animationen */
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal-card, .modal-fade-leave-to .modal-card { transform: translateY(20px) scale(0.95); }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateY(30px); }
.list-leave-to { opacity: 0; transform: scale(0.9); }
.list-move { transition: transform 0.4s ease; }

.modal-header-info h1 { font-size: 2.2rem; margin-bottom: 15px; color: var(--accent); }
.info-bar { display: flex; gap: 20px; margin-bottom: 25px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; color: var(--text-sec); }
.detail-img { width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin-bottom: 20px; }
.modal-actions { margin-top: 30px; display: flex; gap: 15px; justify-content: flex-end; align-items: center; }
.btn-save, .btn-edit { background: var(--accent); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
.theme-btn { background: none; border: 1px solid var(--border-color); color: var(--text-main); border-radius: 50%; width: 35px; height: 35px; cursor: pointer; }
</style>

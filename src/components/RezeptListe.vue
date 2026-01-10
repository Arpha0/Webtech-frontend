<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, ref, type Ref } from "vue";

type Rezept = {
  id?: number;
  nameRezept: string;
  anleitungRezept: string;
  bild?: string;
  kategorie: string;
  dauer?: string;
}

// Die Kategorien für Dropdown und Filter
const kategorienAuswahl = ['Frühstück', 'Hauptgericht', 'Dessert', 'Snack', 'Getränk'];

const Rezepte: Ref<Rezept[]> = ref([])
const nameEingabe = ref('')
const anleitungEingabe = ref('')
const bildEingabe = ref('')
const kategorieEingabe = ref(kategorienAuswahl[1]) // Standard auf Hauptgericht
const editId = ref<number | null>(null)
const dauerEingabe = ref('')

// Filter Variable
const activeFilter = ref('Alle')

// Hole die URL aus der Umgebungsvariable (oder nutze localhost als Fallback)
const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'

const suchbegriff = ref('')

const visibleRezepte = computed(() => {
  // Zuerst nehmen wir alle Rezepte
  let gefilterteListe = Rezepte.value;

  // 1. Nach Kategorie filtern
  if (activeFilter.value !== 'Alle') {
    gefilterteListe = gefilterteListe.filter(r => r.kategorie === activeFilter.value);
  }

  // 2. Nach Suchbegriff filtern
  if (suchbegriff.value.trim() !== '') {
    const term = suchbegriff.value.toLowerCase();
    gefilterteListe = gefilterteListe.filter(r =>
      // Wir suchen im Namen ODER in der Anleitung
      r.nameRezept.toLowerCase().includes(term) ||
      r.anleitungRezept.toLowerCase().includes(term)
    );
  }

  return gefilterteListe;
})

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];

    // Kleine Sicherheitsprüfung: Ist das Bild zu groß? (z.B. max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Das Bild ist zu groß! Bitte maximal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      bildEingabe.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

const isDarkMode = ref(true)

function requestRezepte(): void {
  axios
    .get<Rezept[]>(`${baseUrl}/api/v1/rezepte`)
    .then((response) => (Rezepte.value = response.data))
    .catch((error) => console.log(error))
}

function startEdit(rezept: Rezept) {
  if (rezept.id) {
    nameEingabe.value = rezept.nameRezept
    anleitungEingabe.value = rezept.anleitungRezept
    bildEingabe.value = rezept.bild || ''
    // Falls Kategorie vorhanden laden, sonst Standard
    kategorieEingabe.value = rezept.kategorie || kategorienAuswahl[1]
    dauerEingabe.value = rezept.dauer || ''
    editId.value = rezept.id
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function sendRezept(): void {

  // 1. VALIDIERUNG
  if (nameEingabe.value.trim() === "" || anleitungEingabe.value.trim() === "") {
    alert("So nicht, Freundchen! 🛑\nEin Rezept braucht einen Namen UND eine Anleitung!");
    return;
  }

  //2. DATEN VORBEREITEN
  const neuesRezept = {
    nameRezept: nameEingabe.value,
    anleitungRezept: anleitungEingabe.value,
    bild: bildEingabe.value,
    kategorie: kategorieEingabe.value,
    dauer: dauerEingabe.value
  }

  // 3. SENDEN (Nur wenn Validierung okay war)
  if (editId.value) {
    // UPDATE
    axios.put(`${baseUrl}/api/v1/rezepte/${editId.value}`, neuesRezept)
      .then(() => {
        requestRezepte()
        resetForm()
      })
      .catch((e) => console.log(e))
  } else {
    // NEU ERSTELLEN
    axios.post(`${baseUrl}/api/v1/rezepte`, neuesRezept)
      .then(() => {
        requestRezepte()
        resetForm()
      })
      .catch((e) => console.log(e))
  }
}

function deleteRezept(id: number | undefined): void {
  if (id === undefined) {
    return; // Abbruch, wenn keine ID da ist
  }
  axios
    .delete(`${baseUrl}/api/v1/rezepte/${id}`)
    .then(() => requestRezepte())
    .catch((error) => console.log(error))
}

function resetForm() {
  nameEingabe.value = ''
  anleitungEingabe.value = ''
  bildEingabe.value = ''
  kategorieEingabe.value = kategorienAuswahl[1]
  editId.value = null
  dauerEingabe.value = ''
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
}

onMounted(() => requestRezepte())
</script>

<template>
  <div class="page-wrapper" :class="{ 'light-theme': !isDarkMode }">

    <header class="app-header">
      <h1>Meine Rezepte</h1>

      <button @click="toggleTheme" class="theme-btn">
        {{ isDarkMode ? '☀️ Hell' : '🌙 Dunkel' }}
      </button>
    </header>

    <div class="container">

      <div class="search-container">
        <input
          v-model="suchbegriff"
          placeholder="🔍 Rezept suchen..."
          class="search-input"
        />
        <button v-if="suchbegriff" @click="suchbegriff = ''" class="clear-search">❌</button>
      </div>

      <div class="filter-bar">
        <button
          @click="activeFilter = 'Alle'"
          :class="['filter-pill', { active: activeFilter === 'Alle' }]">
          Alles
        </button>
        <button
          v-for="kat in kategorienAuswahl"
          :key="kat"
          @click="activeFilter = kat"
          :class="['filter-pill', { active: activeFilter === kat }]">
          {{ kat }}
        </button>
      </div>

      <div class="card input-card">
        <h2>{{ editId ? 'Rezept bearbeiten' : 'Neues Rezept' }}</h2>

        <div class="form-grid">
          <div class="text-inputs">
            <input v-model="nameEingabe" placeholder="Rezept Name" class="input-field" />

            <select v-model="kategorieEingabe" class="input-field select-field">
              <option v-for="kat in kategorienAuswahl" :key="kat" :value="kat">
                {{ kat }}
              </option>
            </select>
            <input v-model="dauerEingabe" placeholder="⏱️ Dauer (z.B. 30 Min)" class="input-field" />
            <textarea v-model="anleitungEingabe" placeholder="Zubereitung" rows="3" class="input-field area"></textarea>
          </div>

          <div class="upload-section">
            <label class="upload-btn">
              📷 Bild wählen
              <input type="file" @change="onFileSelected" accept="image/*" />
            </label>

            <div v-if="bildEingabe" class="preview-box">
              <img :src="bildEingabe" class="mini-preview" />
              <button @click="bildEingabe = ''" class="remove-x">❌</button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="sendRezept" class="btn btn-save">{{ editId ? 'Speichern' : 'Hinzufügen' }}</button>
          <button v-if="editId" @click="resetForm" class="btn btn-cancel">Abbrechen</button>
        </div>
      </div>

      <div class="recipe-grid">
        <div v-for="rezept in visibleRezepte" :key="rezept.id" class="recipe-card">

          <div class="card-image-wrapper">
            <span class="category-badge">{{ rezept.kategorie || 'Allgemein' }}</span>
            <img v-if="rezept.bild" :src="rezept.bild" class="card-img" />
            <div v-else class="no-img">🍽️</div>
          </div>

          <div class="card-content">
            <h3>{{ rezept.nameRezept }}</h3>
            <p>{{ rezept.anleitungRezept }}</p>
            <span v-if="rezept.dauer" class="duration-tag">⏱️ {{ rezept.dauer }}</span>
          </div>

          <div class="card-footer">
            <button @click="startEdit(rezept)" class="icon-btn edit-icon">✏️</button>
            <button @click="deleteRezept(rezept.id)" class="icon-btn delete-icon">🗑️</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

/* VARIABLEN FÜR DARK/LIGHT MODE */
.page-wrapper {
  /* Standard: Dunkel */
  --bg-color: #121212;
  --text-main: #ffffff;
  --text-sec: #aaaaaa;
  --card-bg: #1e1e1e;
  --border-color: #333333;
  --input-bg: #2a2a2a;
  --input-text: #ffffff;
  --accent: #42b983;
  --badge-bg: rgba(0, 0, 0, 0.75);

  /* Variablen anwenden */
  background-color: var(--bg-color);
  color: var(--text-main);
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  padding-bottom: 50px;
  transition: background-color 0.3s, color 0.3s;
}

/* Wenn Light-Mode aktiv ist, überschreiben die Variablen */
.page-wrapper.light-theme {
  --bg-color: #f4f6f8;
  --text-main: #2c3e50;
  --text-sec: #666666;
  --card-bg: #ffffff;
  --border-color: #dddddd;
  --input-bg: #ffffff;
  --input-text: #333333;
  --badge-bg: rgba(255, 255, 255, 0.9);
}

.app-header {
  background-color: var(--card-bg);
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 30px;
  display: flex; justify-content: space-between; align-items: center; /* Layout für Button */
}
.app-header h1 { margin: 0; color: var(--accent); font-size: 1.8rem; }

/* SUCHLEISTE */
.search-container {
  margin-bottom: 15px;
  position: relative; /* Damit das X absolut positioniert werden kann */
  max-width: 100%;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 15px; /* Rechts Platz für das X */
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  color: var(--input-text);
  border-radius: 25px; /* Rundere Ecken sehen moderner aus */
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 8px rgba(66, 185, 131, 0.3);
}

.clear-search {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}

/* Neuer Button Style */
.theme-btn {
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Filter */
.filter-bar {
  display: flex; gap: 10px; margin-bottom: 25px; overflow-x: auto; padding-bottom: 5px; justify-content: center;
}

.filter-pill {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  color: var(--text-sec);
  padding: 8px 18px; border-radius: 20px; cursor: pointer; white-space: nowrap;
}

.filter-pill:hover { border-color: var(--text-main); }
.filter-pill.active { background: var(--accent); color: white; border-color: var(--accent); font-weight: bold; }

/* Input Card */
.card {
  background: var(--card-bg);
  border-radius: 12px; padding: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.input-card { margin-bottom: 40px; }
.input-card h2 { margin-top: 0; color: var(--text-main); font-size: 1.3rem; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }

.form-grid { display: flex; gap: 20px; flex-wrap: wrap; }
.text-inputs { flex: 2; display: flex; flex-direction: column; gap: 12px; min-width: 250px; }

.input-field {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  color: var(--input-text);
  padding: 12px; border-radius: 8px; font-size: 1rem; outline: none; width: 100%;
}
.input-field:focus { border-color: var(--accent); }

.select-field { cursor: pointer; }
.area { resize: vertical; min-height: 80px; }

.upload-section { flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; min-width: 150px; }
.upload-btn {
  background: var(--input-bg);
  padding: 10px 15px; border-radius: 8px; cursor: pointer;
  border: 1px dashed var(--text-sec);
  width: 100%; text-align: center; color: var(--text-main);
}
.upload-btn:hover { border-color: var(--accent); }
.upload-btn input { display: none; }

.preview-box { position: relative; margin-top: 10px; }
.mini-preview { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid var(--border-color); }
.remove-x {
  position: absolute; top: -8px; right: -8px;
  background: #d9534f; color: white; border: none; border-radius: 50%;
  width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.form-actions { margin-top: 20px; display: flex; gap: 10px; }
.btn { padding: 12px 24px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; flex: 1; font-size: 1rem; }
.btn-save { background: var(--accent); color: #fff; }
.btn-cancel { background: var(--text-sec); color: #fff; }

/* Recipe List */
.recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 25px; }

.recipe-card {
  background: var(--card-bg);
  border-radius: 12px; overflow: hidden;
  border: 1px solid var(--border-color);
  display: flex; flex-direction: column; transition: transform 0.2s;
}

.recipe-card:hover { transform: translateY(-5px); border-color: var(--text-sec); }

.card-image-wrapper {
  height: 180px; background: #252525; display: flex; align-items: center; justify-content: center; position: relative;
}
.card-img { width: 100%; height: 100%; object-fit: cover; }
.no-img { font-size: 3rem; }

.category-badge {
  position: absolute; top: 10px; right: 10px;
  background: var(--badge-bg);
  color: var(--accent); padding: 5px 12px;
  border-radius: 15px; font-size: 0.8rem; font-weight: bold; border: 1px solid var(--accent);
}

.card-content { padding: 15px; flex-grow: 1; }
.card-content h3 { margin: 0 0 8px 0; color: var(--text-main); font-size: 1.2rem; }
.card-content p { color: var(--text-sec); font-size: 0.95rem; line-height: 1.4; margin: 0; }

.card-footer {
  padding: 12px 15px; background: var(--input-bg); display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color);
}

.icon-btn {
  background: none; border: none; cursor: pointer; font-size: 1.3rem; padding: 5px; border-radius: 5px; transition: background 0.2s;
}
.edit-icon:hover { background: rgba(255, 193, 7, 0.2); }
.delete-icon:hover { background: rgba(220, 53, 69, 0.3); }

@media (max-width: 600px) {
  .form-grid { flex-direction: column; }
  .filter-bar { justify-content: flex-start; }
}
</style>

<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, ref, type Ref } from "vue";

type Rezept = {
  id?: number;
  nameRezept: string;
  anleitungRezept: string;
  bild?: string;
  kategorie: string;
}

// Die Kategorien für Dropdown und Filter
const kategorienAuswahl = ['Frühstück', 'Hauptgericht', 'Dessert', 'Snack', 'Getränk'];

const Rezepte: Ref<Rezept[]> = ref([])
const nameEingabe = ref('')
const anleitungEingabe = ref('')
const bildEingabe = ref('')
const kategorieEingabe = ref(kategorienAuswahl[1]) // Standard auf Hauptgericht
const editId = ref<number | null>(null)

// Filter Variable
const activeFilter = ref('Alle')

// Hole die URL aus der Umgebungsvariable (oder nutze localhost als Fallback)
const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'

// Filter-Logik
const visibleRezepte = computed(() => {
  if (activeFilter.value === 'Alle') {
    return Rezepte.value;
  }
  return Rezepte.value.filter(r => r.kategorie === activeFilter.value);
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
    editId.value = rezept.id
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function sendRezept(): void {
  const neuesRezept = {
    nameRezept: nameEingabe.value,
    anleitungRezept: anleitungEingabe.value,
    bild: bildEingabe.value,
    kategorie: kategorieEingabe.value
  }

  if (editId.value) {
    // FALL 1: Update (PUT), wenn wir eine editId haben
    axios.put(`${baseUrl}/api/v1/rezepte/${editId.value}`, neuesRezept)
      .then(() => {
        requestRezepte()
        resetForm()
      })
      .catch((e) => console.log(e))
  } else {
    // FALL 2: Neu erstellen (POST), wie vorher
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
}

onMounted(() => requestRezepte())
</script>

<template>
  <div class="page-wrapper">

    <header class="app-header">
      <h1>Meine Rezepte</h1>
    </header>

    <div class="container">

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
/* Reset & Global */
* { box-sizing: border-box; }

.page-wrapper {
  background-color: #121212;
  color: #fff;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  padding-bottom: 50px;
}

.app-header {
  background-color: #1e1e1e;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #333;
  margin-bottom: 30px;
}
.app-header h1 { margin: 0; color: #42b983; font-size: 1.8rem; }

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
  background: #2a2a2a; border: 1px solid #444; color: #ccc;
  padding: 8px 18px; border-radius: 20px; cursor: pointer; white-space: nowrap;
}

.filter-pill:hover { background: #333; }
.filter-pill.active { background: #42b983; color: white; border-color: #42b983; font-weight: bold; }

/* Input Card */
.card {
  background: #1e1e1e; border-radius: 12px; padding: 20px; border: 1px solid #333; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.input-card { margin-bottom: 40px; }
.input-card h2 { margin-top: 0; color: #eee; font-size: 1.3rem; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px; }

.form-grid { display: flex; gap: 20px; flex-wrap: wrap; }
.text-inputs { flex: 2; display: flex; flex-direction: column; gap: 12px; min-width: 250px; }

.input-field {
  background: #2a2a2a; border: 1px solid #444; color: white;
  padding: 12px; border-radius: 8px; font-size: 1rem; outline: none; width: 100%;
}
.input-field:focus { border-color: #42b983; }

.select-field { cursor: pointer; }
.area { resize: vertical; min-height: 80px; }

.upload-section { flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; min-width: 150px; }
.upload-btn {
  background: #333; padding: 10px 15px; border-radius: 8px; cursor: pointer; border: 1px dashed #666; width: 100%; text-align: center;
}
.upload-btn:hover { background: #444; border-color: #888; }
.upload-btn input { display: none; }

.preview-box { position: relative; margin-top: 10px; }
.mini-preview { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #555; }
.remove-x {
  position: absolute; top: -8px; right: -8px;
  background: #d9534f; color: white; border: none; border-radius: 50%;
  width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.form-actions { margin-top: 20px; display: flex; gap: 10px; }
.btn { padding: 12px 24px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; flex: 1; font-size: 1rem; }
.btn-save { background: #42b983; color: #fff; }
.btn-cancel { background: #555; color: #fff; }

/* Recipe List */
.recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 25px; }

.recipe-card {
  background: #1e1e1e; border-radius: 12px; overflow: hidden; border: 1px solid #333;
  display: flex; flex-direction: column; transition: transform 0.2s;
}

.recipe-card:hover { transform: translateY(-5px); border-color: #555; }

.card-image-wrapper {
  height: 180px; background: #252525; display: flex; align-items: center; justify-content: center; position: relative;
}
.card-img { width: 100%; height: 100%; object-fit: cover; }
.no-img { font-size: 3rem; }

.category-badge {
  position: absolute; top: 10px; right: 10px;
  background: rgba(0, 0, 0, 0.75); color: #42b983; padding: 5px 12px;
  border-radius: 15px; font-size: 0.8rem; font-weight: bold; border: 1px solid #42b983;
}

.card-content { padding: 15px; flex-grow: 1; }
.card-content h3 { margin: 0 0 8px 0; color: #fff; font-size: 1.2rem; }
.card-content p { color: #aaa; font-size: 0.95rem; line-height: 1.4; margin: 0; }

.card-footer {
  padding: 12px 15px; background: #252525; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #333;
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

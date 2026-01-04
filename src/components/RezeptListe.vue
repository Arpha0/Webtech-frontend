<script setup lang="ts">
import axios from "axios";
import { onMounted, ref, type Ref } from "vue";

// Typen
type Rezept = {
  id?: number;
  nameRezept: string;
  anleitungRezept: string;
  bild?: string;
}

// State
const Rezepte: Ref<Rezept[]> = ref([])
const nameEingabe = ref('')
const anleitungEingabe = ref('')
const bildEingabe = ref('')
const editId = ref<number | null>(null)

// Backend URL
const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'

// --- Funktionen ---

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (file.size > 5000000) { // Limit auf 5MB erhöht
      alert("Datei ist zu groß (Max 5MB)!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      // Ergebnis in Variable speichern
      bildEingabe.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

function requestRezepte(): void {
  axios.get<Rezept[]>(`${baseUrl}/api/v1/rezepte`)
    .then((response) => (Rezepte.value = response.data))
    .catch((error) => console.log(error))
}

function startEdit(rezept: Rezept) {
  nameEingabe.value = rezept.nameRezept
  anleitungEingabe.value = rezept.anleitungRezept
  bildEingabe.value = rezept.bild || ''
  editId.value = rezept.id || null
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sendRezept(): void {
  if (!nameEingabe.value) { alert("Bitte Namen eingeben!"); return; }

  const neuesRezept = {
    nameRezept: nameEingabe.value,
    anleitungRezept: anleitungEingabe.value,
    bild: bildEingabe.value
  }

  if (editId.value) {
    axios.put(`${baseUrl}/api/v1/rezepte/${editId.value}`, neuesRezept)
      .then(() => { requestRezepte(); resetForm(); })
  } else {
    axios.post(`${baseUrl}/api/v1/rezepte`, neuesRezept)
      .then(() => { requestRezepte(); resetForm(); })
  }
}

function deleteRezept(id: number | undefined): void {
  if (!id) return;

  axios.delete(`${baseUrl}/api/v1/rezepte/${id}`)
    .then(() => requestRezepte())
    .catch((e) => console.log(e))
}

function resetForm() {
  nameEingabe.value = ''
  anleitungEingabe.value = ''
  bildEingabe.value = ''
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

      <div class="card input-card">
        <h2>{{ editId ? 'Rezept bearbeiten' : 'Neues Rezept' }}</h2>

        <div class="form-grid">
          <div class="text-inputs">
            <input v-model="nameEingabe" placeholder="Name des Gerichts" class="input-field" />
            <textarea v-model="anleitungEingabe" placeholder="Zubereitung..." rows="3" class="input-field area"></textarea>
          </div>

          <div class="upload-section">
            <label class="upload-btn">
              📷 Bild wählen
              <input type="file" @change="onFileSelected" accept="image/*" />
            </label>
            <div v-if="bildEingabe" class="preview-box">
              <img :src="bildEingabe" class="mini-preview" />
              <span @click="bildEingabe = ''" class="remove-x">❌</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="sendRezept" class="btn btn-save">{{ editId ? 'Speichern' : 'Hinzufügen' }}</button>
          <button v-if="editId" @click="resetForm" class="btn btn-cancel">Abbrechen</button>
        </div>
      </div>

      <div class="recipe-grid">
        <div v-for="rezept in Rezepte" :key="rezept.id" class="recipe-card">

          <div class="card-image-wrapper">
            <img v-if="rezept.bild" :src="rezept.bild" class="card-img" />
            <div v-else class="no-img">🍽️</div>
          </div>

          <div class="card-content">
            <h3>{{ rezept.nameRezept }}</h3>
            <p>{{ rezept.anleitungRezept }}</p>
          </div>

          <div class="card-footer">
            <button @click="startEdit(rezept)" class="icon-btn">✏️</button>
            <button @click="deleteRezept(rezept.id)" class="icon-btn delete">🗑️</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Reset & Fonts */
* { box-sizing: border-box; }

.page-wrapper {
  background-color: #121212;
  color: #fff;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
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
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

/* KARTEN STYLE */
.card {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #333;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

/* INPUT BEREICH */
.input-card { margin-bottom: 40px; }
.input-card h2 { margin-top: 0; color: #ccc; font-size: 1.2rem; margin-bottom: 15px; }

.form-grid { display: flex; gap: 20px; flex-wrap: wrap; }
.text-inputs { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 250px; }

.input-field {
  background: #2a2a2a; border: 1px solid #444; color: white;
  padding: 12px; border-radius: 8px; font-size: 1rem; outline: none;
}
.input-field:focus { border-color: #42b983; }
.area { resize: vertical; }

.upload-section { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
.upload-btn {
  background: #333; padding: 10px 15px; border-radius: 8px; cursor: pointer; border: 1px dashed #666;
}
.upload-btn:hover { background: #444; }
.upload-btn input { display: none; }

.preview-box { position: relative; }
.mini-preview { width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #555; }
.remove-x { position: absolute; top: -5px; right: -5px; cursor: pointer; background: #000; border-radius: 50%; padding: 2px; font-size: 0.8rem; }

.form-actions { margin-top: 20px; display: flex; gap: 10px; }
.btn { padding: 10px 20px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; flex: 1; }
.btn-save { background: #42b983; color: #fff; }
.btn-cancel { background: #555; color: #fff; }

/* REZEPT LISTE */
.recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }

.recipe-card {
  background: #1e1e1e; border-radius: 12px; overflow: hidden; border: 1px solid #333;
  display: flex; flex-direction: column;
}

.card-image-wrapper { height: 180px; background: #252525; display: flex; align-items: center; justify-content: center; overflow: hidden;}
.card-img { width: 100%; height: 100%; object-fit: cover; }
.no-img { font-size: 3rem; }

.card-content { padding: 15px; flex-grow: 1; }
.card-content h3 { margin: 0 0 5px 0; color: #fff; }
.card-content p { color: #aaa; font-size: 0.9rem; line-height: 1.4; }

.card-footer {
  padding: 10px 15px; background: #252525; display: flex; justify-content: flex-end; gap: 10px;
}

.icon-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; transition: transform 0.2s; }
.icon-btn:hover { transform: scale(1.2); }
</style>

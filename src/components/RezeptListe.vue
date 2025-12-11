<script setup lang="ts">
import axios from "axios";
import { onMounted, ref, type Ref } from "vue";

// Datentyp passend zu deinem Backend-DTO
type Rezept = {
  id?: number;
  nameRezept: string;
  anleitungRezept: string;
}

const Rezepte: Ref<Rezept[]> = ref([])
const nameEingabe = ref('')
const anleitungEingabe = ref('')

// Hole die URL aus der Umgebungsvariable (oder nutze localhost als Fallback)
const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'

function requestRezepte(): void {
  axios
    .get<Rezept[]>(`${baseUrl}/api/v1/rezepte`)
    .then((response) => (Rezepte.value = response.data))
    .catch((error) => console.log(error))
}

function sendRezept(): void {
  const neuesRezept = {
    nameRezept: nameEingabe.value,
    anleitungRezept: anleitungEingabe.value
  }

  axios
    .post(`${baseUrl}/api/v1/rezepte`, neuesRezept)
    .then((response) => {
      // Liste neu laden, damit das neue Rezept sofort erscheint
      requestRezepte()
      // Felder leeren
      nameEingabe.value = ''
      anleitungEingabe.value = ''
    })
    .catch((error) => console.log(error))
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

onMounted(() => requestRezepte())
</script>

<template>
  <div class="rezept-container">
    <h1>Meine Rezeptsammlung 🍳</h1>

    <div class="form-container">
      <input v-model="nameEingabe" placeholder="Rezept Name" type="text">
      <input v-model="anleitungEingabe" placeholder="Zubereitung" type="text">
      <button @click="sendRezept">Hinzufügen</button>
    </div>

    <ul>
      <li v-for="rezept in Rezepte" :key="rezept.id">
        <div>
        <strong>{{ rezept.nameRezept }}</strong>
        <p>{{ rezept.anleitungRezept }}</p>
        </div>
        <button @click="deleteRezept(rezept.id)">Löschen</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.rezept-container {
  color: #e0e0e0;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: hsla(160, 100%, 37%, 1);
  text-align: center;
  margin-bottom: 2rem;
}

/* Styling für das neue Formular */
.form-container {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  justify-content: center;
}

input {
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #555;
  background-color: #333;
  color: white;
}

button {
  padding: 10px 20px;
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background-color: hsla(160, 100%, 37%, 0.8);
}

ul {
  list-style: none;
  padding: 0;
}

li {
  background-color: #2c2c2c;
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #444;
}

strong {
  font-size: 1.2em;
  color: #ffffff;
  display: block;
  margin-bottom: 5px;
}

p {
  color: #c0c0c0;
  margin: 0;
}
</style>

<script setup lang="ts">
import axios from "axios";
import {onMounted, ref, type Ref} from "vue";

type Rezept = {nameRezept:string , anleitungRezept:string}

const Rezepte: Ref<Rezept[]> = ref([])

    function requestRezepte(): void {
      axios
        .get<Rezept[]>(`https://webtech-backend-ohtd.onrender.com/api/v1/rezepte`)
        .then((response) => (Rezepte.value = response.data))
        .catch((error) => console.log(error))
    }

onMounted(() => requestRezepte())

</script>

<template>
  <div>
    <h1>Meine Rezeptsammlung 🍳</h1>

    <ul>
      <li v-for="rezept in Rezepte" :key="rezept.nameRezept">
        <strong>{{ rezept.nameRezept }}</strong>
        <p>{{ rezept.anleitungRezept }}</p>
      </li>
    </ul>
  </div>

</template>

<style scoped>

  /* Legt eine helle Grundfarbe für den gesamten Text in der Komponente fest */
.rezept-container {
  color: #e0e0e0;
}

h1 {
  /* Vue's typisches Grün für die Überschrift */
  color: hsla(160, 100%, 37%, 1);
  text-align: center;
  margin-bottom: 2rem;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  /* Ein dunkler Grauton für den Hintergrund jedes Listeneintrags */
  background-color: #2c2c2c;
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 8px;
  /* Eine feine, hellere Umrandung */
  border: 1px solid #444;
}

strong {
  font-size: 1.2em;
  /* Reines Weiß für den Rezeptnamen, damit er hervorsticht */
  color: #ffffff;
}

p {
  /* Ein etwas weicheres Grau für die Beschreibung */
  color: #c0c0c0;
}
</style>



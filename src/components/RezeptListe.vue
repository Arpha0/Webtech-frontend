<script setup lang="ts">

    function requestHeroes(): void {
      axios
        .get<Hero[]>(`${url}/heroes`)
        .then((response) => (heroes.value = response.data))
        .catch((error) => console.log(error))
    }

//Eine Liste (Array) mit deinen Rezepten
const rezepte = [
  {
    id: 1,
    name: "Spaghetti Carbonara",
    beschreibung: "Ein klassisches italienisches Nudelgericht."
  },
  {
    id: 2,
    name: "Apfelkuchen",
    beschreibung: "Omas bester Apfelkuchen mit Streuseln."
  },
  {
    id: 3,
    name: "Linsen-Dal",
    beschreibung: "Ein schnelles und gesundes indisches Gericht."
  }
]
</script>

<template>
  <div>
    <h1>Meine Rezeptsammlung 🍳</h1>

    <ul>
      <li v-for="rezept in rezepte" :key="rezept.id">
        <strong>{{ rezept.name }}</strong>
        <p>{{ rezept.beschreibung }}</p>
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



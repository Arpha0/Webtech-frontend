import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RezeptListe from '../RezeptListe.vue'
import axios from 'axios'

// 1. Axios mocken
vi.mock('axios')

describe('RezeptListe.vue', () => {

  // Vor jedem Test: Mocks resetten & Default-Antworten setzen
  beforeEach(() => {
    vi.resetAllMocks()

    // Damit loadUsers() im onMounted nicht abstürzt:
    vi.mocked(axios.get).mockResolvedValue({ data: [] })
  })

  // --- HILFSFUNKTION: Simuliert einen eingeloggten User ---
  async function mountLoggedIn() {
    const wrapper = mount(RezeptListe)
    await flushPromises() // Warten auf initiales loadUsers

    const vm = wrapper.vm as any

    vm.isLoggedIn = true
    vm.currentUserId = 123
    vm.currentUsername = 'TestUser'

    // warten kurz, damit Vue das Re-Rendering (v-if="isLoggedIn") macht
    await wrapper.vm.$nextTick()

    return wrapper
  }

  // TEST 1: Zeigt den "Willkommen"-Screen wenn ausgeloggt
  it('shows welcome message when logged out', async () => {
    const wrapper = mount(RezeptListe)
    await flushPromises()

    expect(wrapper.text()).toContain('Willkommen!')
    expect(wrapper.text()).toContain('Logge dich ein')
    // Eingabefelder sollten NICHT da sein
    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  // TEST 2: Zeigt Rezepte an (wenn eingeloggt)
  it('shows recipes from backend when logged in', async () => {
    // 1. Wrapper holen (bereits "eingeloggt")
    const wrapper = await mountLoggedIn()

    // 2. Daten vorbereiten (WICHTIG: userId muss passen!)
    const mockRezepte = [
      { id: 1, nameRezept: 'Pfannkuchen', kategorie: 'Frühstück', userId: 123 },
      { id: 2, nameRezept: 'Pizza', kategorie: 'Hauptgericht', userId: 123 }
    ]

    // 3. Daten direkt in die Ref schieben
    const vm = wrapper.vm as any
    vm.Rezepte = mockRezepte

    // 4. Update abwarten
    await wrapper.vm.$nextTick()

    // 5. Prüfung
    expect(wrapper.text()).toContain('Pfannkuchen')
    expect(wrapper.text()).toContain('Pizza')
    expect(wrapper.findAll('.recipe-card').length).toBe(2)
  })

  // TEST 3: Neues Rezept erstellen
  it('sends POST request when adding a recipe', async () => {
    const wrapper = await mountLoggedIn()

    // Mocks für den POST call
    vi.mocked(axios.post).mockResolvedValue({ data: {} })
    // Nach dem Speichern lädt er neu, also GET mocken
    vi.mocked(axios.get).mockResolvedValue({ data: [] })

    // Formular ausfüllen
    await wrapper.find('input[placeholder="Rezept Name"]').setValue('Burger')
    await wrapper.find('textarea').setValue('Braten')

    // Button "Hinzufügen" klicken (.btn-save)
    await wrapper.find('.btn-save').trigger('click')

    // Prüfen
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/rezepte'),
      expect.objectContaining({
        nameRezept: 'Burger',
        anleitungRezept: 'Braten',
        userId: 123 // Muss mit unserem Fake-User übereinstimmen
      })
    )
  })

  // TEST 4: Rezept Löschen (Über Modal)
  it('opens modal and deletes recipe', async () => {
    const wrapper = await mountLoggedIn()

    // 1. Ein Rezept simulieren
    const mockRezept = { id: 99, nameRezept: 'Löschmich', kategorie: 'Snack', userId: 123, anleitungRezept: 'Test' }
    const vm = wrapper.vm as any
    vm.Rezepte = [mockRezept]
    await wrapper.vm.$nextTick()

    // 2. Auf die Karte klicken, um Modal zu öffnen
    await wrapper.find('.recipe-card').trigger('click')

    // 3. Warten bis Vue das Modal rendert (v-if)
    await wrapper.vm.$nextTick()

    // Prüfen ob Modal offen ist
    expect(wrapper.text()).toContain('Zubereitung')

    // 4. Löschen simulieren
    vi.mocked(axios.delete).mockResolvedValue({})
    vi.mocked(axios.get).mockResolvedValue({ data: [] })

    // VERBESSERUNG: Wir suchen spezifisch im Modal
    const deleteBtn = wrapper.find('.modal-card .icon-btn-plain')

    // TypeScript-Check: Existiert der Button?
    if (deleteBtn.exists()) {
      await deleteBtn.trigger('click')
      // 5. Prüfen
      expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/99'))
    } else {
      // Falls der Test fehlschlägt, wissen wir warum
      throw new Error('Löschen-Button im Modal wurde nicht gefunden!')
    }
  })

  // TEST 5: Dark Mode Toggle
  it('toggles dark mode class', async () => {
    const wrapper = mount(RezeptListe) // Mountet standardmäßig mit isDarkMode = true

    // Standard: Klasse 'light-theme' FEHLT (da isDarkMode = true)
    expect(wrapper.classes()).not.toContain('light-theme')

    // Button klicken (.theme-btn)
    await wrapper.find('.theme-btn').trigger('click')

    // Jetzt sollte 'light-theme' da sein
    expect(wrapper.classes()).toContain('light-theme')
  })

  // TEST 6: Suchfilter funktioniert
  it('filters recipes by search term', async () => {
    const wrapper = await mountLoggedIn()

    // 2 Rezepte
    const vm = wrapper.vm as any
    vm.Rezepte = [
      { id: 1, nameRezept: 'Spaghetti', userId: 123, anleitungRezept: 'Kochen', kategorie: 'Hauptgericht' },
      { id: 2, nameRezept: 'Salat', userId: 123, anleitungRezept: 'Schneiden', kategorie: 'Vorspeise' }
    ]
    await wrapper.vm.$nextTick()

    // Suche eingeben
    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('Spaghetti')

    // Prüfen: Salat sollte weg sein, Spaghetti noch da
    expect(wrapper.text()).toContain('Spaghetti')
    expect(wrapper.text()).not.toContain('Salat')
  })
})

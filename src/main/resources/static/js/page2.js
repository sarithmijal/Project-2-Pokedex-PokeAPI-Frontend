// Page 2: Pokémon cards from PokéAPI with a 4-SECOND search delay.
//
// Search behavior (different from page 1):
//   - uses the "change" event (fires when the user presses Enter or leaves the field),
//     NOT "input" (which fires on every keystroke)
//   - waits SEARCH_DELAY_MS (4 seconds) before showing the results

const MAX_POKEMON = 1025; // national dex (avoids special forms without artwork)
const PAGE_SIZE = 12; // divisible by 1, 2, 3 and 4 columns
const SEARCH_DELAY_MS = 4000; // the 4-second delay required for the search

// Optional: set to 4000 if the search BAR itself must appear after 4 seconds
const REVEAL_SEARCH_BAR_AFTER_MS = 0;

const grid = document.getElementById("grid");
const searchBox = document.getElementById("search-box");
const searchInput = document.getElementById("search");
const statusBox = document.getElementById("status");
const statusText = document.getElementById("status-text");
const loadMoreButton = document.getElementById("load-more");
const emptyMessage = document.getElementById("empty");
const errorBox = document.getElementById("error");

let allPokemon = []; // [{ name, id }] -> the whole list (endpoint /pokemon)
let visibleList = []; // the list after applying the search
let renderedCount = 0; // how many cards are already on screen
let generation = 0; // increases on every new search to ignore stale responses
let searchTimer = null;
let countdownTimer = null;
const cardCache = new Map(); // id -> promise with the card data

function setStatus(message) {
  statusText.textContent = message;
  statusBox.hidden = !message;
}

// Loads the data a card needs: endpoint /pokemon/{id} (image, types)
// and endpoint /pokemon-species/{id} (description). Both run in PARALLEL.
function loadCardData(id) {
  if (!cardCache.has(id)) {
    const request = Promise.all([
      getJson(`${API_BASE}/pokemon/${id}`),
      getJson(`${API_BASE}/pokemon-species/${id}`),
    ]).then(([pokemon, species]) => {
      // find: first description written in English
      const english = species.flavor_text_entries.find((entry) => entry.language.name === "en");
      return {
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default,
        types: pokemon.types.map((slot) => slot.type.name),
        description: english ? cleanText(english.flavor_text) : "No description available.",
      };
    });
    cardCache.set(id, request);
    request.catch(() => cardCache.delete(id)); // allow retrying failed ones
  }
  return cardCache.get(id);
}

async function renderNextBatch() {
  const myGeneration = generation;
  const batch = visibleList.slice(renderedCount, renderedCount + PAGE_SIZE);
  renderedCount += batch.length;
  loadMoreButton.hidden = true;
  errorBox.hidden = true;
  setStatus("Loading Pokémon...");

  // allSettled: waits for ALL requests, even if some fail
  const results = await Promise.allSettled(batch.map((item) => loadCardData(item.id)));

  if (myGeneration !== generation) return; // a newer search replaced this one

  let failed = 0;
  results.forEach((result) => {
    if (result.status === "rejected") {
      failed++;
      return;
    }
    const data = result.value;
    grid.append(
      createCard({
        image: data.image,
        title: data.name,
        subtitle: formatNumber(data.id),
        description: data.description,
        badges: data.types,
        imageFit: "contain",
        // Clicking the card opens the details in a modal (overlay) on top of this page
        onClick: () => showPokemonModal(data.id),
      })
    );
  });

  if (failed > 0) {
    errorBox.textContent = `${failed} Pokémon could not be loaded. Check your connection and try again.`;
    errorBox.hidden = false;
  }

  setStatus("");
  loadMoreButton.hidden = renderedCount >= visibleList.length;
}

function applySearch(query) {
  generation++; // invalidates any batch still loading
  visibleList = query
    ? allPokemon.filter((pokemon) => pokemon.name.includes(query) || String(pokemon.id) === query)
    : allPokemon;

  renderedCount = 0;
  grid.replaceChildren();
  emptyMessage.hidden = visibleList.length > 0;
  loadMoreButton.hidden = true;

  if (visibleList.length > 0) {
    renderNextBatch();
  } else {
    setStatus("");
  }
}

// "change" event + 4-second delay
searchInput.addEventListener("change", () => {
  const query = searchInput.value.trim().toLowerCase();

  // If the user searches again while waiting, cancel the previous timers
  clearTimeout(searchTimer);
  clearInterval(countdownTimer);

  const label = query ? `Searching for "${query}"` : "Showing all Pokémon";
  let secondsLeft = SEARCH_DELAY_MS / 1000;
  setStatus(`${label}... results in ${secondsLeft} s`);

  // Countdown shown to the user (updates every second)
  countdownTimer = setInterval(() => {
    secondsLeft--;
    if (secondsLeft > 0) setStatus(`${label}... results in ${secondsLeft} s`);
  }, 1000);

  // The actual delay: the search runs only after 4 seconds
  searchTimer = setTimeout(() => {
    clearInterval(countdownTimer);
    applySearch(query);
  }, SEARCH_DELAY_MS);
});

loadMoreButton.addEventListener("click", renderNextBatch);

async function init() {
  if (REVEAL_SEARCH_BAR_AFTER_MS > 0) {
    searchBox.hidden = true;
    setTimeout(() => (searchBox.hidden = false), REVEAL_SEARCH_BAR_AFTER_MS);
  }

  setStatus("Loading Pokémon list...");
  try {
    const list = await getJson(`${API_BASE}/pokemon?limit=${MAX_POKEMON}`);
    allPokemon = list.results.map((item) => ({ name: item.name, id: idFromUrl(item.url) }));
    applySearch("");
  } catch (error) {
    setStatus("");
    errorBox.textContent = "Could not reach PokéAPI. Check your internet connection and reload the page.";
    errorBox.hidden = false;
  }
}

init();

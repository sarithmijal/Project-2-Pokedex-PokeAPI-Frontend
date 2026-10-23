// Shared helpers for the PokéAPI pages (page 2 and the detail page).
//
// The 3 endpoints used in this project:
//   1) /pokemon            -> list of names + data of one Pokémon (image, types, stats...)
//   2) /pokemon-species    -> description text, genus, habitat and the evolution chain URL
//   3) /evolution-chain    -> NESTED evolution data (used in the detail page) (Nested tree structure with the
// complete evolutionary stages.)

const API_BASE = "https://pokeapi.co/api/v2";

// fetch() returns a PROMISE. "await" pauses this function until the response
// arrives, without freezing the page. A bad HTTP status (404, 500) is turned into an error.
async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json(); // also returns a promise
}

// "https://pokeapi.co/api/v2/pokemon/25/" -> 25
function idFromUrl(url) {
  return Number(url.split("/").filter(Boolean).pop());
}

// The API texts contain line breaks and special characters
function cleanText(text) {
  return text.replace(/[\f\n\r­]+/g, " ").replace(/\s+/g, " ").trim();
}

function formatNumber(id) {
  return `#${String(id).padStart(4, "0")}`;
}

// Official artwork can be built from the id (no extra request needed)
function artworkUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

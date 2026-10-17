// Pokémon details inside a modal (overlay), opened when the user clicks a card.
// It shows the image and all the details, including the NESTED evolution chain,
// and has a "← Back" button that closes the modal.

async function showPokemonModal(id) {
  const modal = openModal({ label: "Pokémon details" });
  await loadPokemon(modal, id);
}

// Loads one Pokémon into an already open modal.
// It is also used when the user clicks an evolution: the modal content is replaced.
async function loadPokemon(modal, id) {
  const requestId = ++modal.requestId; // lets us ignore this response if a newer click happened
  modal.body.replaceChildren(createLoading("Loading details..."));

  try {
    // Endpoints 1 and 2 in parallel, then endpoint 3 (its URL comes from the species data)
    const [pokemon, species] = await Promise.all([
      getJson(`${API_BASE}/pokemon/${id}`),
      getJson(`${API_BASE}/pokemon-species/${id}`),
    ]);
    const chain = await getJson(species.evolution_chain.url);

    if (!modal.isOpen() || requestId !== modal.requestId) return;
    renderPokemon(modal, pokemon, species, chain);
  } catch (error) {
    if (!modal.isOpen() || requestId !== modal.requestId) return;
    const actions = el("div", "actions");
    actions.append(createBackButton(modal));
    modal.body.replaceChildren(
      el("p", "error", "Could not load this Pokémon. Check your internet connection and try again."),
      actions
    );
  }
}

// Turns the nested tree into a flat list with the stage of each Pokémon.
// Example (Eevee): [{eevee, stage 0}, {vaporeon, stage 1}, {jolteon, stage 1}, ...]
function flattenChain(node, stage = 0, list = []) {
  list.push({ name: node.species.name, id: idFromUrl(node.species.url), stage });
  node.evolves_to.forEach((next) => flattenChain(next, stage + 1, list)); // recursion
  return list;
}

function createPanel(title) {
  const panel = el("section", "panel");
  panel.append(el("h3", null, title));
  return panel;
}

function createFacts(pokemon, species) {
  const facts = [
    ["Height", `${pokemon.height / 10} m`],
    ["Weight", `${pokemon.weight / 10} kg`],
    ["Base experience", pokemon.base_experience ?? "-"],
    ["Generation", species.generation.name.replace("generation-", "").toUpperCase()],
    ["Habitat", species.habitat ? species.habitat.name : "unknown", true],
    ["Capture rate", species.capture_rate],
    ["Egg groups", species.egg_groups.map((group) => group.name).join(", ") || "-", true],
    ["Moves", pokemon.moves.length],
  ];

  const list = el("dl", "facts");
  facts.forEach(([label, value, capitalize]) => {
    const item = el("div");
    item.append(el("dt", null, label), el("dd", capitalize ? "is-capitalized" : null, String(value)));
    list.append(item);
  });
  return list;
}

function createStats(pokemon) {
  const wrapper = el("div");
  pokemon.stats.forEach((entry) => {
    const row = el("div", "stat");
    const bar = el("div", "stat__bar");
    bar.style.width = `${Math.min((entry.base_stat / 255) * 100, 100)}%`; // 255 = max possible
    const track = el("div", "stat__track");
    track.append(bar);
    row.append(
      el("span", "stat__name", entry.stat.name === "hp" ? "HP" : entry.stat.name.replace("-", " ")),
      el("span", "stat__value", String(entry.base_stat)),
      track
    );
    wrapper.append(row);
  });
  return wrapper;
}

function createEvolution(modal, chain, currentId) {
  const flat = flattenChain(chain);

  if (flat.length === 1) {
    return el("p", "detail__genus", "This Pokémon does not evolve.");
  }

  // Group the Pokémon by stage: { 0: [...], 1: [...], 2: [...] }
  const stages = flat.reduce((groups, item) => {
    (groups[item.stage] = groups[item.stage] || []).push(item);
    return groups;
  }, {});

  const wrapper = el("div", "evolution");
  Object.keys(stages).forEach((stage, index) => {
    if (index > 0) wrapper.append(el("span", "evolution__arrow", "→"));

    const column = el("div", "evolution__stage");
    stages[stage].forEach((item) => {
      const isCurrent = item.id === currentId;
      const button = el("button", `evolution__item${isCurrent ? " evolution__item--current" : ""}`);
      button.type = "button";
      if (isCurrent) button.setAttribute("aria-current", "true");

      const image = el("img");
      image.src = artworkUrl(item.id);
      image.alt = item.name;
      image.loading = "lazy";
      button.append(image, el("span", null, item.name));

      // Clicking another evolution loads that Pokémon inside the same modal
      button.addEventListener("click", () => {
        if (!isCurrent) loadPokemon(modal, item.id);
      });
      column.append(button);
    });
    wrapper.append(column);
  });
  return wrapper;
}

function renderPokemon(modal, pokemon, species, chain) {
  const picture = el("img", "detail__image");
  picture.src = pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default;
  picture.alt = pokemon.name;

  // Description and genus come from the species endpoint
  const english = species.flavor_text_entries.find((entry) => entry.language.name === "en");
  const genus = species.genera.find((entry) => entry.language.name === "en");

  const title = el("h2", "detail__title", pokemon.name);
  title.append(" ", el("span", "detail__id", formatNumber(pokemon.id)));

  const types = el("div", "badges");
  pokemon.types.forEach((slot) => types.append(createBadge(slot.type.name)));

  const info = el("div");
  info.append(title);
  if (genus) info.append(el("p", "detail__genus", genus.genus));
  info.append(types);
  info.append(el("p", "detail__text", english ? cleanText(english.flavor_text) : "No description available."));

  const factsPanel = createPanel("Facts");
  factsPanel.append(createFacts(pokemon, species));

  const abilities = el("ul", "plain-list");
  pokemon.abilities.forEach((entry) => {
    abilities.append(el("li", null, entry.ability.name.replace("-", " ") + (entry.is_hidden ? " (hidden)" : "")));
  });
  const abilitiesPanel = createPanel("Abilities");
  abilitiesPanel.append(abilities);

  const statsPanel = createPanel("Base stats");
  statsPanel.append(createStats(pokemon));

  info.append(factsPanel, abilitiesPanel, statsPanel);

  const evolutionPanel = createPanel("Evolution chain");
  evolutionPanel.append(createEvolution(modal, chain.chain, pokemon.id));

  const layout = el("section", "detail");
  layout.append(picture, info);

  const actions = el("div", "actions");
  actions.append(createBackButton(modal));

  modal.body.replaceChildren(layout, evolutionPanel, actions);
  modal.body.scrollTop = 0;
}

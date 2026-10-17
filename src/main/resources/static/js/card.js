// Shared helpers and the card template.

// Small helper: creates an element, optionally with a class and text.
// It uses textContent (never innerHTML), so API data can never inject HTML.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Pokémon type colors for the badges (other badges use the default color)
const TYPE_COLORS = {
  normal: "#a8a77a", fire: "#ee8130", water: "#6390f0", electric: "#f7d02c",
  grass: "#7ac74c", ice: "#96d9d6", fighting: "#c22e28", poison: "#a33ea1",
  ground: "#e2bf65", flying: "#a98ff3", psychic: "#f95587", bug: "#a6b91a",
  rock: "#b6a136", ghost: "#735797", dragon: "#6f35fc", dark: "#705746",
  steel: "#b7b7ce", fairy: "#d685ad",
};
const LIGHT_TYPES = new Set(["electric", "ice", "ground", "steel", "fairy", "flying", "normal", "bug"]);

function createBadge(text) {
  const badge = el("span", "badge", text);
  const color = TYPE_COLORS[text];
  if (color) {
    badge.style.background = color;
    badge.style.color = LIGHT_TYPES.has(text) ? "#1d2130" : "#ffffff";
  }
  return badge;
}

// The card template.
// - If "onClick" is given, the WHOLE card is clickable (mouse, Enter or Space)
//   and it runs that function (we use it to open the modal).
// - "fallbackImage" (optional) replaces the image if it fails to load.
function createCard({ image, fallbackImage, title, subtitle, description, badges = [], onClick, imageFit = "cover" }) {
  const card = el("article", "card");

  if (onClick) {
    card.classList.add("card--clickable");
    card.tabIndex = 0; // reachable with the keyboard
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute("aria-label", `Open details for ${title}`);
    card.addEventListener("click", () => onClick());
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    });
  }

  const picture = el("img", `card__image card__image--${imageFit}`);
  picture.src = image;
  picture.alt = title;
  picture.loading = "lazy";
  if (fallbackImage) {
    picture.addEventListener("error", () => (picture.src = fallbackImage), { once: true });
  }

  const body = el("div", "card__body");
  if (subtitle) body.append(el("p", "card__subtitle", subtitle));
  body.append(el("h2", "card__title", title));
  body.append(el("p", "card__description", description));

  if (badges.length > 0) {
    const list = el("div", "badges");
    badges.forEach((text) => list.append(createBadge(text)));
    body.append(list);
  }

  card.append(picture, body);
  return card;
}

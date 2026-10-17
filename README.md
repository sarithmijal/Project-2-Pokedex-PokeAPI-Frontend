# Pokédex – Page 2 (Vanilla JS + PokéAPI)

A responsive Pokédex built with **plain JavaScript, HTML and CSS** that consumes the public [PokéAPI](https://pokeapi.co/). A minimal Spring Boot application is used only as a web server, so the whole project can be run from IntelliJ with a single click.

- Frontend: HTML, CSS and Vanilla JavaScript (no frameworks, no libraries)
- Data: PokéAPI (3 endpoints, nested data)
- Server: Java 21 + Spring Boot 3.5 (`spring-boot-starter-web` only; no database and no custom endpoints)

## Features

- Card layout with a responsive CSS Grid: 4 columns on large screens, 3 by default, 2 on tablets and 1 on phones.
- Each card shows the Pokémon image, number, name, description and types.
- Clicking a card opens a modal overlay with the image, full details and a **Back** button (it also closes with the × button, the `Esc` key or by clicking outside).
- Search with a **4-second delay**: typing alone does nothing; when the `change` event fires (Enter or leaving the field) the app waits 4 seconds, showing a countdown, before filtering. A new search cancels the previous one.
- "Load more" button that loads Pokémon in batches of 12.

## PokéAPI endpoints used

| Endpoint | Used for |
|----------|----------|
| `/pokemon` | List of Pokémon and data of each one (image, types, stats, abilities, moves) |
| `/pokemon-species` | Description, genus, habitat, capture rate and the evolution chain URL |
| `/evolution-chain` | **Nested** evolution tree (for example Eevee or Bulbasaur → Ivysaur → Venusaur) |

The nested evolution tree is flattened with a recursive function, and clicking an evolution loads that Pokémon inside the same modal.

## Requirements

- JDK 21
- IntelliJ IDEA (or any IDE with Maven support)
- Internet connection (PokéAPI, images and Maven dependencies)

## Run the project

1. Open the project folder in IntelliJ (`File > Open`) and wait for Maven to download the dependencies.
2. Check that the project SDK is JDK 21 (`File > Project Structure > Project`).
3. Run `PokemonApplication` (green ▶ next to `main`).
4. Open **http://localhost:8081** in your browser.

The application uses port **8081**, so it can run at the same time as the books project (port 8080).

## Project structure

```
pokemon-app/
├── pom.xml
└── src/main/
    ├── java/com/example/pokemon/
    │   └── PokemonApplication.java    # starts the web server
    └── resources/
        ├── application.properties     # server.port=8081
        └── static/                    # the frontend
            ├── index.html
            ├── css/styles.css
            └── js/
                ├── api.js             # fetch helper and API base URL
                ├── card.js            # reusable card template
                ├── modal.js           # reusable modal overlay
                ├── pokemon-modal.js   # details + nested evolution chain
                └── page2.js           # list, load more and delayed search
```

## Configuration

In `src/main/resources/static/js/page2.js`:

- `SEARCH_DELAY_MS = 4000`: delay before the search runs.
- `PAGE_SIZE = 12`: cards loaded per batch.
- `REVEAL_SEARCH_BAR_AFTER_MS = 0`: set it to `4000` if the search bar itself must appear after 4 seconds.

## Common problems

- **Unsupported JDK / cannot compile for JVM target 21**: set the project SDK to JDK 21.
- **Port 8081 already in use**: stop the other running application.
- **No cards or images**: check your internet connection (PokéAPI and image servers must be reachable).

## Possible improvements

Cache API responses in `localStorage`, filter by type, pagination with infinite scroll, loading skeletons, unit tests for the helper functions.
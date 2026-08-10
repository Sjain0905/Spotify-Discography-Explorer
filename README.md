<h1 align="center">Spotify Discography Explorer <img src="./assets/spotify.svg" alt="spotify" height="29px" width="29px"></h1>

<p align="center">
  Search any artist and instantly browse their album discography — cover art, release year, and a direct link to open each album on Spotify.
</p>

---

## Features

- 🔍 **Artist search** — type any artist name and hit Enter or click Search
- 💽 **Album grid** — displays up to 10 albums with cover art and release year
- 🔗 **Direct Spotify links** — every album card opens the album on Spotify in a new tab
- ⚡ **Client Credentials auth** — fetches a Spotify access token automatically on load, no user login required
- 🧭 **Loading & error states** — spinner while fetching, clear messages when an artist or album isn't found, and a dedicated message if credentials are missing

## Tech Stack

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React-Bootstrap](https://react-bootstrap.github.io/) / [Bootstrap 5](https://getbootstrap.com/)
- [Font Awesome](https://fontawesome.com/) (via CDN, for the Spotify icon)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api) — Client Credentials flow

## How It Works

1. On load, the app requests an access token from Spotify's `/api/token` endpoint using your Client ID and Secret (Client Credentials flow — no user login needed, since this only reads public catalog data).
2. When you search an artist, the app calls `GET /v1/search?type=artist` to resolve the artist's Spotify ID.
3. It then calls `GET /v1/artists/{id}/albums` (filtered to `include_groups=album`) to fetch up to 10 albums.
4. Each result is rendered as a card with cover art, release year, and a link to the album on Spotify.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Spotify Developer](https://developer.spotify.com/dashboard) account with an app created, so you have a **Client ID** and **Client Secret**

## Project Structure

```
Spotify-Discography-Explorer/
├── assets/
│   ├── Spotify button flat 3D.gif   # favicon
│   └── spotify.svg                  # header icon
├── src/
│   ├── App.jsx                      # main component: auth hook, API calls, UI
│   ├── App.css                      # app styles
│   ├── index.css                    # global styles
│   └── main.jsx                     # React entry point
├── index.html
├── vite.config.js
├── .env.example                     # template for required env vars
├── .gitignore
└── package.json
```

## Notes & Limitations

- Album results are capped at 10 per artist (`limit=10` in the API call).
- Search returns the top-matching artist only — there's no artist disambiguation UI if multiple artists share a name.
- Uses the Client Credentials flow, so it only accesses public catalog data — no playlists, saved albums, or user-specific data.

import { useState, useEffect, useCallback } from 'react';
import './App.css';

const clientId = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

// ─── Custom hook: Spotify auth token ─────────────────────────────────────────
function useSpotifyToken() {
  const [accessToken, setAccessToken] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!clientId || !clientSecret) {
      setAuthError('Missing Spotify credentials. Check your .env file.');
      return;
    }

    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: 'grant_type=client_credentials',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) setAccessToken(data.access_token);
        else throw new Error(data.error_description || 'Auth failed');
      })
      .catch((err) => setAuthError(err.message));
  }, []);

  return { accessToken, authError };
}

// ─── Spotify API helpers ──────────────────────────────────────────────────────
async function fetchArtistId(query, token) {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Artist search failed');
  return data.artists?.items?.[0]?.id ?? null;
}

async function fetchArtistAlbums(artistId, token) {
  const url = new URL(`https://api.spotify.com/v1/artists/${artistId}/albums`);
  url.searchParams.set('include_groups', 'album');
  url.searchParams.set('limit', '10');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Albums fetch failed');
  return data.items ?? [];
}

// ─── AlbumCard component ──────────────────────────────────────────────────────
function AlbumCard({ album }) {
  const imageUrl = album.images?.[0]?.url;
  const releaseYear = album.release_date?.slice(0, 4) ?? '—';

  return (
    <article className="album-card">
      <a
        href={album.external_urls.spotify}
        target="_blank"
        rel="noopener noreferrer"
        className="album-card__link"
        aria-label={`Open ${album.name} on Spotify`}>
        <div className="album-card__img-wrap">
          {imageUrl ? (
            <img src={imageUrl} alt={`${album.name} cover`} loading="lazy" />
          ) : (
            <div className="album-card__img-placeholder">No Image</div>
          )}
          <div className="album-card__overlay">
            <span className="album-card__open-icon">↗</span>
          </div>
        </div>
        <div className="album-card__body">
          <p className="album-card__year">{releaseYear}</p>
          <h3 className="album-card__title">{album.name}</h3>
        </div>
      </a>
    </article>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { accessToken, authError } = useSpotifyToken();

  const [searchInput, setSearchInput] = useState('');
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    const query = searchInput.trim();
    if (!query || !accessToken) return;

    setIsLoading(true);
    setSearchError('');
    setAlbums([]);
    setSearched(true);

    try {
      const artistId = await fetchArtistId(query, accessToken);
      if (!artistId) {
        setSearchError(`No artist found for "${query}".`);
        return;
      }
      const results = await fetchArtistAlbums(artistId, accessToken);
      setAlbums(results);
      if (results.length === 0)
        setSearchError('No albums found for this artist.');
    } catch (err) {
      setSearchError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }, [searchInput, accessToken]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') search();
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="page__header">
        <div className="header__inner">
          <span className="header__logo">
            <i className="fab fa-spotify fa-3x"></i>
          </span>
          <h1 className="header__title">Discography Explorer</h1>
          <p className="header__sub">
            Discover an artist's discography via Spotify
          </p>
        </div>
      </header>

      {/* Search bar */}
      <section className="search-section">
        <div className="search-bar">
          <input
            className="search-bar__input"
            type="text"
            placeholder="Search for an artist…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Artist name"
            disabled={!accessToken && !authError}
          />
          <button
            className="search-bar__btn"
            onClick={search}
            disabled={isLoading || !accessToken || !searchInput.trim()}
            aria-label="Search">
            {isLoading ? <span className="spinner" /> : 'Search'}
          </button>
        </div>

        {authError && <p className="msg msg--error">{authError}</p>}
        {searchError && <p className="msg msg--error">{searchError}</p>}
      </section>

      {/* Results */}
      <main className="results">
        {isLoading && (
          <div className="results__loading">
            <span className="big-spinner" />
            <p>Loading albums…</p>
          </div>
        )}

        {!isLoading && albums.length > 0 && (
          <>
            <p className="results__count">{albums.length} albums found</p>
            <div className="album-grid">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </>
        )}

        {!isLoading && !searched && (
          <div className="results__empty">
            <p className="results__hint">
              Deep-Dive into your Artist's Discography 💽
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

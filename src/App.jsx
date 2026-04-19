import './App.css';
import {
  FormControl,
  InputGroup,
  Container,
  Button,
  Card,
  Row,
} from 'react-bootstrap';
import { useState, useEffect } from 'react';

const clientId = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    if (!clientId || !clientSecret) {
      console.error('Missing Spotify client ID or secret. Check .env file.');
      return;
    }

    const authParams = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: 'grant_type=client_credentials',
    };

    fetch('https://accounts.spotify.com/api/token', authParams)
      .then(async (result) => {
        const data = await result.json();
        console.log('Access token response:', data);
        if (!result.ok) {
          throw new Error(
            data.error_description ||
              data.error ||
              'Spotify token request failed',
          );
        }
        return data;
      })
      .then((data) => {
        setAccessToken(data.access_token);
      })
      .catch((error) => {
        console.error('Error getting access token:', error);
      });
  }, []);

  async function search() {
    console.log('Search input:', searchInput);
    console.log('Access token:', accessToken);
    if (!accessToken) {
      console.error('No access token available');
      return;
    }
    var artistParams = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
    };

    try {
      // Get Artist
      var artistID = await fetch(
        'https://api.spotify.com/v1/search?q=' +
          encodeURIComponent(searchInput) +
          '&type=artist',
        artistParams,
      )
        .then((result) => {
          console.log('Artist search response status:', result.status);
          return result.json();
        })
        .then((data) => {
          console.log('Artist search data:', data);
          if (
            data.artists &&
            data.artists.items &&
            data.artists.items.length > 0
          ) {
            return data.artists.items[0].id;
          } else {
            console.error('No artists found');
            return null;
          }
        });

      if (!artistID) {
        setAlbums([]);
        return;
      }

      // Get Artist Albums
      await fetch(
        'https://api.spotify.com/v1/artists/' +
          artistID +
          '/albums?include_groups=album&market=US&limit=10',
        artistParams,
      )
        .then(async (result) => {
          console.log('Albums response status:', result.status);
          const data = await result.json();
          if (!result.ok) {
            console.error('Albums fetch error body:', data);
            throw new Error(data.error?.message || 'Albums request failed');
          }
          return data;
        })
        .then((data) => {
          console.log('Albums data:', data);
          setAlbums(data.items || []);
        });
    } catch (error) {
      console.error('Error in search:', error);
      setAlbums([]);
    }
  }

  return (
    <>
      <Container
        style={{
          marginBottom: '30px',
        }}>
        <InputGroup>
          <FormControl
            placeholder="Search For Artist"
            type="input"
            aria-label="Search for an Artist"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                search();
              }
            }}
            onChange={(event) => setSearchInput(event.target.value)}
            style={{
              width: '300px',
              height: '35px',
              borderWidth: '0px',
              borderStyle: 'solid',
              borderRadius: '5px',
              marginRight: '10px',
              paddingLeft: '10px',
            }}
          />

          <Button onClick={search}>Search</Button>
        </InputGroup>
      </Container>

      <Container>
        <Row
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            alignContent: 'center',
          }}>
          {albums.map((album) => {
            return (
              <Card
                key={album.id}
                style={{
                  backgroundColor: 'white',
                  margin: '10px',
                  borderRadius: '5px',
                  marginBottom: '30px',
                }}>
                <Card.Img
                  width={200}
                  src={album.images[0].url}
                  style={{
                    borderRadius: '4%',
                  }}
                />

                <Card.Body>
                  <Card.Title
                    style={{
                      whiteSpace: 'wrap',
                      fontWeight: 'bold',
                      maxWidth: '200px',
                      fontSize: '18px',
                      marginTop: '10px',
                      color: 'black',
                    }}>
                    {album.name}
                  </Card.Title>

                  <Card.Text
                    style={{
                      color: 'black',
                    }}>
                    Release Date: <br /> {album.release_date}
                  </Card.Text>

                  <Button
                    href={album.external_urls.spotify}
                    style={{
                      backgroundColor: 'black',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '15px',
                      borderRadius: '5px',
                      padding: '10px',
                    }}>
                    Album Link
                  </Button>
                </Card.Body>
              </Card>
            );
          })}
        </Row>
      </Container>
    </>
  );
}

export default App;

interface Song {
  title: string
  artist: string
  genre: string
  energy: number
  reason: string
}

interface PlaylistData {
  name: string
  description: string
  songs: Song[]
}

async function searchSpotifyTrack(accessToken: string, title: string, artist: string): Promise<string | null> {
  try {
    // Clean search terms
    const cleanTitle = title.replace(/[^\w\s-]/g, "").trim()
    const cleanArtist = artist.replace(/[^\w\s-]/g, "").trim()

    // Try different search strategies
    const searches = [
      `track:"${cleanTitle}" artist:"${cleanArtist}"`,
      `"${cleanTitle}" "${cleanArtist}"`,
      `${cleanTitle} ${cleanArtist}`,
      cleanTitle,
    ]

    for (const query of searches) {
      const encodedQuery = encodeURIComponent(query)
      const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=5`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) continue

      const data = await response.json()

      if (data.tracks?.items?.length > 0) {
        // Find best match
        for (const track of data.tracks.items) {
          const trackTitle = track.name.toLowerCase()
          const trackArtist = track.artists[0]?.name.toLowerCase() || ""

          if (trackTitle.includes(cleanTitle.toLowerCase()) || cleanTitle.toLowerCase().includes(trackTitle)) {
            if (trackArtist.includes(cleanArtist.toLowerCase()) || cleanArtist.toLowerCase().includes(trackArtist)) {
              console.log(`✓ Found: "${track.name}" by ${track.artists[0]?.name}`)
              return track.uri
            }
          }
        }

        // Return first result if no perfect match
        console.log(`~ Using: "${data.tracks.items[0].name}" by ${data.tracks.items[0].artists[0]?.name}`)
        return data.tracks.items[0].uri
      }
    }

    console.log(`✗ Not found: "${title}" by ${artist}`)
    return null
  } catch (error) {
    console.error(`Search error for "${title}":`, error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { accessToken, playlistData }: { accessToken: string; playlistData: PlaylistData } = await req.json()

    console.log("=== CREATING SPOTIFY PLAYLIST ===")
    console.log("Playlist:", playlistData.name)
    console.log("Songs:", playlistData.songs.length)

    if (!accessToken || !playlistData) {
      return Response.json({ error: "Missing data" }, { status: 400 })
    }

    // Get user profile
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userResponse.ok) {
      console.error("Failed to get user profile")
      return Response.json({ error: "Invalid token" }, { status: 401 })
    }

    const userData = await userResponse.json()
    console.log("User:", userData.display_name || userData.id)

    // Create playlist
    const createResponse = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playlistData.name,
        description: playlistData.description,
        public: false,
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error("Failed to create playlist:", errorText)
      return Response.json({ error: "Failed to create playlist" }, { status: 400 })
    }

    const playlist = await createResponse.json()
    console.log("Playlist created:", playlist.id)

    // Search and add tracks
    const trackUris: string[] = []
    const foundTracks: Array<{ original: string; spotify: string }> = []
    const notFoundTracks: Song[] = []

    console.log("Searching for tracks...")
    for (const song of playlistData.songs) {
      const uri = await searchSpotifyTrack(accessToken, song.title, song.artist)

      if (uri) {
        trackUris.push(uri)
        foundTracks.push({
          original: `${song.title} by ${song.artist}`,
          spotify: uri,
        })
      } else {
        notFoundTracks.push(song)
      }
    }

    console.log(`Found ${trackUris.length}/${playlistData.songs.length} tracks`)

    // Add tracks to playlist
    if (trackUris.length > 0) {
      const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: trackUris }),
      })

      if (!addResponse.ok) {
        console.error("Failed to add tracks")
      } else {
        console.log("✓ Tracks added successfully")
      }
    }

    return Response.json({
      success: true,
      playlistId: playlist.id,
      playlistUrl: playlist.external_urls.spotify,
      tracksAdded: trackUris.length,
      tracksNotFound: notFoundTracks.length,
      notFoundTracks,
      foundTracks,
    })
  } catch (error) {
    console.error("=== PLAYLIST CREATION ERROR ===")
    console.error(error)
    return Response.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

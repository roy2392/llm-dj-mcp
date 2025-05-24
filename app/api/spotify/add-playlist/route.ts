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
    // Clean up the search terms
    const cleanTitle = title.replace(/[^\w\s]/g, "").trim()
    const cleanArtist = artist.replace(/[^\w\s]/g, "").trim()

    // Try multiple search strategies
    const searchStrategies = [
      `track:"${cleanTitle}" artist:"${cleanArtist}"`,
      `"${cleanTitle}" "${cleanArtist}"`,
      `${cleanTitle} ${cleanArtist}`,
      cleanTitle, // Last resort - just the title
    ]

    for (const query of searchStrategies) {
      console.log(`Searching for: ${query}`)

      const encodedQuery = encodeURIComponent(query)
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=5`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        console.error(`Search failed for "${query}":`, response.status)
        continue
      }

      const data = await response.json()

      if (data.tracks?.items?.length > 0) {
        // Try to find the best match
        for (const track of data.tracks.items) {
          const trackTitle = track.name.toLowerCase()
          const trackArtist = track.artists[0]?.name.toLowerCase() || ""
          const searchTitle = cleanTitle.toLowerCase()
          const searchArtist = cleanArtist.toLowerCase()

          // Check for exact or close matches
          if (trackTitle.includes(searchTitle) || searchTitle.includes(trackTitle)) {
            if (trackArtist.includes(searchArtist) || searchArtist.includes(trackArtist)) {
              console.log(`Found match: "${track.name}" by ${track.artists[0]?.name}`)
              return track.uri
            }
          }
        }

        // If no perfect match, return the first result
        console.log(`Using first result: "${data.tracks.items[0].name}" by ${data.tracks.items[0].artists[0]?.name}`)
        return data.tracks.items[0].uri
      }
    }

    console.log(`No tracks found for: ${title} by ${artist}`)
    return null
  } catch (error) {
    console.error(`Error searching for track ${title} by ${artist}:`, error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { accessToken, playlistData }: { accessToken: string; playlistData: PlaylistData } = await req.json()

    console.log("Creating playlist:", playlistData.name)
    console.log("Songs to add:", playlistData.songs.length)

    if (!accessToken || !playlistData) {
      return Response.json({ error: "Missing access token or playlist data" }, { status: 400 })
    }

    // Validate access token by getting user profile
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      console.error("Failed to get user profile:", userResponse.status)
      return Response.json({ error: "Invalid or expired access token" }, { status: 401 })
    }

    const userData = await userResponse.json()
    const userId = userData.id

    console.log("Creating playlist for user:", userData.display_name || userId)

    // Create playlist
    const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
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

    if (!createPlaylistResponse.ok) {
      const errorData = await createPlaylistResponse.text()
      console.error("Failed to create playlist:", errorData)
      return Response.json({ error: "Failed to create playlist" }, { status: 400 })
    }

    const playlistResponse = await createPlaylistResponse.json()
    const playlistId = playlistResponse.id

    console.log("Playlist created:", playlistId)

    // Search for tracks and collect URIs
    const trackUris: string[] = []
    const notFoundTracks: Song[] = []
    const foundTracks: Array<{ song: Song; spotifyTrack: string }> = []

    for (const song of playlistData.songs) {
      console.log(`Searching for: "${song.title}" by ${song.artist}`)
      const trackUri = await searchSpotifyTrack(accessToken, song.title, song.artist)

      if (trackUri) {
        trackUris.push(trackUri)
        foundTracks.push({ song, spotifyTrack: trackUri })
      } else {
        notFoundTracks.push(song)
      }
    }

    console.log(`Found ${trackUris.length} tracks, ${notFoundTracks.length} not found`)

    // Add tracks to playlist in batches (Spotify allows max 100 per request)
    if (trackUris.length > 0) {
      const batchSize = 100
      for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize)

        const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: batch,
          }),
        })

        if (!addTracksResponse.ok) {
          const errorData = await addTracksResponse.text()
          console.error("Failed to add tracks batch:", errorData)
          // Continue with other batches even if one fails
        } else {
          console.log(`Added batch of ${batch.length} tracks`)
        }
      }
    }

    return Response.json({
      success: true,
      playlistId,
      playlistUrl: playlistResponse.external_urls.spotify,
      tracksAdded: trackUris.length,
      tracksNotFound: notFoundTracks.length,
      notFoundTracks,
      foundTracks: foundTracks.map((ft) => ({
        original: `${ft.song.title} by ${ft.song.artist}`,
        spotify: ft.spotifyTrack,
      })),
    })
  } catch (error) {
    console.error("Error adding playlist to Spotify:", error)
    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

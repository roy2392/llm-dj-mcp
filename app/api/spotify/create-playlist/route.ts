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

// Enhanced search function with better matching and error handling
async function searchSpotifyTrackEnhanced(
  accessToken: string,
  title: string,
  artist: string,
): Promise<{ uri: string | null; trackName: string; artistName: string }> {
  try {
    // Clean and prepare search terms
    const cleanTitle = title.replace(/[^\w\s-']/g, "").trim()
    const cleanArtist = artist.replace(/[^\w\s-']/g, "").trim()

    // Multiple search strategies for better matching
    const searchStrategies = [
      `track:"${cleanTitle}" artist:"${cleanArtist}"`, // Exact match
      `"${cleanTitle}" "${cleanArtist}"`, // Quoted search
      `${cleanTitle} ${cleanArtist}`, // Simple search
      `${cleanTitle}`, // Title only
      cleanTitle.split(" ")[0], // First word of title
    ]

    for (const [index, query] of searchStrategies.entries()) {
      try {
        console.log(`  Strategy ${index + 1}: ${query}`)

        const encodedQuery = encodeURIComponent(query)
        const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=10&market=US`

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          console.log(`  Search failed with status ${response.status}`)
          continue
        }

        const data = await response.json()

        if (data.tracks?.items?.length > 0) {
          // Score and rank results for best match
          const scoredTracks = data.tracks.items.map((track: any) => {
            const trackTitle = track.name.toLowerCase()
            const trackArtist = track.artists[0]?.name.toLowerCase() || ""
            const searchTitle = cleanTitle.toLowerCase()
            const searchArtist = cleanArtist.toLowerCase()

            let score = 0

            // Title matching
            if (trackTitle === searchTitle) score += 100
            else if (trackTitle.includes(searchTitle)) score += 80
            else if (searchTitle.includes(trackTitle)) score += 60
            else {
              const titleWords = searchTitle.split(" ")
              const matchingWords = titleWords.filter((word) => trackTitle.includes(word))
              score += (matchingWords.length / titleWords.length) * 40
            }

            // Artist matching
            if (trackArtist === searchArtist) score += 50
            else if (trackArtist.includes(searchArtist)) score += 40
            else if (searchArtist.includes(trackArtist)) score += 30
            else {
              const artistWords = searchArtist.split(" ")
              const matchingWords = artistWords.filter((word) => trackArtist.includes(word))
              score += (matchingWords.length / artistWords.length) * 20
            }

            return { track, score }
          })

          // Sort by score and return best match
          scoredTracks.sort((a, b) => b.score - a.score)
          const bestMatch = scoredTracks[0]

          if (bestMatch.score > 30) {
            // Minimum threshold for acceptance
            console.log(
              `  ✓ Match found (score: ${bestMatch.score}): "${bestMatch.track.name}" by ${bestMatch.track.artists[0]?.name}`,
            )
            return {
              uri: bestMatch.track.uri,
              trackName: bestMatch.track.name,
              artistName: bestMatch.track.artists[0]?.name || "Unknown Artist",
            }
          }
        }
      } catch (searchError) {
        console.log(`  Search strategy ${index + 1} failed:`, searchError)
        continue
      }
    }

    console.log(`  ✗ No suitable match found for "${title}" by ${artist}`)
    return { uri: null, trackName: "", artistName: "" }
  } catch (error) {
    console.error(`Search error for "${title}" by ${artist}:`, error)
    throw error
  }
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
    console.log("Access token length:", accessToken?.length || 0)

    if (!accessToken || !playlistData) {
      console.error("Missing required data:", { hasToken: !!accessToken, hasPlaylistData: !!playlistData })
      return Response.json({ error: "Missing access token or playlist data" }, { status: 400 })
    }

    // Validate access token by getting user profile with detailed error handling
    console.log("Validating access token...")
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("Failed to get user profile:", {
        status: userResponse.status,
        statusText: userResponse.statusText,
        error: errorText,
      })

      if (userResponse.status === 401) {
        return Response.json(
          {
            error: "Access token expired or invalid",
            code: "TOKEN_EXPIRED",
            message: "Please reconnect your Spotify account",
          },
          { status: 401 },
        )
      }

      return Response.json(
        {
          error: "Failed to validate Spotify account",
          details: errorText,
        },
        { status: userResponse.status },
      )
    }

    const userData = await userResponse.json()
    console.log("User validated:", userData.display_name || userData.id)

    // Create playlist with enhanced error handling
    console.log("Creating playlist...")
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
      console.error("Failed to create playlist:", {
        status: createResponse.status,
        statusText: createResponse.statusText,
        error: errorText,
      })

      return Response.json(
        {
          error: "Failed to create playlist in Spotify",
          details: errorText,
          code: "PLAYLIST_CREATION_FAILED",
        },
        { status: createResponse.status },
      )
    }

    const playlist = await createResponse.json()
    console.log("✓ Playlist created successfully:", playlist.id)

    // Search and add tracks with progress tracking
    const trackUris: string[] = []
    const foundTracks: Array<{ original: string; spotify: string; trackName: string; artistName: string }> = []
    const notFoundTracks: Song[] = []
    const searchErrors: Array<{ song: Song; error: string }> = []

    console.log("Searching for tracks...")
    for (let i = 0; i < playlistData.songs.length; i++) {
      const song = playlistData.songs[i]
      console.log(`[${i + 1}/${playlistData.songs.length}] Searching: "${song.title}" by ${song.artist}`)

      try {
        const result = await searchSpotifyTrackEnhanced(accessToken, song.title, song.artist)

        if (result.uri) {
          trackUris.push(result.uri)
          foundTracks.push({
            original: `${song.title} by ${song.artist}`,
            spotify: result.uri,
            trackName: result.trackName,
            artistName: result.artistName,
          })
          console.log(`✓ Found: "${result.trackName}" by ${result.artistName}`)
        } else {
          notFoundTracks.push(song)
          console.log(`✗ Not found: "${song.title}" by ${song.artist}`)
        }
      } catch (error) {
        console.error(`Search error for "${song.title}":`, error)
        searchErrors.push({
          song,
          error: error instanceof Error ? error.message : "Unknown search error",
        })
        notFoundTracks.push(song)
      }
    }

    console.log(`Search complete: ${trackUris.length}/${playlistData.songs.length} tracks found`)

    // Add tracks to playlist with batch handling
    let tracksAddedCount = 0
    if (trackUris.length > 0) {
      console.log("Adding tracks to playlist...")

      // Spotify allows max 100 tracks per request
      const batchSize = 100
      for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize)
        console.log(`Adding batch ${Math.floor(i / batchSize) + 1}: ${batch.length} tracks`)

        try {
          const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uris: batch }),
          })

          if (addResponse.ok) {
            tracksAddedCount += batch.length
            console.log(`✓ Successfully added batch of ${batch.length} tracks`)
          } else {
            const errorText = await addResponse.text()
            console.error(`Failed to add batch ${Math.floor(i / batchSize) + 1}:`, errorText)
          }
        } catch (error) {
          console.error(`Error adding batch ${Math.floor(i / batchSize) + 1}:`, error)
        }
      }
    }

    console.log("=== PLAYLIST CREATION COMPLETE ===")
    console.log(`✓ Playlist created: ${playlist.id}`)
    console.log(`✓ Tracks added: ${tracksAddedCount}/${playlistData.songs.length}`)
    console.log(`✗ Tracks not found: ${notFoundTracks.length}`)

    return Response.json({
      success: true,
      playlistId: playlist.id,
      playlistUrl: playlist.external_urls.spotify,
      playlistName: playlist.name,
      tracksAdded: tracksAddedCount,
      tracksNotFound: notFoundTracks.length,
      totalTracks: playlistData.songs.length,
      notFoundTracks,
      foundTracks,
      searchErrors: searchErrors.length > 0 ? searchErrors : undefined,
    })
  } catch (error) {
    console.error("=== PLAYLIST CREATION ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return Response.json(
      {
        error: "Server error during playlist creation",
        details: error instanceof Error ? error.message : "Unknown error",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    )
  }
}

import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

interface Song {
  title: string
  artist: string
  genre: string
  energy: number
  reason: string
}

interface PlaylistResponse {
  playlist: Song[]
  djComment: string
  overallVibe: string
}

function parsePlaylistFromText(text: string): PlaylistResponse {
  console.log("=== PARSING DEBUG ===")
  console.log("Full AI response:", text)
  console.log("Response length:", text.length)

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  console.log("Split into lines:", lines.length)
  lines.forEach((line, index) => {
    console.log(`Line ${index}: "${line}"`)
  })

  const playlist: Song[] = []
  let djComment = ""
  let overallVibe = ""

  // Try multiple parsing strategies
  for (const line of lines) {
    console.log(`Processing line: "${line}"`)

    // Strategy 1: Look for pipe-separated format
    if (line.includes("|")) {
      const parts = line.split("|").map((part) => part.trim())
      console.log("Found pipe-separated line, parts:", parts)

      if (parts.length >= 3) {
        // More lenient - accept if we have at least title, artist, genre
        const song: Song = {
          title: parts[0] || "Unknown Song",
          artist: parts[1] || "Unknown Artist",
          genre: parts[2] || "Pop",
          energy: parts[3] ? Number.parseInt(parts[3]) || 5 : 5,
          reason: parts[4] || "Great track for this vibe",
        }
        playlist.push(song)
        console.log("Added song:", song)
        continue
      }
    }

    // Strategy 2: Look for numbered list format
    const numberedMatch = line.match(/^\d+\.\s*(.+)/i)
    if (numberedMatch) {
      console.log("Found numbered format:", numberedMatch[1])
      // Try to extract artist and title from various formats
      const songText = numberedMatch[1]
      let title = "Unknown Song"
      let artist = "Unknown Artist"

      // Try "Title - Artist" format
      if (songText.includes(" - ")) {
        const parts = songText.split(" - ")
        title = parts[0].trim()
        artist = parts[1].trim()
      }
      // Try "Artist - Title" format
      else if (songText.includes(" by ")) {
        const parts = songText.split(" by ")
        title = parts[0].trim()
        artist = parts[1].trim()
      }
      // Just use the whole thing as title
      else {
        title = songText.trim()
      }

      const song: Song = {
        title,
        artist,
        genre: "Pop",
        energy: 5,
        reason: "Great track for this vibe",
      }
      playlist.push(song)
      console.log("Added numbered song:", song)
      continue
    }

    // Strategy 3: Look for any line that might be a song (contains common music words)
    const musicKeywords = ["song", "track", "music", "artist", "album", "feat", "ft"]
    const hasQuotes = line.includes('"') || line.includes("'")
    const hasMusicKeywords = musicKeywords.some((keyword) => line.toLowerCase().includes(keyword))

    if ((hasQuotes || hasMusicKeywords) && line.length > 10 && line.length < 200) {
      console.log("Found potential song line:", line)
      // Extract title from quotes if present
      const quotedMatch = line.match(/["']([^"']+)["']/g)
      if (quotedMatch && quotedMatch.length >= 1) {
        const title = quotedMatch[0].replace(/["']/g, "")
        const artist = quotedMatch[1] ? quotedMatch[1].replace(/["']/g, "") : "Unknown Artist"

        const song: Song = {
          title,
          artist,
          genre: "Pop",
          energy: 5,
          reason: "Great track for this vibe",
        }
        playlist.push(song)
        console.log("Added quoted song:", song)
        continue
      }
    }

    // Look for DJ comment
    if (line.toLowerCase().includes("dj") || line.toLowerCase().includes("comment")) {
      djComment = line.replace(/^.*?:/i, "").trim()
      console.log("Found DJ comment:", djComment)
    }

    // Look for vibe
    if (line.toLowerCase().includes("vibe") || line.toLowerCase().includes("mood")) {
      overallVibe = line.replace(/^.*?:/i, "").trim()
      console.log("Found overall vibe:", overallVibe)
    }
  }

  console.log("=== PARSING COMPLETE ===")
  console.log("Songs found:", playlist.length)
  console.log("DJ Comment:", djComment)
  console.log("Overall Vibe:", overallVibe)

  return { playlist, djComment: djComment.trim(), overallVibe: overallVibe.trim() }
}

export async function POST(req: Request) {
  try {
    const { vibe } = await req.json()
    console.log("Generating playlist for vibe:", vibe)

    // Try a much simpler, more direct prompt
    const result = await generateText({
      model: groq("llama3-70b-8192"),
      prompt: `Create a playlist for: "${vibe}"

Format each song exactly like this:
Title | Artist | Genre | Energy | Reason

Example:
Happy | Pharrell Williams | Pop | 8 | Feel-good anthem
Uptown Funk | Bruno Mars | Funk | 9 | Party starter
Blinding Lights | The Weeknd | Pop | 7 | Retro vibes

Create 6 songs in this exact format. Then add:
DJ Comment: [your comment]
Overall Vibe: [description]`,
    })

    console.log("=== AI RESPONSE ===")
    console.log(result.text)
    console.log("=== END RESPONSE ===")

    // Parse the response
    let parsedResult: PlaylistResponse
    try {
      parsedResult = parsePlaylistFromText(result.text)

      // If we still have no songs, create some based on the vibe
      if (parsedResult.playlist.length === 0) {
        console.log("No songs parsed, creating fallback based on vibe")
        throw new Error("No songs found in parsed result")
      }

      // Set defaults if missing
      if (!parsedResult.djComment) {
        parsedResult.djComment = "Here's a curated playlist that matches your vibe perfectly!"
      }
      if (!parsedResult.overallVibe) {
        parsedResult.overallVibe = "A carefully selected mix that captures the essence of your request."
      }

      console.log("Successfully parsed playlist with", parsedResult.playlist.length, "songs")
      return Response.json(parsedResult)
    } catch (parseError) {
      console.error("Parsing failed:", parseError)
      throw parseError
    }
  } catch (error) {
    console.error("Error in playlist generation:", error)

    // Enhanced fallback system
    const { vibe } = await req.json().catch(() => ({ vibe: "general" }))
    const vibeKeywords = vibe?.toLowerCase() || ""

    console.log("Using fallback playlist for vibe:", vibe)

    let fallbackPlaylist: PlaylistResponse

    // More specific vibe matching
    if (vibeKeywords.includes("party") || vibeKeywords.includes("dance") || vibeKeywords.includes("celebration")) {
      fallbackPlaylist = {
        playlist: [
          {
            title: "Uptown Funk",
            artist: "Mark Ronson ft. Bruno Mars",
            genre: "Funk/Pop",
            energy: 9,
            reason: "Irresistible party starter",
          },
          {
            title: "Can't Stop the Feeling!",
            artist: "Justin Timberlake",
            genre: "Pop",
            energy: 8,
            reason: "Pure joy and energy",
          },
          {
            title: "September",
            artist: "Earth, Wind & Fire",
            genre: "Funk/Soul",
            energy: 9,
            reason: "Timeless party classic",
          },
          {
            title: "I Gotta Feeling",
            artist: "The Black Eyed Peas",
            genre: "Pop/Dance",
            energy: 8,
            reason: "Ultimate party anthem",
          },
          {
            title: "Good as Hell",
            artist: "Lizzo",
            genre: "Pop/R&B",
            energy: 8,
            reason: "Confidence booster",
          },
          {
            title: "Levitating",
            artist: "Dua Lipa",
            genre: "Pop/Dance",
            energy: 8,
            reason: "Modern dance floor hit",
          },
        ],
        djComment: `Perfect for ${vibe}! These tracks will get everyone moving and create an amazing atmosphere.`,
        overallVibe: "High-energy celebration music that brings people together",
      }
    } else if (vibeKeywords.includes("chill") || vibeKeywords.includes("relax") || vibeKeywords.includes("calm")) {
      fallbackPlaylist = {
        playlist: [
          { title: "Stay", artist: "Rihanna", genre: "Pop/R&B", energy: 4, reason: "Smooth and emotional" },
          {
            title: "Blinding Lights",
            artist: "The Weeknd",
            genre: "Synth-pop",
            energy: 6,
            reason: "Chill retro vibes",
          },
          {
            title: "Watermelon Sugar",
            artist: "Harry Styles",
            genre: "Pop",
            energy: 5,
            reason: "Light and breezy",
          },
          {
            title: "Golden",
            artist: "Harry Styles",
            genre: "Pop/Rock",
            energy: 5,
            reason: "Warm and comforting",
          },
          { title: "Adorn", artist: "Miguel", genre: "R&B", energy: 4, reason: "Smooth and soulful" },
          {
            title: "Best Part",
            artist: "Daniel Caesar ft. H.E.R.",
            genre: "R&B",
            energy: 3,
            reason: "Intimate and mellow",
          },
        ],
        djComment: `Perfect for ${vibe}! These tracks create a peaceful, relaxing atmosphere.`,
        overallVibe: "Smooth, laid-back tracks for unwinding and relaxation",
      }
    } else {
      // General fallback
      fallbackPlaylist = {
        playlist: [
          {
            title: "Happy",
            artist: "Pharrell Williams",
            genre: "Pop",
            energy: 8,
            reason: "Universal feel-good vibes",
          },
          {
            title: "Count on Me",
            artist: "Bruno Mars",
            genre: "Pop",
            energy: 6,
            reason: "Warm and friendly",
          },
          {
            title: "Three Little Birds",
            artist: "Bob Marley",
            genre: "Reggae",
            energy: 5,
            reason: "Positive and peaceful",
          },
          {
            title: "Here Comes the Sun",
            artist: "The Beatles",
            genre: "Rock/Pop",
            energy: 6,
            reason: "Timeless optimism",
          },
          {
            title: "What a Wonderful World",
            artist: "Louis Armstrong",
            genre: "Jazz",
            energy: 4,
            reason: "Appreciation for life",
          },
          {
            title: "Lovely Day",
            artist: "Bill Withers",
            genre: "Soul",
            energy: 6,
            reason: "Perfect for any mood",
          },
        ],
        djComment: `Here's a curated playlist for "${vibe}" - these tracks work great for any occasion!`,
        overallVibe: "Feel-good classics that bring joy and positivity",
      }
    }

    console.log("Returning fallback playlist with", fallbackPlaylist.playlist.length, "songs")
    return Response.json(fallbackPlaylist)
  }
}

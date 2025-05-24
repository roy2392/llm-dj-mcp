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
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const playlist: Song[] = []
  let djComment = ""
  let overallVibe = ""

  let currentSection = ""

  for (const line of lines) {
    if (line.toLowerCase().includes("dj comment:") || line.toLowerCase().includes("dj says:")) {
      currentSection = "comment"
      djComment = line.split(":").slice(1).join(":").trim()
    } else if (line.toLowerCase().includes("overall vibe:") || line.toLowerCase().includes("vibe:")) {
      currentSection = "vibe"
      overallVibe = line.split(":").slice(1).join(":").trim()
    } else if (line.includes("|")) {
      // Parse song line: Title | Artist | Genre | Energy | Reason
      const parts = line.split("|").map((part) => part.trim())
      if (parts.length >= 4) {
        const song: Song = {
          title: parts[0] || "Unknown Song",
          artist: parts[1] || "Unknown Artist",
          genre: parts[2] || "Unknown",
          energy: Number.parseInt(parts[3]) || 5,
          reason: parts[4] || "Great track for this vibe",
        }
        playlist.push(song)
      }
    } else if (currentSection === "comment" && line.length > 0) {
      djComment += " " + line
    } else if (currentSection === "vibe" && line.length > 0) {
      overallVibe += " " + line
    }
  }

  return { playlist, djComment: djComment.trim(), overallVibe: overallVibe.trim() }
}

export async function POST(req: Request) {
  try {
    const { vibe } = await req.json()

    const result = await generateText({
      model: groq("llama3-70b-8192"),
      prompt: `You are DJ LLM, an AI DJ. Create a playlist for this vibe: "${vibe}".

Format your response EXACTLY like this example:

Song Title 1 | Artist Name 1 | Genre 1 | 8 | Reason why this song fits the vibe
Song Title 2 | Artist Name 2 | Genre 2 | 7 | Reason why this song fits the vibe  
Song Title 3 | Artist Name 3 | Genre 3 | 9 | Reason why this song fits the vibe
Song Title 4 | Artist Name 4 | Genre 4 | 6 | Reason why this song fits the vibe
Song Title 5 | Artist Name 5 | Genre 5 | 8 | Reason why this song fits the vibe
Song Title 6 | Artist Name 6 | Genre 6 | 7 | Reason why this song fits the vibe

DJ Comment: Your fun comment about this playlist as the DJ

Overall Vibe: One sentence summary of the playlist mood

Rules:
- Include 6-8 songs
- Use real song titles and artists
- Energy must be a number 1-10
- Separate each field with | (pipe character)
- Keep reasons brief
- No extra formatting or symbols`,
    })

    console.log("Raw AI response:", result.text)

    // Parse the structured text response
    let parsedResult: PlaylistResponse
    try {
      parsedResult = parsePlaylistFromText(result.text)

      // Validate we got some songs
      if (parsedResult.playlist.length === 0) {
        throw new Error("No songs parsed from response")
      }

      // Set defaults if missing
      if (!parsedResult.djComment) {
        parsedResult.djComment = "Here's a curated playlist that matches your vibe perfectly!"
      }
      if (!parsedResult.overallVibe) {
        parsedResult.overallVibe = "A carefully selected mix that captures the essence of your request."
      }
    } catch (parseError) {
      console.error("Text parsing error:", parseError)
      console.error("Raw response that failed:", result.text)
      throw new Error("Could not parse AI response")
    }

    return Response.json(parsedResult)
  } catch (error) {
    console.error("Error generating playlist:", error)

    // Get vibe for themed fallback
    const { vibe } = await req.json().catch(() => ({ vibe: "" }))
    const vibeKeywords = vibe?.toLowerCase() || ""

    let fallbackPlaylist: PlaylistResponse

    if (vibeKeywords.includes("party") || vibeKeywords.includes("dance") || vibeKeywords.includes("celebration")) {
      fallbackPlaylist = {
        playlist: [
          {
            title: "Uptown Funk",
            artist: "Mark Ronson ft. Bruno Mars",
            genre: "Funk/Pop",
            energy: 9,
            reason: "Irresistible party starter that gets everyone moving",
          },
          {
            title: "Can't Stop the Feeling!",
            artist: "Justin Timberlake",
            genre: "Pop",
            energy: 8,
            reason: "Pure joy and dance floor energy",
          },
          {
            title: "September",
            artist: "Earth, Wind & Fire",
            genre: "Funk/Soul",
            energy: 9,
            reason: "Timeless classic that spans generations",
          },
          {
            title: "I Gotta Feeling",
            artist: "The Black Eyed Peas",
            genre: "Pop/Dance",
            energy: 8,
            reason: "Ultimate party anthem for good times",
          },
          {
            title: "Good as Hell",
            artist: "Lizzo",
            genre: "Pop/R&B",
            energy: 8,
            reason: "Confidence boosting celebration track",
          },
          {
            title: "Levitating",
            artist: "Dua Lipa",
            genre: "Pop/Dance",
            energy: 8,
            reason: "Modern dance floor essential",
          },
        ],
        djComment: "My systems are having a moment, but I've got some guaranteed party bangers that never fail!",
        overallVibe: "High-energy celebration tracks that get everyone dancing and having a great time.",
      }
    } else if (vibeKeywords.includes("chill") || vibeKeywords.includes("relax") || vibeKeywords.includes("calm")) {
      fallbackPlaylist = {
        playlist: [
          { title: "Stay", artist: "Rihanna", genre: "Pop/R&B", energy: 4, reason: "Smooth and emotionally resonant" },
          {
            title: "Blinding Lights",
            artist: "The Weeknd",
            genre: "Synth-pop",
            energy: 6,
            reason: "Chill but engaging retro vibes",
          },
          {
            title: "Watermelon Sugar",
            artist: "Harry Styles",
            genre: "Pop",
            energy: 5,
            reason: "Light, breezy summer feeling",
          },
          {
            title: "Golden",
            artist: "Harry Styles",
            genre: "Pop/Rock",
            energy: 5,
            reason: "Warm and comforting atmosphere",
          },
          { title: "Adorn", artist: "Miguel", genre: "R&B", energy: 4, reason: "Smooth and soulful romance" },
          {
            title: "Best Part",
            artist: "Daniel Caesar ft. H.E.R.",
            genre: "R&B",
            energy: 3,
            reason: "Intimate and mellow perfection",
          },
        ],
        djComment:
          "Having some technical difficulties, but here are some perfectly chill vibes to keep you in the zone!",
        overallVibe: "Smooth, laid-back tracks perfect for unwinding and finding your peaceful flow.",
      }
    } else if (vibeKeywords.includes("workout") || vibeKeywords.includes("energy") || vibeKeywords.includes("pump")) {
      fallbackPlaylist = {
        playlist: [
          {
            title: "Till I Collapse",
            artist: "Eminem",
            genre: "Hip-Hop",
            energy: 10,
            reason: "Ultimate motivation and determination",
          },
          {
            title: "Stronger",
            artist: "Kanye West",
            genre: "Hip-Hop",
            energy: 9,
            reason: "Power and resilience anthem",
          },
          {
            title: "Eye of the Tiger",
            artist: "Survivor",
            genre: "Rock",
            energy: 9,
            reason: "Classic pump-up motivation",
          },
          {
            title: "Thunder",
            artist: "Imagine Dragons",
            genre: "Pop/Rock",
            energy: 8,
            reason: "Electric energy and drive",
          },
          {
            title: "Pump It",
            artist: "The Black Eyed Peas",
            genre: "Hip-Hop/Pop",
            energy: 9,
            reason: "High-intensity workout fuel",
          },
          {
            title: "Can't Hold Us",
            artist: "Macklemore & Ryan Lewis",
            genre: "Hip-Hop",
            energy: 9,
            reason: "Unstoppable energy and momentum",
          },
        ],
        djComment: "My AI brain is buffering, but I've got some high-octane tracks to keep your energy maxed out!",
        overallVibe: "High-intensity tracks designed to push you to your limits and beyond.",
      }
    } else {
      fallbackPlaylist = {
        playlist: [
          {
            title: "Happy",
            artist: "Pharrell Williams",
            genre: "Pop",
            energy: 8,
            reason: "Universal feel-good vibes for any occasion",
          },
          {
            title: "Count on Me",
            artist: "Bruno Mars",
            genre: "Pop",
            energy: 6,
            reason: "Warm friendship and connection",
          },
          {
            title: "Three Little Birds",
            artist: "Bob Marley",
            genre: "Reggae",
            energy: 5,
            reason: "Positive outlook and peace",
          },
          {
            title: "Here Comes the Sun",
            artist: "The Beatles",
            genre: "Rock/Pop",
            energy: 6,
            reason: "Timeless optimism and hope",
          },
          {
            title: "What a Wonderful World",
            artist: "Louis Armstrong",
            genre: "Jazz",
            energy: 4,
            reason: "Appreciation for life's beauty",
          },
          {
            title: "Lovely Day",
            artist: "Bill Withers",
            genre: "Soul",
            energy: 6,
            reason: "Perfect soundtrack for good times",
          },
        ],
        djComment:
          "My AI circuits are having a moment, but I've curated some universally loved tracks that work for any vibe!",
        overallVibe: "Feel-good classics that bring joy and positivity to any moment.",
      }
    }

    return Response.json(fallbackPlaylist)
  }
}

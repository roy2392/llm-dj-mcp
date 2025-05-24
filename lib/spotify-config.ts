// Spotify API Configuration
export const SPOTIFY_CONFIG = {
  // Using provided credentials with fallback to environment variables
  CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || "2e64f74d09314eaf927b0edead3633e4",
  CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || "049e057ec7f542e299eb0c5b6617a7f9",
  REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI || "https://djllm.vercel.app/api/auth/spotify",

  // Spotify API endpoints
  ENDPOINTS: {
    AUTHORIZE: "https://accounts.spotify.com/authorize",
    TOKEN: "https://accounts.spotify.com/api/token",
    USER_PROFILE: "https://api.spotify.com/v1/me",
    SEARCH: "https://api.spotify.com/v1/search",
    CREATE_PLAYLIST: (userId: string) => `https://api.spotify.com/v1/users/${userId}/playlists`,
    ADD_TRACKS: (playlistId: string) => `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
  },

  // Required scopes for the application
  SCOPES: ["playlist-modify-public", "playlist-modify-private", "user-read-private", "user-read-email"],

  // API limits and constraints
  LIMITS: {
    MAX_TRACKS_PER_REQUEST: 100,
    SEARCH_LIMIT: 10,
    MAX_RETRY_ATTEMPTS: 3,
    TOKEN_REFRESH_THRESHOLD: 60000, // 1 minute in milliseconds
  },

  // Error codes
  ERROR_CODES: {
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    PLAYLIST_CREATION_FAILED: "PLAYLIST_CREATION_FAILED",
    TRACK_SEARCH_FAILED: "TRACK_SEARCH_FAILED",
    SERVER_ERROR: "SERVER_ERROR",
    RATE_LIMITED: "RATE_LIMITED",
    INVALID_REQUEST: "INVALID_REQUEST",
  },
} as const

// Helper function to validate configuration
export function validateSpotifyConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!SPOTIFY_CONFIG.CLIENT_ID) {
    errors.push("Missing Spotify Client ID")
  }

  if (!SPOTIFY_CONFIG.CLIENT_SECRET) {
    errors.push("Missing Spotify Client Secret")
  }

  if (!SPOTIFY_CONFIG.REDIRECT_URI) {
    errors.push("Missing Spotify Redirect URI")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Helper function to generate authorization URL
export function generateAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
    scope: SPOTIFY_CONFIG.SCOPES.join(" "),
    state: state || Math.random().toString(36).substring(2, 15),
    show_dialog: "true",
  })

  return `${SPOTIFY_CONFIG.ENDPOINTS.AUTHORIZE}?${params.toString()}`
}

import { SPOTIFY_CONFIG } from "./spotify-config"

export interface SpotifyError {
  code: string
  message: string
  userMessage: string
  retryable: boolean
  statusCode?: number
}

export class SpotifyErrorHandler {
  static handleApiError(error: any, context: string): SpotifyError {
    console.error(`Spotify API Error in ${context}:`, error)

    // Handle different types of errors
    if (error.status === 401) {
      return {
        code: SPOTIFY_CONFIG.ERROR_CODES.TOKEN_EXPIRED,
        message: "Access token expired or invalid",
        userMessage: "Your Spotify session has expired. Please reconnect your account.",
        retryable: false,
        statusCode: 401,
      }
    }

    if (error.status === 429) {
      return {
        code: SPOTIFY_CONFIG.ERROR_CODES.RATE_LIMITED,
        message: "Rate limited by Spotify API",
        userMessage: "Too many requests. Please wait a moment and try again.",
        retryable: true,
        statusCode: 429,
      }
    }

    if (error.status === 400) {
      return {
        code: SPOTIFY_CONFIG.ERROR_CODES.INVALID_REQUEST,
        message: "Invalid request to Spotify API",
        userMessage: "Invalid request. Please check your input and try again.",
        retryable: false,
        statusCode: 400,
      }
    }

    if (error.status >= 500) {
      return {
        code: SPOTIFY_CONFIG.ERROR_CODES.SERVER_ERROR,
        message: "Spotify server error",
        userMessage: "Spotify is experiencing issues. Please try again later.",
        retryable: true,
        statusCode: error.status,
      }
    }

    // Network or unknown errors
    return {
      code: SPOTIFY_CONFIG.ERROR_CODES.SERVER_ERROR,
      message: error.message || "Unknown error",
      userMessage: "An unexpected error occurred. Please try again.",
      retryable: true,
    }
  }

  static shouldRetry(error: SpotifyError, attemptCount: number): boolean {
    return error.retryable && attemptCount < SPOTIFY_CONFIG.LIMITS.MAX_RETRY_ATTEMPTS
  }

  static getRetryDelay(attemptCount: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attemptCount), 10000)
  }
}

// User-friendly error messages
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: "Failed to connect to Spotify. Please check your internet connection and try again.",
  AUTH_CANCELLED: "Spotify authorization was cancelled. Please try again if you want to save playlists.",
  PLAYLIST_EXISTS: "A playlist with this name already exists. Please choose a different name.",
  NO_TRACKS_FOUND: "None of the tracks could be found on Spotify. Please try a different playlist.",
  PARTIAL_SUCCESS: "Playlist created successfully, but some tracks couldn't be found on Spotify.",
  QUOTA_EXCEEDED: "You've reached your Spotify API quota. Please try again later.",
  INVALID_CREDENTIALS: "Invalid Spotify credentials. Please contact support.",
} as const

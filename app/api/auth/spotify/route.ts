import { type NextRequest, NextResponse } from "next/server"

// Simple logging function
function log(message: string, data?: any) {
  console.log(`[Spotify Auth] ${message}`, data || "")
}

export async function GET(request: NextRequest) {
  log("=== GET REQUEST START ===")

  try {
    // Log basic request info
    log("Request URL", request.url)
    log("Request method", request.method)

    // Get URL parameters safely
    const url = new URL(request.url)
    const searchParams = url.searchParams

    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    log("URL Parameters", {
      hasCode: !!code,
      state: state,
      error: error,
      allParams: Array.from(searchParams.entries()),
    })

    // Handle Spotify OAuth errors first
    if (error) {
      log("Spotify OAuth error detected", error)
      try {
        const homeUrl = new URL("/", request.url)
        homeUrl.searchParams.set("spotify_error", error)
        log("Redirecting to home with error", homeUrl.toString())
        return NextResponse.redirect(homeUrl.toString())
      } catch (redirectError) {
        log("Redirect failed", redirectError)
        return NextResponse.json(
          {
            error: "OAuth error",
            details: error,
            redirectError: String(redirectError),
          },
          { status: 400 },
        )
      }
    }

    // Get credentials with hardcoded fallbacks
    const clientId = "2e64f74d09314eaf927b0edead3633e4"
    const clientSecret = "049e057ec7f542e299eb0c5b6617a7f9"
    const redirectUri = "https://djllm.vercel.app/api/auth/spotify"

    log("Using credentials", {
      clientId: clientId ? `${clientId.substring(0, 8)}...` : "MISSING",
      clientSecret: clientSecret ? `${clientSecret.substring(0, 8)}...` : "MISSING",
      redirectUri: redirectUri,
    })

    // Validate credentials
    if (!clientId || !clientSecret || !redirectUri) {
      log("Missing credentials")
      return NextResponse.json(
        {
          error: "Missing Spotify credentials",
          details: {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            hasRedirectUri: !!redirectUri,
          },
        },
        { status: 500 },
      )
    }

    // If no code, start OAuth flow
    if (!code) {
      log("No code found, starting OAuth flow")

      try {
        const scopes = [
          "playlist-modify-public",
          "playlist-modify-private",
          "user-read-private",
          "user-read-email",
        ].join(" ")

        const authParams = new URLSearchParams({
          client_id: clientId,
          response_type: "code",
          redirect_uri: redirectUri,
          scope: scopes,
          state: state || "default",
          show_dialog: "true",
        })

        const authUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`

        log("Redirecting to Spotify", authUrl)
        return NextResponse.redirect(authUrl)
      } catch (authError) {
        log("Auth URL creation failed", authError)
        return NextResponse.json(
          {
            error: "Failed to create auth URL",
            details: String(authError),
          },
          { status: 500 },
        )
      }
    }

    // Exchange code for token
    log("Exchanging code for token")

    try {
      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      })

      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

      log("Making token request")

      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: tokenParams.toString(),
      })

      log("Token response status", tokenResponse.status)

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        log("Token request failed", {
          status: tokenResponse.status,
          error: errorText,
        })

        return NextResponse.json(
          {
            error: "Token exchange failed",
            status: tokenResponse.status,
            details: errorText,
          },
          { status: tokenResponse.status },
        )
      }

      const tokenData = await tokenResponse.json()
      log("Token received", {
        hasAccessToken: !!tokenData.access_token,
        expiresIn: tokenData.expires_in,
      })

      if (!tokenData.access_token) {
        log("No access token in response", tokenData)
        return NextResponse.json(
          {
            error: "No access token received",
            tokenData: tokenData,
          },
          { status: 400 },
        )
      }

      // Success - redirect with token
      log("Success! Redirecting with token")

      try {
        const homeUrl = new URL("/", request.url)
        homeUrl.searchParams.set("spotify_token", tokenData.access_token)
        homeUrl.searchParams.set("spotify_expires_in", tokenData.expires_in.toString())

        if (tokenData.refresh_token) {
          homeUrl.searchParams.set("spotify_refresh_token", tokenData.refresh_token)
        }

        log("Final redirect URL", homeUrl.toString())
        return NextResponse.redirect(homeUrl.toString())
      } catch (redirectError) {
        log("Final redirect failed", redirectError)
        return NextResponse.json(
          {
            error: "Redirect failed",
            token: tokenData.access_token,
            details: String(redirectError),
          },
          { status: 500 },
        )
      }
    } catch (tokenError) {
      log("Token exchange error", tokenError)
      return NextResponse.json(
        {
          error: "Token exchange failed",
          details: String(tokenError),
        },
        { status: 500 },
      )
    }
  } catch (mainError) {
    log("=== MAIN ERROR ===", mainError)

    // Return detailed error info
    return NextResponse.json(
      {
        error: "Server error",
        message: mainError instanceof Error ? mainError.message : String(mainError),
        stack: mainError instanceof Error ? mainError.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Simple health check
export async function POST(request: NextRequest) {
  log("=== POST HEALTH CHECK ===")

  try {
    const clientId = "2e64f74d09314eaf927b0edead3633e4"
    const clientSecret = "049e057ec7f542e299eb0c5b6617a7f9"
    const redirectUri = "https://djllm.vercel.app/api/auth/spotify"

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      config: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRedirectUri: !!redirectUri,
        clientIdPreview: clientId ? `${clientId.substring(0, 8)}...` : null,
        redirectUri: redirectUri,
      },
      request: {
        url: request.url,
        method: request.method,
      },
    })
  } catch (error) {
    log("Health check error", error)
    return NextResponse.json(
      {
        status: "error",
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("=== SPOTIFY AUTH ROUTE (GET) ===")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    console.log("Auth params:", {
      hasCode: !!code,
      state,
      error,
      allParams: Object.fromEntries(searchParams.entries()),
    })

    // Handle Spotify OAuth errors
    if (error) {
      console.log("Spotify OAuth error:", error)
      const homeUrl = new URL("/", request.url)
      homeUrl.searchParams.set("spotify_error", error)
      return NextResponse.redirect(homeUrl)
    }

    // Get environment variables with fallbacks
    const clientId = process.env.SPOTIFY_CLIENT_ID || "2e64f74d09314eaf927b0edead3633e4"
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "049e057ec7f542e299eb0c5b6617a7f9"
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "https://djllm.vercel.app/api/auth/spotify"

    console.log("Environment check:", {
      clientId: clientId ? `${clientId.substring(0, 8)}...` : "✗ Missing",
      clientSecret: clientSecret ? `${clientSecret.substring(0, 8)}...` : "✗ Missing",
      redirectUri: redirectUri || "✗ Missing",
      nodeEnv: process.env.NODE_ENV,
    })

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Missing Spotify configuration")
      return NextResponse.json(
        {
          error: "Missing Spotify configuration",
          details: {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            hasRedirectUri: !!redirectUri,
          },
        },
        { status: 500 },
      )
    }

    if (!code) {
      // Step 1: Redirect to Spotify for authorization
      console.log("Initiating Spotify OAuth flow")

      const scopes = ["playlist-modify-public", "playlist-modify-private", "user-read-private", "user-read-email"].join(
        " ",
      )

      const authUrl = new URL("https://accounts.spotify.com/authorize")
      authUrl.searchParams.set("client_id", clientId)
      authUrl.searchParams.set("response_type", "code")
      authUrl.searchParams.set("redirect_uri", redirectUri)
      authUrl.searchParams.set("scope", scopes)
      authUrl.searchParams.set("state", state || "default")
      authUrl.searchParams.set("show_dialog", "true")

      console.log("Redirecting to Spotify:", authUrl.toString())
      return NextResponse.redirect(authUrl.toString())
    }

    // Step 2: Exchange authorization code for access token
    console.log("Exchanging code for access token")

    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    })

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    console.log("Making token request to Spotify...")
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: tokenBody.toString(),
    })

    console.log("Token response status:", tokenResponse.status)
    console.log("Token response headers:", Object.fromEntries(tokenResponse.headers.entries()))

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
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
    console.log("Token received:", {
      hasAccessToken: !!tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    })

    if (!tokenData.access_token) {
      console.error("No access token received")
      return NextResponse.json(
        {
          error: "No access token received",
          tokenData: tokenData,
        },
        { status: 400 },
      )
    }

    // Step 3: Redirect back to app with token
    console.log("Authentication successful!")
    const homeUrl = new URL("/", request.url)
    homeUrl.searchParams.set("spotify_token", tokenData.access_token)
    homeUrl.searchParams.set("spotify_expires_in", tokenData.expires_in.toString())

    if (tokenData.refresh_token) {
      homeUrl.searchParams.set("spotify_refresh_token", tokenData.refresh_token)
    }

    console.log("Redirecting to home with token")
    return NextResponse.redirect(homeUrl.toString())
  } catch (error) {
    console.error("=== SPOTIFY AUTH ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    // Return JSON error instead of redirect for better debugging
    return NextResponse.json(
      {
        error: "Server error in Spotify auth",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Enhanced health check endpoint
export async function POST(request: NextRequest) {
  console.log("=== SPOTIFY AUTH HEALTH CHECK ===")

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID || "2e64f74d09314eaf927b0edead3633e4"
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "049e057ec7f542e299eb0c5b6617a7f9"
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "https://djllm.vercel.app/api/auth/spotify"

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRedirectUri: !!redirectUri,
        clientIdPreview: clientId ? `${clientId.substring(0, 8)}...` : null,
        redirectUri: redirectUri,
      },
      request: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
      },
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

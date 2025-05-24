import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("=== SPOTIFY AUTH ROUTE ===")

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    console.log("Auth params:", {
      hasCode: !!code,
      state,
      error,
      fullUrl: request.url,
    })

    // Handle Spotify OAuth errors
    if (error) {
      console.log("Spotify OAuth error:", error)
      const homeUrl = new URL("/", request.url)
      homeUrl.searchParams.set("spotify_error", error)
      return NextResponse.redirect(homeUrl)
    }

    // Get environment variables
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI

    console.log("Environment check:", {
      clientId: clientId ? "✓" : "✗",
      clientSecret: clientSecret ? "✓" : "✗",
      redirectUri: redirectUri ? "✓" : "✗",
    })

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Missing Spotify configuration")
      const homeUrl = new URL("/", request.url)
      homeUrl.searchParams.set("spotify_error", "missing_config")
      return NextResponse.redirect(homeUrl)
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

      console.log("Redirecting to:", authUrl.toString())
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

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: tokenBody.toString(),
    })

    console.log("Token response status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange failed:", errorText)
      const homeUrl = new URL("/", request.url)
      homeUrl.searchParams.set("spotify_error", "token_failed")
      return NextResponse.redirect(homeUrl)
    }

    const tokenData = await tokenResponse.json()
    console.log("Token received:", {
      hasAccessToken: !!tokenData.access_token,
      expiresIn: tokenData.expires_in,
    })

    if (!tokenData.access_token) {
      console.error("No access token received")
      const homeUrl = new URL("/", request.url)
      homeUrl.searchParams.set("spotify_error", "no_token")
      return NextResponse.redirect(homeUrl)
    }

    // Step 3: Redirect back to app with token
    console.log("Authentication successful!")
    const homeUrl = new URL("/", request.url)
    homeUrl.searchParams.set("spotify_token", tokenData.access_token)
    homeUrl.searchParams.set("spotify_expires_in", tokenData.expires_in.toString())

    if (tokenData.refresh_token) {
      homeUrl.searchParams.set("spotify_refresh_token", tokenData.refresh_token)
    }

    return NextResponse.redirect(homeUrl.toString())
  } catch (error) {
    console.error("=== SPOTIFY AUTH ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    const homeUrl = new URL("/", request.url)
    homeUrl.searchParams.set("spotify_error", "server_error")
    return NextResponse.redirect(homeUrl)
  }
}

// Add a simple health check endpoint
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      env: {
        hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
        hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
        hasRedirectUri: !!process.env.SPOTIFY_REDIRECT_URI,
      },
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

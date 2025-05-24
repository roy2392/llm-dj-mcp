"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2, ExternalLink } from "lucide-react"

export default function SpotifyDebugPage() {
  const [healthCheck, setHealthCheck] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runHealthCheck = async () => {
    setLoading(true)
    setError(null)
    setHealthCheck(null)

    try {
      console.log("Running Spotify health check...")

      const response = await fetch("/api/auth/spotify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Health check response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Health check data:", data)
        setHealthCheck(data)
      } else {
        const errorText = await response.text()
        console.error("Health check failed:", errorText)
        setError(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (err) {
      console.error("Health check error:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const testDirectAccess = () => {
    console.log("Testing direct access to Spotify auth route...")
    window.open("/api/auth/spotify", "_blank")
  }

  const startAuthFlow = () => {
    console.log("Starting Spotify auth flow...")
    window.location.href = "/api/auth/spotify"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-white">Spotify Integration Debug</h1>

        {/* Health Check */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Health Check</h2>

            <Button onClick={runHealthCheck} disabled={loading} className="mb-4 bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </div>
              ) : (
                "Run Health Check"
              )}
            </Button>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="font-semibold text-white">Error</span>
                </div>
                <p className="text-sm text-white">{error}</p>
              </div>
            )}

            {healthCheck && (
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-white">Health Check Results</span>
                </div>

                <div className="space-y-3 text-sm text-white">
                  <div>
                    <strong>Status:</strong> {healthCheck.status}
                  </div>
                  <div>
                    <strong>Environment:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>Node ENV: {healthCheck.environment?.nodeEnv || "unknown"}</li>
                      <li>Client ID: {healthCheck.environment?.hasClientId ? "✅ Present" : "❌ Missing"}</li>
                      <li>Client Secret: {healthCheck.environment?.hasClientSecret ? "✅ Present" : "❌ Missing"}</li>
                      <li>Redirect URI: {healthCheck.environment?.hasRedirectUri ? "✅ Present" : "❌ Missing"}</li>
                      {healthCheck.environment?.redirectUri && (
                        <li>Redirect URL: {healthCheck.environment.redirectUri}</li>
                      )}
                    </ul>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">Show Full Response</summary>
                  <pre className="text-xs mt-2 bg-gray-900 p-3 rounded overflow-auto">
                    {JSON.stringify(healthCheck, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Test Actions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={testDirectAccess} className="bg-purple-600 hover:bg-purple-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                Test Direct Access
              </Button>

              <Button onClick={startAuthFlow} className="bg-green-600 hover:bg-green-700">
                Start Auth Flow
              </Button>
            </div>

            <div className="mt-4 text-sm text-gray-400">
              <p>
                <strong>Direct Access:</strong> Opens the auth route in a new tab to see raw response
              </p>
              <p>
                <strong>Auth Flow:</strong> Starts the full Spotify authentication process
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Environment Information</h2>

            <div className="space-y-2 text-sm">
              <div>Current URL: {typeof window !== "undefined" ? window.location.href : "N/A"}</div>
              <div>
                User Agent: {typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 100) + "..." : "N/A"}
              </div>
              <div>Timestamp: {new Date().toISOString()}</div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-900/20 border-blue-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Debug Instructions</h2>

            <div className="space-y-3 text-sm text-white">
              <div>
                <strong>1. Run Health Check:</strong> This will test the API route and show configuration status
              </div>
              <div>
                <strong>2. Check Browser Console:</strong> Look for detailed logs and error messages
              </div>
              <div>
                <strong>3. Test Direct Access:</strong> This opens the route directly to see any error responses
              </div>
              <div>
                <strong>4. Start Auth Flow:</strong> This begins the full Spotify authentication process
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

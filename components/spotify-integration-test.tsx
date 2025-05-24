"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Music, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

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

interface SpotifyIntegrationTestProps {
  playlist: PlaylistResponse
  vibe: string
}

export function SpotifyIntegrationTest({ playlist, vibe }: SpotifyIntegrationTestProps) {
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const testBasicRoute = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      console.log("Testing basic Spotify route...")

      const response = await fetch("/api/auth/spotify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Success:", data)
        setTestResult({ success: true, data })
      } else {
        const errorText = await response.text()
        console.error("Error:", errorText)
        setTestResult({
          success: false,
          error: errorText,
          status: response.status,
        })
      }
    } catch (error) {
      console.error("Network error:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        type: "network_error",
      })
    } finally {
      setTesting(false)
    }
  }

  if (!playlist || !playlist.playlist || playlist.playlist.length === 0) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-blue-900/30 to-gray-800 border-blue-700 text-white">
      <CardContent className="p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Spotify Route Test</h3>
            <p className="text-sm text-gray-300">Testing basic API route connectivity</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={testBasicRoute}
            disabled={testing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {testing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing Route...
              </div>
            ) : (
              "Test Basic Route"
            )}
          </Button>

          {testResult && (
            <div className="space-y-3">
              <div
                className={`p-4 rounded-lg border ${
                  testResult.success ? "bg-green-900/50 border-green-700" : "bg-red-900/50 border-red-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className="font-semibold">{testResult.success ? "Route Working!" : "Route Error"}</span>
                </div>

                {testResult.status && <div className="text-sm text-gray-400 mb-2">Status: {testResult.status}</div>}

                {testResult.type && <div className="text-sm text-gray-400 mb-2">Error Type: {testResult.type}</div>}
              </div>

              <details className="bg-gray-900 p-3 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium">Show Full Response</summary>
                <pre className="text-xs mt-2 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <div className="text-xs text-gray-400 space-y-1">
            <div>• Playlist: {playlist.playlist.length} songs</div>
            <div>• Vibe: "{vibe}"</div>
            <div>• Check browser console for detailed logs</div>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-medium mb-1">Next Steps:</div>
              <div className="text-xs text-gray-400">
                1. Test the basic route first
                <br />
                2. Visit /test-simple for comprehensive testing
                <br />
                3. Check browser console for errors
                <br />
                4. Verify environment variables are set
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

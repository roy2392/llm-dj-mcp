"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Music, AlertCircle, ExternalLink } from "lucide-react"

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

interface SpotifyIntegrationProps {
  playlist: PlaylistResponse
  vibe: string
}

export function SpotifyIntegrationSimple({ playlist, vibe }: SpotifyIntegrationProps) {
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const testSpotifyRoute = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      console.log("Testing Spotify route...")
      const response = await fetch("/api/auth/spotify", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult({ success: true, data })
      } else {
        const errorText = await response.text()
        setTestResult({ success: false, error: errorText, status: response.status })
      }
    } catch (error) {
      console.error("Test error:", error)
      setTestResult({ success: false, error: error.message })
    } finally {
      setTesting(false)
    }
  }

  if (!playlist || !playlist.playlist || playlist.playlist.length === 0) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-green-900/30 to-gray-800 border-green-700 text-white">
      <CardContent className="p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Spotify Integration (Debug Mode)</h3>
            <p className="text-sm text-gray-300">Testing Spotify API route connectivity</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={testSpotifyRoute}
            disabled={testing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {testing ? "Testing Route..." : "Test Spotify Route"}
          </Button>

          {testResult && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className={`flex items-center gap-2 mb-2 ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                {testResult.success ? <Music className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-semibold">{testResult.success ? "Route Working!" : "Route Error"}</span>
              </div>

              {testResult.status && <div className="text-sm text-gray-400 mb-2">Status: {testResult.status}</div>}

              <pre className="text-xs overflow-auto bg-gray-800 p-2 rounded">{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}

          <div className="text-xs text-gray-400 space-y-1">
            <div>• Playlist has {playlist.playlist.length} songs</div>
            <div>• Vibe: "{vibe}"</div>
            <div>• Check browser console for detailed logs</div>
          </div>

          <Button
            onClick={() => window.open("/test-auth", "_blank")}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Full Test Page
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

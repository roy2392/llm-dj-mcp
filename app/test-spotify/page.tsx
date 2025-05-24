"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function TestSpotifyPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSpotifyRoute = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/spotify", {
        method: "POST",
      })
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testSpotifyAuth = () => {
    window.location.href = "/api/auth/spotify"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">Spotify Integration Test</h1>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Test Spotify Route</h2>
            <Button onClick={testSpotifyRoute} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
              {loading ? "Testing..." : "Test Route"}
            </Button>

            {testResult && (
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Test Result:</h3>
                <pre className="text-sm overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Test Spotify Auth Flow</h2>
            <Button onClick={testSpotifyAuth} className="w-full bg-blue-600 hover:bg-blue-700">
              Start Spotify Auth
            </Button>
            <p className="text-sm text-gray-400">This will redirect you to Spotify for authentication</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
            <div className="space-y-2 text-sm">
              <div>SPOTIFY_CLIENT_ID: {process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ? "✅ Set" : "❌ Missing"}</div>
              <div>SPOTIFY_REDIRECT_URI: {process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ? "✅ Set" : "❌ Missing"}</div>
              <p className="text-gray-400 mt-4">Note: Client secret is not shown for security reasons</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

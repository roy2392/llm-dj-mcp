"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function SimpleAuthTest() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testHealthCheck = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log("Testing health check...")

      const response = await fetch("/api/auth/spotify", {
        method: "POST",
      })

      console.log("Response status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      setResult({
        success: response.ok,
        status: response.status,
        data: data,
      })
    } catch (error) {
      console.error("Test error:", error)
      setResult({
        success: false,
        error: String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const testDirectGet = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log("Testing direct GET...")

      const response = await fetch("/api/auth/spotify", {
        method: "GET",
      })

      console.log("Response status:", response.status)
      console.log("Response type:", response.headers.get("content-type"))

      if (response.headers.get("content-type")?.includes("application/json")) {
        const data = await response.json()
        console.log("JSON response:", data)
        setResult({
          success: response.ok,
          status: response.status,
          data: data,
        })
      } else {
        const text = await response.text()
        console.log("Text response:", text)
        setResult({
          success: response.ok,
          status: response.status,
          data: { text: text },
        })
      }
    } catch (error) {
      console.error("Test error:", error)
      setResult({
        success: false,
        error: String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const startAuthFlow = () => {
    console.log("Starting auth flow...")
    window.location.href = "/api/auth/spotify"
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">Simple Auth Test</h1>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Test API Route</h2>

            <div className="space-y-3">
              <Button onClick={testHealthCheck} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading ? "Testing..." : "Test Health Check (POST)"}
              </Button>

              <Button onClick={testDirectGet} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                {loading ? "Testing..." : "Test Direct GET"}
              </Button>

              <Button onClick={startAuthFlow} className="w-full bg-purple-600 hover:bg-purple-700">
                Start Auth Flow
              </Button>
            </div>

            {result && (
              <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                <h3 className="font-semibold mb-2">{result.success ? "✅ Success" : "❌ Error"}</h3>

                {result.status && <div className="text-sm mb-2">Status: {result.status}</div>}

                <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <div className="space-y-2 text-sm">
              <div>
                1. <strong>Test Health Check:</strong> Tests the POST endpoint
              </div>
              <div>
                2. <strong>Test Direct GET:</strong> Tests the GET endpoint directly
              </div>
              <div>
                3. <strong>Start Auth Flow:</strong> Begins Spotify authentication
              </div>
              <div>
                4. <strong>Check Console:</strong> Look for detailed logs
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

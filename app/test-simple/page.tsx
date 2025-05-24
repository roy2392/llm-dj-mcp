"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function TestSimplePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testRoute = async (method: "GET" | "POST") => {
    setLoading(true)
    setResult(null)

    try {
      console.log(`Testing ${method} /api/auth/spotify`)

      const response = await fetch("/api/auth/spotify", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log("Success data:", data)
        setResult({ success: true, data, status: response.status })
      } else {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        setResult({
          success: false,
          error: errorText,
          status: response.status,
          statusText: response.statusText,
        })
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        type: "network_error",
      })
    } finally {
      setLoading(false)
    }
  }

  const testDirectAccess = () => {
    window.open("/api/auth/spotify", "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">Simple API Route Test</h1>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Test Basic Route</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={() => testRoute("GET")} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                Test GET
              </Button>

              <Button onClick={() => testRoute("POST")} disabled={loading} className="bg-green-600 hover:bg-green-700">
                Test POST
              </Button>

              <Button onClick={testDirectAccess} className="bg-purple-600 hover:bg-purple-700">
                Direct Access
              </Button>
            </div>

            {loading && <div className="text-center text-gray-400">Testing...</div>}

            {result && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${result.success ? "bg-green-900/50 border border-green-700" : "bg-red-900/50 border border-red-700"}`}
                >
                  <div className="font-semibold mb-2">{result.success ? "✅ Success" : "❌ Error"}</div>

                  {result.status && (
                    <div className="text-sm mb-2">
                      Status: {result.status} {result.statusText && `(${result.statusText})`}
                    </div>
                  )}

                  {result.type && <div className="text-sm mb-2">Type: {result.type}</div>}
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Full Response:</h3>
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <div className="space-y-2 text-sm">
              <div>Current URL: {typeof window !== "undefined" ? window.location.href : "N/A"}</div>
              <div>
                User Agent: {typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 100) + "..." : "N/A"}
              </div>
              <div>Timestamp: {new Date().toISOString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

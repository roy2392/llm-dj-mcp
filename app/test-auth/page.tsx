"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testGet = async () => {
    setLoading(true)
    setResult(null)
    try {
      console.log("Testing GET /api/auth/spotify")
      const response = await fetch("/api/auth/spotify", {
        method: "GET",
      })
      console.log("Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Response data:", data)
        setResult({ success: true, data })
      } else {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        setResult({ success: false, error: errorText, status: response.status })
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testPost = async () => {
    setLoading(true)
    setResult(null)
    try {
      console.log("Testing POST /api/auth/spotify")
      const response = await fetch("/api/auth/spotify", {
        method: "POST",
      })
      console.log("Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Response data:", data)
        setResult({ success: true, data })
      } else {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        setResult({ success: false, error: errorText, status: response.status })
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testDirect = () => {
    console.log("Testing direct navigation to /api/auth/spotify")
    window.open("/api/auth/spotify", "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">API Route Test</h1>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Test API Route</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={testGet} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                Test GET
              </Button>

              <Button onClick={testPost} disabled={loading} className="bg-green-600 hover:bg-green-700">
                Test POST
              </Button>

              <Button onClick={testDirect} className="bg-purple-600 hover:bg-purple-700">
                Direct Access
              </Button>
            </div>

            {loading && <div className="text-center text-gray-400">Testing...</div>}

            {result && (
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Result:</h3>
                <div className={`p-2 rounded ${result.success ? "bg-green-900" : "bg-red-900"}`}>
                  <div className="font-semibold">{result.success ? "✅ Success" : "❌ Error"}</div>
                  {result.status && <div className="text-sm">Status: {result.status}</div>}
                </div>
                <pre className="text-sm overflow-auto mt-2 bg-gray-800 p-2 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
            <div className="space-y-2 text-sm">
              <div>Current URL: {typeof window !== "undefined" ? window.location.href : "N/A"}</div>
              <div>User Agent: {typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

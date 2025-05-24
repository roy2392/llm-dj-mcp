import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("=== SIMPLE TEST GET ===")
  console.log("URL:", request.url)

  try {
    return NextResponse.json({
      message: "Simple GET test successful",
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method,
    })
  } catch (error) {
    console.error("Simple test error:", error)
    return NextResponse.json(
      {
        error: "Simple test failed",
        details: String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("=== SIMPLE TEST POST ===")
  console.log("URL:", request.url)

  try {
    return NextResponse.json({
      message: "Simple POST test successful",
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method,
    })
  } catch (error) {
    console.error("Simple test error:", error)
    return NextResponse.json(
      {
        error: "Simple test failed",
        details: String(error),
      },
      { status: 500 },
    )
  }
}

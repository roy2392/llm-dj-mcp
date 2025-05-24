"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Play, Disc3, Headphones, Zap } from "lucide-react"
import { SpotifyIntegration } from "@/components/spotify-integration"
import { ErrorWrapper } from "@/components/error-wrapper"

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

export default function DJLLMApp() {
  const [vibe, setVibe] = useState("")
  const [playlist, setPlaylist] = useState<PlaylistResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePlaylist = () => {
    if (!vibe.trim()) return

    setIsGenerating(true)

    fetch("/api/generate-playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vibe }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json()
        }
        throw new Error("Failed to generate playlist")
      })
      .then((data) => {
        setPlaylist(data)
      })
      .catch((error) => {
        console.error("Error generating playlist:", error)
      })
      .finally(() => {
        setIsGenerating(false)
      })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      generatePlaylist()
    }
  }

  return (
    <ErrorWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        {/* Header */}
        <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Disc3 className="w-8 h-8 text-green-500 animate-spin" style={{ animationDuration: "3s" }} />
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-sm"></div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                DJ LLM
              </h1>
              <span className="text-sm text-gray-400 ml-2">AI-Powered Playlist Generator</span>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* DJ Avatar & Controls */}
            <div className="space-y-6">
              {/* DJ Avatar */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 overflow-hidden text-white">
                <CardContent className="p-8 text-center text-white">
                  <div className="relative mx-auto w-48 h-48 mb-6">
                    {/* DJ Avatar */}
                    <div className="w-full h-full bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/20 rounded-full"></div>
                      <Headphones className="w-20 h-20 text-white z-10" />
                      {/* Animated rings */}
                      <div className="absolute inset-0 border-4 border-green-300/30 rounded-full animate-ping"></div>
                      <div className="absolute inset-4 border-2 border-green-400/50 rounded-full animate-pulse"></div>
                    </div>
                    {/* Floating music notes */}
                    <Music className="absolute -top-2 -right-2 w-6 h-6 text-green-400 animate-bounce" />
                    <Music
                      className="absolute -bottom-2 -left-2 w-4 h-4 text-green-300 animate-bounce"
                      style={{ animationDelay: "0.5s" }}
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">DJ LLM</h2>
                  <p className="text-gray-400 mb-4">Your AI Music Curator</p>
                  <div className="flex justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              {/* Vibe Input */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white">
                <CardContent className="p-6 text-white">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-500" />
                    What's Your Vibe?
                  </h3>
                  <div className="space-y-4">
                    <Input
                      placeholder="e.g., afternoon party for my nana & her poker friends..."
                      value={vibe}
                      onChange={(e) => setVibe(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="bg-gray-900 border-gray-600 text-white placeholder-white/60 focus:border-green-500 focus:ring-green-500"
                    />
                    <Button
                      onClick={generatePlaylist}
                      disabled={!vibe.trim() || isGenerating}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-2">
                          <Disc3 className="w-4 h-4 animate-spin" />
                          Curating Your Playlist...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Generate Playlist
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Playlist Display */}
            <div className="space-y-6">
              {playlist && (
                <>
                  {/* DJ Comment */}
                  <Card className="bg-gradient-to-r from-green-900/50 to-gray-800 border-green-700 text-white">
                    <CardContent className="p-6 text-white">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Headphones className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-400 mb-1">DJ LLM says:</h4>
                          <p className="text-gray-300">{playlist.djComment}</p>
                          <p className="text-sm text-green-300 mt-2 italic">Overall Vibe: {playlist.overallVibe}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Playlist */}
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white">
                    <CardContent className="p-6 text-white">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5 text-green-500" />
                        Your Curated Playlist
                      </h3>
                      <div className="space-y-3">
                        {playlist.playlist.map((song, index) => (
                          <div
                            key={index}
                            className="group p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-green-500/50 transition-all duration-200 hover:bg-gray-800/50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-sm text-gray-500 font-mono w-6">
                                    {(index + 1).toString().padStart(2, "0")}
                                  </span>
                                  <div>
                                    <h4 className="font-semibold text-white group-hover:text-green-400 transition-colors">
                                      {song.title}
                                    </h4>
                                    <p className="text-gray-400 text-sm">{song.artist}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500 ml-9">
                                  <span className="bg-gray-800 px-2 py-1 rounded">{song.genre}</span>
                                  <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    <span>Energy: {song.energy}/10</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-400 mt-2 ml-9 italic">{song.reason}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-green-500 hover:text-green-400 hover:bg-green-500/10"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Spotify Integration */}
                  <SpotifyIntegration playlist={playlist} vibe={vibe} />
                </>
              )}

              {!playlist && !isGenerating && (
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 border-dashed text-white">
                  <CardContent className="p-12 text-center text-white">
                    <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready to Drop Some Beats?</h3>
                    <p className="text-gray-500">Tell me your vibe and I'll curate the perfect playlist for you!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorWrapper>
  )
}

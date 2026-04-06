import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Play, BookOpen, Coffee, ArrowLeft } from "lucide-react";

export default function EpisodeLibrary() {
  const [, setLocation] = useLocation();
  const [difficulty, setDifficulty] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Fetch episodes
  const episodesQuery = trpc.episodes.list.useQuery({
    difficulty: (difficulty || undefined) as "A1" | "A2" | "B1" | "B2" | undefined,
    search: search || undefined,
  });

  const episodes = episodesQuery.data || [];

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "A1":
        return "bg-green-100 text-green-800";
      case "A2":
        return "bg-blue-100 text-blue-800";
      case "B1":
        return "bg-orange-100 text-orange-800";
      case "B2":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Home
          </Button>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-700" />
            <span className="font-semibold">Camera Cafe Learner</span>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/vocabulary")}>
              My Vocabulary
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Camera Cafe Episodes
          </h1>
          <p className="text-gray-600">
            Learn Italian through authentic TV content
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search episodes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1"
          />

          <Select value={difficulty || "all"} onValueChange={v => setDifficulty(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="A1">A1 - Beginner</SelectItem>
              <SelectItem value="A2">A2 - Elementary</SelectItem>
              <SelectItem value="B1">B1 - Intermediate</SelectItem>
              <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Episodes Grid */}
        {episodesQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No episodes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map(episode => (
              <Card
                key={episode.id}
                className="overflow-hidden hover:shadow-lg transition cursor-pointer group"
                onClick={() => setLocation(`/watch/${episode.id}`)}
              >
                {/* YouTube Thumbnail */}
                <div className="w-full h-40 bg-gray-900 relative overflow-hidden">
                  {episode.videoUrl?.includes("youtube.com") ? (
                    <img
                      src={`https://img.youtube.com/vi/${new URL(episode.videoUrl).searchParams.get("v")}/mqdefault.jpg`}
                      alt={episode.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center">
                      <Coffee className="w-12 h-12 text-white opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-70 group-hover:opacity-100 transition" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                        {episode.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        S{episode.season}E{episode.episodeNumber}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${getDifficultyColor(episode.difficulty)}`}
                    >
                      {episode.difficulty}
                    </span>
                  </div>

                  {/* Description */}
                  {episode.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {episode.description}
                    </p>
                  )}

                  {/* Duration */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{Math.floor(episode.duration / 60)} minutes</span>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={e => {
                        e.stopPropagation();
                        setLocation(`/watch/${episode.id}`);
                      }}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Watch
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

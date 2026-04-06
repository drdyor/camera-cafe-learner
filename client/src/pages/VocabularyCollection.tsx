import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Heart, Trash2, BookOpen, TrendingUp } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function VocabularyCollection() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Fetch vocabulary
  const vocabularyQuery = trpc.vocabulary.list.useQuery({
    status: statusFilter as "learning" | "reviewing" | "mastered" | undefined,
  });

  // Fetch stats
  const statsQuery = trpc.vocabulary.getStats.useQuery();

  // Remove from vocabulary
  const removeMutation = trpc.vocabulary.updateStatus.useMutation({
    onSuccess: () => {
      vocabularyQuery.refetch();
      statsQuery.refetch();
    },
  });

  // Update status
  const updateStatusMutation = trpc.vocabulary.updateStatus.useMutation({
    onSuccess: () => {
      vocabularyQuery.refetch();
      statsQuery.refetch();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please log in to view your vocabulary</p>
      </div>
    );
  }

  const vocabulary = vocabularyQuery.data || [];
  const stats = statsQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "learning":
        return "bg-blue-100 text-blue-800";
      case "reviewing":
        return "bg-orange-100 text-orange-800";
      case "mastered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "learning":
        return "Learning";
      case "reviewing":
        return "Reviewing";
      case "mastered":
        return "Mastered";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My Vocabulary
          </h1>
          <p className="text-gray-600">
            Track and review the words you're learning
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Words</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {stats.totalVocabulary}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-400" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mastered</p>
                  <p className="text-3xl font-bold text-green-900">
                    {stats.masteredCount}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reviewing</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {stats.reviewingCount}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-orange-400" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Learning</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {stats.learningCount}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-400" />
              </div>
            </Card>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter || "all"} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Words</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="mastered">Mastered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vocabulary List */}
        {vocabularyQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : vocabulary.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No vocabulary saved yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Start watching episodes and save words to build your collection
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vocabulary.map(entry => (
              <Card key={entry.id} className="p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {entry.phraseId}
                        </p>
                        <p className="text-sm text-gray-600">
                          Times encountered: {entry.timesEncountered}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(entry.status)}`}
                      >
                        {getStatusLabel(entry.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {entry.status !== "mastered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const nextStatus =
                            entry.status === "learning"
                              ? "reviewing"
                              : "mastered";
                          updateStatusMutation.mutate({
                            vocabularyId: entry.id,
                            status: nextStatus,
                          });
                        }}
                      >
                        Mark as{" "}
                        {entry.status === "learning" ? "Reviewing" : "Mastered"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        // For now, just update status to deleted (in a real app, delete from DB)
                        // removeMutation.mutate({ vocabularyId: entry.id });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
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

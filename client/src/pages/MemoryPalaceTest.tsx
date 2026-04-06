import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function MemoryPalaceTest() {
  const [, setLocation] = useLocation();
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Home
        </Button>
        <Sparkles className="w-5 h-5 text-amber-500" />
        <span className="font-bold">Memory Palace Test</span>
      </header>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Memory Palace is Loading!</h1>
        <p className="text-slate-400 mb-6">
          If you see this, the route is working. The issue might be with the complex components.
        </p>

        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
          <p className="mb-4">Test counter: {count}</p>
          <Button onClick={() => setCount(c => c + 1)}>
            Click me ({count})
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation("/memory-palace")}
          >
            Try Full Memory Palace
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = "/memory-palace"}
          >
            Hard Refresh to Memory Palace
          </Button>
        </div>
      </div>
    </div>
  );
}

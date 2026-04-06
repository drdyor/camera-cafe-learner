import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import EpisodeLibrary from "./pages/EpisodeLibrary";
import VideoPlayer from "./pages/VideoPlayer";
import VocabularyCollection from "./pages/VocabularyCollection";
import StoryLibrary from "./pages/StoryLibrary";
import StoryReader from "./pages/StoryReader";
import VisualDictionary from "./pages/VisualDictionary";
import DialogueLibrary from "./pages/DialogueLibrary";
import DialoguePlayer from "./pages/DialoguePlayer";
import MemoryPalace from "./pages/MemoryPalace";
import MemoryPalaceTest from "./pages/MemoryPalaceTest";
import MemoryPalaceLanding from "./pages/MemoryPalaceLanding";
import MemoryPalaceRooms from "./pages/MemoryPalaceRooms";
import MemoryPalaceRoom from "./pages/MemoryPalaceRoom";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/episodes" component={EpisodeLibrary} />
      <Route path="/watch/:episodeId" component={VideoPlayer} />
      <Route path="/vocabulary" component={VocabularyCollection} />
      <Route path="/stories" component={StoryLibrary} />
      <Route path="/story/:storyId" component={StoryReader} />
      <Route path="/visual-dictionary" component={VisualDictionary} />
      <Route path="/dialogues" component={DialogueLibrary} />
      <Route path="/dialogue/:dialogueId" component={DialoguePlayer} />
      <Route path="/palace" component={MemoryPalaceLanding} />
      <Route path="/palace/rooms" component={MemoryPalaceRooms} />
      <Route path="/palace/rooms/:roomId" component={MemoryPalaceRoom} />
      <Route path="/memory-palace" component={MemoryPalace} />
      <Route path="/memory-palace-test" component={MemoryPalaceTest} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

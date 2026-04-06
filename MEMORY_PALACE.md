# Memory Palace Feature

## 🏛️ Multi-Level Spatial Learning System

Navigate through nested room spaces - enter the kitchen, open the fridge, explore cabinets, etc.

### Features
- **Zoom/Pan** - Explore room details with mouse/touch
- **Nested Navigation** - Click zones to enter deeper levels
- **Vocabulary Hotspots** - Click words to hear pronunciation
- **Language Agnostic** - Same palace layout, swap vocab for new languages

---

## 📁 File Structure

```
client/src/
├── components/memory-palace/
│   ├── SpatialViewer.tsx    # Reusable zoom/pan viewer
│   ├── data.ts              # Palace level definitions
│   └── index.ts             # Exports
├── pages/
│   └── MemoryPalace.tsx     # Main page
```

---

## 🚀 Usage

### 1. Access the Memory Palace
Navigate to: `http://localhost:3000/memory-palace`

### 2. Explore the Kitchen
- **Main Kitchen** - Overview with 6 enterable zones
  - Fridge (il frigorifero) - 8 words
  - Cabinets (gli armadietti) - 8 words  
  - Drawers (i cassetti) - 6 words
  - Stove (la cucina) - 8 words
  - Sink (il lavello) - 5 words
  - Pantry (la dispensa) - 6 words

### 3. Controls
- **Scroll** - Zoom in/out
- **Drag** - Pan around
- **Click Zones** - Enter areas (amber dashed boxes)
- **Click Words** - Hear Italian pronunciation
- **Back Button** - Return to previous level

---

## 🏗️ Adding New Palaces

### 1. Define Levels in `data.ts`

```typescript
export const bedroomLevels: SpatialLevel[] = [
  {
    id: "bedroom-main",
    name: "The Bedroom",
    nameIt: "La Camera",
    description: "A cozy bedroom with morning light",
    image: "/palace/bedroom/main.jpg",
    zones: [
      { 
        id: "closet-zone", 
        name: "Closet", 
        nameIt: "L'Armadio", 
        x: 70, y: 40, width: 20, height: 30, 
        icon: "🚪", 
        targetLevelId: "bedroom-closet" 
      },
      // ... more zones
    ],
    words: [
      { id: "letto", word: "il letto", en: "bed", g: "m", emoji: "🛏️", x: 40, y: 60, mnemonic: "Sleep in the LETTO" },
      // ... more words
    ]
  },
  // ... more levels
];
```

### 2. Add to `allPalaces`

```typescript
export const allPalaces = {
  kitchen: kitchenLevels,
  bedroom: bedroomLevels,  // Add here
};
```

### 3. Add to Sidebar in `MemoryPalace.tsx`

```typescript
const PALACES = [
  { id: "kitchen", name: "Kitchen", nameIt: "Cucina", icon: ChefHat, levelCount: 7, color: "amber" },
  { id: "bedroom", name: "Bedroom", nameIt: "Camera", icon: Bed, levelCount: 4, color: "indigo" },
  // Add here
];
```

---

## 🎨 Generating Room Images

Use the image generation script:

```bash
# Install dependencies
pnpm add -D tsx

# Generate room scenes
npx tsx scripts/generate-images.ts --rooms

# Generate specific category
npx tsx scripts/generate-images.ts --items --category=kitchen
```

Set your OpenAI API key:
```bash
$env:OPENAI_API_KEY="sk-..."
$env:AI_PROVIDER="openai"
```

---

## 🌍 Multi-Language Support

The palace layout is **language-agnostic**. To add French:

1. Keep same `zones` and `images`
2. Swap `words` with French vocabulary
3. Update `name` and `mnemonic` fields

```typescript
// Italian
{ id: "latte", word: "il latte", en: "milk", g: "m", ... }

// French (same position, same image)
{ id: "lait", word: "le lait", en: "milk", g: "m", ... }
```

---

## 📚 Dependencies Used

| Package | Purpose |
|---------|---------|
| `react-prismazoom` | Zoom/pan image viewer |
| `framer-motion` | Smooth transitions |
| `react-tooltip` | Hover tooltips |

---

## 🔗 Navigation Integration

Add to Home page for access:

```tsx
<Button onClick={() => setLocation("/memory-palace")}>
  <Sparkles className="w-4 h-4 mr-2" />
  Memory Palace
</Button>
```

---

## 📊 Stats

- **7** explorable kitchen levels
- **41** vocabulary words in kitchen
- **Infinite** expandable to other rooms
- **Language-agnostic** architecture

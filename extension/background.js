// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// AnkiConnect API helper
const ANKI_URL = "http://127.0.0.1:8765";

async function ankiInvoke(action, params = {}) {
  const res = await fetch(ANKI_URL, {
    method: "POST",
    body: JSON.stringify({ action, version: 6, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

async function ensureAnkiDeck(deckName) {
  const decks = await ankiInvoke("deckNames");
  if (!decks.includes(deckName)) {
    await ankiInvoke("createDeck", { deck: deckName });
  }
}

async function ensureAnkiModel() {
  const models = await ankiInvoke("modelNames");
  if (!models.includes("CameraCafe-Italian")) {
    await ankiInvoke("createModel", {
      modelName: "CameraCafe-Italian",
      inOrderFields: ["Italian", "English", "CEFR", "Rank", "POS", "Audio"],
      css: `.card { font-family: -apple-system, sans-serif; font-size: 20px; text-align: center; padding: 20px; }
.italian { font-size: 28px; font-weight: bold; color: #1e293b; margin-bottom: 12px; }
.english { font-size: 18px; color: #64748b; }
.cefr { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #065f46; color: #6ee7b7; }
.rank { font-size: 12px; color: #94a3b8; }`,
      cardTemplates: [
        {
          Name: "Italian → English",
          Front: `<div class="italian">{{Italian}}</div><div class="cefr">{{CEFR}}</div> <span class="rank">#{{Rank}}</span>{{Audio}}`,
          Back: `<div class="italian">{{Italian}}</div><hr><div class="english">{{English}}</div><div class="cefr">{{CEFR}}</div> <span class="rank">#{{Rank}}</span>`,
        },
      ],
    });
  }
}

async function addToAnki(word, cefrLevel, frequencyRank, pos) {
  const deckName = `CameraCafe::${cefrLevel || "A1"}`;
  await ensureAnkiDeck(deckName);
  await ensureAnkiModel();

  // Generate Italian TTS audio via Anki's built-in TTS
  const audioField = `[anki:tts lang=it_IT]${word}[/anki:tts]`;

  await ankiInvoke("addNote", {
    note: {
      deckName,
      modelName: "CameraCafe-Italian",
      fields: {
        Italian: word,
        English: "",
        CEFR: cefrLevel || "",
        Rank: String(frequencyRank || ""),
        POS: pos || "",
        Audio: audioField,
      },
      options: { allowDuplicate: false },
      tags: ["camera-cafe", `cefr-${(cefrLevel || "a1").toLowerCase()}`],
    },
  });
}

// Listen for messages from content script and side panel
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SAVE_WORD") {
    chrome.storage.local.get("vocabulary", (data) => {
      const vocab = data.vocabulary || {};
      vocab[msg.word] = {
        translation: msg.translation,
        cefrLevel: msg.cefrLevel,
        frequencyRank: msg.frequencyRank,
        pos: msg.pos || "",
        savedAt: Date.now(),
        status: "learning",
        reviewCount: 0,
        nextReview: Date.now() + 86400000, // tomorrow
      };
      chrome.storage.local.set({ vocabulary: vocab }, () => {
        sendResponse({ success: true });
      });
    });
    return true; // async response
  }

  if (msg.type === "REMOVE_WORD") {
    chrome.storage.local.get("vocabulary", (data) => {
      const vocab = data.vocabulary || {};
      delete vocab[msg.word];
      chrome.storage.local.set({ vocabulary: vocab }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (msg.type === "GET_VOCABULARY") {
    chrome.storage.local.get("vocabulary", (data) => {
      sendResponse(data.vocabulary || {});
    });
    return true;
  }

  if (msg.type === "UPDATE_STATUS") {
    chrome.storage.local.get("vocabulary", (data) => {
      const vocab = data.vocabulary || {};
      if (vocab[msg.word]) {
        vocab[msg.word].status = msg.status;
        vocab[msg.word].reviewCount = (vocab[msg.word].reviewCount || 0) + 1;
        // Spaced repetition intervals
        const intervals = [1, 3, 7, 14, 30, 60];
        const idx = Math.min(vocab[msg.word].reviewCount, intervals.length - 1);
        vocab[msg.word].nextReview = Date.now() + intervals[idx] * 86400000;
        chrome.storage.local.set({ vocabulary: vocab }, () => {
          sendResponse({ success: true });
        });
      }
    });
    return true;
  }

  if (msg.type === "ADD_TO_ANKI") {
    addToAnki(msg.word, msg.cefrLevel, msg.frequencyRank, msg.pos)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (msg.type === "ANKI_EXPORT_ALL") {
    // Export all saved vocabulary to Anki
    chrome.storage.local.get("vocabulary", async (data) => {
      const vocab = data.vocabulary || {};
      const entries = Object.entries(vocab);
      let exported = 0;
      let errors = 0;
      for (const [word, info] of entries) {
        try {
          await addToAnki(word, info.cefrLevel, info.frequencyRank, info.pos);
          exported++;
        } catch (e) {
          if (!e.message.includes("duplicate")) errors++;
        }
      }
      sendResponse({ success: true, exported, errors, total: entries.length });
    });
    return true;
  }

  if (msg.type === "ANKI_STATUS") {
    ankiInvoke("version")
      .then((v) => sendResponse({ connected: true, version: v }))
      .catch(() => sendResponse({ connected: false }));
    return true;
  }

  if (msg.type === "CAPTION_UPDATE") {
    // Forward caption updates to side panel
    chrome.runtime.sendMessage(msg);
  }
});

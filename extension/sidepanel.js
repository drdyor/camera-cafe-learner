let kellyData = {};
let vocabulary = {};
let currentFilter = "all";
let currentStatus = "all";
let reviewQueue = [];
let reviewIndex = 0;
let showingAnswer = false;
let recentCaptionWords = [];

// Load Kelly data
fetch(chrome.runtime.getURL("kelly.json"))
  .then(r => r.json())
  .then(data => { kellyData = data; });

// Tab switching
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
    if (tab.dataset.tab === "vocab") renderVocab();
    if (tab.dataset.tab === "review") startReview();
  });
});

// Filter buttons
document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderVocab();
  });
});

document.querySelectorAll("[data-status]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-status]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentStatus = btn.dataset.status;
    renderVocab();
  });
});

// Listen for caption updates from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "CAPTION_UPDATE") {
    document.getElementById("live-caption").textContent = msg.text;
    extractWordsFromCaption(msg.text);
  }
});

function extractWordsFromCaption(text) {
  const words = text.toLowerCase()
    .replace(/[.,!?;:'"()[\]{}«»""''…—–\-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1);

  const newWords = [];
  for (const word of words) {
    const kelly = kellyData[word];
    if (!kelly) continue;
    if (kelly.r < 50) continue; // skip ultra-common
    if (recentCaptionWords.find(w => w.word === word)) continue;

    newWords.push({
      word,
      level: kelly.c,
      rank: kelly.r,
      pos: kelly.p,
    });
  }

  if (newWords.length > 0) {
    recentCaptionWords = [...newWords, ...recentCaptionWords].slice(0, 50);
    renderLiveWords();
  }
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "it-IT";
  utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
}

function renderLiveWords() {
  const container = document.getElementById("live-words");
  container.innerHTML = recentCaptionWords.map(w => `
    <div class="word-item" data-word="${w.word}">
      <button class="speak-btn" data-speak="${w.word}">🔊</button>
      <div class="word-main">
        <div class="word-it">${w.word}</div>
        <div class="word-en">${w.pos || ""}</div>
      </div>
      <span class="word-level level-${w.level}">${w.level}</span>
      <button class="speak-btn" data-save="${w.word}" data-level="${w.level}" data-rank="${w.rank}">💾</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-speak]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      speak(btn.dataset.speak);
    });
  });

  container.querySelectorAll("[data-save]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({
        type: "SAVE_WORD",
        word: btn.dataset.save,
        translation: "",
        cefrLevel: btn.dataset.level,
        frequencyRank: parseInt(btn.dataset.rank),
      }, () => {
        btn.textContent = "✅";
        loadVocabulary();
      });
    });
  });
}

// Vocabulary management
function loadVocabulary() {
  chrome.runtime.sendMessage({ type: "GET_VOCABULARY" }, (data) => {
    vocabulary = data || {};
    document.getElementById("word-count").textContent = `${Object.keys(vocabulary).length} words`;
  });
}

function renderVocab() {
  loadVocabulary();
  setTimeout(() => {
    const container = document.getElementById("vocab-list");
    let entries = Object.entries(vocabulary);

    // Filter by level
    if (currentFilter !== "all") {
      entries = entries.filter(([, v]) => v.cefrLevel === currentFilter);
    }
    // Filter by status
    if (currentStatus !== "all") {
      entries = entries.filter(([, v]) => v.status === currentStatus);
    }

    // Sort: A1 first, then A2, then by rank
    const levelOrder = { A1: 0, A2: 1, B1: 2, B2: 3 };
    entries.sort((a, b) => {
      const ld = (levelOrder[a[1].cefrLevel] || 0) - (levelOrder[b[1].cefrLevel] || 0);
      if (ld !== 0) return ld;
      return (a[1].frequencyRank || 9999) - (b[1].frequencyRank || 9999);
    });

    if (entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="emoji">📝</div>
          <p>No words saved yet</p>
          <p style="margin-top:8px;font-size:12px;">Click 💾 on words in the Live tab or click words in YouTube captions</p>
        </div>
      `;
      return;
    }

    container.innerHTML = entries.map(([word, data]) => `
      <div class="word-item">
        <button class="speak-btn" data-speak="${word}">🔊</button>
        <div class="word-main">
          <div class="word-it">${word}</div>
          <div class="word-en">${data.status} · reviewed ${data.reviewCount || 0}x</div>
        </div>
        <span class="word-level level-${data.cefrLevel}">${data.cefrLevel}</span>
        <button class="remove-btn" data-remove="${word}">✕</button>
      </div>
    `).join("");

    container.querySelectorAll("[data-speak]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        speak(btn.dataset.speak);
      });
    });

    container.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ type: "REMOVE_WORD", word: btn.dataset.remove }, () => {
          loadVocabulary();
          renderVocab();
        });
      });
    });
  }, 100);
}

// Review / Quiz mode
function startReview() {
  loadVocabulary();
  setTimeout(() => {
    const entries = Object.entries(vocabulary);
    const now = Date.now();

    // Stats
    const learning = entries.filter(([, v]) => v.status === "learning").length;
    const reviewing = entries.filter(([, v]) => v.status === "reviewing").length;
    const mastered = entries.filter(([, v]) => v.status === "mastered").length;
    const dueForReview = entries.filter(([, v]) => (v.nextReview || 0) <= now).length;

    document.getElementById("review-stats").innerHTML = `
      <div class="stat-card"><div class="stat-num">${entries.length}</div><div class="stat-label">Total</div></div>
      <div class="stat-card"><div class="stat-num">${dueForReview}</div><div class="stat-label">Due Today</div></div>
      <div class="stat-card"><div class="stat-num">${learning}</div><div class="stat-label">Learning</div></div>
      <div class="stat-card"><div class="stat-num">${mastered}</div><div class="stat-label">Mastered</div></div>
    `;

    // Build review queue: prioritize due items, A1/A2 first
    const levelOrder = { A1: 0, A2: 1, B1: 2, B2: 3 };
    reviewQueue = entries
      .filter(([, v]) => v.status !== "mastered" || (v.nextReview || 0) <= now)
      .sort((a, b) => {
        // Due items first
        const aDue = (a[1].nextReview || 0) <= now ? 0 : 1;
        const bDue = (b[1].nextReview || 0) <= now ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        // A1/A2 first
        return (levelOrder[a[1].cefrLevel] || 0) - (levelOrder[b[1].cefrLevel] || 0);
      });

    reviewIndex = 0;
    showingAnswer = false;

    if (reviewQueue.length === 0) {
      document.getElementById("review-area").innerHTML = `
        <div class="empty-state">
          <div class="emoji">🎉</div>
          <p>No words to review right now!</p>
          <p style="margin-top:8px;font-size:12px;">Save more words from captions or come back later.</p>
        </div>
      `;
      return;
    }

    showReviewCard();
  }, 100);
}

function showReviewCard() {
  if (reviewIndex >= reviewQueue.length) {
    document.getElementById("review-area").innerHTML = `
      <div class="empty-state">
        <div class="emoji">✅</div>
        <p>Review session complete!</p>
        <p style="margin-top:8px;font-size:12px;">${reviewQueue.length} words reviewed</p>
      </div>
    `;
    return;
  }

  const [word, data] = reviewQueue[reviewIndex];
  const kelly = kellyData[word] || {};
  const conj = conjugate(word);

  const area = document.getElementById("review-area");
  area.innerHTML = `
    <div class="review-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span class="word-level level-${data.cefrLevel}">${data.cefrLevel}</span>
        <span style="color:#64748b;font-size:12px;">${reviewIndex + 1} / ${reviewQueue.length}</span>
      </div>
      <div class="review-word">${word}</div>
      <button class="speak-btn" id="review-speak" style="margin-bottom:12px;">🔊 Listen</button>
      <div class="review-answer" id="review-answer" style="display:none;">
        ${kelly.p ? `<div style="color:#64748b;font-size:12px;margin-bottom:4px;">${kelly.p}</div>` : ""}
        <div>Rank #${kelly.r || "?"} — ${data.cefrLevel}</div>
      </div>
      ${conj ? `
        <div class="review-conjugation" id="review-conj" style="display:none;">
          ${conj.map(t => `
            <div class="conj-col">
              <div class="conj-label">${t.tense}</div>
              ${t.forms.slice(0, 3).map(f => `
                <div class="conj-row">
                  <span class="conj-pronoun">${f.pronoun}</span>
                  <span class="conj-form">${f.form}</span>
                  <button class="conj-speak" data-text="${f.pronoun} ${f.form}">🔊</button>
                </div>
              `).join("")}
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
    <div class="btn-row" id="review-buttons">
      <button class="btn btn-show" id="btn-show">Show Answer</button>
    </div>
  `;

  document.getElementById("review-speak").addEventListener("click", () => speak(word));

  document.getElementById("btn-show").addEventListener("click", () => {
    document.getElementById("review-answer").style.display = "block";
    const conjEl = document.getElementById("review-conj");
    if (conjEl) conjEl.style.display = "grid";

    // Add conjugation speak buttons
    area.querySelectorAll(".conj-speak").forEach(btn => {
      btn.addEventListener("click", () => speak(btn.dataset.text));
    });

    document.getElementById("review-buttons").innerHTML = `
      <button class="btn btn-hard" id="btn-hard">Hard</button>
      <button class="btn btn-good" id="btn-good">Good</button>
      <button class="btn btn-easy" id="btn-easy">Easy</button>
    `;

    document.getElementById("btn-hard").addEventListener("click", () => {
      // Keep as learning, short interval
      chrome.runtime.sendMessage({ type: "UPDATE_STATUS", word, status: "learning" });
      reviewIndex++;
      showReviewCard();
    });
    document.getElementById("btn-good").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "UPDATE_STATUS", word, status: "reviewing" });
      reviewIndex++;
      showReviewCard();
    });
    document.getElementById("btn-easy").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "UPDATE_STATUS", word, status: "mastered" });
      reviewIndex++;
      showReviewCard();
    });
  });
}

// Conjugation logic (same as content.js)
function conjugate(word) {
  const w = word.toLowerCase().trim();
  if (!w.match(/(are|ere|ire)$/)) return null;
  const stem = w.slice(0, -3);
  const ending = w.slice(-3);
  const pronouns = ["io", "tu", "lui/lei", "noi", "voi", "loro"];

  const irregulars = {
    essere: { present: ["sono","sei","è","siamo","siete","sono"], past: "stato/a", future: ["sarò","sarai","sarà","saremo","sarete","saranno"] },
    avere: { present: ["ho","hai","ha","abbiamo","avete","hanno"], past: "avuto", future: ["avrò","avrai","avrà","avremo","avrete","avranno"] },
    fare: { present: ["faccio","fai","fa","facciamo","fate","fanno"], past: "fatto", future: ["farò","farai","farà","faremo","farete","faranno"] },
    dire: { present: ["dico","dici","dice","diciamo","dite","dicono"], past: "detto", future: ["dirò","dirai","dirà","diremo","direte","diranno"] },
    andare: { present: ["vado","vai","va","andiamo","andate","vanno"], past: "andato/a", future: ["andrò","andrai","andrà","andremo","andrete","andranno"] },
    venire: { present: ["vengo","vieni","viene","veniamo","venite","vengono"], past: "venuto/a", future: ["verrò","verrai","verrà","verremo","verrete","verranno"] },
    potere: { present: ["posso","puoi","può","possiamo","potete","possono"], past: "potuto", future: ["potrò","potrai","potrà","potremo","potrete","potranno"] },
    volere: { present: ["voglio","vuoi","vuole","vogliamo","volete","vogliono"], past: "voluto", future: ["vorrò","vorrai","vorrà","vorremo","vorrete","vorranno"] },
    dovere: { present: ["devo","devi","deve","dobbiamo","dovete","devono"], past: "dovuto", future: ["dovrò","dovrai","dovrà","dovremo","dovrete","dovranno"] },
    sapere: { present: ["so","sai","sa","sappiamo","sapete","sanno"], past: "saputo", future: ["saprò","saprai","saprà","sapremo","saprete","sapranno"] },
    stare: { present: ["sto","stai","sta","stiamo","state","stanno"], past: "stato/a", future: ["starò","starai","starà","staremo","starete","staranno"] },
    dare: { present: ["do","dai","dà","diamo","date","danno"], past: "dato", future: ["darò","darai","darà","daremo","darete","daranno"] },
    vedere: { present: ["vedo","vedi","vede","vediamo","vedete","vedono"], past: "visto", future: ["vedrò","vedrai","vedrà","vedremo","vedrete","vedranno"] },
  };

  if (irregulars[w]) {
    const irr = irregulars[w];
    return [
      { tense: "Presente", forms: irr.present.map((f, i) => ({ pronoun: pronouns[i], form: f })) },
      { tense: "Passato", forms: [{ pronoun: "", form: `ho ${irr.past}` }] },
      { tense: "Futuro", forms: irr.future.map((f, i) => ({ pronoun: pronouns[i], form: f })) },
    ];
  }

  let present, pastPart, future;
  if (ending === "are") {
    present = [`${stem}o`,`${stem}i`,`${stem}a`,`${stem}iamo`,`${stem}ate`,`${stem}ano`];
    pastPart = `${stem}ato`;
    future = [`${stem}erò`,`${stem}erai`,`${stem}erà`,`${stem}eremo`,`${stem}erete`,`${stem}eranno`];
  } else if (ending === "ere") {
    present = [`${stem}o`,`${stem}i`,`${stem}e`,`${stem}iamo`,`${stem}ete`,`${stem}ono`];
    pastPart = `${stem}uto`;
    future = [`${stem}erò`,`${stem}erai`,`${stem}erà`,`${stem}eremo`,`${stem}erete`,`${stem}eranno`];
  } else {
    present = [`${stem}o`,`${stem}i`,`${stem}e`,`${stem}iamo`,`${stem}ite`,`${stem}ono`];
    pastPart = `${stem}ito`;
    future = [`${stem}irò`,`${stem}irai`,`${stem}irà`,`${stem}iremo`,`${stem}irete`,`${stem}iranno`];
  }

  return [
    { tense: "Presente", forms: present.map((f, i) => ({ pronoun: pronouns[i], form: f })) },
    { tense: "Passato", forms: [{ pronoun: "", form: `ho ${pastPart}` }] },
    { tense: "Futuro", forms: future.map((f, i) => ({ pronoun: pronouns[i], form: f })) },
  ];
}

// Anki tab
function checkAnkiConnection() {
  chrome.runtime.sendMessage({ type: "ANKI_STATUS" }, (res) => {
    const el = document.getElementById("anki-connection");
    if (res && res.connected) {
      el.textContent = "OK";
      el.style.color = "#6ee7b7";
    } else {
      el.textContent = "OFF";
      el.style.color = "#fca5a5";
    }
  });
  // Update word count
  chrome.runtime.sendMessage({ type: "GET_VOCABULARY" }, (data) => {
    document.getElementById("anki-word-count").textContent = Object.keys(data || {}).length;
  });
}

document.getElementById("anki-check").addEventListener("click", () => {
  checkAnkiConnection();
});

document.getElementById("anki-export-all").addEventListener("click", () => {
  const resultEl = document.getElementById("anki-result");
  resultEl.innerHTML = '<div style="color:#fbbf24;">Exporting... keep Anki open.</div>';
  chrome.runtime.sendMessage({ type: "ANKI_EXPORT_ALL" }, (res) => {
    if (res && res.success) {
      resultEl.innerHTML = `
        <div style="color:#6ee7b7;font-weight:600;margin-bottom:4px;">Export complete!</div>
        <div style="color:#94a3b8;font-size:12px;">
          ${res.exported} words added to Anki<br>
          ${res.total - res.exported} already existed (skipped)<br>
          ${res.errors > 0 ? `${res.errors} errors` : ""}
        </div>
      `;
    } else {
      resultEl.innerHTML = `
        <div style="color:#fca5a5;">Export failed. Is Anki open with AnkiConnect installed?</div>
      `;
    }
  });
});

// Init
loadVocabulary();

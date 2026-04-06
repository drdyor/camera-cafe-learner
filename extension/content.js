// Content script: runs on YouTube pages
// Watches for caption changes and makes Italian words clickable

let lastCaptionText = "";
let kellyData = null;

// Load Kelly word list
fetch(chrome.runtime.getURL("kelly.json"))
  .then((r) => r.json())
  .then((data) => {
    kellyData = data;
    console.log("[CafeLearner] Kelly list loaded:", Object.keys(data).length, "words");
    startObserving();
  });

function startObserving() {
  // Watch for YouTube caption container changes
  const observer = new MutationObserver(() => {
    processCaption();
  });

  // YouTube's caption container
  const checkForCaptions = setInterval(() => {
    const captionWindow =
      document.querySelector(".ytp-caption-window-container") ||
      document.querySelector(".caption-window");
    if (captionWindow) {
      observer.observe(captionWindow, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      clearInterval(checkForCaptions);
      console.log("[CafeLearner] Caption observer started");
    }
  }, 1000);

  // Also poll as fallback
  setInterval(processCaption, 500);
}

function processCaption() {
  // Find YouTube caption segments
  const segments = document.querySelectorAll(
    ".ytp-caption-segment, .caption-visual-line span"
  );
  if (segments.length === 0) return;

  let fullText = "";
  segments.forEach((seg) => (fullText += seg.textContent + " "));
  fullText = fullText.trim();

  if (fullText === lastCaptionText || !fullText) return;
  lastCaptionText = fullText;

  // Send to side panel
  chrome.runtime.sendMessage({
    type: "CAPTION_UPDATE",
    text: fullText,
    timestamp: Date.now(),
  });

  // Make words clickable in the caption
  segments.forEach((seg) => {
    if (seg.dataset.cafeLearner) return;
    seg.dataset.cafeLearner = "true";

    const text = seg.textContent;
    const words = text.split(/(\s+)/);
    seg.textContent = "";

    words.forEach((word) => {
      if (/^\s+$/.test(word)) {
        seg.appendChild(document.createTextNode(word));
        return;
      }

      const clean = word.toLowerCase().replace(/[.,!?;:'"()[\]{}«»""''…—–-]/g, "");
      const kelly = kellyData?.[clean];

      const span = document.createElement("span");
      span.textContent = word;
      span.style.cursor = kelly ? "pointer" : "default";

      if (kelly) {
        span.style.borderBottom = "1px dotted rgba(255,255,255,0.5)";
        span.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          showWordPopup(clean, kelly, e.clientX, e.clientY);
        });
      }

      seg.appendChild(span);
    });
  });
}

function showWordPopup(word, kelly, x, y) {
  // Remove existing popup
  const existing = document.getElementById("cafe-learner-popup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.id = "cafe-learner-popup";
  popup.innerHTML = `
    <div class="clf-popup">
      <div class="clf-header">
        <span class="clf-word">${word}</span>
        <button class="clf-speak" data-word="${word}">🔊</button>
        <button class="clf-close">✕</button>
      </div>
      <div class="clf-level clf-level-${kelly.c}">${kelly.c}</div>
      <div class="clf-rank">Rank #${kelly.r} / 6,865</div>
      ${kelly.p ? `<div class="clf-pos">${kelly.p}</div>` : ""}
      ${getConjugationHTML(word)}
      <div class="clf-actions">
        <button class="clf-save" data-word="${word}" data-level="${kelly.c}" data-rank="${kelly.r}">💾 Save</button>
        <button class="clf-anki" data-word="${word}" data-level="${kelly.c}" data-rank="${kelly.r}" data-pos="${kelly.p || ""}">📇 Add to Anki</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // Position popup
  const rect = popup.getBoundingClientRect();
  popup.style.position = "fixed";
  popup.style.left = Math.min(x, window.innerWidth - 320) + "px";
  popup.style.top = Math.max(10, y - rect.height - 10) + "px";
  popup.style.zIndex = "999999";

  // Event handlers
  popup.querySelector(".clf-close").addEventListener("click", () => popup.remove());
  popup.querySelector(".clf-speak").addEventListener("click", () => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "it-IT";
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  });
  popup.querySelector(".clf-save").addEventListener("click", (e) => {
    const btn = e.target;
    chrome.runtime.sendMessage({
      type: "SAVE_WORD",
      word: btn.dataset.word,
      translation: "",
      cefrLevel: btn.dataset.level,
      frequencyRank: parseInt(btn.dataset.rank),
    }, () => {
      btn.textContent = "✅ Saved!";
      btn.disabled = true;
    });
  });
  popup.querySelector(".clf-anki").addEventListener("click", (e) => {
    const btn = e.target;
    btn.textContent = "⏳...";
    chrome.runtime.sendMessage({
      type: "ADD_TO_ANKI",
      word: btn.dataset.word,
      cefrLevel: btn.dataset.level,
      frequencyRank: parseInt(btn.dataset.rank),
      pos: btn.dataset.pos,
    }, (res) => {
      if (res && res.success) {
        btn.textContent = "✅ In Anki!";
        btn.disabled = true;
      } else {
        btn.textContent = "❌ " + (res?.error || "Anki not open");
        setTimeout(() => { btn.textContent = "📇 Add to Anki"; }, 2000);
      }
    });
  });

  // Add speak handlers for conjugation forms
  popup.querySelectorAll(".clf-conj-speak").forEach((btn) => {
    btn.addEventListener("click", () => {
      const utterance = new SpeechSynthesisUtterance(btn.dataset.text);
      utterance.lang = "it-IT";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    });
  });

  // Close on click outside
  setTimeout(() => {
    document.addEventListener("click", function handler(e) {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener("click", handler);
      }
    });
  }, 100);
}

function getConjugationHTML(word) {
  const conj = conjugate(word);
  if (!conj) return "";

  return `
    <div class="clf-conjugation">
      <div class="clf-conj-title">Conjugation</div>
      <div class="clf-conj-grid">
        ${conj
          .map(
            (t) => `
          <div class="clf-conj-tense">
            <div class="clf-conj-label">${t.tense}</div>
            ${t.forms
              .slice(0, 3)
              .map(
                (f) => `
              <div class="clf-conj-form">
                <span class="clf-pronoun">${f.pronoun}</span>
                <span class="clf-form">${f.form}</span>
                <button class="clf-conj-speak" data-text="${f.pronoun} ${f.form}">🔊</button>
              </div>
            `
              )
              .join("")}
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

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
    prendere: { present: ["prendo","prendi","prende","prendiamo","prendete","prendono"], past: "preso", future: ["prenderò","prenderai","prenderà","prenderemo","prenderete","prenderanno"] },
    mettere: { present: ["metto","metti","mette","mettiamo","mettete","mettono"], past: "messo", future: ["metterò","metterai","metterà","metteremo","metterete","metteranno"] },
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

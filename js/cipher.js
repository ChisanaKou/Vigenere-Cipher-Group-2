"use strict";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHABET_SIZE = ALPHABET.length;
const ASCII_A = 65;

// =========================================================
// BASIC HELPERS
// =========================================================

function normalizeKey(rawKey) {
  return rawKey.trim().toUpperCase();
}

function isValidKey(key) {
  return /^[A-Z]+$/.test(key);
}

function isAlphabeticCharacter(character) {
  return /^[A-Za-z]$/.test(character);
}

function letterToNumber(letter) {
  return letter.toUpperCase().charCodeAt(0) - ASCII_A;
}

function numberToLetter(value) {
  return String.fromCharCode(value + ASCII_A);
}

function setFeedback(elementId, message) {
  const element = document.getElementById(elementId);

  if (element) {
    element.textContent = message;
  }
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

// =========================================================
// CORE VIGENERE ALGORITHM
// =========================================================

/**
 * Standard Vigenère Cipher over the English alphabet.
 *
 * Mapping:
 *   A = 0, B = 1, ... Z = 25
 *
 * Encryption:
 *   C = (P + K) mod 26
 *
 * Decryption:
 *   P = (C - K + 26) mod 26
 *
 * Non-letter characters are preserved and DO NOT advance
 * the key. Alphabetic output is normalized to uppercase so
 * the learning visualization stays consistent.
 */
function transformText(text, key, mode) {
  if (mode !== "encrypt" && mode !== "decrypt") {
    throw new Error("Mode must be either 'encrypt' or 'decrypt'.");
  }

  let result = "";
  let keyIndex = 0;
  const steps = [];

  for (let textIndex = 0; textIndex < text.length; textIndex += 1) {
    const character = text[textIndex];

    if (!isAlphabeticCharacter(character)) {
      result += character;
      continue;
    }

    const inputCharacter = character.toUpperCase();
    const inputValue = letterToNumber(inputCharacter);

    const keyCharacter = key[keyIndex % key.length];
    const keyValue = letterToNumber(keyCharacter);

    let outputValue;
    let calculation;

    if (mode === "encrypt") {
      outputValue = (inputValue + keyValue) % ALPHABET_SIZE;
      calculation = `(${inputValue} + ${keyValue}) mod 26 = ${outputValue}`;
    } else {
      outputValue = (inputValue - keyValue + ALPHABET_SIZE) % ALPHABET_SIZE;
      calculation = `(${inputValue} - ${keyValue} + 26) mod 26 = ${outputValue}`;
    }

    const outputCharacter = numberToLetter(outputValue);
    result += outputCharacter;

    steps.push({
      step: keyIndex + 1,
      textIndex,
      keyPosition: keyIndex % key.length,
      inputCharacter,
      inputValue,
      keyCharacter,
      keyValue,
      outputCharacter,
      outputValue,
      calculation,
    });

    keyIndex += 1;
  }

  return { result, steps };
}

// =========================================================
// EXPLANATION PANEL
// =========================================================

function clearExplanation() {
  const explanation = document.getElementById("explanation");

  if (explanation) {
    explanation.replaceChildren(
      createElement(
        "p",
        "explanation-placeholder",
        "Click ENCRYPT, DECRYPT, or LOAD EXAMPLE to see what happens.",
      ),
    );
  }
}

function renderExplanation(mode, sourceText, key, result) {
  const explanation = document.getElementById("explanation");

  if (!explanation) {
    return;
  }

  explanation.replaceChildren();

  const formula =
    mode === "encrypt"
      ? "Encrypt: move each message letter forward by its key’s number."
      : "Decrypt: move each secret letter backward by its key’s number.";

  explanation.appendChild(createElement("p", "formula", formula));

  const rows =
    mode === "encrypt"
      ? [
          ["Your message", sourceText],
          ["Key", key],
          ["Secret result", result],
        ]
      : [
          ["Secret message", sourceText],
          ["Key", key],
          ["Readable result", result],
        ];

  rows.forEach(([label, value]) => {
    const row = createElement("p", "explanation-row");
    const strong = createElement("strong", "", `${label}: `);
    const span = createElement("span", "", value);

    row.append(strong, span);
    explanation.appendChild(row);
  });

  const note = createElement(
    "p",
    "explanation-note",
    "Only A–Z letters change. Spaces, numbers, and symbols stay the same. They do not use a key letter.",
  );

  explanation.appendChild(note);
}

// =========================================================
// VISUALIZATION HELPERS
// =========================================================

let visualizationTimer = null;
let activePlayButton = null;
function pauseVisualization() {
  window.clearInterval(visualizationTimer);
  visualizationTimer = null;
  if (activePlayButton) activePlayButton.textContent = "▶ Play the moves";
}
function clearVisualization() {
  pauseVisualization();
  const visualization = document.getElementById("visualization");
  if (visualization)
    visualization.replaceChildren(
      createElement(
        "p",
        "visualization-empty",
        "Click LOAD EXAMPLE above to start exploring the letters.",
      ),
    );
}
function makeLearningButton(text, action, className = "step-nav-button") {
  const button = createElement("button", className, text);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}
function buildCharacterTrack(label, steps, field, extraClass, onSelect) {
  const row = createElement("div", `character-track ${extraClass}`);
  const cells = createElement("div", "character-track-cells");
  steps.forEach((step) => {
    const cell = onSelect
      ? makeLearningButton(
          step[field],
          () => onSelect(step.step - 1),
          "character-cell",
        )
      : createElement("span", "character-cell", step[field]);
    cell.dataset.step = step.step - 1;
    if (onSelect)
      cell.setAttribute(
        "aria-label",
        `Show letter ${step.step}: ${step.inputCharacter}`,
      );
    cells.append(cell);
  });
  row.append(createElement("span", "character-track-label", label), cells);
  return row;
}
function buildOverview(mode, steps, onSelect) {
  const overview = createElement("div", "visualization-overview");
  overview.showLetter = (index) => {
    const start = Math.max(0, index - 12),
      visible = steps.slice(start, start + 40);
    overview.replaceChildren(
      buildCharacterTrack(
        "MESSAGE",
        visible,
        "inputCharacter",
        "track-input",
        onSelect,
      ),
      buildCharacterTrack("KEY", visible, "keyCharacter", "track-key"),
      buildCharacterTrack("RESULT", visible, "outputCharacter", "track-output"),
    );
    overview.querySelectorAll(".character-cell").forEach((cell) => {
      const selected = Number(cell.dataset.step) === index;
      cell.classList.toggle("selected-letter", selected);
      if (cell.tagName === "BUTTON")
        cell.setAttribute("aria-pressed", String(selected));
    });
    if (steps.length > 40)
      overview.append(
        createElement(
          "p",
          "step-detail",
          `Showing letters ${start + 1}–${start + visible.length}. Previous / Next lets you explore the rest.`,
        ),
      );
  };
  overview.showLetter(0);
  return overview;
}
function buildAlphabetRow(label, letters, highlightedIndex, highlightClass) {
  const row = createElement("div", "alphabet-row");
  const cells = createElement("div", "alphabet-row-letters");
  letters.forEach((letter, index) =>
    cells.append(
      createElement(
        "span",
        index === highlightedIndex
          ? `alphabet-letter ${highlightClass}`
          : "alphabet-letter",
        letter,
      ),
    ),
  );
  row.append(createElement("span", "alphabet-row-label", label), cells);
  return row;
}
function buildShiftedAlphabet(keyValue) {
  return Array.from(
    { length: 26 },
    (_, index) => ALPHABET[(index + keyValue) % 26],
  );
}
function buildStepExplorer(mode, steps) {
  const explorer = createElement("div", "step-explorer");
  let currentIndex = 0,
    moves = 0;
  const header = createElement("div", "step-explorer-header");
  const heading = createElement("h4", "step-heading");
  heading.id = "currentLetterHeading";
  const nav = createElement("div", "step-navigation");
  const previous = makeLearningButton("← Previous letter", () =>
    selectLetter(currentIndex - 1),
  );
  previous.id = "previousLetter";
  const next = makeLearningButton("Next letter →", () =>
    selectLetter(currentIndex + 1),
  );
  next.id = "nextLetter";
  nav.append(previous, next);
  header.append(heading, nav);
  const story = createElement("p", "move-story");
  const cards = createElement("div", "step-math letter-cards");
  const tip = createElement(
    "p",
    "step-detail",
    "The key repeats: LEMON becomes LEMONLEMON… Each message letter takes the next key letter. A = 0 moves, B = 1, … Z = 25.",
  );
  const rail = createElement("div", "move-alphabet");
  rail.id = "moveAlphabet";
  ALPHABET.split("").forEach((letter) =>
    rail.append(createElement("span", "move-letter", letter)),
  );
  const progress = createElement("p", "move-progress");
  progress.id = "moveProgress";
  progress.setAttribute("aria-live", "polite");
  const label = createElement(
    "label",
    "move-label",
    "Drag the slider to move the letter",
  );
  label.htmlFor = "moveSlider";
  const slider = createElement("input", "move-slider");
  slider.type = "range";
  slider.id = "moveSlider";
  slider.min = 0;
  slider.step = 1;
  slider.addEventListener("input", () => {
    pauseVisualization();
    moves = Number(slider.value);
    updateMoves();
  });
  const controls = createElement("div", "move-controls");
  const restart = makeLearningButton("↺ Start this letter again", () => {
    pauseVisualization();
    moves = 0;
    updateMoves();
  });
  const one = makeLearningButton("Move one place", () => {
    pauseVisualization();
    if (moves < steps[currentIndex].keyValue) moves++;
    updateMoves();
  });
  one.id = "oneMove";
  const play = makeLearningButton("▶ Play the moves", () => {
    if (visualizationTimer) {
      pauseVisualization();
      return;
    }
    const limit = steps[currentIndex].keyValue;
    if (limit === 0) return;
    if (moves === limit) moves = 0;
    activePlayButton = play;
    play.textContent = "Ⅱ Pause";
    updateMoves();
    visualizationTimer = window.setInterval(() => {
      moves++;
      updateMoves();
      if (moves === limit) pauseVisualization();
    }, 450);
  });
  play.id = "playMoves";
  controls.append(restart, one, play);
  const result = createElement("p", "move-result");
  result.id = "moveResult";
  const details = createElement("details", "learning-details");
  const summary = createElement(
    "summary",
    "",
    "See the numbers and alphabet matching",
  );
  const math = createElement("p", "step-detail");
  const alphabet = createElement("div", "alphabet-visual");
  const mapping = createElement("p", "step-detail");
  details.append(summary, math, alphabet, mapping);
  explorer.append(
    header,
    story,
    cards,
    tip,
    rail,
    progress,
    label,
    slider,
    controls,
    result,
    details,
  );

  function updateMoves() {
    const s = steps[currentIndex],
      direction = mode === "encrypt" ? 1 : -1;
    const current = (s.inputValue + direction * moves + 26) % 26;
    const finished = moves === s.keyValue;
    slider.value = moves;
    slider.setAttribute(
      "aria-valuetext",
      `${moves} of ${s.keyValue} moves, at ${ALPHABET[current]}`,
    );
    one.disabled = finished;
    Array.from(rail.children).forEach((cell, value) => {
      cell.classList.toggle(
        "move-start",
        value === s.inputValue && value !== current,
      );
      cell.classList.toggle("move-current", value === current);
      let visited = false;
      for (let m = 1; m < moves; m++)
        if ((s.inputValue + direction * m + 26) % 26 === value) visited = true;
      cell.classList.toggle("move-visited", visited && value !== current);
    });
    const crossed =
      direction > 0 ? s.inputValue + moves >= 26 : s.inputValue - moves < 0;
    progress.textContent =
      `${s.inputCharacter} → ${ALPHABET[current]} · ${moves} of ${s.keyValue} moves` +
      (crossed
        ? direction > 0
          ? " · After Z, go back to A."
          : " · Before A, go back to Z."
        : "");
    result.textContent = finished
      ? `Done! ${s.inputCharacter} becomes ${s.outputCharacter}. Try the next letter.`
      : `${s.keyValue - moves} more ${s.keyValue - moves === 1 ? "move" : "moves"} to go. The starting letter counts as 0.`;
  }
  function selectLetter(index) {
    if (index < 0 || index >= steps.length) return;
    pauseVisualization();
    currentIndex = index;
    moves = 0;
    const s = steps[index],
      direction = mode === "encrypt" ? "forward" : "backward";
    heading.textContent = `LETTER ${s.step} OF ${steps.length}`;
    previous.disabled = index === 0;
    next.disabled = index === steps.length - 1;
    story.textContent = `Start at ${s.inputCharacter}. The key letter ${s.keyCharacter} tells us to move ${s.keyValue} ${s.keyValue === 1 ? "place" : "places"} ${direction}.`;
    cards.replaceChildren();
    [
      ["MESSAGE LETTER", s.inputCharacter],
      ["KEY LETTER", `${s.keyCharacter} · ${s.keyValue} moves`],
      ["RESULT", s.outputCharacter],
    ].forEach(([title, value]) => {
      const card = createElement("div", "math-card");
      card.append(
        createElement("span", "math-card-label", title),
        createElement("strong", "math-card-value", value),
      );
      cards.append(card);
    });
    tip.textContent = `The key repeats when it runs out. This is key letter ${s.keyPosition + 1}. A = 0 moves, B = 1, … Z = 25.`;
    slider.max = s.keyValue;
    slider.disabled = s.keyValue === 0;
    play.disabled = s.keyValue === 0;
    math.textContent = `${s.inputCharacter} = ${s.inputValue}; key ${s.keyCharacter} = ${s.keyValue}. ${s.calculation} → ${s.outputCharacter}. “mod 26” means loop around the 26 letters.`;
    const column = mode === "encrypt" ? s.inputValue : s.outputValue;
    alphabet.replaceChildren(
      buildAlphabetRow(
        "NORMAL",
        ALPHABET.split(""),
        column,
        mode === "encrypt" ? "highlight-input" : "highlight-output",
      ),
      buildAlphabetRow(
        `KEY ${s.keyCharacter}`,
        buildShiftedAlphabet(s.keyValue),
        column,
        mode === "encrypt" ? "highlight-output" : "highlight-input",
      ),
    );
    mapping.textContent =
      mode === "encrypt"
        ? `Find ${s.inputCharacter} in the normal row. Directly below it is ${s.outputCharacter}, the result.`
        : `Find ${s.inputCharacter} in the key row. Directly above it is ${s.outputCharacter}, the result.`;
    updateMoves();
    explorer.dispatchEvent(new CustomEvent("letterchange", { detail: index }));
  }
  explorer.selectLetter = selectLetter;
  selectLetter(0);
  return explorer;
}

function buildVisualizationTable(mode, steps) {
  const wrapper = createElement("div", "visualization-table-wrapper");
  const table = createElement("table", "visualization-table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const headers =
    mode === "encrypt"
      ? [
          "Letter #",
          "Message",
          "Number",
          "Key",
          "Move by",
          "Calculation",
          "Result",
        ]
      : [
          "Letter #",
          "Secret",
          "Number",
          "Key",
          "Move by",
          "Calculation",
          "Result",
        ];

  headers.forEach((header) => {
    headerRow.appendChild(createElement("th", "", header));
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  steps.forEach((step) => {
    const row = document.createElement("tr");
    const values = [
      step.step,
      step.inputCharacter,
      step.inputValue,
      step.keyCharacter,
      step.keyValue,
      step.calculation,
      `${step.outputCharacter} (${step.outputValue})`,
    ];

    values.forEach((value) => {
      row.appendChild(createElement("td", "", String(value)));
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

function renderVisualization(mode, steps) {
  pauseVisualization();
  const visualization = document.getElementById("visualization");
  if (!visualization) return;
  visualization.replaceChildren();
  if (!steps.length) {
    visualization.append(
      createElement(
        "p",
        "visualization-empty",
        "This message has no A–Z letters. Spaces, numbers, and symbols stay the same, so there are no moves to show.",
      ),
    );
    return;
  }
  const explorer = buildStepExplorer(mode, steps);
  const overview = buildOverview(mode, steps, (index) =>
    explorer.selectLetter(index),
  );
  explorer.addEventListener("letterchange", (event) =>
    overview.showLetter(event.detail),
  );
  const details = createElement("details", "learning-details all-steps");
  details.append(
    createElement("summary", "", "Show all calculations"),
    createElement(
      "p",
      "step-detail",
      "Letters use A = 0, B = 1, … Z = 25. Each row is one message letter.",
    ),
    buildVisualizationTable(mode, steps),
  );
  visualization.append(
    createElement(
      "h3",
      "visualization-title",
      mode === "encrypt"
        ? "MAKE IT SECRET: MOVE FORWARD"
        : "READ IT AGAIN: MOVE BACKWARD",
    ),
    createElement(
      "p",
      "visualization-note",
      "Click a message letter below to select it. Spaces and symbols are left out of this view; they stay unchanged in your result.",
    ),
    overview,
    explorer,
    details,
  );
}

// =========================================================
// ENCRYPT / DECRYPT ACTIONS
// =========================================================

function validateCipherInput(text, key, feedbackId, outputElement) {
  setFeedback(feedbackId, "");

  if (text.trim() === "" || key === "") {
    outputElement.value = "";
    setFeedback(feedbackId, "Add a message and a key word, like LEMON.");
    clearExplanation();
    clearVisualization();
    return false;
  }

  if (!isValidKey(key)) {
    outputElement.value = "";
    setFeedback(
      feedbackId,
      "Use letters only in the key. Try KEY instead of K3Y.",
    );
    clearExplanation();
    clearVisualization();
    return false;
  }

  return true;
}

function encrypt() {
  const plaintextElement = document.getElementById("plaintext");
  const keyElement = document.getElementById("encryptionKey");
  const outputElement = document.getElementById("ciphertextOutput");

  const plaintext = plaintextElement.value;
  const key = normalizeKey(keyElement.value);

  if (
    !validateCipherInput(plaintext, key, "encryptionFeedback", outputElement)
  ) {
    return;
  }

  const { result, steps } = transformText(plaintext, key, "encrypt");
  outputElement.value = result;

  renderExplanation("encrypt", plaintext, key, result);
  renderVisualization("encrypt", steps);
  scrollVisualizationIntoView();
}

function decrypt() {
  const ciphertextElement = document.getElementById("ciphertext");
  const keyElement = document.getElementById("decryptionKey");
  const outputElement = document.getElementById("plaintextOutput");

  const ciphertext = ciphertextElement.value;
  const key = normalizeKey(keyElement.value);

  if (
    !validateCipherInput(ciphertext, key, "decryptionFeedback", outputElement)
  ) {
    return;
  }

  const { result, steps } = transformText(ciphertext, key, "decrypt");
  outputElement.value = result;

  renderExplanation("decrypt", ciphertext, key, result);
  renderVisualization("decrypt", steps);
  scrollVisualizationIntoView();
}

function scrollVisualizationIntoView() {
  const visualizationSection = document.getElementById("visualization-section");

  if (!visualizationSection) {
    return;
  }

  window.setTimeout(() => {
    visualizationSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

// =========================================================
// KEY QUALITY CHECK
// =========================================================

function getShortestRepeatingUnit(key) {
  for (let size = 1; size <= key.length / 2; size += 1) {
    if (key.length % size !== 0) {
      continue;
    }

    const unit = key.slice(0, size);

    if (unit.repeat(key.length / size) === key) {
      return unit;
    }
  }

  return key;
}

function checkKey() {
  const keyElement = document.getElementById("key");
  const feedback = document.getElementById("checkKeyFeedback");
  const key = normalizeKey(keyElement.value);

  if (!feedback) {
    return;
  }

  feedback.replaceChildren();

  if (key === "") {
    feedback.textContent = "Please enter a key.";
    return;
  }

  if (!isValidKey(key)) {
    feedback.textContent = "Invalid key: use letters A-Z only.";
    return;
  }

  const repeatingUnit = getShortestRepeatingUnit(key);
  const uniqueCharacters = new Set(key).size;
  let message;

  if (uniqueCharacters === 1) {
    message =
      "Every key letter is the same. Every message letter moves by the same amount, so the pattern is easy to spot.";
  } else if (repeatingUnit.length < key.length) {
    message = `Your key repeats “${repeatingUnit}”. It works exactly like using ${repeatingUnit} as the key.`;
  } else if (key.length <= 3) {
    message =
      "This key is short. It starts repeating quickly, which makes its pattern easier to spot.";
  } else if (key.length <= 5) {
    message =
      "This key repeats quite often. It works well for trying the cipher and learning the steps.";
  } else {
    message =
      "This key takes longer to repeat. It is fine for learning, but Vigenère can still be broken.";
  }

  const summary = createElement("p", "key-summary", message);
  const details = createElement(
    "p",
    "explanation-row",
    `Key: ${key} | Length: ${key.length} | Different letters: ${uniqueCharacters} | Pattern repeats every ${repeatingUnit.length} letters`,
  );

  feedback.append(summary, details);
}

// =========================================================
// EXAMPLE BUTTONS
// =========================================================

function loadEncryptionExample() {
  document.getElementById("plaintext").value = "ATTACK AT DAWN";
  document.getElementById("encryptionKey").value = "LEMON";
  encrypt();
}

function loadDecryptionExample() {
  document.getElementById("ciphertext").value = "LXFOPV EF RNHR";
  document.getElementById("decryptionKey").value = "LEMON";
  decrypt();
}

// =========================================================
// AUDIO
// =========================================================

function setupAudioPreview() {
  const music = document.getElementById("fadedMusic");

  if (!music) {
    return;
  }

  music.volume = 0.5;

  const playAttempt = music.play();

  if (playAttempt && typeof playAttempt.catch === "function") {
    playAttempt.catch(() => {
      // Browsers commonly block autoplay until user interaction.
    });
  }

  window.setTimeout(() => {
    if (!music.paused) {
      music.pause();
      music.currentTime = 0;
    }
  }, 20000);
}

// =========================================================
// INITIALIZE PAGE
// =========================================================

function initializePage() {
  const encryptButton = document.getElementById("encryptButton");
  const decryptButton = document.getElementById("decryptButton");
  const checkKeyButton = document.getElementById("checkKeyButton");
  const encryptionExampleButton = document.getElementById(
    "encryptionExampleButton",
  );
  const decryptionExampleButton = document.getElementById(
    "decryptionExampleButton",
  );

  if (encryptButton) {
    encryptButton.addEventListener("click", encrypt);
  }

  if (decryptButton) {
    decryptButton.addEventListener("click", decrypt);
  }

  if (checkKeyButton) {
    checkKeyButton.addEventListener("click", checkKey);
  }

  if (encryptionExampleButton) {
    encryptionExampleButton.addEventListener("click", loadEncryptionExample);
  }

  if (decryptionExampleButton) {
    decryptionExampleButton.addEventListener("click", loadDecryptionExample);
  }

  clearExplanation();
  clearVisualization();
  setupAudioPreview();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseVisualization();
});
document.addEventListener("DOMContentLoaded", initializePage);

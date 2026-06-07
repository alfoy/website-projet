// Logique frontend de "¡Vamos! Flashcards"
// Gère : connexion par pseudo, chargement des cartes, retournement,
// auto-évaluation et sauvegarde de la progression via l'API.

// --- Références aux éléments du DOM ---
const loginScreen = document.getElementById('login-screen');
const quizScreen = document.getElementById('quiz-screen');
const endScreen = document.getElementById('end-screen');

const loginForm = document.getElementById('login-form');
const pseudoInput = document.getElementById('pseudo-input');

const welcomeMessage = document.getElementById('welcome-message');
const progressSummary = document.getElementById('progress-summary');

const flashcard = document.getElementById('flashcard');
const spanishWordEl = document.getElementById('spanish-word');
const frenchWordEl = document.getElementById('french-word');

const answerButtons = document.getElementById('answer-buttons');
const btnKnew = document.getElementById('btn-knew');
const btnDidntKnow = document.getElementById('btn-didnt-know');
const btnNext = document.getElementById('btn-next');
const btnRestart = document.getElementById('btn-restart');

const finalScore = document.getElementById('final-score');

// --- État de l'application ---
let pseudo = '';
let cards = [];
let currentIndex = 0;
let progress = { vues: 0, correctes: 0 };
let hasAnswered = false; // empêche de cliquer deux fois sur "je savais"/"je ne savais pas"

// --- Étape 1 : connexion par pseudo ---

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const value = pseudoInput.value.trim();
  if (!value) return;

  pseudo = value;

  try {
    const [cardsRes, progressRes] = await Promise.all([
      fetch('/api/cards'),
      fetch(`/api/progress/${encodeURIComponent(pseudo)}`)
    ]);

    if (!cardsRes.ok || !progressRes.ok) {
      throw new Error('Réponse serveur invalide');
    }

    cards = await cardsRes.json();
    progress = await progressRes.json();

    startSession();
  } catch (err) {
    alert("Une erreur est survenue lors du chargement. Réessaie dans un instant.");
    console.error(err);
  }
});

// --- Démarrage d'une session de révision ---

function startSession() {
  currentIndex = 0;
  hasAnswered = false;

  loginScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');

  welcomeMessage.textContent = `¡Hola, ${pseudo}!`;
  updateProgressSummary();
  showCard();
}

function updateProgressSummary() {
  const { vues, correctes } = progress;
  const taux = vues > 0 ? Math.round((correctes / vues) * 100) : 0;
  progressSummary.textContent = `Progression totale : ${vues} carte(s) vue(s) — ${taux}% de réussite`;
}

// --- Affichage d'une carte ---

function showCard() {
  if (currentIndex >= cards.length) {
    showEndScreen();
    return;
  }

  const card = cards[currentIndex];
  spanishWordEl.textContent = card.spanish;
  frenchWordEl.textContent = card.french;

  flashcard.classList.remove('flipped');
  answerButtons.classList.add('hidden');
  btnNext.classList.add('hidden');
  hasAnswered = false;
}

// Retourner la carte au clic
flashcard.addEventListener('click', () => {
  flashcard.classList.toggle('flipped');

  // Une fois la carte retournée (et la traduction visible), on propose l'auto-évaluation
  if (flashcard.classList.contains('flipped') && !hasAnswered) {
    answerButtons.classList.remove('hidden');
  }
});

// --- Auto-évaluation ---

btnKnew.addEventListener('click', () => handleAnswer(true));
btnDidntKnow.addEventListener('click', () => handleAnswer(false));

async function handleAnswer(savait) {
  if (hasAnswered) return;
  hasAnswered = true;

  answerButtons.classList.add('hidden');
  btnNext.classList.remove('hidden');

  // Mise à jour locale immédiate pour un retour instantané
  progress.vues += 1;
  if (savait) progress.correctes += 1;
  updateProgressSummary();

  // Sauvegarde côté serveur
  try {
    const res = await fetch(`/api/progress/${encodeURIComponent(pseudo)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savait })
    });

    if (res.ok) {
      progress = await res.json();
      updateProgressSummary();
    }
  } catch (err) {
    console.error("Impossible de sauvegarder la progression :", err);
  }
}

// --- Carte suivante ---

btnNext.addEventListener('click', () => {
  currentIndex += 1;
  showCard();
});

// --- Écran de fin de session ---

function showEndScreen() {
  quizScreen.classList.add('hidden');
  endScreen.classList.remove('hidden');

  const taux = progress.vues > 0 ? Math.round((progress.correctes / progress.vues) * 100) : 0;
  finalScore.textContent = `Score cumulé : ${progress.correctes} / ${progress.vues} (${taux}% de réussite)`;
}

btnRestart.addEventListener('click', () => {
  startSession();
});

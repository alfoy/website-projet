// Serveur Express pour l'application "¡Vamos! Flashcards"
// Sert le frontend (dossier public/) et expose une petite API
// pour les flashcards et la progression des utilisateurs.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const FLASHCARDS_PATH = path.join(__dirname, 'data', 'flashcards.json');
const PROGRESS_PATH = path.join(__dirname, 'data', 'progress.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Fonctions utilitaires pour lire/écrire le fichier de progression ---

function readProgress() {
  try {
    const raw = fs.readFileSync(PROGRESS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    // Si le fichier n'existe pas encore, on part d'un objet vide
    return {};
  }
}

function writeProgress(data) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Routes API ---

// Renvoie le jeu de flashcards
app.get('/api/cards', (req, res) => {
  try {
    const raw = fs.readFileSync(FLASHCARDS_PATH, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: "Impossible de charger les flashcards." });
  }
});

// Renvoie la progression d'un pseudo (ou une progression vierge s'il n'existe pas encore)
app.get('/api/progress/:pseudo', (req, res) => {
  const pseudo = req.params.pseudo.trim().toLowerCase();
  if (!pseudo) {
    return res.status(400).json({ error: "Pseudo invalide." });
  }

  const allProgress = readProgress();
  const userProgress = allProgress[pseudo] || { vues: 0, correctes: 0 };

  res.json({ pseudo, ...userProgress });
});

// Met à jour la progression d'un pseudo après une carte évaluée
app.post('/api/progress/:pseudo', (req, res) => {
  const pseudo = req.params.pseudo.trim().toLowerCase();
  if (!pseudo) {
    return res.status(400).json({ error: "Pseudo invalide." });
  }

  const { savait } = req.body;
  if (typeof savait !== 'boolean') {
    return res.status(400).json({ error: "Le champ 'savait' doit être un booléen." });
  }

  const allProgress = readProgress();
  const userProgress = allProgress[pseudo] || { vues: 0, correctes: 0 };

  userProgress.vues += 1;
  if (savait) {
    userProgress.correctes += 1;
  }

  allProgress[pseudo] = userProgress;
  writeProgress(allProgress);

  res.json({ pseudo, ...userProgress });
});

app.listen(PORT, () => {
  console.log(`¡Vamos! Flashcards est lancé sur http://localhost:${PORT}`);
});

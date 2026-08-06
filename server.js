const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'reports.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(UPLOAD_DIR));

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao abrir banco de dados:', err.message);
    process.exit(1);
  }
});

const initSql = `
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  school TEXT,
  incident TEXT,
  description TEXT,
  status TEXT,
  evidence TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS supports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time TEXT,
  status TEXT,
  created_at TEXT
);
`;

db.exec(initSql, (err) => {
  if (err) {
    console.error('Erro ao criar tabelas:', err.message);
    process.exit(1);
  }
});

function generateTrackingCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let code = 'REP-2026-';

  for (let i = 0; i < 3; i += 1) {
    code += i % 2 === 0
      ? letters.charAt(Math.floor(Math.random() * letters.length))
      : digits.charAt(Math.floor(Math.random() * digits.length));
  }

  return code;
}

app.post('/api/reports', upload.single('attachment'), (req, res) => {
  const { school, incident, description } = req.body;

  if (!school || !incident || !description || description.trim().length < 20) {
    return res.status(400).json({ message: 'Preencha os campos obrigatórios corretamente.' });
  }

  const code = generateTrackingCode();
  const status = 'Recebida';
  const createdAt = new Date().toISOString();
  const evidence = req.file ? `/uploads/${req.file.filename}` : null;

  const query = `INSERT INTO reports (code, school, incident, description, status, evidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [code, school, incident, description.trim(), status, evidence, createdAt], function (err) {
    if (err) {
      console.error('Erro ao salvar denúncia:', err.message);
      return res.status(500).json({ message: 'Erro interno ao salvar a denúncia.' });
    }

    return res.json({ code, status });
  });
});

app.get('/api/reports/:code', (req, res) => {
  const { code } = req.params;
  const query = 'SELECT code, school, incident, description, status, evidence, created_at FROM reports WHERE code = ?';

  db.get(query, [code], (err, row) => {
    if (err) {
      console.error('Erro ao consultar denúncia:', err.message);
      return res.status(500).json({ message: 'Erro interno ao consultar a denúncia.' });
    }

    if (!row) {
      return res.status(404).json({ message: 'Denúncia não encontrada.' });
    }

    return res.json(row);
  });
});

app.post('/api/supports', (req, res) => {
  const { time } = req.body;
  if (!time) {
    return res.status(400).json({ message: 'Selecione um horário.' });
  }

  const status = 'Agendado';
  const createdAt = new Date().toISOString();
  const query = 'INSERT INTO supports (time, status, created_at) VALUES (?, ?, ?)';

  db.run(query, [time, status, createdAt], function (err) {
    if (err) {
      console.error('Erro ao agendar apoio:', err.message);
      return res.status(500).json({ message: 'Erro interno ao agendar apoio psicológico.' });
    }

    return res.json({ time, status, createdAt });
  });
});

app.get('/api/supports', (req, res) => {
  const query = 'SELECT id, time, status, created_at FROM supports ORDER BY created_at DESC LIMIT 20';
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar agendamentos:', err.message);
      return res.status(500).json({ message: 'Erro interno ao buscar agendamentos.' });
    }
    return res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});

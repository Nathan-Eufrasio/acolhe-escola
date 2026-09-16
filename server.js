const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'reports.db');
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const adminTokens = new Set();
const allowedStatuses = new Set(['Recebida', 'Em análise', 'Resolvida', 'Arquivada']);

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

function requireAdmin(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ message: 'Acesso administrativo não autorizado.' });
  }

  return next();
}

app.post('/api/admin/login', (req, res) => {
  const { login, password } = req.body;

  if (login !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Login ou senha inválidos.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  adminTokens.add(token);
  return res.json({ token });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = (req.get('authorization') || '').slice(7);
  adminTokens.delete(token);
  return res.json({ message: 'Sessão encerrada.' });
});

app.get('/api/admin/reports', requireAdmin, (req, res) => {
  const query = `
    SELECT id, code, school, incident, description, status, evidence, created_at
    FROM reports
    ORDER BY datetime(created_at) DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar denúncias:', err.message);
      return res.status(500).json({ message: 'Erro interno ao listar denúncias.' });
    }

    return res.json(rows);
  });
});

app.patch('/api/admin/reports/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const reportId = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(reportId) || !allowedStatuses.has(status)) {
    return res.status(400).json({ message: 'Status ou denúncia inválidos.' });
  }

  db.run('UPDATE reports SET status = ? WHERE id = ?', [status, reportId], function updateReport(err) {
    if (err) {
      console.error('Erro ao atualizar denúncia:', err.message);
      return res.status(500).json({ message: 'Erro interno ao atualizar denúncia.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Denúncia não encontrada.' });
    }

    return res.json({ message: 'Status atualizado com sucesso.' });
  });
});

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

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'O arquivo excede o limite de 10 MB.' });
    }

    return res.status(400).json({ message: 'Não foi possível processar o arquivo enviado.' });
  }

  console.error('Erro inesperado na API:', error);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS: allow both Vite dev ports ──────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:5178',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── SQLite setup ──────────────────────────────────────────────────────────────
const dbPath = path.join(__dirname, 'data.db');
const db     = new sqlite3.Database(dbPath);

const run = (sql, p=[]) => new Promise((res,rej) => db.run(sql, p, function(e){ e?rej(e):res(this); }));
const all = (sql, p=[]) => new Promise((res,rej) => db.all(sql, p, (e,r)=>e?rej(e):res(r)));
const get = (sql, p=[]) => new Promise((res,rej) => db.get(sql, p, (e,r)=>e?rej(e):res(r)));

async function initDB() {
  await run(`PRAGMA journal_mode=WAL`);

  // Users table (lightweight — real auth stays in MongoDB)
  await run(`CREATE TABLE IF NOT EXISTS users (
    id   TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE
  )`);

  // Transactions (user-scoped)
  await run(`CREATE TABLE IF NOT EXISTS transactions (
    _id          TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    date         TEXT,
    createdAt    TEXT,
    amount       REAL DEFAULT 0,
    merchant     TEXT DEFAULT '',
    description  TEXT DEFAULT '',
    category     TEXT DEFAULT 'Uncategorized',
    type         TEXT DEFAULT 'debit',
    paymentMethod TEXT DEFAULT 'cash',
    bankAccountId TEXT,
    mode         TEXT DEFAULT 'cash',
    currency     TEXT DEFAULT 'INR',
    autoDebit    INTEGER DEFAULT 0,
    rawJson      TEXT
  )`);

  // Bank accounts (user-scoped)
  await run(`CREATE TABLE IF NOT EXISTS bank_accounts (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL,
    name           TEXT,
    lastFourDigits TEXT,
    balance        REAL DEFAULT 0,
    createdAt      TEXT
  )`);

  // Payment reminders (user-scoped)
  await run(`CREATE TABLE IF NOT EXISTS payment_reminders (
    id        TEXT PRIMARY KEY,
    user_id   TEXT NOT NULL,
    title     TEXT,
    amount    REAL DEFAULT 0,
    date      TEXT,
    type      TEXT DEFAULT 'other',
    frequency TEXT DEFAULT 'monthly',
    account   TEXT DEFAULT 'cash',
    completed INTEGER DEFAULT 0,
    lastPaid  TEXT,
    createdAt TEXT
  )`);

  // Saving goals (user-scoped)
  await run(`CREATE TABLE IF NOT EXISTS saving_goals (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    name         TEXT,
    targetAmount REAL DEFAULT 0,
    currentAmount REAL DEFAULT 0,
    deadline     TEXT,
    priority     TEXT DEFAULT 'medium',
    category     TEXT DEFAULT 'savings',
    description  TEXT DEFAULT '',
    completed    INTEGER DEFAULT 0,
    createdAt    TEXT
  )`);

  console.log('✅ Database initialized');
}

// ── Auto-categorize helper ────────────────────────────────────────────────────
const CATEGORY_MAP = [
  ['Food & Dining',    'food,restaurant,cafe,meal,pizza,burger,coffee,dine,swiggy,zomato,dominos,starbucks,subway,kfc,mcdonald'],
  ['Transportation',   'uber,ola,cab,metro,bus,fuel,petrol,gas,taxi,auto,rapido,irctc,railway,parking'],
  ['Shopping',         'amazon,flipkart,myntra,shop,store,purchase,buy,bigbasket,grofers,reliance,retail,clothing,fashion'],
  ['Entertainment',    'movie,cinema,netflix,disney,spotify,music,game,hotstar,theater,concert,bookmyshow,pvr,inox'],
  ['Utilities',        'electricity,water,bill,power,broadband,internet,jio,airtel,postpaid,prepaid,subscription'],
  ['Healthcare',       'hospital,medicine,pharma,health,medical,doctor,clinic,apollo,prescription,1mg'],
  ['Education',        'school,college,course,book,tuition,fee,university,udemy,coursera,byjus'],
  ['Travel',           'flight,hotel,airline,booking,trip,vacation,makemytrip,oyo,airbnb,goibibo'],
  ['Investment',       'mutual,stock,investment,sip,equity,bond,trading,zerodha,groww,crypto'],
  ['Insurance',        'insurance,premium,policy,lic,term'],
  ['Rent',             'rent,landlord,lease'],
  ['Groceries',        'grocery,supermarket,vegetables,fruits,dairy,provisions'],
  ['Salary',           'salary,payroll,wages,stipend,income'],
  ['Freelance',        'freelance,consulting,project payment,client'],
  ['Credit Card',      'credit card,card payment,cc bill'],
  ['Loan EMI',         'loan,emi,equated,repayment'],
];

function autoCategory(merchant='', description='') {
  const text = (merchant + ' ' + description).toLowerCase();
  for (const [cat, kws] of CATEGORY_MAP) {
    for (const kw of kws.split(',')) {
      if (text.includes(kw.trim())) return cat;
    }
  }
  return 'Uncategorized';
}

// ── Helper: upsert user ───────────────────────────────────────────────────────
async function upsertUser(id, name, email) {
  await run(
    `INSERT OR IGNORE INTO users (id, name, email) VALUES (?,?,?)`,
    [id, name||'', email||'']
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/',       (_, res) => res.send('TRIKIA Budget Tracker API running ✅'));
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

// GET /transactions?user_id=xxx
app.get('/transactions', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const rows = await all(
      'SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC, createdAt DESC',
      [user_id]
    );
    // Parse rawJson back if stored, otherwise return row fields
    const parsed = rows.map(r => {
      try { return r.rawJson ? { ...JSON.parse(r.rawJson), _id: r._id } : r; }
      catch { return r; }
    });
    res.json(parsed);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /transactions  — add one
app.post('/transactions', async (req, res) => {
  try {
    const tx = req.body;
    if (!tx.user) return res.status(400).json({ error: 'tx.user required' });
    if (!tx.category) tx.category = autoCategory(tx.merchant, tx.description);
    const id = tx._id || `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await upsertUser(tx.user, tx.userName, tx.userEmail);
    await run(
      `INSERT OR REPLACE INTO transactions
        (_id,user_id,date,createdAt,amount,merchant,description,category,type,paymentMethod,bankAccountId,mode,currency,autoDebit,rawJson)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, tx.user, tx.date||new Date().toISOString(), tx.createdAt||new Date().toISOString(),
       tx.amount||0, tx.merchant||'', tx.description||'', tx.category||'Uncategorized',
       tx.type||'debit', tx.paymentMethod||'cash', tx.bankAccountId||null,
       tx.mode||'cash', tx.currency||'INR', tx.autoDebit?1:0,
       JSON.stringify(tx)]
    );
    res.status(201).json({ ...tx, _id: id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /transactions/bulk  — sync entire array from localStorage
app.post('/transactions/bulk', async (req, res) => {
  try {
    const { user_id, transactions } = req.body;
    if (!user_id || !Array.isArray(transactions)) return res.status(400).json({ error: 'user_id and transactions[] required' });
    // Delete existing for this user and re-insert
    await run('DELETE FROM transactions WHERE user_id=?', [user_id]);
    for (const tx of transactions) {
      if (!tx._id) continue;
      await run(
        `INSERT OR REPLACE INTO transactions
          (_id,user_id,date,createdAt,amount,merchant,description,category,type,paymentMethod,bankAccountId,mode,currency,autoDebit,rawJson)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [tx._id, user_id, tx.date||'', tx.createdAt||'', tx.amount||0,
         tx.merchant||'', tx.description||'', tx.category||'Uncategorized',
         tx.type||'debit', tx.paymentMethod||'cash', tx.bankAccountId||null,
         tx.mode||'cash', tx.currency||'INR', tx.autoDebit?1:0, JSON.stringify(tx)]
      );
    }
    res.json({ synced: transactions.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /transactions/:id
app.delete('/transactions/:id', async (req, res) => {
  try {
    await run('DELETE FROM transactions WHERE _id=?', [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /transactions/:id
app.put('/transactions/:id', async (req, res) => {
  try {
    const tx = req.body;
    await run(
      `UPDATE transactions SET date=?,amount=?,merchant=?,description=?,category=?,type=?,paymentMethod=?,bankAccountId=?,rawJson=?
       WHERE _id=?`,
      [tx.date, tx.amount, tx.merchant, tx.description, tx.category, tx.type, tx.paymentMethod, tx.bankAccountId||null, JSON.stringify(tx), req.params.id]
    );
    res.json(tx);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── BANK ACCOUNTS ─────────────────────────────────────────────────────────────

app.get('/bank-accounts', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const rows = await all('SELECT * FROM bank_accounts WHERE user_id=? ORDER BY createdAt ASC', [user_id]);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/bank-accounts', async (req, res) => {
  try {
    const acc = req.body;
    if (!acc.user_id) return res.status(400).json({ error: 'user_id required' });
    const id = acc.id || `acc_${Date.now()}`;
    await run(
      `INSERT OR REPLACE INTO bank_accounts (id,user_id,name,lastFourDigits,balance,createdAt) VALUES (?,?,?,?,?,?)`,
      [id, acc.user_id, acc.name||'', acc.lastFourDigits||'', acc.balance||0, acc.createdAt||new Date().toISOString()]
    );
    res.status(201).json({ ...acc, id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/bank-accounts/bulk', async (req, res) => {
  try {
    const { user_id, accounts } = req.body;
    if (!user_id || !Array.isArray(accounts)) return res.status(400).json({ error: 'user_id and accounts[] required' });
    await run('DELETE FROM bank_accounts WHERE user_id=?', [user_id]);
    for (const acc of accounts) {
      if (!acc.id) continue;
      await run(
        `INSERT OR REPLACE INTO bank_accounts (id,user_id,name,lastFourDigits,balance,createdAt) VALUES (?,?,?,?,?,?)`,
        [acc.id, user_id, acc.name||'', acc.lastFourDigits||'', acc.balance||0, acc.createdAt||'']
      );
    }
    res.json({ synced: accounts.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/bank-accounts/:id', async (req, res) => {
  try {
    const acc = req.body;
    await run(
      'UPDATE bank_accounts SET name=?,lastFourDigits=?,balance=? WHERE id=?',
      [acc.name, acc.lastFourDigits, acc.balance, req.params.id]
    );
    res.json(acc);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/bank-accounts/:id', async (req, res) => {
  try {
    await run('DELETE FROM bank_accounts WHERE id=?', [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── PAYMENT REMINDERS ─────────────────────────────────────────────────────────

app.get('/payment-reminders', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const rows = await all('SELECT * FROM payment_reminders WHERE user_id=? ORDER BY createdAt ASC', [user_id]);
    res.json(rows.map(r => ({ ...r, completed: !!r.completed })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/payment-reminders', async (req, res) => {
  try {
    const r = req.body;
    if (!r.user_id) return res.status(400).json({ error: 'user_id required' });
    const id = r.id || `rem_${Date.now()}`;
    await run(
      `INSERT OR REPLACE INTO payment_reminders (id,user_id,title,amount,date,type,frequency,account,completed,lastPaid,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, r.user_id, r.title||'', r.amount||0, r.date||'', r.type||'other',
       r.frequency||'monthly', r.account||'cash', r.completed?1:0,
       r.lastPaid||null, r.createdAt||new Date().toISOString()]
    );
    res.status(201).json({ ...r, id, completed: !!r.completed });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/payment-reminders/bulk', async (req, res) => {
  try {
    const { user_id, reminders } = req.body;
    if (!user_id || !Array.isArray(reminders)) return res.status(400).json({ error: 'user_id and reminders[] required' });
    await run('DELETE FROM payment_reminders WHERE user_id=?', [user_id]);
    for (const r of reminders) {
      if (!r.id) continue;
      await run(
        `INSERT OR REPLACE INTO payment_reminders (id,user_id,title,amount,date,type,frequency,account,completed,lastPaid,createdAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [r.id, user_id, r.title||'', r.amount||0, r.date||'', r.type||'other',
         r.frequency||'monthly', r.account||'cash', r.completed?1:0,
         r.lastPaid||null, r.createdAt||'']
      );
    }
    res.json({ synced: reminders.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/payment-reminders/:id', async (req, res) => {
  try {
    const r = req.body;
    await run(
      `UPDATE payment_reminders SET title=?,amount=?,date=?,type=?,frequency=?,account=?,completed=?,lastPaid=? WHERE id=?`,
      [r.title, r.amount, r.date, r.type, r.frequency, r.account, r.completed?1:0, r.lastPaid||null, req.params.id]
    );
    res.json({ ...r, completed: !!r.completed });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/payment-reminders/:id', async (req, res) => {
  try {
    await run('DELETE FROM payment_reminders WHERE id=?', [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── SAVING GOALS ──────────────────────────────────────────────────────────────

app.get('/saving-goals', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const rows = await all('SELECT * FROM saving_goals WHERE user_id=? ORDER BY createdAt ASC', [user_id]);
    res.json(rows.map(r => ({ ...r, completed: !!r.completed })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/saving-goals', async (req, res) => {
  try {
    const g = req.body;
    if (!g.user_id) return res.status(400).json({ error: 'user_id required' });
    const id = g.id || `goal_${Date.now()}`;
    await run(
      `INSERT OR REPLACE INTO saving_goals (id,user_id,name,targetAmount,currentAmount,deadline,priority,category,description,completed,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, g.user_id, g.name||'', g.targetAmount||0, g.currentAmount||0,
       g.deadline||'', g.priority||'medium', g.category||'savings',
       g.description||'', g.completed?1:0, g.createdAt||new Date().toISOString()]
    );
    res.status(201).json({ ...g, id, completed: !!g.completed });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/saving-goals/bulk', async (req, res) => {
  try {
    const { user_id, goals } = req.body;
    if (!user_id || !Array.isArray(goals)) return res.status(400).json({ error: 'user_id and goals[] required' });
    await run('DELETE FROM saving_goals WHERE user_id=?', [user_id]);
    for (const g of goals) {
      if (!g.id) continue;
      await run(
        `INSERT OR REPLACE INTO saving_goals (id,user_id,name,targetAmount,currentAmount,deadline,priority,category,description,completed,createdAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [g.id, user_id, g.name||'', g.targetAmount||0, g.currentAmount||0,
         g.deadline||'', g.priority||'medium', g.category||'savings',
         g.description||'', g.completed?1:0, g.createdAt||'']
      );
    }
    res.json({ synced: goals.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/saving-goals/:id', async (req, res) => {
  try {
    const g = req.body;
    await run(
      `UPDATE saving_goals SET name=?,targetAmount=?,currentAmount=?,deadline=?,priority=?,category=?,description=?,completed=? WHERE id=?`,
      [g.name, g.targetAmount, g.currentAmount, g.deadline, g.priority, g.category, g.description, g.completed?1:0, req.params.id]
    );
    res.json({ ...g, completed: !!g.completed });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/saving-goals/:id', async (req, res) => {
  try {
    await run('DELETE FROM saving_goals WHERE id=?', [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── FULL SYNC endpoint (client pushes everything on login) ────────────────────
app.post('/sync', async (req, res) => {
  try {
    const { user_id, transactions=[], bankAccounts=[], reminders=[], goals=[] } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Transactions
    if (transactions.length > 0) {
      await run('DELETE FROM transactions WHERE user_id=?', [user_id]);
      for (const tx of transactions) {
        if (!tx._id) continue;
        await run(
          `INSERT OR REPLACE INTO transactions (_id,user_id,date,createdAt,amount,merchant,description,category,type,paymentMethod,bankAccountId,mode,currency,autoDebit,rawJson)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [tx._id, user_id, tx.date||'', tx.createdAt||'', tx.amount||0,
           tx.merchant||'', tx.description||'', tx.category||'Uncategorized',
           tx.type||'debit', tx.paymentMethod||'cash', tx.bankAccountId||null,
           tx.mode||'cash', tx.currency||'INR', tx.autoDebit?1:0, JSON.stringify(tx)]
        );
      }
    }

    // Bank accounts
    if (bankAccounts.length > 0) {
      await run('DELETE FROM bank_accounts WHERE user_id=?', [user_id]);
      for (const acc of bankAccounts) {
        if (!acc.id) continue;
        await run(
          `INSERT OR REPLACE INTO bank_accounts (id,user_id,name,lastFourDigits,balance,createdAt) VALUES (?,?,?,?,?,?)`,
          [acc.id, user_id, acc.name||'', acc.lastFourDigits||'', acc.balance||0, acc.createdAt||'']
        );
      }
    }

    // Reminders
    if (reminders.length > 0) {
      await run('DELETE FROM payment_reminders WHERE user_id=?', [user_id]);
      for (const r of reminders) {
        if (!r.id) continue;
        await run(
          `INSERT OR REPLACE INTO payment_reminders (id,user_id,title,amount,date,type,frequency,account,completed,lastPaid,createdAt)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [r.id, user_id, r.title||'', r.amount||0, r.date||'', r.type||'other',
           r.frequency||'monthly', r.account||'cash', r.completed?1:0, r.lastPaid||null, r.createdAt||'']
        );
      }
    }

    // Goals
    if (goals.length > 0) {
      await run('DELETE FROM saving_goals WHERE user_id=?', [user_id]);
      for (const g of goals) {
        if (!g.id) continue;
        await run(
          `INSERT OR REPLACE INTO saving_goals (id,user_id,name,targetAmount,currentAmount,deadline,priority,category,description,completed,createdAt)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [g.id, user_id, g.name||'', g.targetAmount||0, g.currentAmount||0,
           g.deadline||'', g.priority||'medium', g.category||'savings',
           g.description||'', g.completed?1:0, g.createdAt||'']
        );
      }
    }

    res.json({ ok: true, synced: { transactions: transactions.length, bankAccounts: bankAccounts.length, reminders: reminders.length, goals: goals.length } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── FULL LOAD endpoint (client pulls everything on login) ─────────────────────
app.get('/load', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const [txRows, accRows, remRows, goalRows] = await Promise.all([
      all('SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC', [user_id]),
      all('SELECT * FROM bank_accounts WHERE user_id=? ORDER BY createdAt ASC', [user_id]),
      all('SELECT * FROM payment_reminders WHERE user_id=? ORDER BY createdAt ASC', [user_id]),
      all('SELECT * FROM saving_goals WHERE user_id=? ORDER BY createdAt ASC', [user_id]),
    ]);

    const transactions = txRows.map(r => {
      try { return r.rawJson ? { ...JSON.parse(r.rawJson), _id: r._id } : r; } catch { return r; }
    });

    res.json({
      transactions,
      bankAccounts: accRows,
      reminders:    remRows.map(r => ({ ...r, completed: !!r.completed })),
      goals:        goalRows.map(r => ({ ...r, completed: !!r.completed })),
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Auto-categorize ───────────────────────────────────────────────────────────
app.post('/categorize', (req, res) => {
  const { merchant='', description='' } = req.body;
  res.json({ category: autoCategory(merchant, description) });
});

// ─────────────────────────────────────────────────────────────────────────────
// Try to mount MongoDB auth routes if available, but don't crash if not
// ─────────────────────────────────────────────────────────────────────────────
try {
  const backendApp = require('./Backend/routes');
  app.use('/api', backendApp);
  console.log('✅ MongoDB auth routes mounted at /api');
} catch(e) {
  console.warn('⚠️  Backend/routes not found — auth routes skipped:', e.message);
}

// Start
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 TRIKIA server running on http://localhost:${PORT}`));
}).catch(e => { console.error('DB init failed:', e); process.exit(1); });

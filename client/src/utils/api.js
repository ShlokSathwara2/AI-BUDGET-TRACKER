// utils/api.js
// Talks to the TRIKIA backend (localhost:5000).
// Every call gracefully falls back to localStorage if the server is unreachable.

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── low-level fetch wrapper ────────────────────────────────────────────────────
async function apiFetch(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── localStorage helpers ──────────────────────────────────────────────────────
const lsGet = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const lsSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getTransactions(userId) {
  if (!userId) return [];
  try {
    const data = await apiFetch('GET', `/transactions?user_id=${userId}`);
    lsSet(`transactions_${userId}`, data);
    return data;
  } catch {
    return lsGet(`transactions_${userId}`, []);
  }
}

export async function addTransactionAPI(tx) {
  try {
    return await apiFetch('POST', '/transactions', tx);
  } catch {
    return tx; // already saved to localStorage by App
  }
}

export async function updateTransactionAPI(tx) {
  try {
    return await apiFetch('PUT', `/transactions/${tx._id}`, tx);
  } catch {
    return tx;
  }
}

export async function deleteTransactionAPI(id) {
  try {
    return await apiFetch('DELETE', `/transactions/${id}`);
  } catch {
    return { deleted: id };
  }
}

export async function syncTransactions(userId, transactions) {
  try {
    return await apiFetch('POST', '/transactions/bulk', { user_id: userId, transactions });
  } catch {
    return { synced: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BANK ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getBankAccounts(userId) {
  if (!userId) return [];
  try {
    const data = await apiFetch('GET', `/bank-accounts?user_id=${userId}`);
    lsSet(`bank_accounts_${userId}`, data);
    return data;
  } catch {
    return lsGet(`bank_accounts_${userId}`, []);
  }
}

export async function addBankAccountAPI(userId, account) {
  try {
    return await apiFetch('POST', '/bank-accounts', { ...account, user_id: userId });
  } catch {
    return account;
  }
}

export async function updateBankAccountAPI(account) {
  try {
    return await apiFetch('PUT', `/bank-accounts/${account.id}`, account);
  } catch {
    return account;
  }
}

export async function deleteBankAccountAPI(id) {
  try {
    return await apiFetch('DELETE', `/bank-accounts/${id}`);
  } catch {
    return { deleted: id };
  }
}

export async function syncBankAccounts(userId, accounts) {
  try {
    return await apiFetch('POST', '/bank-accounts/bulk', { user_id: userId, accounts });
  } catch {
    return { synced: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT REMINDERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPaymentReminders(userId) {
  if (!userId) return [];
  try {
    const data = await apiFetch('GET', `/payment-reminders?user_id=${userId}`);
    lsSet(`payment_reminders_${userId}`, data);
    return data;
  } catch {
    return lsGet(`payment_reminders_${userId}`, []);
  }
}

export async function addPaymentReminderAPI(userId, reminder) {
  try {
    return await apiFetch('POST', '/payment-reminders', { ...reminder, user_id: userId });
  } catch {
    return reminder;
  }
}

export async function updatePaymentReminderAPI(reminder) {
  try {
    return await apiFetch('PUT', `/payment-reminders/${reminder.id}`, reminder);
  } catch {
    return reminder;
  }
}

export async function deletePaymentReminderAPI(id) {
  try {
    return await apiFetch('DELETE', `/payment-reminders/${id}`);
  } catch {
    return { deleted: id };
  }
}

export async function syncReminders(userId, reminders) {
  try {
    return await apiFetch('POST', '/payment-reminders/bulk', { user_id: userId, reminders });
  } catch {
    return { synced: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVING GOALS
// ─────────────────────────────────────────────────────────────────────────────

export async function getSavingGoals(userId) {
  if (!userId) return [];
  try {
    const data = await apiFetch('GET', `/saving-goals?user_id=${userId}`);
    lsSet(`saving_goals_${userId}`, data);
    return data;
  } catch {
    return lsGet(`saving_goals_${userId}`, []);
  }
}

export async function addSavingGoalAPI(userId, goal) {
  try {
    return await apiFetch('POST', '/saving-goals', { ...goal, user_id: userId });
  } catch {
    return goal;
  }
}

export async function updateSavingGoalAPI(goal) {
  try {
    return await apiFetch('PUT', `/saving-goals/${goal.id}`, goal);
  } catch {
    return goal;
  }
}

export async function deleteSavingGoalAPI(id) {
  try {
    return await apiFetch('DELETE', `/saving-goals/${id}`);
  } catch {
    return { deleted: id };
  }
}

export async function syncGoals(userId, goals) {
  try {
    return await apiFetch('POST', '/saving-goals/bulk', { user_id: userId, goals });
  } catch {
    return { synced: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL LOAD / SYNC  (used on login to pull everything from DB at once)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pull all user data from backend in one request.
 * Falls back to localStorage if server is down.
 */
export async function loadAllUserData(userId) {
  if (!userId) return null;
  try {
    const data = await apiFetch('GET', `/load?user_id=${userId}`);
    // Only cache to localStorage if backend returned actual data
    // This prevents overwriting existing local data with empty arrays
    if (data.transactions?.length)  lsSet(`transactions_${userId}`,      data.transactions);
    if (data.bankAccounts?.length)  lsSet(`bank_accounts_${userId}`,     data.bankAccounts);
    if (data.reminders?.length)     lsSet(`payment_reminders_${userId}`, data.reminders);
    if (data.goals?.length)         lsSet(`saving_goals_${userId}`,      data.goals);
    return data;
  } catch {
    // Backend unreachable — load from localStorage
    return {
      transactions:  lsGet(`transactions_${userId}`,      []),
      bankAccounts:  lsGet(`bank_accounts_${userId}`,     []),
      reminders:     lsGet(`payment_reminders_${userId}`, []),
      goals:         lsGet(`saving_goals_${userId}`,      []),
    };
  }
}

/**
 * Push all local data to backend (called when server comes back online or on login).
 */
export async function pushAllUserData(userId, { transactions=[], bankAccounts=[], reminders=[], goals=[] }) {
  try {
    return await apiFetch('POST', '/sync', { user_id: userId, transactions, bankAccounts, reminders, goals });
  } catch {
    return { ok: false };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-CATEGORIZE
// ─────────────────────────────────────────────────────────────────────────────
export async function categorizeTransaction(merchant, description) {
  try {
    const { category } = await apiFetch('POST', '/categorize', { merchant, description });
    return category;
  } catch {
    return 'Uncategorized';
  }
}

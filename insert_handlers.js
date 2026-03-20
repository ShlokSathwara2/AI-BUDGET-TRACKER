const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const handlers = `
  // ── Individual bank account actions (for fully controlled BankAccountManager) ──
  const handleAddBankAccount = useCallback((newAccount) => {
    const added = addBankAccount(newAccount);
    if (added) {
      showToast(\`✅ Bank account "\${added.name}" added successfully!\`);
      if (user?.id) addBankAccountAPI({ ...added, user: user.id }).catch(console.error);
    }
  }, [addBankAccount, showToast, user]);

  const handleDeleteBankAccount = useCallback((accountId) => {
    deleteBankAccount(accountId);
    showToast('✅ Bank account deleted!');
    if (user?.id) deleteBankAccountAPI(accountId).catch(console.error);
  }, [deleteBankAccount, showToast, user]);

  const handleResetBankAccounts = useCallback(() => {
    setBankAccounts([]);
    try { localStorage.setItem(\`bank_accounts_\${user.id}\`, JSON.stringify([])); } catch {}
    showToast('⚠️ All bank accounts reset!');
    if (user?.id) import('./utils/api').then(({ syncBankAccounts }) => syncBankAccounts(user.id, []).catch(console.error));
  }, [setBankAccounts, showToast, user]);

`;

// Find the location to insert - after handleUpdateAccounts
const insertMarker = '}, [setBankAccounts, user]);\n\n  // ── Screens ──';
const replacement = '}, [setBankAccounts, user]);' + handlers + '\n  // ── Screens ──';

if (content.includes(insertMarker)) {
  content = content.replace(insertMarker, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Handlers inserted successfully!');
} else {
  console.log('❌ Could not find insertion point');
  console.log('Looking for:', insertMarker);
}

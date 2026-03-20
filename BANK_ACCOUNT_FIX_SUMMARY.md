# Bank Account Controller Fix - Manual Steps Required

## Root Cause Identified ✅
The dual-state architecture in `BankAccountManager` was causing infinite loops:
1. Component had internal `accounts` state
2. Parent App also had `bankAccounts` state  
3. Both states fighting each other on every navigation
4. `useEffect` save triggers calling `onUpdateAccounts` which recreated on every render
5. Result: State resets to `[]` on every remount

## Solution Implemented ✅

### 1. Rewrote BankAccountManager as Fully Controlled Component
- **Removed**: Internal `accounts` state
- **Removed**: `useEffect` hooks that load/save to localStorage independently
- **Now receives**: `accounts` array as prop
- **Now calls**: Callbacks for all changes (`onAddAccount`, `onDeleteAccount`, `onResetAccounts`)

**File**: `client/src/components/BankAccountManager.jsx` (already replaced)

### 2. Updated BankAccountsPage Props
Changed from `onUpdateAccounts` to individual action callbacks:

```jsx
<BankAccountManager
  user={user}
  accounts={bankAccounts}              // ← Now receives from parent
  onAddAccount={handleAddBankAccount}   // ← Individual callbacks
  onDeleteAccount={handleDeleteBankAccount}
  onResetAccounts={handleResetBankAccounts}
/>
```

**File**: `client/src/pages/BankAccountsPage.jsx` (already updated)

### 3. Add Handlers to App.jsx (MANUAL STEP REQUIRED) ⚠️

Add these three `useCallback` handlers in `AppContent` function, after the `handleUpdateAccounts` callback (around line 688):

```javascript
// ── Individual bank account actions (for fully controlled BankAccountManager) ──
const handleAddBankAccount = useCallback((newAccount) => {
  const added = addBankAccount(newAccount);
  if (added) {
    showToast(`✅ Bank account "${added.name}" added successfully!`);
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
  try { localStorage.setItem(`bank_accounts_${user.id}`, JSON.stringify([])); } catch {}
  showToast('⚠️ All bank accounts reset!');
  if (user?.id) {
    import('./utils/api').then(({ syncBankAccounts }) => {
      syncBankAccounts(user.id, []).catch(console.error);
    });
  }
}, [setBankAccounts, showToast, user]);
```

### 4. Update Route Props (MANUAL STEP REQUIRED) ⚠️

Find the `/bank-accounts` route (around line 788) and change:

**FROM:**
```jsx
<Route path="/bank-accounts" element={
  <BankAccountsPage
    user={user}
    bankAccounts={bankAccounts}
    transactions={safe}
    onUpdateAccounts={handleUpdateAccounts}
  />
}/>
```

**TO:**
```jsx
<Route path="/bank-accounts" element={
  <BankAccountsPage
    user={user}
    bankAccounts={bankAccounts}
    transactions={safe}
    onAddAccount={handleAddBankAccount}
    onDeleteAccount={handleDeleteBankAccount}
    onResetAccounts={handleResetBankAccounts}
  />
}/>
```

## Data Flow After Fix

```
User clicks "Add Account"
  ↓
BankAccountManager calls onAddAccount(newAccount)
  ↓
App.jsx handleAddBankAccount() executes
  ├─→ Calls addBankAccount() from useAppData hook
  │   └─→ Updates App state: _setAcc([...accounts, newAccount])
  │       └─→ Saves to localStorage automatically via setBankAccounts
  ├─→ Shows toast notification
  └─→ Syncs to backend API (fire-and-forget)

Result:
✅ Single source of truth (App state)
✅ No dual-state conflicts
✅ No infinite loops
✅ Data persists across navigation
✅ All pages see same data
```

## Testing Checklist

After applying manual fixes:

1. **Add Bank Account**
   - Go to Bank Accounts page
   - Click "Add Account"
   - Fill form and submit
   - ✅ Account appears immediately
   - Navigate away and back
   - ✅ Account still there

2. **Delete Bank Account**
   - Hover over an account
   - Click "Delete" button
   - ✅ Account disappears immediately
   - Refresh page
   - ✅ Account still deleted

3. **Reset All Accounts**
   - Click "Reset All" button
   - Confirm dialog
   - ✅ All accounts cleared
   - Navigate to dashboard and back
   - ✅ Still empty

4. **Cross-page Sync**
   - Add an account on Bank Accounts page
   - Navigate to Analytics
   - ✅ Account shows in dropdowns/graphs
   - Navigate to Transactions
   - ✅ Account shows in payment method selector

## Files Already Fixed

✅ `client/src/components/BankAccountManager.jsx` - Fully controlled
✅ `client/src/pages/BankAccountsPage.jsx` - Updated props

## Files Needing Manual Edit

⚠️ `client/src/App.jsx` - Add 3 handlers + update route props

## Why This Fixes The Problem

1. **Single Source of Truth**: Only App state manages accounts
2. **Stable Callbacks**: `useCallback` prevents recreation on every render
3. **No Side Effects**: Removed useEffect that was causing infinite loops
4. **Controlled Component**: BankAccountManager is now purely presentational
5. **Predictable Flow**: All mutations go through App → useAppData → localStorage

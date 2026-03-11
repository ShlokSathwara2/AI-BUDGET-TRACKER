# 🧪 TESTING GUIDE - Payment Reminder Features

## Quick Start Testing

### Prerequisites:
- App is running (`npm run dev` in client folder)
- Browser open (Chrome/Edge recommended)
- Notification permissions enabled

---

## Test 1: Create Variable Bill Reminder ✅

**Objective**: Test editing feature for month-to-month changing bills

### Steps:

1. **Open Dashboard**
   ```
   Navigate to: Dashboard Tab
   Scroll to: Payment Reminders section
   ```

2. **Create First Reminder**
   ```
   Click: + (Add) button
   Fill form:
   - Title: Credit Card Bill
   - Amount: 5000
   - Day: 15
   - Type: Credit Card
   - Account: Select your bank account
   - Frequency: Monthly
   Click: Add Reminder
   ```

3. **Verify Creation**
   ```
   Should see: "Credit Card Bill - ₹5,000" in reminders list
   Should show: Due on day 15, linked to your account
   ```

4. **Edit the Reminder (Simulating Month 2)**
   ```
   Click: Edit (pencil icon) on reminder
   Change: Amount from 5000 to 5500
   Click: Save (via Add Reminder button in modal)
   ```

5. **Verify Edit**
   ```
   Should see: Amount updated to ₹5,500
   Reminder card shows new amount
   ```

### Expected Result:
✅ Reminder created successfully
✅ Edit feature works
✅ Amount can be changed anytime before due date

---

## Test 2: Insufficient Balance Alert ✅

**Objective**: Test popup alert when account has insufficient funds

### Setup:

1. **Create Bank Account** (if not exists)
   ```
   Go to: Dashboard → Bank Accounts
   Click: Add Bank Account
   Details:
   - Name: HDFC Bank
   - Balance: 3000 (intentionally low)
   - Account Number: 1234
   - Last 4 Digits: 1234
   Save
   ```

2. **Create Payment Reminder**
   ```
   Payment Reminders → Add (+)
   Details:
   - Title: Electricity Bill
   - Amount: 5000 (higher than balance)
   - Day: [Tomorrow's date]
   - Type: Utilities
   - Account: HDFC Bank
   Save
   ```

### Option A: Manual Date Change (Recommended)

3. **Change System Date** (to test alert timing)
   ```
   Windows Settings → Time & Language
   Turn off: "Set time automatically"
   Click: Change
   Set date to: Day before due date (or due date)
   ```

4. **Refresh App**
   ```
   Press: F5 or Ctrl+R
   Wait: 1-2 minutes for system check to run
   ```

5. **Watch for Alert**
   ```
   Should appear: Modal popup with red/orange gradient
   Should show:
   - ⚠️ Insufficient Balance Alert
   - HDFC Bank has only ₹3,000, but ₹5,000 needed
   - Current Balance: ₹3,000
   - Required: ₹5,000
   - Shortfall: ₹2,000
   ```

### Option B: Quick Test (Without Date Change)

3. **Create Same-Day Reminder**
   ```
   Set due date to: TODAY
   Amount: Higher than account balance
   Wait: Up to 1 hour for next system check
   OR Refresh page multiple times
   ```

### Expected Result:
✅ Browser notification appears (🔔)
✅ Modal popup with all details
✅ Correct shortfall calculation
✅ Action buttons visible (Dismiss / Add Cash Now)

---

## Test 3: Alert Modal Actions ✅

**Objective**: Test both action buttons in alert modal

### From Test 2 (Alert Modal Open):

#### Test 3A: Dismiss Button
```
Click: Dismiss
Modal should: Close
Alert logged: For user reference
Can manually: Add funds later
```

**Expected**: Modal closes, no side effects ✅

#### Test 3B: Add Cash Now Button
```
Reset: Re-create reminder with insufficient balance
Wait: For alert to appear again
Click: Add Cash Now
```

**Should Happen**:
```
✅ Cash transaction created for shortfall amount
✅ Transaction appears in Transactions tab
✅ Cash balance increases
✅ Modal closes
✅ Toast notification: "Cash added..."
```

**Verify**:
```
Go to: Transactions tab
Should see: "Cash added for Electricity Bill - ₹2,000"
Type: Credit (income)
Category: Cash Add
```

---

## Test 4: Auto-Deduction on Due Date ✅

**Objective**: Test automatic payment processing

### Setup:

1. **Set Due Date to Today**
   ```
   Create/Edit reminder
   Set day: Today's date
   Ensure: Account has SUFFICIENT balance (> reminder amount)
   ```

2. **Wait for System Check**
   ```
   Option A: Wait for hourly check (up to 1 hour)
   Option B: Refresh page multiple times
   Option C: Change system time to trigger check
   ```

3. **Monitor Console** (F12 → Console tab)
   ```
   Look for: "✅ Auto-paid: Electricity Bill - ₹5,000"
   ```

4. **Verify Payment Processed**
   ```
   Check reminder: Should show "Paid" status
   Check bank account: Balance should decrease
   Check transactions: New entry should exist
   ```

### Expected Results:

✅ Reminder marked as completed (green/dimmed)
✅ Bank account balance reduced by payment amount
✅ Transaction created in Transactions tab
✅ Browser notification: "Payment Processed"
✅ Last paid date recorded

---

## Test 5: Transaction Reflection in Reports ✅

**Objective**: Verify auto-deducted payments appear in Reports

### After Test 4 (Payment Processed):

1. **Navigate to Reports Tab**
   ```
   Click: Reports in navbar
   ```

2. **Check Summary Cards**
   ```
   Should see: Expenses increased by payment amount
   Example: If payment was ₹5,000, expenses show +₹5,000
   ```

3. **Check Daily Breakdown Chart**
   ```
   Find: Today's date (day 15) on graph
   Should see: Spike in expenses (red area)
   Height: Represents payment amount
   ```

4. **Check Category Breakdown**
   ```
   Look at: Pie chart
   Should see: "Utilities" or "Credit Card Payment" slice
   Percentage: Based on total expenses
   ```

5. **Check Individual Account Report**
   ```
   Find: Your bank account section
   Should show:
   - Expenses: Includes payment amount
   - Net: Reduced by payment
   - Graph: Shows expense bar
   ```

### Expected Results:

✅ Summary cards include payment in expenses
✅ Daily graph shows expense spike on due date
✅ Category pie chart includes payment category
✅ Account report reflects transaction
✅ All numbers add up correctly

---

## Test 6: Transaction Reflection in Analytics ✅

**Objective**: Verify payments appear in Analytics charts

### After Test 4 (Payment Processed):

1. **Navigate to Analytics Tab**
   ```
   Click: Analytics in navbar
   ```

2. **Check Income vs Expenses Chart**
   ```
   Time range: Last Month
   Should see: Expense bar (red) for payment date
   Height: Corresponds to payment amount
   ```

3. **Check Category Analysis**
   ```
   Look for: Expenses by Category pie chart
   Should see: Payment category represented
   Hover: Shows exact amount
   ```

4. **Check Account-Specific Analysis**
   ```
   Find: Your bank account section
   Should show:
   - Total Expenses: Includes payment
   - Net Flow: Reduced by payment
   - Graph: Visual representation
   ```

5. **Check Cash Flow Overview**
   ```
   Verify: Outflow includes payment amount
   Net Flow: Correctly calculated with payment
   ```

### Expected Results:

✅ Income vs Expense chart updated
✅ Category analysis includes payment
✅ Account metrics reflect transaction
✅ Cash flow calculations accurate
✅ All time ranges show data correctly

---

## Test 7: Monthly Protection (No Duplicate Payments) ✅

**Objective**: Verify system doesn't pay twice in same month

### Setup:

1. **Create Reminder Due Today**
   ```
   Amount: ₹1,000
   Account: Any with sufficient balance
   ```

2. **Wait for First Payment**
   ```
   Refresh page
   Wait for system check
   Verify: Payment processed (check console)
   ```

3. **Trigger Another Check**
   ```
   Refresh page again
   Wait another hour
   ```

4. **Verify No Second Payment**
   ```
   Check console: No "Auto-paid" message
   Check transactions: Only ONE entry exists
   Check reminder: Still marked as paid
   ```

### Expected Results:

✅ Only ONE transaction created
✅ Reminder stays completed
✅ No duplicate deduction
✅ Last paid date preserved
✅ System correctly prevents double-payment

---

## Test 8: Multiple Reminders Different Accounts ✅

**Objective**: Test multiple reminders with different linked accounts

### Setup:

1. **Create Multiple Bank Accounts**
   ```
   Account 1: HDFC Bank, Balance: ₹10,000
   Account 2: ICICI Bank, Balance: ₹8,000
   Account 3: SBI Bank, Balance: ₹5,000
   ```

2. **Create Multiple Reminders**
   ```
   Reminder 1: Rent ₹5,000 from HDFC (due 1st)
   Reminder 2: Credit Card ₹3,000 from ICICI (due 15th)
   Reminder 3: Electricity ₹2,000 from SBI (due 20th)
   ```

3. **Set Dates to Today** (for testing)
   ```
   Change system date to match one of the due dates
   Or create all due today
   ```

4. **Verify Each Processes Correctly**
   ```
   HDFC: Should deduct ₹5,000, balance → ₹5,000
   ICICI: Should deduct ₹3,000, balance → ₹5,000
   SBI: Should deduct ₹2,000, balance → ₹3,000
   ```

### Expected Results:

✅ Each reminder deducts from correct account
✅ Account balances update independently
✅ Transactions show correct account linkage
✅ Reports separate by account
✅ No cross-contamination between accounts

---

## Test 9: Browser Notifications ✅

**Objective**: Verify browser notifications work

### Steps:

1. **Allow Notifications**
   ```
   When prompted by browser: Click "Allow"
   Or manually enable in browser settings
   ```

2. **Trigger Alert** (insufficient balance)
   ```
   Follow Test 2 setup
   Wait for alert
   ```

3. **Check Notification**
   ```
   Should see: Browser notification in system tray
   Title: "⚠️ Insufficient Balance Alert"
   Body: Details about shortfall
   Click: Opens app (if implemented)
   ```

4. **Test Payment Notification**
   ```
   Trigger auto-deduction (Test 4)
   Should see: "Payment Processed" notification
   ```

### Expected Results:

✅ Notifications appear even when browsing other tabs
✅ Correct title and message
✅ Icon shows (favicon)
✅ Non-intrusive but noticeable
✅ Clicking opens app/focuses window

---

## Test 10: Edge Cases & Error Handling ✅

**Objective**: Test system handles edge cases gracefully

### Test 10A: Cash Payment (No Balance Check)
```
Create reminder with account: "Cash"
Amount: Any value
Due date: Today
Expected: NO insufficient balance alert (cash doesn't check balance)
```

### Test 10B: Invalid Amount
```
Try to create reminder with: Amount = 0 or negative
Expected: Validation error, cannot save
```

### Test 10C: Missing Title
```
Try to create reminder with: Empty title
Expected: Validation error, cannot save
```

### Test 10D: Invalid Date
```
Try to create reminder with: Day = 32 or 0
Expected: Validation prevents or auto-corrects
```

### Test 10E: Account Deleted After Reminder Created
```
Create reminder linked to account
Delete the bank account
Wait for due date
Expected: System uses fallback ("Selected Account")
```

### Test 10F: Very Large Amount
```
Create reminder with: Amount = 999999999
Expected: Handles gracefully, no crashes
```

---

## Performance Testing

### Test 11: Many Reminders

**Objective**: Ensure system performs well with many reminders

### Setup:

```
Create: 20+ different reminders
Various amounts, dates, accounts
Wait: For hourly check
Measure: Page load time, check speed
```

### Expected:

✅ No lag or freezing
✅ Checks complete quickly (< 1 second)
✅ UI remains responsive
✅ Memory usage reasonable
✅ No console errors

---

## Troubleshooting Common Issues

### Issue: Alert Not Appearing

**Possible Causes**:
1. Browser notifications blocked
2. Reminder set to "Cash" (no balance check)
3. Not 1 day before or on due date
4. Already paid this month

**Solutions**:
```
1. Enable notifications in browser settings
2. Link reminder to actual bank account
3. Change system date or wait for due date
4. Reset reminder completion status
```

### Issue: Transaction Not in Reports

**Possible Causes**:
1. Wrong date range selected
2. Filter applied
3. Transaction not saved properly

**Solutions**:
```
1. Expand Reports date range
2. Remove active filters
3. Check Transactions tab first
4. Refresh page
```

### Issue: Wrong Amount Deducted

**Cause**: Reminder amount not updated before due date

**Solution**:
```
Edit reminder BEFORE due date
Update to correct amount
Save
System will use new amount
```

### Issue: Duplicate Payment

**Note**: This should NOT happen due to monthly protection

**If it does**:
```
Check: lastPaid field in reminder
Verify: System clock accuracy
Review: Console logs for duplicate checks
```

---

## Testing Checklist

Use this checklist to ensure all features work:

### Basic Functionality
- [ ] Can create payment reminder
- [ ] Can edit reminder amount
- [ ] Can delete reminder
- [ ] Can toggle completion status

### Insufficient Balance Alert
- [ ] Alert triggers 1 day before due date
- [ ] Alert triggers on due date
- [ ] Modal shows correct information
- [ ] Shortfall calculated correctly
- [ ] Browser notification appears
- [ ] Dismiss button works
- [ ] Add Cash Now button works

### Auto-Deduction
- [ ] Payment processes on due date
- [ ] Correct amount deducted
- [ ] From correct account
- [ ] Transaction created
- [ ] Balance updated
- [ ] Reminder marked as paid
- [ ] Notification sent

### Data Reflection
- [ ] Transaction appears in Transactions tab
- [ ] Included in Reports summary cards
- [ ] Shows in Reports daily graph
- [ ] Appears in Reports category pie
- [ ] Reflected in Reports account section
- [ ] Shows in Analytics income vs expense
- [ ] Appears in Analytics category analysis
- [ ] Included in Analytics account metrics

### Edge Cases
- [ ] Cash payments skip balance check
- [ ] Validation prevents invalid inputs
- [ ] Monthly protection prevents duplicates
- [ ] Multiple reminders work independently
- [ ] Deleted accounts handled gracefully

### Performance
- [ ] Fast response times
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] No console errors
- [ ] Works offline (localStorage)

---

## Success Criteria

All tests pass if:

✅ Users can create and edit reminders
✅ Alerts appear when balance insufficient
✅ Auto-deduction works on due date
✅ All transactions flow through entire system
✅ Reports and Analytics always up-to-date
✅ No crashes or errors
✅ Good performance

---

## Quick Test Script (5 Minutes)

For rapid verification:

```
1. Create reminder: Credit Card, ₹5,000, due today, linked to bank
2. Ensure bank has < ₹5,000 balance
3. Refresh page, wait 1 minute
4. Verify: Alert modal appears
5. Click: Add Cash Now
6. Verify: Cash transaction created
7. Wait: For hourly check (or refresh multiple times)
8. Verify: Payment auto-deducted
9. Go to: Reports tab
10. Verify: Graph includes payment
11. Go to: Analytics tab
12. Verify: Charts updated
```

If all steps work → **Core features functional!** ✅

---

## Final Notes

### Best Testing Practices:

1. **Test in order**: Each test builds on previous
2. **Clear localStorage**: Between major test sessions
3. **Check console**: For debug messages
4. **Document issues**: Note any unexpected behavior
5. **Test on multiple browsers**: Chrome, Firefox, Edge

### Reporting Bugs:

If you find issues, note:
- Steps to reproduce
- Expected vs actual behavior
- Browser/console errors
- Screenshots if helpful

---

**Happy Testing!** 🧪✅

All features should work seamlessly. If anything doesn't work, check the troubleshooting section or review the implementation documentation.

// Run this script to apply fixes automatically
const fs = require('fs');
const path = require('path');

const appFilePath = path.join(__dirname, 'client', 'src', 'App.jsx');
const dashboardNewPath = path.join(__dirname, 'client', 'src', 'pages', 'DashboardNew.jsx');

console.log('🔧 Applying critical fixes...\n');

// Fix 1: Update App.jsx imports
let appContent = fs.readFileSync(appFilePath, 'utf8');

console.log('1. Updating App.jsx imports...');
appContent = appContent.replace(
  /import { Menu, X, Wallet, User, BarChart3, FileText, Settings, Home, LogOut, Sun, Moon, Calculator, AlertTriangle, MessageSquare, PiggyBank, Edit3, Trash2, Users, Shield, Lock, CheckCircle, Brain, Eye, Bell, CreditCard, Download, Globe } from 'lucide-react';/,
  "import { Wallet, Calculator, AlertTriangle, MessageSquare, PiggyBank, Edit3, Trash2, Users, Shield, Lock, CheckCircle, Brain, Eye } from 'lucide-react';"
);

console.log('2. Adding Navbar import...');
appContent = appContent.replace(
  "// Import new page components\nimport DashboardNew",
  "// Import new page components\nimport Navbar from './components/Navbar';\nimport DashboardNew"
);

console.log('3. Removing old Navbar component definition...');
const navbarStart = appContent.indexOf('// Mobile-Friendly Navbar Component\nconst Navbar = ({ activeTab, setActiveTab, user, onLogout }) => {');
const navbarEnd = appContent.indexOf('};\n\n// Main App Component with Theme and Notification Providers');
if (navbarStart !== -1 && navbarEnd !== -1) {
  appContent = appContent.substring(0, navbarStart) + appContent.substring(navbarEnd + 2);
  console.log('   ✅ Removed Navbar component (lines 156-554)');
} else {
  console.log('   ⚠️  Could not find Navbar component boundaries');
}

console.log('4. Updating Navbar usage...');
appContent = appContent.replace(
  /<Navbar \s+activeTab={activeTab} \s+setActiveTab={setActiveTab} \s+user={user}\s+onLogout={handleLogout}\s+\/>/g,
  '<Navbar \n          user={user}\n          onLogout={handleLogout}\n        />'
);

fs.writeFileSync(appFilePath, appContent, 'utf8');
console.log('✅ App.jsx updated successfully!\n');

// Fix 2: Add Settings tile to DashboardNew
console.log('5. Adding Settings tile to DashboardNew.jsx...');
let dashboardContent = fs.readFileSync(dashboardNewPath, 'utf8');

const settingsTile = `        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          color: 'from-indigo-500 to-purple-500',
          description: 'Profile, notifications & privacy'
        },`;

// Find the Advanced Tools section and add Settings before closing bracket
const advancedToolsMatch = dashboardContent.match(/({\s+title: 'Advanced Tools',[\s\S]*?features:\s*\[[\s\S]*?\]\s*})/);
if (advancedToolsMatch) {
  const advancedToolsSection = advancedToolsMatch[0];
  const lastFeatureEnd = advancedToolsSection.lastIndexOf(']');
  const modifiedSection = advancedToolsSection.substring(0, lastFeatureEnd) + '\n' + settingsTile + '\n      ' + advancedToolsSection.substring(lastFeatureEnd);
  dashboardContent = dashboardContent.replace(advancedToolsSection, modifiedSection);
  console.log('   ✅ Added Settings tile to Advanced Tools');
} else {
  console.log('   ⚠️  Could not find Advanced Tools section');
}

fs.writeFileSync(dashboardNewPath, dashboardContent, 'utf8');
console.log('✅ DashboardNew.jsx updated successfully!\n');

console.log('🎉 All fixes applied! Restart the dev server to test.');
console.log('📝 Note: You may still need to manually fix TransactionsPage data persistence issue.\n');

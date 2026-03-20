import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Button, 
  FAB, 
  Divider,
  ActivityIndicator,
  useTheme,
  Chip
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import AIChatAssistant from '../components/AIChatAssistant';
import VoiceAssistant from '../components/VoiceAssistant';

const DashboardScreen = ({ navigation, user, onLogout }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState([]);
  const [showAIChat, setShowAIChat] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    loadTransactions();
    loadPaymentReminders();
  }, []);

  const loadTransactions = async () => {
    try {
      const storedTransactions = await AsyncStorage.getItem(`transactions_${user.id}`);
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
    } catch (error) {
      console.log('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem(`payment_reminders_${user.id}`);
      if (savedReminders) {
        setPaymentReminders(JSON.parse(savedReminders));
      }
    } catch (error) {
      console.log('Error loading payment reminders:', error);
    }
  };

  const handleVoiceTransaction = (transaction) => {
    // Add transaction from voice assistant
    addTransactionToLocal(transaction);
  };

  const addTransactionToLocal = async (newTransaction) => {
    try {
      const transaction = {
        ...newTransaction,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      const updatedTransactions = [...transactions, transaction];
      await AsyncStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTransactions));
      setTransactions(updatedTransactions);
      Alert.alert('Success', 'Transaction added via voice!');
    } catch (error) {
      console.log('Error adding voice transaction:', error);
    }
  };

  const calculateSummary = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
    const totalExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
    const netBalance = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, netBalance };
  };

  const handleAddTransaction = () => {
    navigation.navigate('AddTransaction', { 
      userId: user.id, 
      onTransactionAdded: loadTransactions 
    });
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const { totalIncome, totalExpenses, netBalance } = calculateSummary();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title style={styles.welcomeTitle}>
              Welcome back, {user.name}!
            </Title>
            <Text style={styles.welcomeSubtitle}>
              Continue tracking your expenses on the go
            </Text>
          </Card.Content>
        </Card>

        {/* Quick Actions - AI Assistants */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#6200ee' }]}
            onPress={() => setShowAIChat(true)}
          >
            <Ionicons name="chatbubbles" size={24} color="white" />
            <Text style={styles.quickActionText}>AI Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#ff9800' }]}
            onPress={() => navigation.navigate('Reminders')}
          >
            <Ionicons name="notifications" size={24} color="white" />
            <Text style={styles.quickActionText}>Reminders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#4caf50' }]}
            onPress={() => navigation.navigate('Reports')}
          >
            <Ionicons name="analytics" size={24} color="white" />
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Reminders Summary */}
        {paymentReminders.length > 0 && (
          <Card style={styles.remindersSummaryCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={styles.cardTitle}>Upcoming Payments</Title>
                <Button 
                  mode="text" 
                  onPress={() => navigation.navigate('Reminders')}
                  textColor={colors.primary}
                >
                  View All
                </Button>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.remindersList}>
                {paymentReminders.slice(0, 3).map((reminder) => (
                  <View key={reminder.id} style={styles.reminderItem}>
                    <View style={styles.reminderInfo}>
                      <Text style={styles.reminderTitle}>{reminder.title}</Text>
                      <Text style={styles.reminderDate}>Due: {reminder.date}{['st', 'nd', 'rd'][((parseInt(reminder.date) % 10) - 1)] || 'th'}</Text>
                    </View>
                    <Text style={styles.reminderAmount}>₹{parseFloat(reminder.amount).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={[styles.summaryCard, { backgroundColor: '#e8f5e8' }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>
                ₹{totalIncome.toLocaleString()}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, { backgroundColor: '#ffebee' }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: '#c62828' }]}>
                ₹{totalExpenses.toLocaleString()}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Balance</Text>
              <Text style={[styles.summaryValue, { color: netBalance >= 0 ? '#1565c0' : '#c62828' }]}>
                ₹{netBalance.toLocaleString()}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Transactions */}
        <Card style={styles.transactionsCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Recent Transactions</Title>
              <Button 
                mode="text" 
                onPress={handleAddTransaction}
                textColor={colors.primary}
              >
                Add New
              </Button>
            </View>
            
            <Divider style={styles.divider} />
            
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>Add your first transaction to get started!</Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.slice(0, 5).map((transaction, index) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.merchant} numberOfLines={1}>
                        {transaction.merchant || transaction.description || 'N/A'}
                      </Text>
                      <Text style={styles.category}>
                        {transaction.category || 'Uncategorized'}
                      </Text>
                      <Text style={styles.date}>
                        {new Date(transaction.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[
                      styles.amount,
                      { color: transaction.type === 'credit' ? '#2e7d32' : '#c62828' }
                    ]}>
                      {transaction.type === 'credit' ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleSettings}
            style={styles.actionButton}
            textColor={colors.primary}
          >
            Settings
          </Button>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.actionButton}
            textColor="#c62828"
          >
            Logout
          </Button>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddTransaction}
      />
      
      {/* Voice Assistant Button */}
      <VoiceAssistant 
        onTransactionDetected={handleVoiceTransaction}
        bankAccounts={[]}
      />
      
      {/* AI Chat Assistant Modal */}
      <AIChatAssistant 
        transactions={transactions}
        bankAccounts={[]}
        isVisible={showAIChat}
        setIsVisible={setShowAIChat}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  welcomeCard: {
    margin: 16,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    color: '#666',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  quickActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  remindersSummaryCard: {
    margin: 16,
    marginBottom: 0,
    elevation: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionsCard: {
    margin: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  remindersList: {
    marginTop: 8,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  reminderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  reminderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  transactionsList: {
    marginTop: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionInfo: {
    flex: 1,
  },
  merchant: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    margin: 20,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

export default DashboardScreen;
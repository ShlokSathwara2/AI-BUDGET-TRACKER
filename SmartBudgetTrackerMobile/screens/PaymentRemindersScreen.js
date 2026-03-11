import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Button, 
  TextInput,
  List,
  Divider,
  FAB,
  Chip,
  IconButton,
  useTheme
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const PaymentRemindersScreen = ({ navigation, userId }) => {
  const [reminders, setReminders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [insufficientData, setInsufficientData] = useState(null);
  const theme = useTheme();
  
  const [newReminder, setNewReminder] = useState({
    title: '',
    amount: '',
    date: '',
    type: 'credit_card',
    frequency: 'monthly',
    account: 'cash'
  });

  // Load bank accounts
  useEffect(() => {
    loadBankAccounts();
  }, []);

  // Load reminders
  useEffect(() => {
    loadReminders();
  }, [userId]);

  // Check for insufficient balance periodically
  useEffect(() => {
    const checkBalanceInterval = setInterval(() => {
      checkInsufficientBalance();
    }, 3600000); // Every hour

    return () => clearInterval(checkBalanceInterval);
  }, [reminders, bankAccounts]);

  const loadBankAccounts = async () => {
    try {
      const savedAccounts = await AsyncStorage.getItem(`bank_accounts_${userId}`);
      if (savedAccounts) {
        setBankAccounts(JSON.parse(savedAccounts));
      }
    } catch (error) {
      console.log('Error loading bank accounts:', error);
    }
  };

  const loadReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem(`payment_reminders_${userId}`);
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }
    } catch (error) {
      console.log('Error loading reminders:', error);
    }
  };

  const saveReminders = async (updatedReminders) => {
    try {
      await AsyncStorage.setItem(`payment_reminders_${userId}`, JSON.stringify(updatedReminders));
    } catch (error) {
      console.log('Error saving reminders:', error);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newReminder.title.trim()) errors.title = 'Title is required';
    if (!newReminder.amount || parseFloat(newReminder.amount) <= 0) errors.amount = 'Valid amount required';
    if (!newReminder.date || parseInt(newReminder.date) < 1 || parseInt(newReminder.date) > 31) errors.date = 'Date must be 1-31';
    return errors;
  };

  const handleAddReminder = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      Alert.alert('Error', Object.values(errors)[0]);
      return;
    }

    try {
      const reminder = {
        id: Date.now().toString(),
        ...newReminder,
        amount: parseFloat(newReminder.amount),
        completed: false,
        createdAt: new Date().toISOString()
      };

      const updatedReminders = [...reminders, reminder];
      setReminders(updatedReminders);
      await saveReminders(updatedReminders);
      
      setNewReminder({ title: '', amount: '', date: '', type: 'credit_card', frequency: 'monthly', account: 'cash' });
      setShowAddForm(false);
      Alert.alert('Success', 'Payment reminder added successfully!');
    } catch (error) {
      console.log('Error adding reminder:', error);
      Alert.alert('Error', 'Failed to add reminder');
    }
  };

  const handleEditReminder = async () => {
    if (!editingReminder) return;
    
    try {
      const updatedReminders = reminders.map(r => 
        r.id === editingReminder.id ? editingReminder : r
      );
      setReminders(updatedReminders);
      await saveReminders(updatedReminders);
      
      setEditingReminder(null);
      Alert.alert('Success', 'Reminder updated successfully!');
    } catch (error) {
      console.log('Error editing reminder:', error);
    }
  };

  const handleDeleteReminder = async (id) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const updatedReminders = reminders.filter(r => r.id !== id);
              setReminders(updatedReminders);
              await saveReminders(updatedReminders);
              Alert.alert('Success', 'Reminder deleted');
            } catch (error) {
              console.log('Error deleting reminder:', error);
            }
          }
        }
      ]
    );
  };

  const checkInsufficientBalance = async () => {
    const today = new Date();
    const todayDate = today.getDate();
    
    for (const reminder of reminders) {
      if (reminder.account !== 'cash' && !reminder.completed) {
        const account = bankAccounts.find(acc => acc.id === reminder.account);
        if (account) {
          const balance = account.balance || 0;
          const requiredAmount = reminder.amount;
          
          // Check 1 day before and on due date
          const isDueSoon = todayDate === parseInt(reminder.date) - 1 || todayDate === parseInt(reminder.date);
          
          if (isDueSoon && balance < requiredAmount) {
            setInsufficientData({
              reminder,
              account,
              balance,
              requiredAmount,
              shortfall: requiredAmount - balance
            });
            setShowInsufficientModal(true);
            
            // Show local notification
            Alert.alert(
              '⚠️ Insufficient Balance',
              `${account.name} has only ₹${balance.toLocaleString()}, but ₹${requiredAmount.toLocaleString()} is needed for ${reminder.title}`
            );
          }
        }
      }
    }
  };

  const getFrequencyIcon = (frequency) => {
    switch(frequency) {
      case 'daily': return 'calendar-today';
      case 'weekly': return 'calendar-week';
      case 'monthly': return 'calendar-month';
      case 'yearly': return 'calendar-account';
      default: return 'calendar';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'credit_card': return '#ff5252';
      case 'loan': return '#ff9800';
      case 'subscription': return '#4caf50';
      case 'utility': return '#2196f3';
      case 'rent': return '#9c27b0';
      default: return '#6200ee';
    }
  };

  const renderReminderCard = (reminder) => {
    const account = bankAccounts.find(acc => acc.id === reminder.account);
    const accountName = reminder.account === 'cash' ? 'Cash' : (account?.name || 'Unknown');
    
    return (
      <Card key={reminder.id} style={styles.reminderCard}>
        <Card.Content>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderTitleContainer}>
              <Title style={styles.reminderTitle}>{reminder.title}</Title>
              <Chip 
                mode="flat" 
                textStyle={{ fontSize: 12 }}
                style={[styles.typeChip, { backgroundColor: getTypeColor(reminder.type) + '20' }]}
              >
                {reminder.type.replace('_', ' ')}
              </Chip>
            </View>
            <View style={styles.reminderActions}>
              <IconButton 
                icon="pencil" 
                size={20} 
                onPress={() => setEditingReminder(reminder)} 
              />
              <IconButton 
                icon="delete" 
                size={20} 
                onPress={() => handleDeleteReminder(reminder.id)} 
              />
            </View>
          </View>
          
          <View style={styles.reminderDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={18} color="#666" />
              <Text style={styles.detailText}>₹{reminder.amount.toLocaleString()}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.detailText}>Due: {reminder.date}{['st', 'nd', 'rd'][((parseInt(reminder.date) % 10) - 1)] || 'th'} of every month</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="repeat" size={18} color="#666" />
              <Text style={styles.detailText}>{reminder.frequency}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="wallet-outline" size={18} color="#666" />
              <Text style={styles.detailText}>Account: {accountName}</Text>
            </View>
          </View>
          
          {reminder.lastPaid && (
            <View style={styles.lastPaidContainer}>
              <Text style={styles.lastPaidText}>
                Last paid: {new Date(reminder.lastPaid).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>Payment Reminders</Title>
            <Text style={styles.headerSubtitle}>
              Never miss a payment with automated reminders and auto-deduction
            </Text>
          </Card.Content>
        </Card>

        {/* Feature Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoText}>
              💡 Tip: You can edit reminder amounts before the due date for variable bills like credit cards
            </Text>
          </Card.Content>
        </Card>

        {/* Reminders List */}
        {reminders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
                <Title style={styles.emptyTitle}>No Payment Reminders</Title>
                <Text style={styles.emptyText}>
                  Add your first recurring payment to get started
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.remindersList}>
            {reminders.map(renderReminderCard)}
          </View>
        )}
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={showAddForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Add Payment Reminder</Title>
            
            <TextInput
              label="Title"
              value={newReminder.title}
              onChangeText={(text) => setNewReminder({...newReminder, title: text})}
              mode="outlined"
              placeholder="e.g., Credit Card Bill, Rent"
              style={styles.input}
            />
            
            <TextInput
              label="Amount"
              value={newReminder.amount}
              onChangeText={(text) => setNewReminder({...newReminder, amount: text})}
              mode="outlined"
              keyboardType="numeric"
              placeholder="Enter amount"
              style={styles.input}
              left={<TextInput.Affix text="₹" />}
            />
            
            <TextInput
              label="Due Date (Day of Month)"
              value={newReminder.date}
              onChangeText={(text) => setNewReminder({...newReminder, date: text.replace(/\D/g, '')})}
              mode="outlined"
              keyboardType="numeric"
              placeholder="1-31"
              maxLength={2}
              style={styles.input}
            />
            
            <Text style={styles.label}>Payment Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {['credit_card', 'loan', 'subscription', 'utility', 'rent', 'other'].map((type) => (
                <Chip
                  key={type}
                  selected={newReminder.type === type}
                  onPress={() => setNewReminder({...newReminder, type})}
                  style={[styles.typeChip, { backgroundColor: newReminder.type === type ? getTypeColor(type) : '#f0f0f0' }]}
                  textStyle={{ color: newReminder.type === type ? '#fff' : '#333' }}
                >
                  {type.replace('_', ' ')}
                </Chip>
              ))}
            </ScrollView>
            
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.frequencyContainer}>
              {['daily', 'weekly', 'monthly', 'yearly'].map((freq) => (
                <Button
                  key={freq}
                  mode={newReminder.frequency === freq ? 'contained' : 'outlined'}
                  onPress={() => setNewReminder({...newReminder, frequency: freq})}
                  style={styles.frequencyButton}
                >
                  {freq}
                </Button>
              ))}
            </View>
            
            <Text style={styles.label}>Payment Account</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountSelector}>
              <Chip
                selected={newReminder.account === 'cash'}
                onPress={() => setNewReminder({...newReminder, account: 'cash'})}
                style={[styles.accountChip, { backgroundColor: newReminder.account === 'cash' ? '#4caf50' : '#f0f0f0' }]}
                textStyle={{ color: newReminder.account === 'cash' ? '#fff' : '#333' }}
              >
                Cash
              </Chip>
              {bankAccounts.map((acc) => (
                <Chip
                  key={acc.id}
                  selected={newReminder.account === acc.id}
                  onPress={() => setNewReminder({...newReminder, account: acc.id})}
                  style={[styles.accountChip, { backgroundColor: newReminder.account === acc.id ? '#2196f3' : '#f0f0f0' }]}
                  textStyle={{ color: newReminder.account === acc.id ? '#fff' : '#333' }}
                >
                  {acc.name}
                </Chip>
              ))}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowAddForm(false);
                  setNewReminder({ title: '', amount: '', date: '', type: 'credit_card', frequency: 'monthly', account: 'cash' });
                }}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddReminder}
                style={styles.modalButton}
              >
                Add Reminder
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Reminder Modal */}
      <Modal visible={!!editingReminder} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Edit Payment Reminder</Title>
            
            <TextInput
              label="Amount (Editable for variable bills)"
              value={editingReminder?.amount?.toString() || ''}
              onChangeText={(text) => setEditingReminder({...editingReminder, amount: text})}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              left={<TextInput.Affix text="₹" />}
            />
            
            <Text style={styles.editNote}>
              💡 Changing the amount will update future payments. Historical data is preserved.
            </Text>
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setEditingReminder(null)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleEditReminder}
                style={styles.modalButton}
              >
                Save Changes
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Insufficient Balance Modal */}
      <Modal visible={showInsufficientModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.insufficientModal, { borderColor: '#ff5252' }]}>
            <View style={styles.insufficientHeader}>
              <Ionicons name="warning" size={32} color="#ff5252" />
              <Title style={styles.insufficientTitle}>Insufficient Balance!</Title>
            </View>
            
            {insufficientData && (
              <>
                <Text style={styles.insufficientText}>
                  {insufficientData.account.name} has only{' '}
                  <Text style={styles.highlightText}>₹{insufficientData.balance.toLocaleString()}</Text>
                  {' '}but needs{' '}
                  <Text style={styles.highlightText}>₹{insufficientData.requiredAmount.toLocaleString()}</Text>
                  {' '}for{' '}
                  <Text style={styles.boldText}>{insufficientData.reminder.title}</Text>
                </Text>
                
                <Card style={styles.shortfallCard}>
                  <Card.Content>
                    <View style={styles.shortfallRow}>
                      <Text style={styles.shortfallLabel}>Shortfall:</Text>
                      <Text style={styles.shortfallAmount}>₹{insufficientData.shortfall.toLocaleString()}</Text>
                    </View>
                  </Card.Content>
                </Card>
                
                <View style={styles.insufficientActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowInsufficientModal(false)}
                    style={styles.actionButton}
                  >
                    Dismiss
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      // Navigate to add cash screen
                      setShowInsufficientModal(false);
                      navigation.navigate('Transactions', { 
                        prefillAmount: insufficientData.shortfall,
                        prefilledType: 'credit'
                      });
                    }}
                    style={styles.actionButton}
                  >
                    Add Cash Now
                  </Button>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddForm(true)}
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
  headerCard: {
    margin: 16,
    elevation: 2,
    backgroundColor: '#6200ee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    fontStyle: 'italic',
  },
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  remindersList: {
    paddingHorizontal: 16,
  },
  reminderCard: {
    marginBottom: 16,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderTitleContainer: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  typeChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  reminderActions: {
    flexDirection: 'row',
  },
  reminderDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  lastPaidContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  lastPaidText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  typeSelector: {
    marginBottom: 16,
    maxHeight: 50,
  },
  typeChip: {
    marginRight: 8,
    paddingHorizontal: 8,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  frequencyButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  accountSelector: {
    marginBottom: 16,
    maxHeight: 50,
  },
  accountChip: {
    marginRight: 8,
    paddingHorizontal: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 0.48,
  },
  editNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 18,
  },
  insufficientModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    borderWidth: 3,
  },
  insufficientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insufficientTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#ff5252',
  },
  insufficientText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#ff5252',
  },
  boldText: {
    fontWeight: 'bold',
  },
  shortfallCard: {
    backgroundColor: '#ffebee',
    marginBottom: 16,
  },
  shortfallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shortfallLabel: {
    fontSize: 16,
    color: '#c62828',
    fontWeight: 'bold',
  },
  shortfallAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c62828',
  },
  insufficientActions: {
    flexDirection: 'row',
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

export default PaymentRemindersScreen;

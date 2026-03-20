import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title,
  IconButton,
  Chip,
  useTheme
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const AIChatAssistant = ({ transactions = [], bankAccounts = [], isVisible, setIsVisible }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI Financial Advisor. I can help you with budgeting advice, spending analysis, savings recommendations, and financial planning. What would you like to discuss today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Financial analysis functions
  const analyzeSpending = () => {
    if (!transactions || transactions.length === 0) {
      return "I don't have enough transaction data to provide insights yet. Please add some transactions first!";
    }

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentTransactions = transactions.filter(tx => 
      new Date(tx.date) >= oneMonthAgo && tx.type === 'debit'
    );
    
    const totalSpent = recentTransactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    const avgDailySpending = totalSpent / 30;
    
    const categorySpending = {};
    recentTransactions.forEach(tx => {
      const category = tx.category || 'Other';
      categorySpending[category] = (categorySpending[category] || 0) + parseFloat(tx.amount || 0);
    });
    
    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];
    
    return `Based on your recent spending (last 30 days):
• Total spent: ₹${totalSpent.toLocaleString()}
• Average daily spending: ₹${avgDailySpending.toFixed(2)}
• Your biggest spending category: ${topCategory ? `${topCategory[0]} (₹${topCategory[1].toLocaleString()})` : 'No clear pattern'}`;
  };

  const provideSavingsAdvice = () => {
    if (!transactions || transactions.length === 0) {
      return "Please add some transactions so I can analyze your spending patterns and provide personalized savings advice.";
    }

    const incomeTransactions = transactions.filter(tx => tx.type === 'credit');
    const expenseTransactions = transactions.filter(tx => tx.type === 'debit');
    
    const totalIncome = incomeTransactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    const totalExpenses = expenseTransactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    let advice = `Your current savings rate is ${savingsRate.toFixed(1)}%. `;
    
    if (savingsRate < 10) {
      advice += "This is below the recommended 20%. Consider reducing discretionary spending in categories like dining, entertainment, or shopping.";
    } else if (savingsRate < 20) {
      advice += "You're doing well, but could aim for the 20% savings benchmark. Look for small optimizations in your monthly expenses.";
    } else {
      advice += "Excellent! You're maintaining a healthy savings rate. Consider investing some of these savings for better returns.";
    }
    
    return advice;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Process user input and generate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (input) => {
    const lowerInput = input.toLowerCase();
    
    // Spending analysis
    if (lowerInput.includes('spending') || lowerInput.includes('expense') || lowerInput.includes('where did my money go')) {
      return analyzeSpending();
    }
    
    // Savings advice
    if (lowerInput.includes('saving') || lowerInput.includes('save') || lowerInput.includes('invest')) {
      return provideSavingsAdvice();
    }
    
    // Budget help
    if (lowerInput.includes('budget') || lowerInput.includes('plan')) {
      return "Based on your income and expenses, I recommend following the 50/30/20 rule:\n• 50% for Needs (rent, groceries, utilities)\n• 30% for Wants (dining, entertainment)\n• 20% for Savings & Debt Repayment\n\nWould you like me to analyze how well you're following this budget?";
    }
    
    // Financial tips
    if (lowerInput.includes('tip') || lowerInput.includes('advice') || lowerInput.includes('help')) {
      const tips = [
        "💡 Try cooking at home more often - it can save you ₹3,000-5,000 per month compared to dining out!",
        "💰 Set up automatic transfers to your savings account right after payday. Pay yourself first!",
        "📊 Track your expenses for 30 days - awareness is the first step to better money management.",
        "🎯 Create specific savings goals (emergency fund, vacation, etc.) to stay motivated.",
        "💳 Use credit cards wisely - pay the full balance each month to avoid interest charges."
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
    
    // Default response
    return "I'd be happy to help you with your finances! You can ask me about:\n• Your spending patterns\n• Savings recommendations\n• Budget planning\n• Financial tips\n\nWhat would you like to know?";
  };

  const quickActions = [
    { label: 'Analyze Spending', icon: 'trending-down', query: 'Analyze my spending' },
    { label: 'Savings Tips', icon: 'piggy-bank', query: 'Give me savings advice' },
    { label: 'Budget Help', icon: 'wallet', query: 'Help me create a budget' },
    { label: 'Financial Tips', icon: 'lightbulb', query: 'Give me a financial tip' }
  ];

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.chatContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="chatbubbles" size={28} color="#6200ee" />
              <Title style={styles.headerTitle}>AI Financial Advisor</Title>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setIsVisible(false)}
            />
          </View>

          {/* Messages */}
          <ScrollView 
            ref={messagesEndRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.sender === 'user' ? styles.userMessage : styles.aiMessage
                ]}
              >
                {message.sender === 'ai' && (
                  <Ionicons name="robot" size={20} color="#6200ee" style={styles.aiIcon} />
                )}
                <Text style={[
                  styles.messageText,
                  message.sender === 'user' ? styles.userMessageText : styles.aiMessageText
                ]}>
                  {message.text}
                </Text>
              </View>
            ))}
            
            {isTyping && (
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <Ionicons name="robot" size={20} color="#6200ee" style={styles.aiIcon} />
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Actions */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <Chip
                key={index}
                icon={action.icon}
                onPress={() => {
                  setInputValue(action.query);
                  setTimeout(() => handleSend(), 100);
                }}
                style={styles.quickActionChip}
                textStyle={styles.quickActionText}
              >
                {action.label}
              </Chip>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Ask me anything..."
              mode="outlined"
              style={styles.textInput}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={[
                styles.sendButton,
                { backgroundColor: !inputValue.trim() ? '#ccc' : '#6200ee' }
              ]}
              disabled={!inputValue.trim()}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
    maxHeight: 400,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  aiIcon: {
    marginRight: 8,
    marginTop: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  userMessageText: {
    color: 'white',
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  aiMessageText: {
    color: '#333',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  quickActionChip: {
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  quickActionText: {
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AIChatAssistant;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  Title,
  IconButton,
  useTheme
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const VoiceAssistant = ({ onTransactionDetected, bankAccounts = [] }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showModal, setShowModal] = useState(false);
  const theme = useTheme();

  // Simulated voice recognition (in production, would use actual speech recognition)
  const startListening = () => {
    setIsListening(true);
    setShowModal(true);
    
    // Simulate listening for demo purposes
    setTimeout(() => {
      const sampleTranscripts = [
        "Spent 250 rupees at Starbucks for coffee",
        "Added 5000 rupees salary to savings account",
        "Paid 1200 rupees for electricity bill",
        "Spent 800 rupees on groceries at BigBasket"
      ];
      
      const randomTranscript = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
      setTranscript(randomTranscript);
      processVoiceCommand(randomTranscript);
      setIsListening(false);
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
    setShowModal(false);
    setTranscript('');
  };

  const processVoiceCommand = (text) => {
    // Simple parsing logic for voice commands
    const lowerText = text.toLowerCase();
    
    // Extract amount (look for numbers followed by rupees/rs)
    const amountMatch = text.match(/(\d+)\s*(?:rupees|rs|₹)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
    
    // Determine transaction type
    const isCredit = lowerText.includes('added') || lowerText.includes('received') || lowerText.includes('salary');
    const type = isCredit ? 'credit' : 'debit';
    
    // Extract merchant/description
    const merchantMatch = text.match(/(?:at|for|on)\s+(.+)/i);
    const merchant = merchantMatch ? merchantMatch[1].trim() : 'Unknown';
    
    // Auto-categorize
    let category = 'Other';
    if (lowerText.includes('coffee') || lowerText.includes('restaurant') || lowerText.includes('food')) {
      category = 'Food & Dining';
    } else if (lowerText.includes('grocer') || lowerText.includes('vegetable') || lowerText.includes('milk')) {
      category = 'Groceries';
    } else if (lowerText.includes('bill') || lowerText.includes('electricity')) {
      category = 'Utilities';
    } else if (lowerText.includes('salary') || lowerText.includes('income')) {
      category = 'Salary';
    }
    
    if (amount) {
      const transaction = {
        type,
        amount: amount.toString(),
        merchant,
        category,
        date: new Date().toISOString().split('T')[0],
        description: `Voice entry: ${text}`,
        paymentMethod: 'cash',
        bankAccountId: bankAccounts[0]?.id || ''
      };
      
      onTransactionDetected(transaction);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={startListening}
        style={[
          styles.floatingButton,
          { backgroundColor: isListening ? '#ff5252' : '#6200ee' }
        ]}
      >
        <Ionicons 
          name={isListening ? 'mic' : 'mic-outline'} 
          size={28} 
          color="white" 
        />
        {isListening && <View style={styles.pulseRing} />}
      </TouchableOpacity>

      <Modal visible={showModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Card.Content>
              <Title style={styles.modalTitle}>
                {isListening ? 'Listening...' : 'Processing'}
              </Title>
              
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={isListening ? 'mic' : 'checkmark-done'} 
                  size={64} 
                  color={isListening ? '#6200ee' : '#4caf50'} 
                />
              </View>
              
              {transcript ? (
                <Text style={styles.transcript}>{transcript}</Text>
              ) : (
                <Text style={styles.instruction}>
                  Tell me about your transaction...
                </Text>
              )}
              
              <Button
                mode="contained"
                onPress={stopListening}
                style={styles.stopButton}
              >
                {isListening ? 'Stop Listening' : 'Done'}
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: 'rgba(98, 0, 238, 0.3)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  iconContainer: {
    marginVertical: 20,
  },
  transcript: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    fontStyle: 'italic',
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 30,
  },
});

export default VoiceAssistant;

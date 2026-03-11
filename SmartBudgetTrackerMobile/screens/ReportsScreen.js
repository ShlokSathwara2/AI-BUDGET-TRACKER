import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Chip,
  Divider,
  ActivityIndicator,
  useTheme
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Simple bar chart component using Views
const SimpleBarChart = ({ data, width }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = (width - 40) / data.length - 8;
  const maxHeight = 150;
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: maxHeight + 40, paddingHorizontal: 20 }}>
      {data.map((item, index) => (
        <View key={index} style={{ alignItems: 'center', marginRight: 4 }}>
          <View 
            style={[
              styles.bar, 
              { 
                height: (item.value / maxValue) * maxHeight,
                width: barWidth,
                backgroundColor: item.color || '#6200ee'
              }
            ]} 
          />
          <Text style={styles.barLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

// Simple pie chart segment
const PieSegment = ({ startAngle, endAngle, color }) => {
  return (
    <View style={{
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: color,
      transform: [{ rotate: `${startAngle}deg` }],
      overflow: 'hidden',
    }} />
  );
};

const ReportsScreen = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year
  const [reportData, setReportData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    categoryBreakdown: [],
    dailyHistory: [],
    monthlyHistory: []
  });
  const theme = useTheme();

  useEffect(() => {
    loadTransactions();
  }, [userId]);

  useEffect(() => {
    if (transactions.length > 0) {
      generateReport();
    }
  }, [timeRange, transactions]);

  const loadTransactions = async () => {
    try {
      const storedTransactions = await AsyncStorage.getItem(`transactions_${userId}`);
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
    } catch (error) {
      console.log('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    const now = new Date();
    let filteredTransactions = [...transactions];
    
    // Filter by time range
    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredTransactions = transactions.filter(t => new Date(t.date) >= monthAgo);
    }
    // For 'year', show all transactions
    
    // Calculate totals
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
    const netBalance = totalIncome - totalExpenses;
    
    // Category breakdown for expenses
    const categoryMap = {};
    filteredTransactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        const category = t.category || 'Other';
        categoryMap[category] = (categoryMap[category] || 0) + parseFloat(t.amount || 0);
      });
    
    const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
      percentage: totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : 0
    })).sort((a, b) => b.value - a.value);
    
    // Daily history (last 7 days)
    const dailyHistory = [];
    const last7Days = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayTransactions = filteredTransactions.filter(t => t.date === dateStr);
      const dayExpenses = dayTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      dailyHistory.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayExpenses,
        color: dayExpenses > 0 ? '#ff5252' : '#4caf50'
      });
    }
    
    setReportData({
      totalIncome,
      totalExpenses,
      netBalance,
      categoryBreakdown,
      dailyHistory,
      monthlyHistory: []
    });
  };

  const getCategoryColor = (index) => {
    const colors = ['#6200ee', '#03dac6', '#ff5252', '#ffb74d', '#4caf50', '#2196f3', '#ff4081', '#ffd740'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Generating report...</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title style={styles.headerTitle}>Financial Reports</Title>
          <Text style={styles.headerSubtitle}>
            Track your income, expenses, and spending patterns
          </Text>
        </Card.Content>
      </Card>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <Chip
          selected={timeRange === 'week'}
          onPress={() => setTimeRange('week')}
          style={[styles.timeChip, timeRange === 'week' && styles.selectedChip]}
        >
          Week
        </Chip>
        <Chip
          selected={timeRange === 'month'}
          onPress={() => setTimeRange('month')}
          style={[styles.timeChip, timeRange === 'month' && styles.selectedChip]}
        >
          Month
        </Chip>
        <Chip
          selected={timeRange === 'year'}
          onPress={() => setTimeRange('year')}
          style={[styles.timeChip, timeRange === 'year' && styles.selectedChip]}
        >
          Year
        </Chip>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={[styles.summaryCard, { backgroundColor: '#e8f5e8' }]}>
          <Card.Content>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>
              ₹{reportData.totalIncome.toLocaleString()}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, { backgroundColor: '#ffebee' }]}>
          <Card.Content>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#c62828' }]}>
              ₹{reportData.totalExpenses.toLocaleString()}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
          <Card.Content>
            <Text style={styles.summaryLabel}>Net Balance</Text>
            <Text style={[styles.summaryValue, { color: reportData.netBalance >= 0 ? '#1565c0' : '#c62828' }]}>
              ₹{reportData.netBalance.toLocaleString()}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Daily Spending History */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Daily Spending (Last 7 Days)</Title>
          <Divider style={styles.divider} />
          <SimpleBarChart data={reportData.dailyHistory} width={screenWidth - 64} />
        </Card.Content>
      </Card>

      {/* Category Breakdown */}
      <Card style={styles.categoryCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Category Breakdown</Title>
          <Divider style={styles.divider} />
          
          {reportData.categoryBreakdown.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pie-chart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No expense data available</Text>
            </View>
          ) : (
            <View style={styles.categoryList}>
              {reportData.categoryBreakdown.map((category, index) => (
                <View key={category.name} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View 
                      style={[
                        styles.categoryDot, 
                        { backgroundColor: getCategoryColor(index) }
                      ]} 
                    />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryValues}>
                    <Text style={styles.categoryAmount}>₹{category.value.toLocaleString()}</Text>
                    <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Insights */}
      <Card style={styles.insightsCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Key Insights</Title>
          <Divider style={styles.divider} />
          
          <View style={styles.insightList}>
            {reportData.totalExpenses > reportData.totalIncome && (
              <View style={styles.insightItem}>
                <Ionicons name="trending-down" size={20} color="#ff5252" />
                <Text style={styles.insightText}>
                  Your expenses exceed income by ₹{(reportData.totalExpenses - reportData.totalIncome).toLocaleString()}
                </Text>
              </View>
            )}
            
            {reportData.totalExpenses <= reportData.totalIncome && reportData.totalExpenses > 0 && (
              <View style={styles.insightItem}>
                <Ionicons name="trending-up" size={20} color="#4caf50" />
                <Text style={styles.insightText}>
                  You saved ₹{(reportData.totalIncome - reportData.totalExpenses).toLocaleString()} this period
                </Text>
              </View>
            )}
            
            {reportData.categoryBreakdown.length > 0 && (
              <View style={styles.insightItem}>
                <Ionicons name="pie-chart" size={20} color="#2196f3" />
                <Text style={styles.insightText}>
                  Top spending category: {reportData.categoryBreakdown[0].name} ({reportData.categoryBreakdown[0].percentage}%)
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  timeChip: {
    marginHorizontal: 4,
  },
  selectedChip: {
    backgroundColor: '#6200ee',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    paddingVertical: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartCard: {
    margin: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 8,
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryCard: {
    margin: 16,
    elevation: 2,
  },
  categoryList: {
    marginTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
  },
  categoryValues: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  insightsCard: {
    margin: 16,
    marginBottom: 32,
    elevation: 2,
  },
  insightList: {
    marginTop: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
});

export default ReportsScreen;

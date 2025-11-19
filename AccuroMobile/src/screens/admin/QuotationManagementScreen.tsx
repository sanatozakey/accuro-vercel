import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Chip, Menu, IconButton } from 'react-native-paper';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Quotation } from '../../types';
import { COLORS } from '../../constants/colors';

const QuotationManagementScreen = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Quotation[] }>(
        API_ENDPOINTS.QUOTATIONS.BASE
      );
      setQuotations(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveQuotation = async (id: string) => {
    try {
      await api.put(API_ENDPOINTS.QUOTATIONS.APPROVE(id), {
        totalAmount: 10000,
        currency: 'PHP',
        paymentTerms: '30 days',
        deliveryTerms: 'Standard delivery',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      fetchQuotations();
      Alert.alert('Success', 'Quotation approved successfully');
    } catch (error) {
      console.error('Failed to approve quotation:', error);
      Alert.alert('Error', 'Failed to approve quotation');
    } finally {
      setMenuVisible(null);
    }
  };

  const rejectQuotation = async (id: string) => {
    try {
      await api.put(API_ENDPOINTS.QUOTATIONS.REJECT(id), {
        rejectionReason: 'Items not available',
      });
      fetchQuotations();
      Alert.alert('Success', 'Quotation rejected');
    } catch (error) {
      console.error('Failed to reject quotation:', error);
      Alert.alert('Error', 'Failed to reject quotation');
    } finally {
      setMenuVisible(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.warning;
    }
  };

  const renderQuotation = ({ item }: { item: Quotation }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="titleMedium" style={styles.title}>
              {item.quotationNumber}
            </Text>
            <Chip
              style={{ backgroundColor: getStatusColor(item.status) }}
              textStyle={{ color: 'white' }}
              compact
            >
              {item.status.toUpperCase()}
            </Chip>
          </View>
          {item.status === 'pending' && (
            <Menu
              visible={menuVisible === item._id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(item._id)}
                />
              }
            >
              <Menu.Item
                onPress={() => approveQuotation(item._id)}
                title="Approve"
              />
              <Menu.Item
                onPress={() => rejectQuotation(item._id)}
                title="Reject"
              />
            </Menu>
          )}
        </View>

        <Text variant="bodyMedium">Items: {item.items.length}</Text>
        <Text variant="bodySmall" style={styles.date}>
          Requested: {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        {item.totalAmount && (
          <Text variant="titleSmall" style={styles.amount}>
            Total: {item.currency} {item.totalAmount.toLocaleString()}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading quotations..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quotations}
        renderItem={renderQuotation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No quotations found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  date: {
    opacity: 0.6,
    marginTop: 4,
  },
  amount: {
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 8,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
});

export default QuotationManagementScreen;

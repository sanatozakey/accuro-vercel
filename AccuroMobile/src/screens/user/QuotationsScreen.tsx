import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Quotation } from '../../types';
import { COLORS } from '../../constants/colors';

const QuotationsScreen = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

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
          <Text variant="titleMedium" style={styles.title}>
            {item.quotationNumber}
          </Text>
          <Chip
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: 'white' }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.detail}>
          Items: {item.items.length}
        </Text>

        {item.totalAmount && (
          <Text variant="titleSmall" style={styles.amount}>
            Total: {item.currency} {item.totalAmount.toLocaleString()}
          </Text>
        )}

        {item.validUntil && (
          <Text variant="bodySmall" style={styles.validity}>
            Valid Until: {new Date(item.validUntil).toLocaleDateString()}
          </Text>
        )}

        {item.rejectionReason && (
          <Text variant="bodySmall" style={styles.rejection}>
            Reason: {item.rejectionReason}
          </Text>
        )}

        <Text variant="bodySmall" style={styles.date}>
          Requested on: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
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
            <Text variant="bodyLarge">No quotations yet</Text>
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
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  detail: {
    marginBottom: 4,
  },
  amount: {
    color: '#007AFF',
    fontWeight: 'bold',
    marginVertical: 8,
  },
  validity: {
    opacity: 0.7,
    marginTop: 4,
  },
  rejection: {
    color: COLORS.error,
    marginTop: 8,
  },
  date: {
    opacity: 0.6,
    marginTop: 8,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
});

export default QuotationsScreen;

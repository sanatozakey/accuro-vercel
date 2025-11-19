import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Booking } from '../../types';
import { COLORS } from '../../constants/colors';

const BookingHistoryScreen = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Booking[] }>(
        API_ENDPOINTS.BOOKINGS.BASE
      );
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return COLORS.status.confirmed;
      case 'completed':
        return COLORS.status.completed;
      case 'cancelled':
        return COLORS.status.cancelled;
      case 'rescheduled':
        return COLORS.status.rescheduled;
      default:
        return COLORS.status.pending;
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            {item.purpose || 'Consultation'}
          </Text>
          <Chip
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: 'white' }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.detail}>
          📅 {new Date(item.date).toLocaleDateString()} at {item.time}
        </Text>
        <Text variant="bodyMedium" style={styles.detail}>
          📍 {item.location.replace('_', ' ').toUpperCase()}
        </Text>
        {item.company && (
          <Text variant="bodyMedium" style={styles.detail}>
            🏢 {item.company}
          </Text>
        )}
        {item.productOfInterest && (
          <Text variant="bodySmall" style={styles.product}>
            Product: {item.productOfInterest}
          </Text>
        )}
        {item.conclusionNotes && (
          <Text variant="bodySmall" style={styles.notes}>
            Notes: {item.conclusionNotes}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading bookings..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No bookings yet</Text>
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
    flex: 1,
  },
  detail: {
    marginBottom: 4,
  },
  product: {
    marginTop: 8,
    opacity: 0.7,
  },
  notes: {
    marginTop: 8,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
});

export default BookingHistoryScreen;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Chip, Menu, IconButton } from 'react-native-paper';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Booking } from '../../types';
import { COLORS } from '../../constants/colors';

const BookingManagementScreen = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

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

  const updateBookingStatus = async (
    id: string,
    status: Booking['status']
  ) => {
    try {
      await api.put(API_ENDPOINTS.BOOKINGS.UPDATE_STATUS(id), { status });
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === id ? { ...booking, status } : booking
        )
      );
      Alert.alert('Success', `Booking ${status} successfully`);
    } catch (error) {
      console.error('Failed to update booking:', error);
      Alert.alert('Error', 'Failed to update booking status');
    } finally {
      setMenuVisible(null);
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
          <View style={styles.headerLeft}>
            <Text variant="titleMedium" style={styles.title}>
              {typeof item.user === 'object' ? item.user.name : item.fullName}
            </Text>
            <Chip
              style={{ backgroundColor: getStatusColor(item.status) }}
              textStyle={{ color: 'white' }}
              compact
            >
              {item.status.toUpperCase()}
            </Chip>
          </View>
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
              onPress={() => updateBookingStatus(item._id, 'confirmed')}
              title="Confirm"
            />
            <Menu.Item
              onPress={() => updateBookingStatus(item._id, 'completed')}
              title="Mark Completed"
            />
            <Menu.Item
              onPress={() => updateBookingStatus(item._id, 'cancelled')}
              title="Cancel"
            />
          </Menu>
        </View>

        <Text variant="bodyMedium">📧 {item.email}</Text>
        <Text variant="bodyMedium">📱 {item.phone}</Text>
        <Text variant="bodyMedium">
          📅 {new Date(item.date).toLocaleDateString()} at {item.time}
        </Text>
        <Text variant="bodyMedium">
          📍 {item.location.replace('_', ' ').toUpperCase()}
        </Text>
        {item.purpose && (
          <Text variant="bodySmall" style={styles.purpose}>
            Purpose: {item.purpose}
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
            <Text variant="bodyLarge">No bookings found</Text>
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
  purpose: {
    marginTop: 8,
    opacity: 0.7,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
});

export default BookingManagementScreen;

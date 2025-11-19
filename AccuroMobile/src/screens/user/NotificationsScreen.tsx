import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, IconButton, Chip } from 'react-native-paper';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Notification } from '../../types';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Notification[] }>(
        API_ENDPOINTS.NOTIFICATIONS.BASE
      );
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(API_ENDPOINTS.NOTIFICATIONS.READ(id));
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Card
      style={[styles.card, !item.read && styles.unreadCard]}
      onPress={() => !item.read && markAsRead(item._id)}
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" style={styles.title}>
              {item.title}
            </Text>
            {!item.read && <Chip compact style={styles.newChip}>New</Chip>}
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => deleteNotification(item._id)}
          />
        </View>
        <Text variant="bodyMedium" style={styles.message}>
          {item.message}
        </Text>
        <Text variant="bodySmall" style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()} at{' '}
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading notifications..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No notifications</Text>
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
    marginBottom: 12,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  newChip: {
    height: 24,
  },
  message: {
    marginVertical: 8,
  },
  date: {
    opacity: 0.6,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
});

export default NotificationsScreen;

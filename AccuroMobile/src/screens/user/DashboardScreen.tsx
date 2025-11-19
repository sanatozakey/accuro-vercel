import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Dashboard
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Welcome, {user?.name}!
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Quick Actions
          </Text>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Profile' as never)}
            icon="account"
          >
            My Profile
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('BookingHistory' as never)}
            icon="calendar"
          >
            My Bookings
          </Button>
        </Card.Actions>
        <Card.Actions style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Quotations' as never)}
            icon="file-document"
          >
            My Quotations
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Notifications' as never)}
            icon="bell"
          >
            Notifications
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Account Information
          </Text>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Name:
            </Text>
            <Text variant="bodyMedium">{user?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Email:
            </Text>
            <Text variant="bodyMedium">{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Role:
            </Text>
            <Text variant="bodyMedium" style={styles.roleText}>
              {user?.role.toUpperCase()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleLogout}
        icon="logout"
        style={styles.logoutButton}
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 80,
  },
  roleText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
});

export default DashboardScreen;

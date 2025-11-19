import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { AnalyticsData } from '../../types';

const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: AnalyticsData }>(
        API_ENDPOINTS.ANALYTICS.OVERVIEW
      );
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Admin Dashboard
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Welcome, {user?.name}!
        </Text>
      </View>

      {analytics && (
        <>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Overview
          </Text>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {analytics.bookings.total}
                </Text>
                <Text variant="bodyMedium">Total Bookings</Text>
                <Text variant="bodySmall" style={styles.statDetail}>
                  {analytics.bookings.pending} pending
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {analytics.quotations.total}
                </Text>
                <Text variant="bodyMedium">Quotations</Text>
                <Text variant="bodySmall" style={styles.statDetail}>
                  {analytics.quotations.pending} pending
                </Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  ₱{analytics.revenue.monthly.toLocaleString()}
                </Text>
                <Text variant="bodyMedium">Monthly Revenue</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {analytics.userEngagement.activeUsers}
                </Text>
                <Text variant="bodyMedium">Active Users</Text>
                <Text variant="bodySmall" style={styles.statDetail}>
                  {analytics.userEngagement.newUsers} new
                </Text>
              </Card.Content>
            </Card>
          </View>
        </>
      )}

      <Text variant="titleLarge" style={styles.sectionTitle}>
        Quick Actions
      </Text>

      <Card style={styles.card}>
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('BookingManagement' as never)}
            icon="calendar-check"
          >
            Manage Bookings
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ProductManagement' as never)}
            icon="package-variant"
          >
            Manage Products
          </Button>
        </Card.Actions>
        <Card.Actions style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('QuotationManagement' as never)}
            icon="file-document"
          >
            Manage Quotations
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Analytics' as never)}
            icon="chart-bar"
          >
            View Analytics
          </Button>
        </Card.Actions>
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
  sectionTitle: {
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statDetail: {
    opacity: 0.6,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    padding: 8,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
});

export default AdminDashboardScreen;

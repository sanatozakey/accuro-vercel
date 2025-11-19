import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { AnalyticsData } from '../../types';

const AnalyticsScreen = () => {
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

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading analytics..." />;
  }

  if (!analytics) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyLarge">No analytics data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Analytics Overview
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Bookings
          </Text>
          <View style={styles.statRow}>
            <Text variant="bodyLarge">Total:</Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              {analytics.bookings.total}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Pending:</Text>
            <Text variant="bodyMedium">{analytics.bookings.pending}</Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Confirmed:</Text>
            <Text variant="bodyMedium">{analytics.bookings.confirmed}</Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Completed:</Text>
            <Text variant="bodyMedium">{analytics.bookings.completed}</Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Cancelled:</Text>
            <Text variant="bodyMedium">{analytics.bookings.cancelled}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Quotations
          </Text>
          <View style={styles.statRow}>
            <Text variant="bodyLarge">Total:</Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              {analytics.quotations.total}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Pending:</Text>
            <Text variant="bodyMedium">{analytics.quotations.pending}</Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Approved:</Text>
            <Text variant="bodyMedium">{analytics.quotations.approved}</Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Rejected:</Text>
            <Text variant="bodyMedium">{analytics.quotations.rejected}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Revenue
          </Text>
          <View style={styles.statRow}>
            <Text variant="bodyLarge">Total:</Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              ₱{analytics.revenue.total.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Monthly:</Text>
            <Text variant="bodyMedium">
              ₱{analytics.revenue.monthly.toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            User Engagement
          </Text>
          <View style={styles.statRow}>
            <Text variant="bodyLarge">Active Users:</Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              {analytics.userEngagement.activeUsers}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">New Users:</Text>
            <Text variant="bodyMedium">
              {analytics.userEngagement.newUsers}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    padding: 20,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
});

export default AnalyticsScreen;

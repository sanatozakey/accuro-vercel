import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

interface ActivityLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout';
  actionCategory: string;
  resourceType: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const ActivityLogsScreen = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, resourceTypeFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: ActivityLog[] }>(
        API_ENDPOINTS.ACTIVITY_LOGS.BASE
      );
      setLogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query) ||
          log.user?.name.toLowerCase().includes(query) ||
          log.user?.email.toLowerCase().includes(query)
      );
    }

    // Filter by resource type
    if (resourceTypeFilter !== 'all') {
      filtered = filtered.filter(
        (log) => log.resourceType === resourceTypeFilter
      );
    }

    setFilteredLogs(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'create':
        return COLORS.success;
      case 'update':
        return COLORS.primary;
      case 'delete':
        return COLORS.error;
      case 'view':
        return COLORS.gray[500];
      case 'login':
        return '#10B981';
      case 'logout':
        return '#F59E0B';
      default:
        return COLORS.gray[400];
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const resourceTypes = [
    'all',
    'booking',
    'product',
    'quotation',
    'user',
    'review',
    'contact',
  ];

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading activity logs..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Admin</Text>
        </View>
        <Text style={styles.headerTitle}>Activity Logs</Text>
        <Text style={styles.headerSubtitle}>
          Monitor all system activities and user actions
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Searchbar
          placeholder="Search by action, user, or details..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Resource Type:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={resourceTypeFilter}
              onValueChange={(value) => setResourceTypeFilter(value)}
              style={styles.picker}
            >
              {resourceTypes.map((type) => (
                <Picker.Item
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  value={type}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.resultsCount}>
          <Text style={styles.resultsText}>
            {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      </View>

      {/* Logs List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredLogs.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="text-box-search-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>No Activity Logs</Text>
            <Text style={styles.emptyText}>
              {searchQuery || resourceTypeFilter !== 'all'
                ? 'No logs match your filters'
                : 'No activity logs available'}
            </Text>
          </View>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log._id} style={styles.logCard}>
              <Card.Content>
                {/* Header */}
                <View style={styles.logHeader}>
                  <Chip
                    style={[
                      styles.actionTypeChip,
                      { backgroundColor: getActionTypeColor(log.actionType) },
                    ]}
                    textStyle={styles.actionTypeText}
                  >
                    {log.actionType.toUpperCase()}
                  </Chip>
                  <Text style={styles.timestamp}>
                    {formatDate(log.createdAt)}
                  </Text>
                </View>

                {/* Action */}
                <Text style={styles.action}>{log.action}</Text>

                {/* Category */}
                <View style={styles.categoryRow}>
                  <Icon name="tag-outline" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.categoryText}>{log.actionCategory}</Text>
                </View>

                {/* Details */}
                {log.details && (
                  <Text style={styles.details}>{log.details}</Text>
                )}

                {/* User Info */}
                <View style={styles.userInfo}>
                  <Icon name="account-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.userName}>{log.user?.name}</Text>
                  <Text style={styles.userEmail}>({log.user?.email})</Text>
                </View>

                {/* IP Address */}
                {log.ipAddress && (
                  <View style={styles.ipRow}>
                    <Icon name="ip" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.ipText}>{log.ipAddress}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: COLORS.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  searchbar: {
    backgroundColor: COLORS.white,
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  picker: {
    height: 50,
  },
  resultsCount: {
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  content: {
    flex: 1,
  },
  empty: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  logCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTypeChip: {
    height: 28,
  },
  actionTypeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  action: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  details: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ipText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
});

export default ActivityLogsScreen;

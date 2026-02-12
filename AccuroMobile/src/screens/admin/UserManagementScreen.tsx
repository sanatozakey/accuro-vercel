import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { User } from '../../types';
import { COLORS } from '../../constants/colors';

const UserManagementScreen = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: User[] }>(API_ENDPOINTS.USERS.BASE);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDelete = async (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.USERS.BY_ID(userId));
              Toast.show({
                type: 'success',
                text1: 'User Deleted',
                text2: 'User has been deleted successfully',
              });
              fetchUsers();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Deletion Failed',
                text2: error.response?.data?.message || 'Failed to delete user',
              });
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return COLORS.error;
      case 'admin':
        return COLORS.primary;
      default:
        return COLORS.gray[500];
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading users..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Admin</Text>
        </View>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSubtitle}>
          Manage system users and their permissions
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name, email, or role..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.resultsCount}>
          <Text style={styles.resultsText}>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="account-group-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No users match your search' : 'No users available'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user._id} style={styles.userCard}>
              <Card.Content>
                <View style={styles.userHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userMeta}>
                      <View
                        style={[
                          styles.roleBadge,
                          { backgroundColor: getRoleBadgeColor(user.role) },
                        ]}
                      >
                        <Text style={styles.roleBadgeText}>
                          {user.role.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.joinDate}>
                        Joined {formatDate(user.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      Toast.show({
                        type: 'info',
                        text1: 'Feature Coming Soon',
                        text2: 'User history view will be available soon',
                      });
                    }}
                    style={styles.actionButton}
                    icon="history"
                  >
                    History
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      Toast.show({
                        type: 'info',
                        text1: 'Feature Coming Soon',
                        text2: 'User editing will be available soon',
                      });
                    }}
                    style={styles.actionButton}
                    icon="pencil"
                  >
                    Edit
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleDelete(user._id, user.name)}
                    style={styles.deleteButton}
                    textColor={COLORS.error}
                    icon="delete"
                  >
                    Delete
                  </Button>
                </View>
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
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  searchbar: {
    backgroundColor: COLORS.white,
    marginBottom: 12,
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
  userCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 1,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  joinDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    borderColor: COLORS.error,
  },
});

export default UserManagementScreen;

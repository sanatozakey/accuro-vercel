import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { AdminDrawerParamList } from '../types/navigation.types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import BookingManagementScreen from '../screens/admin/BookingManagementScreen';
import ProductManagementScreen from '../screens/admin/ProductManagementScreen';
import QuotationManagementScreen from '../screens/admin/QuotationManagementScreen';
import AnalyticsScreen from '../screens/admin/AnalyticsScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import ReviewManagementScreen from '../screens/admin/ReviewManagementScreen';
import ActivityLogsScreen from '../screens/admin/ActivityLogsScreen';

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

const AdminNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: '#8E8E93',
      }}
    >
      <Drawer.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Icon name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="BookingManagement"
        component={BookingManagementScreen}
        options={{
          title: 'Manage Bookings',
          drawerIcon: ({ color, size}) => (
            <Icon name="calendar-check" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="ProductManagement"
        component={ProductManagementScreen}
        options={{
          title: 'Manage Products',
          drawerIcon: ({ color, size }) => (
            <Icon name="package-variant" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="QuotationManagement"
        component={QuotationManagementScreen}
        options={{
          title: 'Manage Quotations',
          drawerIcon: ({ color, size }) => (
            <Icon name="file-document" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics & Reports',
          drawerIcon: ({ color, size }) => (
            <Icon name="chart-bar" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={{
          title: 'Manage Users',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="ReviewManagement"
        component={ReviewManagementScreen}
        options={{
          title: 'Manage Reviews',
          drawerIcon: ({ color, size }) => (
            <Icon name="star-check" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'Reports',
          drawerIcon: ({ color, size }) => (
            <Icon name="file-chart" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="ActivityLogs"
        component={ActivityLogsScreen}
        options={{
          title: 'Activity Logs',
          drawerIcon: ({ color, size }) => (
            <Icon name="history" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;

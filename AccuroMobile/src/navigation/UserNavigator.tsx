import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { UserStackParamList } from '../types/navigation.types';

// Import screens
import DashboardScreen from '../screens/user/DashboardScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import NotificationsScreen from '../screens/user/NotificationsScreen';
import BookingHistoryScreen from '../screens/user/BookingHistoryScreen';
import QuotationsScreen from '../screens/user/QuotationsScreen';

const Stack = createStackNavigator<UserStackParamList>();

const UserNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{ title: 'My Bookings' }}
      />
      <Stack.Screen
        name="Quotations"
        component={QuotationsScreen}
        options={{ title: 'My Quotations' }}
      />
    </Stack.Navigator>
  );
};

export default UserNavigator;

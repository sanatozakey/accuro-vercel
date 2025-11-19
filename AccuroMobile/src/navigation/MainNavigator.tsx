import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation.types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens (will create these)
import HomeScreen from '../screens/main/HomeScreen';
import ProductsScreen from '../screens/main/ProductsScreen';
import BookingScreen from '../screens/main/BookingScreen';
import CartScreen from '../screens/main/CartScreen';
import UserNavigator from './UserNavigator';
import { useCart } from '../contexts/CartContext';
import { Badge } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsScreen}
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Icon name="package-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="BookingTab"
        component={BookingScreen}
        options={{
          title: 'Book',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="cart" size={size} color={color} />
              {cartCount > 0 && (
                <Badge style={styles.badge} size={18}>
                  {cartCount}
                </Badge>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={UserNavigator}
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
  },
});

export default MainNavigator;

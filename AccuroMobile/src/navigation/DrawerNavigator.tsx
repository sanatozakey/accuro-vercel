import React from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, Divider, Switch } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/colors';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import ProductsScreen from '../screens/main/ProductsScreen';
import AboutScreen from '../screens/main/AboutScreen';
import TestimonialsScreen from '../screens/main/TestimonialsScreen';
import ContactScreen from '../screens/main/ContactScreen';
import BookingScreen from '../screens/main/BookingScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import DashboardScreen from '../screens/user/DashboardScreen';
import AdminNavigator from './AdminNavigator';

export type DrawerParamList = {
  Home: undefined;
  Products: undefined;
  About: undefined;
  Testimonials: undefined;
  Contact: undefined;
  Booking: undefined;
  Profile: undefined;
  Dashboard: undefined;
  AdminDashboard: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

// Custom Drawer Content
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [darkMode, setDarkMode] = React.useState(false);

  const handleLogout = () => {
    logout();
    props.navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      {/* Header Section */}
      <View style={styles.drawerHeader}>
        <Image
          source={{
            uri: 'https://uploadthingy.s3.us-west-1.amazonaws.com/hm7mtaNdbWyZ81qScpSM5S/accuro_logo.png',
          }}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* User Profile Section (if authenticated) */}
        {isAuthenticated && user && (
          <View style={styles.userSection}>
            {user.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitials}>
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2)}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Icon name="shield-check" size={12} color={COLORS.white} />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Main Navigation Items */}
      <View style={styles.navSection}>
        <DrawerItemList {...props} />
      </View>

      <Divider style={styles.divider} />

      {/* User Dashboard Links (if authenticated) */}
      {isAuthenticated && (
        <>
          <View style={styles.navSection}>
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => props.navigation.navigate('Profile')}
            >
              <Icon name="account" size={24} color={COLORS.primary} />
              <Text style={styles.drawerItemText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => props.navigation.navigate('Dashboard')}
            >
              <Icon name="view-dashboard" size={24} color={COLORS.primary} />
              <Text style={styles.drawerItemText}>My Dashboard</Text>
            </TouchableOpacity>

            {isAdmin && (
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => props.navigation.navigate('AdminDashboard')}
              >
                <Icon name="cog" size={24} color={COLORS.primary} />
                <Text style={styles.drawerItemText}>Admin Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>

          <Divider style={styles.divider} />
        </>
      )}

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Dark Mode Toggle */}
        <View style={styles.darkModeToggle}>
          <View style={styles.darkModeLabel}>
            <Icon
              name={darkMode ? 'weather-night' : 'white-balance-sunny'}
              size={24}
              color={COLORS.text.primary}
            />
            <Text style={styles.darkModeText}>
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            color={COLORS.primary}
          />
        </View>

        {/* Auth Buttons */}
        {isAuthenticated ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={20} color={COLORS.error} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => {
                props.navigation.closeDrawer();
                // Navigate to login screen
              }}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => {
                props.navigation.closeDrawer();
                // Navigate to signup screen
              }}
            >
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </DrawerContentScrollView>
  );
};

const DrawerNavigator = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.text.secondary,
        drawerLabelStyle: {
          marginLeft: -16,
          fontSize: 15,
          fontWeight: '500',
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginVertical: 2,
        },
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTintColor: COLORS.text.primary,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Products',
          drawerIcon: ({ color, size }) => (
            <Icon name="package-variant" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About Us',
          drawerIcon: ({ color, size }) => (
            <Icon name="information" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Testimonials"
        component={TestimonialsScreen}
        options={{
          title: 'Testimonials',
          drawerIcon: ({ color, size }) => (
            <Icon name="message-text" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: 'Contact Us',
          drawerIcon: ({ color, size }) => (
            <Icon name="email" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          title: 'Book Meeting',
          drawerIcon: ({ color, size }) => (
            <Icon name="calendar-clock" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden screens for user dashboard */}
      {isAuthenticated && (
        <>
          <Drawer.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              drawerItemStyle: { display: 'none' },
            }}
          />
          <Drawer.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              drawerItemStyle: { display: 'none' },
            }}
          />
        </>
      )}

      {/* Hidden screen for admin dashboard */}
      {isAdmin && (
        <Drawer.Screen
          name="AdminDashboard"
          component={AdminNavigator}
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }}
        />
      )}
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  logo: {
    width: 120,
    height: 40,
    tintColor: COLORS.white,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 8,
  },
  navSection: {
    paddingHorizontal: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    gap: 16,
  },
  drawerItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  darkModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  darkModeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  darkModeText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error + '15',
    marginTop: 12,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
  authButtons: {
    gap: 8,
    marginTop: 12,
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  signupButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default DrawerNavigator;

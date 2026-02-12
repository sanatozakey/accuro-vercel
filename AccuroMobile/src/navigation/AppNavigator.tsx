import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <NavigationContainer>
      {!user ? <AuthNavigator /> : <DrawerNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;

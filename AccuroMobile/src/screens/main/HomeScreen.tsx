import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button as PaperButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome{user ? `, ${user.name}` : ''}!
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Accuro Calibration Solutions
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Our Services
          </Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            We provide professional calibration solutions for all your
            measurement equipment needs.
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Product Categories
          </Text>
          <View style={styles.categoryList}>
            <Text variant="bodyMedium">• Calibration Software</Text>
            <Text variant="bodyMedium">• Field Calibrators</Text>
            <Text variant="bodyMedium">• Workshop Calibrators</Text>
            <Text variant="bodyMedium">• Temperature Calibration</Text>
            <Text variant="bodyMedium">• Pressure Generation</Text>
            <Text variant="bodyMedium">• Accessories</Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('ProductsTab' as never)}>
            Browse Products
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Quick Actions
          </Text>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <PaperButton
            mode="contained"
            onPress={() => navigation.navigate('BookingTab' as never)}
            style={styles.actionButton}
          >
            Book a Meeting
          </PaperButton>
          <PaperButton
            mode="outlined"
            onPress={() => navigation.navigate('ProductsTab' as never)}
            style={styles.actionButton}
          >
            View Products
          </PaperButton>
        </Card.Actions>
      </Card>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Accuro Mobile v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
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
    marginBottom: 12,
    fontWeight: 'bold',
  },
  cardText: {
    marginBottom: 8,
    lineHeight: 22,
  },
  categoryList: {
    marginTop: 8,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 16,
  },
  actionButton: {
    marginBottom: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.5,
  },
});

export default HomeScreen;

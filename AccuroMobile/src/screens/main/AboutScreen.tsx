import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text } from 'react-native-paper';
import Card from '../../components/common/Card';
import { COLORS } from '../../constants/colors';

const AboutScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.headerTitle}>
          About Accuro
        </Text>
        <Text variant="titleMedium" style={styles.headerSubtitle}>
          Industry-Leading Calibration Solutions
        </Text>
      </View>

      {/* Who We Are Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            Who We Are
          </Text>
          <Text variant="bodyLarge" style={styles.paragraph}>
            Accuro is a leading provider of high-quality instrumentation and
            calibration solutions for various industries. We specialize in
            Beamex products, offering the best measurement and calibration
            equipment to ensure accuracy and reliability in your operations.
          </Text>
          <Text variant="bodyLarge" style={styles.paragraph}>
            With years of experience and expertise, we help our clients
            optimize their processes, improve efficiency, and maintain
            compliance with industry standards.
          </Text>
        </Card.Content>
      </Card>

      {/* Our Mission Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            Our Mission
          </Text>
          <Text variant="bodyLarge" style={styles.paragraph}>
            To provide world-class calibration solutions that empower businesses
            to achieve precision, compliance, and operational excellence.
          </Text>
        </Card.Content>
      </Card>

      {/* Our Values Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            Our Values
          </Text>
          <View style={styles.valueItem}>
            <Text variant="titleMedium" style={styles.valueTitle}>
              • Quality Excellence
            </Text>
            <Text variant="bodyMedium" style={styles.valueText}>
              We deliver ISO-compliant solutions that meet the highest industry standards.
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Text variant="titleMedium" style={styles.valueTitle}>
              • Customer Focus
            </Text>
            <Text variant="bodyMedium" style={styles.valueText}>
              Your success is our priority. We provide dedicated support and expert guidance.
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Text variant="titleMedium" style={styles.valueTitle}>
              • Innovation
            </Text>
            <Text variant="bodyMedium" style={styles.valueText}>
              We stay ahead with the latest calibration technologies and solutions.
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Text variant="titleMedium" style={styles.valueTitle}>
              • Reliability
            </Text>
            <Text variant="bodyMedium" style={styles.valueText}>
              Trusted by leading companies for precise and dependable calibration services.
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: COLORS.secondary,
    padding: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.secondary,
  },
  paragraph: {
    marginBottom: 16,
    lineHeight: 24,
    color: '#333',
  },
  valueItem: {
    marginBottom: 16,
  },
  valueTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.primary,
  },
  valueText: {
    color: '#666',
    lineHeight: 20,
    paddingLeft: 16,
  },
});

export default AboutScreen;

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const ContactScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.CONTACTS.BASE, formData);

      Toast.show({
        type: 'success',
        text1: 'Message Sent!',
        text2: 'Thank you for contacting us. We will get back to you soon.',
        visibilityTime: 3000,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: '',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Send Failed',
        text2: error.response?.data?.message || 'Failed to send message. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const mapHTML = `
    <iframe
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d123535.72823500152!2d120.94930147562205!3d14.62801852077159!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b64c0c7a669b%3A0x1feed15106525284!2sViera%20Residences!5e0!3m2!1sen!2sph!4v1763685156198!5m2!1sen!2sph"
      width="100%"
      height="100%"
      style="border:0;"
      allowfullscreen=""
      loading="lazy"
    ></iframe>
  `;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Get in Touch</Text>
        </View>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <Text style={styles.headerSubtitle}>
          Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </Text>
      </View>

      {/* Contact Form */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Icon name="email-outline" size={24} color={COLORS.primary} />
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Send us a Message
            </Text>
          </View>

          <Input
            label="Full Name *"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="Enter your full name"
            autoCapitalize="words"
          />

          <Input
            label="Email Address *"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />

          <Input
            label="Company"
            value={formData.company}
            onChangeText={(text) => handleInputChange('company', text)}
            placeholder="Enter your company name"
          />

          <Input
            label="Subject"
            value={formData.subject}
            onChangeText={(text) => handleInputChange('subject', text)}
            placeholder="What is this regarding?"
          />

          <Input
            label="Message *"
            value={formData.message}
            onChangeText={(text) => handleInputChange('message', text)}
            placeholder="Enter your message..."
            multiline
            numberOfLines={5}
            style={styles.messageInput}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            icon="send"
          >
            Send Message
          </Button>
        </Card.Content>
      </Card>

      {/* Contact Information */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Icon name="information-outline" size={24} color={COLORS.primary} />
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Contact Information
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="phone" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text variant="labelLarge" style={styles.infoLabel}>
                Phone
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                +63 9171507737
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="email" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text variant="labelLarge" style={styles.infoLabel}>
                Email
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                info@accuro.com.ph
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="map-marker" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text variant="labelLarge" style={styles.infoLabel}>
                Office Address
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                Unit 2229, Viera Residences{'\n'}
                Scout Tuason Avenue{'\n'}
                Barangay Obrero, Quezon City{'\n'}
                Philippines
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="clock-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text variant="labelLarge" style={styles.infoLabel}>
                Business Hours
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                Monday - Friday: 9:00 AM - 6:00 PM{'\n'}
                Saturday: 10:00 AM - 2:00 PM{'\n'}
                Sunday: Closed
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Google Maps */}
      <Card style={styles.card}>
        <Card.Content style={styles.mapCardContent}>
          <View style={styles.sectionHeader}>
            <Icon name="map" size={24} color={COLORS.primary} />
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Find Us
            </Text>
          </View>

          <View style={styles.mapContainer}>
            <WebView
              source={{ html: mapHTML }}
              style={styles.map}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 20,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  infoValue: {
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  mapCardContent: {
    padding: 0,
  },
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  map: {
    flex: 1,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ContactScreen;

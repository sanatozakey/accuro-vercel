import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Featured products data
  const featuredProducts = [
    {
      id: '1',
      name: 'Beamex MC6',
      description: 'Advanced field calibrator and communicator',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
    },
    {
      id: '2',
      name: 'Beamex MC4',
      description: 'Documenting process calibrator',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
    },
    {
      id: '3',
      name: 'Beamex FB Series',
      description: 'Field temperature block',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
    },
    {
      id: '4',
      name: 'Beamex CMX',
      description: 'Calibration management software',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
    },
  ];

  // Industry leaders data
  const industryLeaders = [
    {
      id: '1',
      title: 'Official Distributor',
      description: 'Official distributor of Beamex calibration equipment and software solutions',
      icon: 'certificate',
      image: 'https://www.beamex.com/app/uploads/2020/05/Beamex-webshop_big-tablet_v1-e1590471740956.jpeg',
    },
    {
      id: '2',
      title: 'Strategic Partners',
      description: 'Partnered with leading industrial automation companies',
      icon: 'account-group',
      image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400',
    },
    {
      id: '3',
      title: 'Certified Experts',
      description: 'Certified experts in measurement and calibration technologies',
      icon: 'check-circle',
      image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=400',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Industry-Leading Calibration Solutions</Text>
          </View>
          <Text style={styles.heroTitle}>
            Instrumentation & Calibration Solutions
          </Text>
          <Text style={styles.heroSubtitle}>
            Providing high-quality measurement and calibration equipment for industrial applications with precision and reliability
          </Text>
          <View style={styles.heroButtons}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Products' as never)}
              style={styles.primaryButton}
              labelStyle={styles.primaryButtonText}
            >
              Explore Products
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Contact' as never)}
              style={styles.secondaryButton}
              labelStyle={styles.secondaryButtonText}
            >
              Contact Us
            </Button>
          </View>
        </View>
      </View>

      {/* Key Features Strip */}
      <View style={styles.featuresStrip}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Icon name="check-circle" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Certified Quality</Text>
            <Text style={styles.featureSubtitle}>ISO-compliant solutions</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Icon name="account-group" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Expert Support</Text>
            <Text style={styles.featureSubtitle}>Dedicated technical team</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Icon name="trending-up" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Industry Leader</Text>
            <Text style={styles.featureSubtitle}>Trusted by top companies</Text>
          </View>
        </View>
      </View>

      {/* Who We Are Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>About Accuro</Text>
          </View>
          <Text style={styles.sectionTitle}>Who We Are</Text>
        </View>
        <Text style={styles.sectionText}>
          Accuro is a leading provider of high-quality instrumentation and calibration solutions for various industries. We specialize in Beamex products, offering the best measurement and calibration equipment to ensure accuracy and reliability in your operations.
        </Text>
        <Text style={styles.sectionText}>
          With years of experience and expertise, we help our clients optimize their processes, improve efficiency, and maintain compliance with industry standards.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('About' as never)}
          style={styles.learnMoreButton}
        >
          <Text style={styles.learnMoreText}>Learn more about us</Text>
          <Icon name="arrow-right" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Backed by Industry Leaders Section */}
      <View style={[styles.section, styles.graySection]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>Our Partners</Text>
          </View>
          <Text style={styles.sectionTitle}>Backed by Industry Leaders</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Partnering with the best to deliver exceptional calibration solutions
        </Text>

        {industryLeaders.map((item) => (
          <Card key={item.id} style={styles.leaderCard}>
            <View style={styles.leaderImageContainer}>
              <Image
                source={{ uri: item.image }}
                style={styles.leaderImage}
                resizeMode="cover"
              />
            </View>
            <Card.Content>
              <View style={styles.leaderHeader}>
                <Icon name={item.icon} size={20} color={COLORS.primary} />
                <View style={styles.leaderBadge}>
                  <Text style={styles.leaderBadgeText}>{item.title}</Text>
                </View>
              </View>
              <Text style={styles.leaderDescription}>{item.description}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Our Products Preview Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>Product Catalog</Text>
          </View>
          <Text style={styles.sectionTitle}>Our Products</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          We offer a comprehensive range of Beamex calibration equipment and accessories for various industrial applications
        </Text>

        <View style={styles.productsGrid}>
          {featuredProducts.map((product) => (
            <Card key={product.id} style={styles.productCard}>
              <View style={styles.productImageContainer}>
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              </View>
              <Card.Content>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Products' as never)}
                  style={styles.viewDetailsButton}
                >
                  <Text style={styles.viewDetailsText}>View details</Text>
                  <Icon name="arrow-right" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))}
        </View>

        <View style={styles.viewAllButtonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Products' as never)}
            style={styles.viewAllButton}
          >
            View All Products
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  heroSection: {
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: '#1e3a8a',
  },
  heroContent: {
    maxWidth: 800,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    lineHeight: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    flex: 1,
    minWidth: 150,
  },
  primaryButtonText: {
    color: COLORS.white,
  },
  secondaryButton: {
    borderColor: COLORS.white,
    borderWidth: 2,
    flex: 1,
    minWidth: 150,
  },
  secondaryButtonText: {
    color: COLORS.white,
  },
  featuresStrip: {
    backgroundColor: COLORS.gray[50],
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  section: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  graySection: {
    backgroundColor: COLORS.gray[50],
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  sectionBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 24,
    lineHeight: 24,
  },
  sectionText: {
    fontSize: 16,
    color: COLORS.text.primary,
    lineHeight: 24,
    marginBottom: 16,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  learnMoreText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  leaderCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  leaderImageContainer: {
    height: 160,
    overflow: 'hidden',
  },
  leaderImage: {
    width: '100%',
    height: '100%',
  },
  leaderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  leaderBadge: {
    backgroundColor: COLORS.gray[200],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  leaderBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  leaderDescription: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  productsGrid: {
    gap: 16,
  },
  productCard: {
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 160,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  viewAllButtonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  viewAllButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
  },
});

export default HomeScreen;

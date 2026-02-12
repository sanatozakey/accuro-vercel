import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, ScrollView } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MiniCart from '../../components/cart/MiniCart';
import CartModal from '../../components/cart/CartModal';
import { useCart } from '../../contexts/CartContext';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Product } from '../../types';
import { APP_CONFIG } from '../../constants/config';
import { COLORS } from '../../constants/colors';

const ProductsScreen = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cartModalVisible, setCartModalVisible] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Product[] }>(
        API_ENDPOINTS.PRODUCTS.BASE
      );
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory && !product.discontinued;
  });

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${product.name} has been added to your cart`,
      visibilityTime: 2000,
    });
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={styles.productCard}>
      {/* Product Image */}
      <View style={styles.productImageContainer}>
        <Image
          source={{
            uri: item.imageUrl || 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
          }}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>

      <Card.Content>
        <Text variant="titleLarge" style={styles.productName}>
          {item.name}
        </Text>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>

        <Text variant="bodyMedium" style={styles.description}>
          {item.description}
        </Text>

        {/* Features List */}
        {item.features && item.features.length > 0 && (
          <View style={styles.featuresList}>
            {item.features.slice(0, 3).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Icon name="check-circle" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        <Text variant="titleMedium" style={styles.price}>
          {item.price
            ? `₱${item.price.toLocaleString()}`
            : item.priceRange || 'Contact for price'}
        </Text>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <Button
          mode="outlined"
          onPress={() => handleAddToCart(item)}
          style={styles.addToCartButton}
          icon="cart-plus"
        >
          Add to Cart
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading products..." />;
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Products Catalog</Text>
        </View>
        <Text style={styles.headerTitle}>Beamex Products</Text>
        <Text style={styles.headerSubtitle}>
          Complete range of calibration solutions for all your calibration needs.
        </Text>
      </View>

      {/* Search and Filter Section */}
      <View style={styles.searchFilterSection}>
        <View style={styles.searchContainer}>
          <Icon
            name="magnify"
            size={20}
            color={COLORS.text.secondary}
            style={styles.searchIcon}
          />
          <Searchbar
            placeholder="Search products by name, category, or description..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            elevation={0}
          />
        </View>

        {/* Category Filter */}
        <View style={styles.filterRow}>
          <Icon name="filter" size={20} color={COLORS.text.secondary} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScrollView}
          >
            <Chip
              selected={!selectedCategory}
              onPress={() => setSelectedCategory('')}
              style={styles.chip}
              selectedColor={COLORS.primary}
            >
              All Products
            </Chip>
            {APP_CONFIG.PRODUCT_CATEGORIES.map((category) => (
              <Chip
                key={category}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
                style={styles.chip}
                selectedColor={COLORS.primary}
              >
                {category}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View style={styles.resultsCount}>
          <View style={styles.resultsBadge}>
            <Text style={styles.resultsText}>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        </View>
      </View>

      {/* Products List */}
      <View style={styles.productsContainer}>
        {filteredProducts.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="package-variant-closed" size={64} color={COLORS.gray[300]} />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No products found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View key={product._id}>{renderProduct({ item: product })}</View>
          ))
        )}
      </View>
    </ScrollView>

    {/* Mini Cart */}
    <MiniCart onPress={() => setCartModalVisible(true)} />

    {/* Cart Modal */}
    <CartModal
      visible={cartModalVisible}
      onClose={() => setCartModalVisible(false)}
    />
    </>
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
  searchFilterSection: {
    backgroundColor: COLORS.gray[50],
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 18,
    zIndex: 1,
  },
  searchbar: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingLeft: 40,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  categoriesScrollView: {
    flex: 1,
  },
  chip: {
    marginRight: 8,
  },
  resultsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  resultsBadge: {
    backgroundColor: COLORS.gray[200],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  productsContainer: {
    padding: 20,
  },
  productCard: {
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productImageContainer: {
    height: 200,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.text.primary,
  },
  categoryBadge: {
    backgroundColor: COLORS.gray[200],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  description: {
    marginBottom: 16,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  featuresList: {
    marginBottom: 16,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text.primary,
    flex: 1,
  },
  price: {
    fontWeight: 'bold',
    color: COLORS.primary,
    fontSize: 20,
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  addToCartButton: {
    flex: 1,
    borderColor: COLORS.primary,
  },
  empty: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  emptyText: {
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});

export default ProductsScreen;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCart } from '../../contexts/CartContext';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Product } from '../../types';
import { APP_CONFIG } from '../../constants/config';

const ProductsScreen = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={styles.productCard}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.productName}>
          {item.name}
        </Text>
        <Chip style={styles.categoryChip} compact>
          {item.category}
        </Chip>
        <Text variant="bodyMedium" style={styles.description}>
          {item.description}
        </Text>
        <Text variant="titleSmall" style={styles.price}>
          {item.price
            ? `₱${item.price.toLocaleString()}`
            : item.priceRange || 'Contact for price'}
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button mode="outlined" onPress={() => handleAddToCart(item)}>
          Add to Cart
        </Button>
        <Button mode="contained" onPress={() => handleAddToCart(item)}>
          Request Quote
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search products..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.categories}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...APP_CONFIG.PRODUCT_CATEGORIES]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={
                item === 'All'
                  ? !selectedCategory
                  : selectedCategory === item
              }
              onPress={() => setSelectedCategory(item === 'All' ? '' : item)}
              style={styles.chip}
            >
              {item}
            </Chip>
          )}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No products found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  categories: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  list: {
    padding: 16,
  },
  productCard: {
    marginBottom: 16,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  description: {
    marginBottom: 12,
    opacity: 0.8,
  },
  price: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
});

export default ProductsScreen;

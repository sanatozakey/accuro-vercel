import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Product } from '../../types';

const ProductManagementScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {item.name}
        </Text>
        <Text variant="bodyMedium" style={styles.category}>
          {item.category}
        </Text>
        <Text variant="bodySmall" style={styles.description}>
          {item.description}
        </Text>
        <Text variant="titleSmall" style={styles.price}>
          {item.price ? `₱${item.price.toLocaleString()}` : item.priceRange}
        </Text>
        <Text variant="bodySmall" style={styles.status}>
          Status: {item.status.toUpperCase()}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Navigate to add product screen
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  category: {
    opacity: 0.7,
    marginBottom: 8,
  },
  description: {
    marginBottom: 8,
  },
  price: {
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  status: {
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ProductManagementScreen;

import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, IconButton, Divider } from 'react-native-paper';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useCart } from '../../contexts/CartContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { CartItem } from '../../types';

const CartScreen = () => {
  const navigation = useNavigation();
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } =
    useCart();
  const [loading, setLoading] = useState(false);

  const handleRequestQuote = async () => {
    try {
      setLoading(true);

      const quotationData = {
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          specifications: item.specifications || '',
        })),
      };

      await api.post(API_ENDPOINTS.QUOTATIONS.BASE, quotationData);

      // Clear cart after successful quotation request
      clearCart();

      alert('Quotation request submitted successfully!');
      navigation.navigate('ProfileTab' as never, {
        screen: 'Quotations',
      } as never);
    } catch (error) {
      console.error('Failed to request quotation:', error);
      alert('Failed to submit quotation request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <Card style={styles.cartItem}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <Text variant="titleMedium" style={styles.itemName}>
            {item.product.name}
          </Text>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => removeFromCart(item.product._id)}
          />
        </View>

        <Text variant="bodyMedium" style={styles.category}>
          {item.product.category}
        </Text>

        {item.specifications && (
          <Text variant="bodySmall" style={styles.specs}>
            Specifications: {item.specifications}
          </Text>
        )}

        <View style={styles.quantityContainer}>
          <IconButton
            icon="minus"
            size={20}
            onPress={() =>
              updateQuantity(item.product._id, item.quantity - 1)
            }
          />
          <Text variant="bodyLarge" style={styles.quantity}>
            {item.quantity}
          </Text>
          <IconButton
            icon="plus"
            size={20}
            onPress={() =>
              updateQuantity(item.product._id, item.quantity + 1)
            }
          />
        </View>

        {item.product.price && (
          <Text variant="titleSmall" style={styles.price}>
            ₱{(item.product.price * item.quantity).toLocaleString()}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall" style={styles.emptyText}>
          Your cart is empty
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('ProductsTab' as never)}
          style={styles.browseButton}
        >
          Browse Products
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.product._id}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <Card style={styles.summaryCard}>
            <Card.Content>
              <View style={styles.summaryRow}>
                <Text variant="titleMedium">Total Items:</Text>
                <Text variant="titleMedium">{items.length}</Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text variant="titleLarge" style={styles.totalLabel}>
                  Estimated Total:
                </Text>
                <Text variant="titleLarge" style={styles.totalAmount}>
                  ₱{getTotal().toLocaleString()}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.note}>
                * Final pricing will be confirmed in the quotation
              </Text>
            </Card.Content>
            <Card.Actions style={styles.actions}>
              <Button mode="outlined" onPress={clearCart}>
                Clear Cart
              </Button>
              <Button
                mode="contained"
                onPress={handleRequestQuote}
                loading={loading}
                disabled={loading}
              >
                Request Quote
              </Button>
            </Card.Actions>
          </Card>
        }
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
  cartItem: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontWeight: 'bold',
    flex: 1,
  },
  category: {
    opacity: 0.7,
    marginBottom: 4,
  },
  specs: {
    opacity: 0.6,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  quantity: {
    marginHorizontal: 16,
    fontWeight: 'bold',
  },
  price: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryCard: {
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  divider: {
    marginVertical: 12,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  note: {
    marginTop: 8,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  actions: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginBottom: 24,
    opacity: 0.7,
  },
  browseButton: {
    paddingHorizontal: 24,
  },
});

export default CartScreen;

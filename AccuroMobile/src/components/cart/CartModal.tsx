import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../../contexts/CartContext';
import Button from '../common/Button';
import { COLORS } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height } = Dimensions.get('window');

const CartModal: React.FC<CartModalProps> = ({ visible, onClose }) => {
  const { items, updateQuantity, removeFromCart, clearCart, getTotal } = useCart();
  const navigation = useNavigation<any>();

  const handleRequestQuote = () => {
    onClose();
    navigation.navigate('Booking');
  };

  const handleClearCart = () => {
    clearCart();
    Toast.show({
      type: 'success',
      text1: 'Cart Cleared',
      text2: 'All items have been removed from your cart',
    });
  };

  const handleIncreaseQuantity = (productId: string, currentQuantity: number) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    } else {
      removeFromCart(productId);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
    Toast.show({
      type: 'success',
      text1: 'Item Removed',
      text2: 'Product has been removed from cart',
    });
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'Contact for price';
    return `₱${price.toLocaleString()}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon name="cart" size={24} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Shopping Cart</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <Divider />

          {/* Cart Items */}
          <ScrollView
            style={styles.itemsContainer}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <View style={styles.emptyCart}>
                <Icon name="cart-outline" size={64} color={COLORS.gray[300]} />
                <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                <Text style={styles.emptyCartText}>
                  Add products to get started
                </Text>
              </View>
            ) : (
              <>
                {items.map((item) => (
                  <View key={item.product._id} style={styles.cartItem}>
                    <Image
                      source={{
                        uri:
                          item.product.imageUrl ||
                          'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=200',
                      }}
                      style={styles.itemImage}
                      resizeMode="contain"
                    />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      <Text style={styles.itemCategory}>
                        {item.product.category}
                      </Text>
                      <Text style={styles.itemPrice}>
                        {formatPrice(item.product.price)}
                      </Text>

                      {/* Quantity Controls */}
                      <View style={styles.quantityContainer}>
                        <TouchableOpacity
                          onPress={() =>
                            handleDecreaseQuantity(
                              item.product._id,
                              item.quantity
                            )
                          }
                          style={styles.quantityButton}
                        >
                          <Icon name="minus" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            handleIncreaseQuantity(
                              item.product._id,
                              item.quantity
                            )
                          }
                          style={styles.quantityButton}
                        >
                          <Icon name="plus" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Remove Button */}
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item.product._id)}
                      style={styles.removeButton}
                    >
                      <Icon name="trash-can-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          {items.length > 0 && (
            <>
              <Divider />
              <View style={styles.footer}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Subtotal:</Text>
                  <Text style={styles.totalValue}>
                    {formatPrice(getTotal())}
                  </Text>
                </View>

                <View style={styles.footerActions}>
                  <Button
                    mode="outlined"
                    onPress={handleClearCart}
                    style={styles.clearButton}
                    textColor={COLORS.error}
                  >
                    Clear Cart
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleRequestQuote}
                    style={styles.quoteButton}
                    icon="file-document-outline"
                  >
                    Request Quote
                  </Button>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  itemsContainer: {
    maxHeight: height * 0.5,
  },
  emptyCart: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  itemImage: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    padding: 20,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    borderColor: COLORS.error,
  },
  quoteButton: {
    flex: 1,
  },
});

export default CartModal;

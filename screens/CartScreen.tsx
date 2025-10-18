// screens/CartScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ToastAndroid,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  Badge,
  useTheme,
  FAB,
  Divider,
  Modal,
  Portal,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList, WaiterProfile, CartItem } from '../Appnav';
import { ordersService } from '../services/ordersService';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

const CartScreen: React.FC<Props> = ({ route, navigation }) => {
  const { kudilId, waiter } = route.params;
  const [kudil, setKudil] = useState<{ items: CartItem[] }>({ items: [] });
  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
  );
  const [editingQuantity, setEditingQuantity] = useState<number>(1);
  const [showQtyModal, setShowQtyModal] = useState(false);

  useEffect(() => {
    loadKudil();
  }, []);

  const loadKudil = async () => {
    try {
      const resp = await ordersService.getByKudil(kudilId);
      const data = resp.data;
      setKudil({
        items:
          data?.items?.map(i => ({
            productId: i.productId,
            productName: i.productName,
            price: i.price,
            quantity: i.quantity,
          })) || [],
      });
    } catch (e) {
      setKudil({ items: [] });
    }
  };

  const replaceItemsLocal = (updatedItems: CartItem[]) => {
    setKudil({ items: updatedItems });
  };

  const addItem = () => {
    navigation.navigate('Products', {
      kudilId,
      onAdd: async (
        productId: string,
        qty: number,
        productName: string,
        price: number,
      ) => {
        await ordersService.addItem(kudilId, {
          productId,
          productName,
          quantity: qty,
          price,
        });
        await loadKudil();
        ToastAndroid.show('Item added to order', ToastAndroid.SHORT);
      },
    });
  };

  const removeItem = (index: number) => {
    const item = kudil.items[index];
    if (!item) return;
    ordersService
      .removeItem(kudilId, item.productId)
      .then(loadKudil)
      .then(() => ToastAndroid.show('Item removed', ToastAndroid.SHORT));
  };

  const openEditModal = (index: number) => {
    setSelectedItemIndex(index);
    setEditingQuantity(kudil.items[index].quantity);
    setShowQtyModal(true);
  };

  const updateQuantity = () => {
    if (selectedItemIndex !== null && editingQuantity > 0) {
      const item = kudil.items[selectedItemIndex];
      ordersService
        .updateItem(kudilId, item.productId, { quantity: editingQuantity })
        .then(loadKudil)
        .then(() => {
          setShowQtyModal(false);
          ToastAndroid.show('Quantity updated', ToastAndroid.SHORT);
        });
    }
  };

  const goToKOT = () => {
    const items = kudil.items;
    if (items.length === 0) {
      ToastAndroid.show('No unsaved items', ToastAndroid.SHORT);
      return;
    }
    navigation.navigate('KOT', {
      kudilId,
      items,
      onPrint: () => {
        ToastAndroid.show('Order sent to KOT', ToastAndroid.SHORT);
      },
    });
  };

  const waiterComplete = async () => {
    try {
      if (kudil.items.length === 0) {
        ToastAndroid.show('No items to complete', ToastAndroid.SHORT);
        return;
      }
      const response = await ordersService.complete(kudilId);
      const data = response.data;
      console.log('complete response', data);
      ToastAndroid.show('Order marked complete', ToastAndroid.SHORT);
      navigation.goBack();
    } catch (e) {
      ToastAndroid.show('Failed to complete order', ToastAndroid.SHORT);
    }
  };

  const totalItems = kudil.items.length;
  const totalQty = kudil.items.reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount = kudil.items.reduce(
    (sum, it) => sum + (it.price || 0) * it.quantity,
    0,
  );

  const renderItem = ({ item, index }: { item: CartItem; index: number }) => {
    const isServed = false;

    return (
      <Card
        style={[
          styles.card,
          {
            backgroundColor: isServed
              ? theme.colors.surfaceVariant
              : theme.colors.surface,
            opacity: isServed ? 0.6 : 1,
          },
        ]}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.productInfo}>
              <View style={styles.productName}>
                <MaterialCommunityIcons
                  name="food-fork-drink"
                  size={18}
                  color={theme.colors.primary}
                />
                <Title style={styles.productTitle}>{item.productName}</Title>
              </View>
              <View style={styles.badgeContainer}>
                <TouchableOpacity onPress={() => openEditModal(index)}>
                  <Badge
                    style={styles.qtyBadge}
                  >{`Qty: ${item.quantity}`}</Badge>
                </TouchableOpacity>
                <Badge
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isServed ? '#4CAF50' : '#FF8C00',
                    },
                  ]}
                >
                  {isServed ? 'Served' : 'Pending'}
                </Badge>
              </View>
            </View>
            <View style={styles.cardActions}>
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.primary}
                onPress={() => openEditModal(index)}
                style={styles.editButton}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor="#FF6B6B"
                onPress={() => removeItem(index)}
                style={styles.deleteButton}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="cart-outline"
        size={64}
        color={theme.colors.primary}
        style={{ opacity: 0.3 }}
      />
      <Text style={styles.emptyText}>No items in cart</Text>
      <Text style={styles.emptySubtext}>Add items to get started</Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colors.outline + '30' },
        ]}
      >
        <View>
          <Title style={styles.headerTitle}>Kudil {kudilId}</Title>
          <Text style={styles.headerSubtitle}>{waiter.name}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{totalItems}</Text>
        </View>
        <Divider style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Quantity</Text>
          <Badge style={[styles.statBadge, { backgroundColor: '#FF8C00' }]}>
            {totalQty}
          </Badge>
        </View>
        <Divider style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Amount</Text>
          <Badge style={[styles.statBadge, { backgroundColor: '#4CAF50' }]}>
            {`₹${totalAmount.toFixed(0)}`}
          </Badge>
        </View>
      </View>

      {/* Items List */}
      <View style={styles.inner}>
        {kudil.items.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={kudil.items}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
          />
        )}
      </View>

      {/* Bottom Buttons */}
      {kudil.items.length > 0 && (
        <View style={styles.bottomContainer}>
          <Button
            mode="outlined"
            onPress={addItem}
            style={[styles.button, styles.addButton]}
            icon="plus"
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Add Item
          </Button>
          <Button
            mode="contained"
            onPress={goToKOT}
            style={[styles.button, styles.kotButton]}
            icon="printer"
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            disabled={kudil.items.length === 0}
          >
            KOT ({kudil.items.length})
          </Button>
          <Button
            mode="contained"
            onPress={waiterComplete}
            style={[styles.button]}
            icon="check-circle"
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            disabled={kudil.items.length === 0}
          >
            Waiter Complete
          </Button>
        </View>
      )}

      {/* FAB for adding items */}
      {kudil.items.length === 0 && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={addItem}
        />
      )}

      {/* Edit Quantity Modal */}
      <Portal>
        <Modal
          visible={showQtyModal}
          onDismiss={() => setShowQtyModal(false)}
          contentContainerStyle={[
            styles.quantityModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.quantityModalContent}>
            <View style={styles.quantityModalHeader}>
              <Title style={styles.quantityModalTitle}>Edit Quantity</Title>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowQtyModal(false)}
              />
            </View>

            {selectedItemIndex !== null && (
              <>
                <Text style={styles.productNameText}>
                  {kudil.items[selectedItemIndex]?.productName}
                </Text>

                <View style={styles.quantityControlContainer}>
                  <Text style={styles.quantityLabel}>Quantity</Text>
                  <View style={styles.quantityControls}>
                    <IconButton
                      icon="minus-circle"
                      size={36}
                      iconColor={theme.colors.primary}
                      onPress={() =>
                        setEditingQuantity(Math.max(1, editingQuantity - 1))
                      }
                      style={styles.qtyControlButton}
                    />
                    <View
                      style={[
                        styles.quantityDisplay,
                        { backgroundColor: theme.colors.primary + '20' },
                      ]}
                    >
                      <Text style={styles.quantityDisplayText}>
                        {editingQuantity}
                      </Text>
                    </View>
                    <IconButton
                      icon="plus-circle"
                      size={36}
                      iconColor={theme.colors.primary}
                      onPress={() => setEditingQuantity(editingQuantity + 1)}
                      style={styles.qtyControlButton}
                    />
                  </View>
                </View>

                <View style={styles.quantityModalButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowQtyModal(false)}
                    style={styles.modalButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={updateQuantity}
                    style={[styles.modalButton, styles.updateButton]}
                  >
                    Update
                  </Button>
                </View>
              </>
            )}
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    //paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statBadge: {
    fontSize: 14,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
  },
  emptySubtext: {
    fontSize: 12,
    opacity: 0.4,
  },
  card: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  qtyBadge: {
    backgroundColor: '#667BC6',
    padding: 3,
    width: 80,
    height: 40,
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    fontWeight: '700',
    fontSize: 14,
    padding: 3,
    width: 80,
    height: 40,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButton: {
    margin: 0,
  },
  deleteButton: {
    margin: 0,
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 8,
  },
  addButton: {
    borderColor: '#FF8C00',
  },
  kotButton: {
    flex: 1.2,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  quantityModal: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
  },
  quantityModalContent: {
    gap: 16,
  },
  quantityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  productNameText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  quantityControlContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  qtyControlButton: {
    margin: 0,
  },
  quantityDisplay: {
    width: 80,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplayText: {
    fontSize: 24,
    fontWeight: '700',
  },
  quantityModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  updateButton: {
    marginLeft: 0,
  },
});

export default CartScreen;

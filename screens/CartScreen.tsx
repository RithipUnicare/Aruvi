// screens/CartScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ToastAndroid,
  Dimensions,
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
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList, WaiterProfile, CartItem } from '../Appnav';
import productsData from '../data/products.json';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

interface Product {
  id: number;
  name: string;
  availability: boolean;
  image: string;
  price?: number;
  category?: string;
}

const CartScreen: React.FC<Props> = ({ route, navigation }) => {
  const { kudilId, waiter } = route.params;
  const [kudil, setKudil] = useState<{ items: CartItem[] }>({ items: [] });
  const [products, setProducts] = useState<{ [key: number]: Product }>({});
  const theme = useTheme();
  const { width } = Dimensions.get('window');

  useEffect(() => {
    loadKudil();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      //const productsData = await AsyncStorage.getItem('products');
      if (productsData) {
        const productsList: Product[] = productsData;
        const productsMap: { [key: number]: Product } = {};
        productsList.forEach(p => (productsMap[p.id] = p));
        setProducts(productsMap);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadKudil = async () => {
    const kudilsData = await AsyncStorage.getItem('kudils');
    if (kudilsData) {
      const kudils: { id: number; items: CartItem[] }[] =
        JSON.parse(kudilsData);
      const currentKudil = kudils.find(k => k.id === kudilId);
      setKudil(currentKudil || { items: [] });
    }
  };

  const saveKudil = async (updatedItems: CartItem[]) => {
    const kudilsData = await AsyncStorage.getItem('kudils');
    if (kudilsData) {
      const kudils: { id: number; items: CartItem[] }[] =
        JSON.parse(kudilsData);
      const index = kudils.findIndex(k => k.id === kudilId);
      if (index > -1) {
        kudils[index].items = updatedItems;
        await AsyncStorage.setItem('kudils', JSON.stringify(kudils));
        setKudil({ ...kudils[index], items: updatedItems });
      }
    }
  };

  const addItem = () => {
    navigation.navigate('Products', {
      kudilId,
      onAdd: (productId: number, qty: number) => {
        const newItem: CartItem = { productId, qty, served: false };
        const updatedItems = [...kudil.items, newItem];
        saveKudil(updatedItems);
        ToastAndroid.show('Item added to cart', ToastAndroid.SHORT);
      },
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = kudil.items.filter((_, i) => i !== index);
    saveKudil(updatedItems);
    ToastAndroid.show('Item removed', ToastAndroid.SHORT);
  };

  const goToKOT = () => {
    const unsaved = kudil.items.filter(i => !i.served);
    if (unsaved.length === 0) {
      ToastAndroid.show('No unsaved items', ToastAndroid.SHORT);
      return;
    }
    navigation.navigate('KOT', {
      kudilId,
      items: unsaved,
      onPrint: () => {
        const allItems = kudil.items.map(i =>
          unsaved.some(u => u.productId === i.productId && u.qty === i.qty)
            ? { ...i, served: true }
            : i,
        );
        saveKudil(allItems);
        ToastAndroid.show(
          'Order printed and marked served',
          ToastAndroid.SHORT,
        );
      },
    });
  };

  const totalItems = kudil.items.length;
  const unsavedItems = kudil.items.filter(i => !i.served).length;
  const servedItems = kudil.items.filter(i => i.served).length;

  const renderItem = ({ item, index }: { item: CartItem; index: number }) => {
    const product = products[item.productId];
    const isServed = item.served;
    console.log(products);
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
                <Title style={styles.productTitle}>
                  {product?.name || `Product ${item.productId}`}
                </Title>
              </View>
              <View style={styles.badgeContainer}>
                <Badge style={styles.qtyBadge}>{`Qty: ${item.qty}`}</Badge>
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
            <Button
              icon="delete"
              mode="text"
              compact
              onPress={() => removeItem(index)}
              textColor="#FF6B6B"
            >
              Remove
            </Button>
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
          <Text style={styles.statLabel}>Pending</Text>
          <Badge style={[styles.statBadge, { backgroundColor: '#FF8C00' }]}>
            {unsavedItems}
          </Badge>
        </View>
        <Divider style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Served</Text>
          <Badge style={[styles.statBadge, { backgroundColor: '#4CAF50' }]}>
            {servedItems}
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
            disabled={unsavedItems === 0}
          >
            KOT ({unsavedItems})
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    gap: 10,
    alignItems: 'center',
  },
  qtyBadge: {
    backgroundColor: '#667BC6',
    padding: 3,
    fontSize: 14,
    width: 80,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    fontWeight: '700',
    padding: 3,
    fontSize: 14,
    width: 80,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    //paddingVertical: 8,
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
    marginBottom: 20,
  },
});

export default CartScreen;

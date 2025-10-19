// screens/ProductsScreen.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  IconButton,
  Badge,
  useTheme,
  Chip,
  Searchbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../Appnav';
import {
  productsService,
  type Product as ApiProduct,
} from '../services/productsService';
import { RefreshControl } from 'react-native-gesture-handler';

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

type Product = ApiProduct;

const ProductsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { onAdd } = route.params;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterProducts, setFilterProducts] = useState<Product[]>([]);

  useEffect(() => {
    getAllProducts();
  }, []);

  const getAllProducts = async () => {
    setLoading(true);
    const response = await productsService.getAll();
    const data = response.data;
    setProducts(data || []);
    setFilterProducts(data || []);
    setLoading(false);
  };

  const numColumns = width > 600 ? 3 : 2;
  const itemWidth = width / numColumns - 16;

  const filteredProducts = () => {
    let result = products;

    // Apply availability filter
    // placeholder for availability if needed later

    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }

    setFilterProducts(result);
  };

  useEffect(() => {
    filteredProducts();
  }, [searchQuery, products]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getAllProducts();
    setRefreshing(false);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedProduct(item);
        setQuantity(1);
      }}
      activeOpacity={0.7}
    >
      <Card
        style={[
          styles.card,
          {
            width: itemWidth,
            backgroundColor: theme.colors.surface,
            opacity: 1,
          },
        ]}
      >
        <View style={[styles.imageContainer, { width: '100%', height: 120 }]}>
          <View
            style={[
              styles.imagePlaceholder,
              { backgroundColor: theme.colors.primary + '20' },
            ]}
          >
            <MaterialCommunityIcons
              name="food-fork-drink"
              size={48}
              color={theme.colors.primary}
            />
          </View>
        </View>

        {/* Product Info */}
        <Card.Content style={styles.cardContent}>
          <Title style={styles.productTitle}>{item.name}</Title>

          {item.price !== undefined && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>₹{item.price}</Text>
            </View>
          )}

          {/* Add Button */}
          <Button
            mode="contained"
            onPress={() => {
              setSelectedProduct(item);
              setQuantity(1);
            }}
            style={styles.addButton}
            contentStyle={styles.addButtonContent}
            labelStyle={styles.addButtonLabel}
            disabled={false}
            icon="plus"
          >
            Select
          </Button>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const addToCart = () => {
    if (selectedProduct && quantity > 0) {
      onAdd(
        selectedProduct.id,
        quantity,
        selectedProduct.name,
        selectedProduct.price,
      );
      setSelectedProduct(null);
      setQuantity(1);
      ToastAndroid.show('Item added to cart', ToastAndroid.SHORT);
      navigation.goBack();
    } else {
      ToastAndroid.show('Invalid product or quantity', ToastAndroid.SHORT);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

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
          <Title style={styles.headerTitle}>Select Items</Title>
          <Text style={styles.headerSubtitle}>
            {filterProducts.length} items available
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search items..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          icon="magnify"
          clearIcon="close"
        />
      </View>

      {/* Filter Chips Placeholder */}
      <View style={styles.filterContainer}>
        <Chip
          selected={searchFilter === 'all'}
          onPress={() => setSearchFilter('all')}
          style={styles.filterChip}
          mode="outlined"
        >
          All Items
        </Chip>
      </View>

      {/* Products Grid */}
      <View style={styles.inner}>
        {filterProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="plate-utensils-off"
              size={64}
              color={theme.colors.primary}
              style={{ opacity: 0.3 }}
            />
            <Text style={styles.emptyText}>No products available</Text>
            <Text style={styles.emptySubtext}>
              Check back later for more items
            </Text>
          </View>
        ) : (
          <FlatList
            data={filterProducts}
            renderItem={renderProduct}
            keyExtractor={(item: Product) => item.id}
            numColumns={numColumns}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      {/* Quantity Selection Modal */}
      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {/* Close Button */}
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>{selectedProduct?.name}</Title>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setSelectedProduct(null)}
                style={styles.closeButton}
              />
            </View>

            {/* Product Details in Modal */}

            {selectedProduct?.price && (
              <View style={styles.modalPriceContainer}>
                <Text style={styles.modalPriceLabel}>Price per item</Text>
                <Text style={styles.modalPriceValue}>
                  ₹{selectedProduct.price}
                </Text>
              </View>
            )}

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Select Quantity</Text>
              <View style={styles.qtyContainer}>
                <IconButton
                  icon="minus-circle"
                  size={36}
                  iconColor={theme.colors.primary}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  style={styles.qtyButton}
                />
                <View
                  style={[
                    styles.qtyDisplay,
                    { backgroundColor: theme.colors.primary + '20' },
                  ]}
                >
                  <Text style={styles.qtyText}>{quantity}</Text>
                </View>
                <IconButton
                  icon="plus-circle"
                  size={36}
                  iconColor={theme.colors.primary}
                  onPress={() => setQuantity(quantity + 1)}
                  style={styles.qtyButton}
                />
              </View>
            </View>

            {/* Total Price */}
            {selectedProduct?.price && (
              <View style={styles.totalPriceContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ₹{(selectedProduct.price * quantity).toFixed(2)}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => setSelectedProduct(null)}
                style={[styles.modalButton, styles.cancelButton]}
                labelStyle={styles.buttonLabel}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={addToCart}
                style={[styles.modalButton, styles.confirmButton]}
                contentStyle={styles.confirmButtonContent}
                labelStyle={styles.confirmButtonLabel}
                icon="check-circle"
              >
                Add to Cart
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    // paddingVertical: 12,
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
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    opacity: 0.6,
  },
  filterChip: {
    borderRadius: 8,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    borderRadius: 12,
    elevation: 3,
    marginHorizontal: 4,
    marginVertical: 6,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    height: 24,
  },
  categoryText: {
    fontSize: 10,
  },
  priceContainer: {
    marginVertical: 6,
  },
  priceLabel: {
    fontSize: 10,
    opacity: 0.6,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C00',
  },
  addButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  addButtonContent: {
    paddingVertical: 4,
  },
  addButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
    marginBottom: 16,
  },
  modalPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FF8C0015',
    borderRadius: 8,
    marginBottom: 16,
  },
  modalPriceLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  modalPriceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF8C00',
  },
  quantitySection: {
    marginVertical: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qtyButton: {
    margin: 0,
  },
  qtyDisplay: {
    width: 70,
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 32,
    fontWeight: '700',
  },
  totalPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FF8C0025',
    borderRadius: 8,
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF8C00',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
  },
  cancelButton: {
    borderColor: '#FF8C00',
  },
  confirmButton: {
    backgroundColor: '#FF8C00',
  },
  confirmButtonContent: {
    paddingVertical: 8,
  },
  confirmButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProductsScreen;

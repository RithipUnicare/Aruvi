// screens/KOTScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  Badge,
  useTheme,
  Divider,
  TextInput,
  Modal,
  Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList, CartItem } from '../Appnav';
// Import the printer library - assume installed: npm i react-native-thermal-receipt-printer
// @ts-ignore - for untyped library
import RNAccountThermalPrinter from 'react-native-thermal-receipt-printer';
import productsData from '../data/products.json';

type Props = NativeStackScreenProps<RootStackParamList, 'KOT'>;

interface Product {
  id: number;
  name: string;
  availability: boolean;
  image: string;
  price?: number;
  category?: string;
}

const KOTScreen: React.FC<Props> = ({ route, navigation }) => {
  const { items, onPrint, kudilId } = route.params;
  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const [printing, setPrinting] = useState(false);
  const [printerIP, setPrinterIP] = useState('192.168.1.100');
  const [tempPrinterIP, setTempPrinterIP] = useState('192.168.1.100');
  const [showSettings, setShowSettings] = useState(false);
  const [showIPModal, setShowIPModal] = useState(false);
  const [products, setProducts] = useState<{ [key: number]: Product }>({});

  // Default printer settings - STA mode WiFi connection
  const PRINTER_CONFIG = {
    DEFAULT_IP: '192.168.1.100', // WiFi STA mode IP
    DEFAULT_PORT: 9100,
    WIDTH_TIMES: 32,
  };

  useEffect(() => {
    loadSettings();
    loadProducts();
  }, []);

  const loadSettings = async () => {
    try {
      const savedIP = await AsyncStorage.getItem('printerIP');
      if (savedIP) {
        setPrinterIP(savedIP);
      }
    } catch (error) {
      console.error('Error loading printer settings:', error);
    }
  };

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

  const savePrinterIP = async () => {
    try {
      await AsyncStorage.setItem('printerIP', printerIP);
      Alert.alert('Success', 'Printer IP saved successfully');
      setShowSettings(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save printer IP');
    }
  };

  const printKOT = async () => {
    if (!printerIP.trim()) {
      Alert.alert('Error', 'Please configure printer IP address');
      return;
    }

    setPrinting(true);

    try {
      // Prepare receipt data for thermal printer
      const receiptLines: Array<{ type: string; value: string }> = [
        { type: 'text', value: '=== KITCHEN ORDER TICKET ===' },
        { type: 'text', value: '' },
        { type: 'text', value: `TABLE/KUDIL: ${kudilId}` },
        { type: 'text', value: `TIME: ${new Date().toLocaleTimeString()}` },
        { type: 'text', value: '' },
        { type: 'text', value: '================================' },
      ];

      // Add items to receipt
      items.forEach((item: CartItem) => {
        const product = products[item.productId];
        const productName = product?.name || `Product ${item.productId}`;
        receiptLines.push({
          type: 'text',
          value: `${productName}`,
        });
        receiptLines.push({
          type: 'text',
          value: `Quantity: ${item.qty}`,
        });
        receiptLines.push({
          type: 'text',
          value: '',
        });
      });

      receiptLines.push({
        type: 'text',
        value: '================================',
      });
      receiptLines.push({
        type: 'text',
        value: `Total Items: ${items.reduce((sum, item) => sum + item.qty, 0)}`,
      });
      receiptLines.push({ type: 'text', value: '' });
      receiptLines.push({ type: 'text', value: '--- END OF ORDER ---' });
      receiptLines.push({ type: 'text', value: '' });

      const printData = {
        ip: printerIP.trim(),
        port: PRINTER_CONFIG.DEFAULT_PORT,
        widthtimes: PRINTER_CONFIG.WIDTH_TIMES,
        receipt: receiptLines,
      };

      // Send to thermal printer
      await (RNAccountThermalPrinter as any).printBill(printData);

      setPrinting(false);
      Alert.alert('Success', 'Order sent to kitchen printer', [
        {
          text: 'OK',
          onPress: () => {
            onPrint();
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      setPrinting(false);
      console.error('Print error:', error);
      Alert.alert(
        'Print Failed',
        `Unable to connect to printer at ${printerIP}. Please check:\n1. Printer IP address\n2. Printer is connected to WiFi\n3. Printer is powered on`,
      );
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const product = products[item.productId];

    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <View style={styles.itemName}>
                <MaterialCommunityIcons
                  name="playlist-check"
                  size={20}
                  color={theme.colors.primary}
                />
                <Title style={styles.itemTitle}>
                  {product?.name || `Product ${item.productId}`}
                </Title>
              </View>
            </View>
            <Badge style={styles.qtyBadge}>{item.qty}</Badge>
          </View>
          {product?.price && (
            <Text style={styles.priceText}>
              ₹{(product.price * item.qty).toFixed(2)}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => {
    const product = products[item.productId];
    return sum + (product?.price || 0) * item.qty;
  }, 0);

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
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>Kitchen Order Ticket</Title>
          <Text style={styles.headerSubtitle}>Kudil {kudilId}</Text>
        </View>
        <Button
          icon="cog"
          mode="text"
          compact
          onPress={() => setShowSettings(!showSettings)}
          textColor={theme.colors.primary}
        >
          Settings
        </Button>
      </View>

      {/* Printer Settings */}
      {showSettings && (
        <View
          style={[
            styles.settingsContainer,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text style={styles.settingsTitle}>Printer Settings</Text>
          <TextInput
            label="Printer IP Address"
            value={printerIP}
            onChangeText={setPrinterIP}
            mode="outlined"
            placeholder="192.168.1.100"
            style={styles.ipInput}
          />
          <Text style={styles.settingsHint}>
            WiFi STA Mode - Enter thermal printer IP on same network
          </Text>
          <View style={styles.settingsButtonRow}>
            <Button
              mode="outlined"
              onPress={() => {
                setPrinterIP(PRINTER_CONFIG.DEFAULT_IP);
                setShowSettings(false);
              }}
              style={{ flex: 1 }}
            >
              Reset
            </Button>
            <Button
              mode="contained"
              onPress={savePrinterIP}
              style={[{ flex: 1 }, { marginLeft: 10 }]}
            >
              Save
            </Button>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Items</Text>
          <Text style={styles.statValue}>{items.length}</Text>
        </View>
        <Divider style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Quantity</Text>
          <Text style={styles.statValue}>{totalQty}</Text>
        </View>
        <Divider style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>₹{totalPrice.toFixed(2)}</Text>
        </View>
      </View>

      {/* Items List */}
      <View style={styles.inner}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        <View style={styles.printerStatusContainer}>
          <MaterialCommunityIcons
            name={printing ? 'printer-settings' : 'printer'}
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.printerStatusText}>
            {printing ? 'Printing...' : `Printer: ${printerIP}`}
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={printKOT}
          loading={printing}
          disabled={printing || items.length === 0}
          style={styles.printButton}
          contentStyle={styles.printButtonContent}
          labelStyle={styles.printButtonLabel}
          icon="printer"
        >
          {printing ? 'Printing...' : `Print KOT (${items.length})`}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  settingsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  ipInput: {
    marginBottom: 8,
  },
  settingsHint: {
    fontSize: 11,
    opacity: 0.6,
  },
  settingsButtonRow: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 16,
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
  card: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  qtyBadge: {
    backgroundColor: '#FF8C00',
    fontWeight: '700',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    marginTop: 4,
  },
  bottomContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  printerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF8C0015',
  },
  printerStatusText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  printButton: {
    borderRadius: 8,
  },
  printButtonContent: {
    paddingVertical: 8,
  },
  printButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default KOTScreen;

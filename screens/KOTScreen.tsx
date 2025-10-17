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
// Import the correct printer from the library
import { NetPrinter } from 'react-native-thermal-receipt-printer';
import productsData from '../data/products.json';
import dayjs from 'dayjs';

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
  const [printerPort, setPrinterPort] = useState('9100');
  const [tempPrinterIP, setTempPrinterIP] = useState('192.168.1.100');
  const [showSettings, setShowSettings] = useState(false);
  const [showIPModal, setShowIPModal] = useState(false);
  const [products, setProducts] = useState<{ [key: number]: Product }>({});
  const [printerConnected, setPrinterConnected] = useState(false);

  // Default printer settings - STA mode WiFi connection
  const PRINTER_CONFIG = {
    DEFAULT_IP: '192.168.1.100',
    DEFAULT_PORT: 9100,
  };

  useEffect(() => {
    loadSettings();
    loadProducts();
    initializePrinter();
  }, []);

  const initializePrinter = async () => {
    try {
      await NetPrinter.init();
      console.log('Printer initialized');
    } catch (error) {
      console.error('Error initializing printer:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedIP = await AsyncStorage.getItem('printerIP');
      const savedPort = await AsyncStorage.getItem('printerPort');
      if (savedIP) {
        setPrinterIP(savedIP);
      }
      if (savedPort) {
        setPrinterPort(savedPort);
      }
    } catch (error) {
      console.error('Error loading printer settings:', error);
    }
  };

  const loadProducts = async () => {
    try {
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
      await AsyncStorage.setItem('printerPort', printerPort);
      Alert.alert('Success', 'Printer settings saved successfully');
      setShowSettings(false);
      setPrinterConnected(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save printer settings');
    }
  };

  const connectToPrinter = async () => {
    try {
      const port = parseInt(printerPort) || PRINTER_CONFIG.DEFAULT_PORT;
      await NetPrinter.connectPrinter(printerIP.trim(), port);
      setPrinterConnected(true);
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      setPrinterConnected(false);
      return false;
    }
  };

  const printKOT = async () => {
    if (!printerIP.trim()) {
      Alert.alert('Error', 'Please configure printer IP address');
      return;
    }

    setPrinting(true);

    try {
      // Connect to printer if not already connected
      if (!printerConnected) {
        const connected = await connectToPrinter();
        if (!connected) {
          throw new Error('Failed to connect to printer');
        }
      }

      // Build receipt text with formatting tags
      let receiptText = '';
      
      // Restaurant Header
      receiptText += '<CB>ARUVI</CB>\n';
      receiptText += '<CM>Traditional Cuisine</CM>\n';
      receiptText += '<CM>123 Main Street</CM>\n';
      receiptText += '<CM>Salem, Tamil Nadu</CM>\n';
      receiptText += '<C>================================</C>\n';
      receiptText += '\n';
      receiptText += '<CB>KITCHEN ORDER TICKET</CB>\n';
      receiptText += '<C>================================</C>\n';
      receiptText += '\n';
      
      // Table/Kudil info
      receiptText += `<CM>TABLE/KUDIL: ${kudilId}</CM>\n`;
      receiptText += `<CM>TIME: ${dayjs().format('HH:mm:ss')}</CM>\n`;
      receiptText += `<CM>DATE: ${dayjs().format('DD-MM-YYYY')}</CM>\n`;
      receiptText += '<C>================================</C>\n';
      receiptText += '\n';

      // Items
      receiptText += '<CB>ORDER ITEMS</CB>\n';
      receiptText += '<C>--------------------------------</C>\n';
      receiptText += '\n';
      items.forEach((item: CartItem) => {
        const product = products[item.productId];
        const productName = product?.name || `Product ${item.productId}`;
        receiptText += `<CM>${productName}</CM>\n`;
        receiptText += `<CM>Qty: ${item.qty}`;
        if (product?.price) {
          receiptText += ` x Rs.${product.price.toFixed(2)} = Rs.${(product.price * item.qty).toFixed(2)}`;
        }
        receiptText += '</CM>\n';
        receiptText += '\n';
      });

      // Footer
      receiptText += '<C>================================</C>\n';
      receiptText += `<CM>Total Items: ${items.reduce((sum, item) => sum + item.qty, 0)}</CM>\n`;
      receiptText += `<CB>Total Amount: Rs.${totalPrice.toFixed(2)}</CB>\n`;
      receiptText += '<C>================================</C>\n';
      receiptText += '\n';
      receiptText += '<CM>Thank You!</CM>\n';
      receiptText += '<C>--- END OF ORDER ---</C>\n';
      receiptText += '\n';
      // receiptText += '\n';
      // receiptText += '\n';

      // Print using printBill method (automatically cuts paper)
      await NetPrinter.printBill(receiptText);

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
      setPrinterConnected(false);
      console.error('Print error:', error);
      Alert.alert(
        'Print Failed',
        `Unable to connect to printer at ${printerIP}:${printerPort}.\n\nPlease check:\n1. Printer IP address is correct\n2. Printer is connected to WiFi\n3. Printer is powered on\n4. Both devices are on same network`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => printKOT() },
        ]
      );
    }
  };

  const testPrinterConnection = async () => {
    setPrinting(true);
    try {
      const connected = await connectToPrinter();
      if (connected) {
        // Print test receipt
        const testText = '<CB>TEST PRINT</CB>\n<C>Printer Connected Successfully!</C>\n\n';
        await NetPrinter.printText(testText);
        Alert.alert('Success', 'Printer connection successful!');
      } else {
        Alert.alert('Failed', 'Could not connect to printer');
      }
    } catch (error) {
      Alert.alert('Error', 'Printer connection test failed');
    } finally {
      setPrinting(false);
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
            keyboardType="numeric"
          />
          <TextInput
            label="Printer Port"
            value={printerPort}
            onChangeText={setPrinterPort}
            mode="outlined"
            placeholder="9100"
            style={styles.ipInput}
            keyboardType="numeric"
          />
          <Text style={styles.settingsHint}>
            WiFi STA Mode - Enter thermal printer IP on same network
          </Text>
          <View style={styles.settingsButtonRow}>
            <Button
              mode="outlined"
              onPress={() => {
                setPrinterIP(PRINTER_CONFIG.DEFAULT_IP);
                setPrinterPort(PRINTER_CONFIG.DEFAULT_PORT.toString());
              }}
              style={{ flex: 1 }}
            >
              Reset
            </Button>
            <Button
              mode="outlined"
              onPress={testPrinterConnection}
              style={{ flex: 1, marginLeft: 10 }}
              loading={printing}
              disabled={printing}
            >
              Test
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
        <View style={[
          styles.printerStatusContainer,
          { backgroundColor: printerConnected ? '#4CAF5015' : '#FF8C0015' }
        ]}>
          <MaterialCommunityIcons
            name={printing ? 'printer-settings' : printerConnected ? 'printer-check' : 'printer'}
            size={20}
            color={printerConnected ? '#4CAF50' : theme.colors.primary}
          />
          <Text style={styles.printerStatusText}>
            {printing ? 'Printing...' : printerConnected ? `Connected: ${printerIP}:${printerPort}` : `Printer: ${printerIP}:${printerPort}`}
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
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList, CartItem } from '../Appnav';
// Import the correct printer from the library
import { NetPrinter } from 'react-native-thermal-receipt-printer';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [products, setProducts] = useState<{ [key: string]: Product }>({});
  const [printerConnected, setPrinterConnected] = useState(false);

  const PRINTER_CONFIG = {
    DEFAULT_IP: '192.168.1.100',
    DEFAULT_PORT: 9100,
  };

  const STORAGE_KEYS = {
    PRINTER_IP: 'printer_ip',
    PRINTER_PORT: 'printer_port',
  } as const;

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await initializePrinter();
    };
    init();
  }, []);

  const initializePrinter = async () => {
    try {
      await NetPrinter.init();
    } catch (error) {
      console.error('Error initializing printer:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const [savedIP, savedPort] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PRINTER_IP),
        AsyncStorage.getItem(STORAGE_KEYS.PRINTER_PORT),
      ]);

      if (savedIP && savedIP.trim()) {
        setPrinterIP(savedIP.trim());
      }
      if (savedPort && savedPort.trim() && !Number.isNaN(Number(savedPort))) {
        setPrinterPort(String(parseInt(savedPort, 10)));
      }
    } catch (error) {
      console.error('Failed to load printer settings from storage:', error);
    }
  };

  const savePrinterIP = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.PRINTER_IP, printerIP.trim()),
        AsyncStorage.setItem(
          STORAGE_KEYS.PRINTER_PORT,
          (parseInt(printerPort) || PRINTER_CONFIG.DEFAULT_PORT).toString(),
        ),
      ]);
      Alert.alert('Saved', 'Printer settings saved');
    } catch (error) {
      console.error('Failed to save printer settings to storage:', error);
      Alert.alert('Error', 'Failed to save printer settings');
    } finally {
      setShowSettings(false);
      setPrinterConnected(false);
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
      if (!printerConnected) {
        const connected = await connectToPrinter();
        if (!connected) {
          throw new Error('Failed to connect to printer');
        }
      }

      let receiptText = '';

      receiptText += '<C>**********************************************</C>\n';
      receiptText += '\n';
      receiptText += '<CB>ARUVI RESTAURANT</CB>\n';
      receiptText += '<C>மணப்பாறை சமையல்</C>\n';
      receiptText += '<C>Elampillai To Chinnampatti Main Road</C>\n';
      receiptText += '<C>Near Nayara Petrol Bunk, Elampillai-637502</C>\n';
      receiptText += '<C>Phone : 7200800840</C>\n';
      receiptText += '<C>----------------------------------------------</C>\n';
      receiptText += '\n';
      receiptText += '<CB>KITCHEN ORDER</CB>\n';
      receiptText += '<C>----------------------------------------------</C>\n';
      receiptText += '\n';

      receiptText += `<C>KUDIL NO : ${kudilId}     Date :${dayjs().format(
        'DD-MM-YY',
      )}  ${dayjs().format('HH:mm:ss')}</C>\n`;
      receiptText += '<C>----------------------------------------------</C>\n';
      receiptText += '\n';

      receiptText += 'S.No  Particulars            Qty\n';
      receiptText += '<C>----------------------------------------------</C>\n';

      items.forEach((item: CartItem, index: number) => {
        const sno = (index + 1).toString().padEnd(6);
        const name = item.productName.substring(0, 20).padEnd(22);
        const qty = item.quantity.toString();
        receiptText += `${sno}${name}${qty}\n`;
      });

      receiptText += '<C>----------------------------------------------</C>\n';
      receiptText += '\n';
      receiptText += `<CB>Total Items: ${items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      )}</CB>\n`;
      receiptText += '\n';
      receiptText += '<C>**********************************************</C>\n';
      receiptText += '\n';
      receiptText += '\n';

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
        ],
      );
    }
  };

  const testPrinterConnection = async () => {
    setPrinting(true);
    try {
      const connected = await connectToPrinter();
      if (connected) {
        const testText =
          '<CB>TEST PRINT</CB>\n<C>Printer Connected Successfully!</C>\n\n';
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
                <Title style={styles.itemTitle}>{item.productName}</Title>
              </View>
            </View>
            <Badge style={styles.qtyBadge}>{item.quantity}</Badge>
          </View>
          {item.price !== undefined && (
            <Text style={styles.priceText}>
              ₹{(item.price * item.quantity).toFixed(2)}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0,
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
        <View
          style={[
            styles.printerStatusContainer,
            { backgroundColor: printerConnected ? '#4CAF5015' : '#FF8C0015' },
          ]}
        >
          <MaterialCommunityIcons
            name={
              printing
                ? 'printer-settings'
                : printerConnected
                ? 'printer-check'
                : 'printer'
            }
            size={20}
            color={printerConnected ? '#4CAF50' : theme.colors.primary}
          />
          <Text style={styles.printerStatusText}>
            {printing
              ? 'Printing...'
              : printerConnected
              ? `Connected: ${printerIP}:${printerPort}`
              : `Printer: ${printerIP}:${printerPort}`}
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

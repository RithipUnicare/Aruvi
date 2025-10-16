// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Card, Title, Text, Badge, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList, WaiterProfile } from '../Appnav';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface Kudil {
  id: number;
  items: CartItem[];
}

interface CartItem {
  productId: number;
  qty: number;
  served: boolean;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [kudils, setKudils] = useState<Kudil[]>([]);
  const [waiter, setWaiter] = useState<WaiterProfile | null>(null);
  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const numColumns = width > 600 ? 2 : 1;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const waiterData = await AsyncStorage.getItem('waiter');
    const kudilsData = await AsyncStorage.getItem('kudils');
    if (waiterData) setWaiter(JSON.parse(waiterData));
    if (kudilsData) setKudils(JSON.parse(kudilsData));
  };

  const renderKudil = ({ item }: { item: Kudil }) => {
    const totalItems = item.items.length;
    const unsavedItems = item.items.filter((i: CartItem) => !i.served).length;
    const isEmpty = totalItems === 0;
    const isOccupied = !isEmpty;

    return (
      <TouchableOpacity
        onPress={() => {
          if (isEmpty && waiter) {
            navigation.navigate('Cart', { kudilId: item.id, waiter });
          } else {
            Alert.alert('Kudil Occupied', 'This kudil already has orders.');
          }
        }}
        activeOpacity={isEmpty ? 0.7 : 1}
      >
        <Card
          style={[
            styles.card,
            {
              backgroundColor: isEmpty
                ? theme.colors.surface
                : theme.colors.surfaceVariant,
              borderLeftWidth: 4,
              borderLeftColor: isOccupied ? '#FF8C00' : '#4CAF50',
            },
          ]}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.headerRow}>
              <View style={styles.titleContainer}>
                <Title style={styles.title}>Kudil {item.id}</Title>
                <Text style={styles.subtitle}>
                  {isEmpty ? 'Available' : 'Occupied'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isEmpty ? '#4CAF50' : '#FF8C00',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={isEmpty ? 'check-circle' : 'alert-circle'}
                  size={20}
                  color="white"
                />
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="food-fork-drink"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.statLabel}>Total Items</Text>
                <Text style={styles.statValue}>{totalItems}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.statLabel}>Unserved</Text>
                <Badge style={[styles.badge, { backgroundColor: '#FF8C00' }]}>
                  {unsavedItems}
                </Badge>
              </View>
            </View>

            {isEmpty && (
              <View style={styles.actionHint}>
                <MaterialCommunityIcons
                  name="hand-pointing-right"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.hintText, { color: theme.colors.primary }]}
                >
                  Tap to add order
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <View>
          <Title style={styles.headerTitle}>Restaurant Orders</Title>
          <Text style={styles.headerSubtitle}>
            Manage your table orders efficiently
          </Text>
        </View>
        {waiter && (
          <View style={styles.waiterInfo}>
            <MaterialCommunityIcons
              name="account-circle"
              size={32}
              color={theme.colors.primary}
            />
            <Text style={styles.waiterName}>{waiter.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.inner}>
        <FlatList
          data={kudils}
          renderItem={renderKudil}
          keyExtractor={(item: Kudil) => item.id.toString()}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    // paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  waiterInfo: {
    alignItems: 'center',
    gap: 4,
  },
  waiterName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  inner: {
    flex: 1,
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    flex: 1,
    marginHorizontal: 4,
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  badge: {
    marginTop: 2,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HomeScreen;

// App.tsx
import React, { useEffect, useState } from 'react';
import {
  Provider as PaperProvider,
  MD3LightTheme as DefaultLightTheme,
  MD3DarkTheme as DefaultDarkTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import { View } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, Appearance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CartScreen from './screens/CartScreen';
import ProductsScreen from './screens/ProductScreen';
import KOTScreen from './screens/KOTScreen';
import products from './data/products.json';

const Stack = createNativeStackNavigator<RootStackParamList>();
const theme = { light: DefaultTheme, dark: DarkTheme };

const customLightTheme = {
  ...DefaultLightTheme,
  colors: {
    ...DefaultLightTheme.colors,
    primary: '#FF8C00',
    onPrimary: 'white',
    primaryContainer: '#FFDAB9',
  },
};

const customDarkTheme = {
  ...DefaultDarkTheme,
  colors: {
    ...DefaultDarkTheme.colors,
    primary: '#FF8C00',
    onPrimary: 'white',
    primaryContainer: '#FF8C00',
    surface: '#1E1E1E',
    onSurface: 'white',
  },
};

const { LightTheme: PaperNavLight, DarkTheme: PaperNavDark } =
  adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Cart: { kudilId: number; waiter: WaiterProfile };
  Products: {
    kudilId: number;
    onAdd: (productId: number, qty: number) => void;
  };
  KOT: { kudilId: number; items: CartItem[]; onPrint: () => void };
};

export type WaiterProfile = {
  name: string;
  id: string;
};

export type CartItem = {
  productId: number;
  qty: number;
  served: boolean;
};

export default function AppNav() {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  const paperTheme = isDarkMode ? customDarkTheme : customLightTheme;
  const navigationTheme = isDarkMode ? PaperNavDark : PaperNavLight;

  useEffect(() => {
    // Ensure initial data if not present
    AsyncStorage.getItem('kudils').then(data => {
      if (!data) {
        AsyncStorage.setItem(
          'kudils',
          JSON.stringify(
            Array.from({ length: 8 }, (_, i) => ({ id: i + 1, items: [] })),
          ),
        );
      }
    });
  }, []);

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    Appearance.setColorScheme(newTheme);
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerRight: () => (
                <IconButton
                  icon={
                    isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent'
                  }
                  iconColor={paperTheme.colors.primary}
                  size={24}
                  onPress={handleThemeToggle}
                />
              ),
            }}
          >
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: true }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={({ navigation }) => ({
                title: 'Kudils',
                headerShown: true,
                headerRight: () => (
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton
                      icon={
                        isDarkMode
                          ? 'white-balance-sunny'
                          : 'moon-waning-crescent'
                      }
                      iconColor={paperTheme.colors.primary}
                      size={24}
                      onPress={handleThemeToggle}
                    />
                    <IconButton
                      icon="logout"
                      iconColor={paperTheme.colors.primary}
                      size={24}
                      onPress={() => navigation.replace('Login')}
                    />
                  </View>
                ),
              })}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ title: 'Cart' }}
            />
            <Stack.Screen
              name="Products"
              component={ProductsScreen}
              options={{ title: 'Products' }}
            />
            <Stack.Screen
              name="KOT"
              component={KOTScreen}
              options={{ title: 'Kitchen Order Ticket' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

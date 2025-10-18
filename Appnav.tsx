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
import { IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CartScreen from './screens/CartScreen';
import ProductsScreen from './screens/ProductScreen';
import KOTScreen from './screens/KOTScreen';
 

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
  Home: { waiter: WaiterProfile };
  Cart: { kudilId: string; waiter: WaiterProfile };
  Products: {
    kudilId: string;
    onAdd: (productId: string, qty: number, productName: string, price: number) => void;
  };
  KOT: { kudilId: string; items: CartItem[]; onPrint: () => void };
};

export type WaiterProfile = {
  name: string;
  id: string;
};

export type CartItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

export default function AppNav() {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  const paperTheme = isDarkMode ? customDarkTheme : customLightTheme;
  const navigationTheme = isDarkMode ? PaperNavDark : PaperNavLight;

  useEffect(() => {
    // no-op
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

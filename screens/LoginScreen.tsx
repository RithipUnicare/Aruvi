// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { TextInput, Button, Title, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../Appnav';
import { waitersService } from '../services/waitersService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

interface WaiterProfile {
  name: string;
  id: string;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [mobile, setMobile] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const theme = useTheme();
  const { height } = Dimensions.get('window');

  const handleLogin = async () => {
    if (mobile.trim().length === 0) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    if (mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const resp = await waitersService.getAll();
      const waiters = resp.data!;
      const waiter = waiters.find(w => w.phone === mobile);
      navigation.replace('Home', {
        waiter: { id: waiter?.id ?? '', name: waiter?.name ?? '' },
      });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.inner}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <MaterialCommunityIcons
                name="account-tie"
                size={80}
                color={theme.colors.primary}
              />
            </View>
            <Title style={styles.appName}>Aruvi Waiter App</Title>
            {/* <Text style={styles.appSubtitle}>Manage orders with ease</Text> */}
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.titleContainer}>
              <Title style={styles.title}>Welcome Back</Title>
              <Text style={styles.subtitle}>
                Sign in to your waiter account
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Mobile Number"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={theme.colors.outline}
                maxLength={10}
                editable={!loading}
                left={
                  <TextInput.Icon icon="phone" color={theme.colors.primary} />
                }
              />
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.button}
              loading={loading}
              disabled={loading || mobile.length === 0}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <View style={styles.infoContainer}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.infoText}>
                Enter your 10-digit mobile number to login
              </Text>
            </View>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <Text style={styles.footer}>
              Powered by Aruvi Restaurant Management
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    //paddingVertical: 24,
  },
  logoSection: {
    alignItems: 'center',
    //paddingVertical: ,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderRadius: 8,
  },
  button: {
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF8C0015',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  footerSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footer: {
    fontSize: 11,
    opacity: 0.5,
    textAlign: 'center',
  },
});

export default LoginScreen;

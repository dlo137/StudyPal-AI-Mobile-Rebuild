import 'react-native-url-polyfill/auto'
import registerNNPushToken from 'native-notify';


import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
// Deep linking config for the app
const linking = {
  prefixes: ['studypal://'],
  config: {
    screens: {
      Login: 'login',
      Signup: 'signup',
      MainTabs: {
        path: '',
        screens: {
          Chat: 'chat',
          Notes: 'notes',
          Plans: 'plans',
          Profile: 'profile',
        },
      },
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      Mission: 'mission',
      ContactUs: 'contact-us',
      StripePaymentScreen: 'stripe-payment',
    },
  },
};
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import { LogBox } from 'react-native';


import LoginScreen from './src/screens/loginScreen';
import SignupScreen from './src/screens/signupScreen';
import BottomTabNavigator from './src/navigation/BotttomTabNavigator';
import MissionScreen from './src/screens/missionScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import ResetPassword from './src/pages/ResetPassword';


LogBox.ignoreLogs(['Unsupported top level event type \"topInsetsChange\" dispatched']);

const Stack = createNativeStackNavigator();

export default function App() {
  registerNNPushToken(31513, 'L078ZkWOWbfwT6GX7hSh6v');
  
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Expose global refresh function
  React.useEffect(() => {
    (globalThis as any).refreshApp = () => {
      setRefreshKey(k => k + 1);
    };
    return () => {
      (globalThis as any).refreshApp = undefined;
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <StripeProvider publishableKey="pk_live_51RgCVxI3Uf0Ofl4lDYoyPZlcSWrGgHwuUw1UP3YbErpKcBeu4eqLLjCVSxezyH8oIPZSA2iG0tRmEeGzNHUnM0mL00KDz5HAML" merchantIdentifier="merchant.com.example">
          <NavigationContainer linking={linking} key={refreshKey}>
            <Stack.Navigator initialRouteName="MainTabs">
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Signup"
                component={SignupScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MainTabs"
                component={BottomTabNavigator}
                options={{ headerShown: false }}
                initialParams={{ screen: 'Chat' }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{ headerShown: false, presentation: 'modal' }}
              />
              <Stack.Screen
                name="ResetPassword"
                component={ResetPassword}
                options={{ headerShown: false, presentation: 'modal' }}
              />
              <Stack.Screen
                name="Mission"
                component={MissionScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ContactUs"
                component={require('./src/screens/contactusScreen').default}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="StripePaymentScreen"
                component={require('./src/screens/StripePaymentScreen').default}
                options={{ headerShown: false, presentation: 'modal' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </StripeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
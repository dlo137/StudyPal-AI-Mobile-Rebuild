import 'react-native-url-polyfill/auto'


import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';


import LoginScreen from './src/screens/loginScreen';
import SignupScreen from './src/screens/signupScreen';
import BottomTabNavigator from './src/navigation/BotttomTabNavigator';
import MissionScreen from './src/screens/missionScreen';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StripeProvider publishableKey="pk_live_51RgCVxI3Uf0Ofl4lDYoyPZlcSWrGgHwuUw1UP3YbErpKcBeu4eqLLjCVSxezyH8oIPZSA2iG0tRmEeGzNHUnM0mL00KDz5HAML" merchantIdentifier="merchant.com.example">
          <NavigationContainer>
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
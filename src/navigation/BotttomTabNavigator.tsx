import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import ChatScreen from '../screens/chatScreen';
import NotesScreen from '../screens/notesScreen';
import PlansScreen from '../screens/plansScreen';
import ProfileScreen from '../screens/profileScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Notes') {
            iconName = focused ? 'document' : 'document-outline';
          } else if (route.name === 'Plans') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Chat" component={ChatScreen} options={{ headerShown: false, tabBarLabel: 'Chat' }} />
      <Tab.Screen name="Notes" component={NotesScreen} options={{ tabBarLabel: 'Notes', headerShown: false }} />
      <Tab.Screen name="Plans" component={PlansScreen} options={{ tabBarLabel: 'Plans' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

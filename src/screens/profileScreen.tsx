
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type RootStackParamList = {
  Mission: undefined;
  ContactUs: undefined;
  // ...other routes if needed
};

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route?: RouteProp<RootStackParamList, any>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme.mode === 'dark';
  const { user } = useAuth();
  // Get user name, email, and plan from Supabase table
  let userName = '';
  let userEmail = '';
  const [userPlan, setUserPlan] = useState('Free');
  if (user) {
    userEmail = user.email || '';
    const meta = user.user_metadata || {};
    const firstName = meta.first_name || '';
    const lastName = meta.last_name || '';
    if (firstName && lastName) {
      userName = `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
    } else if (meta.name) {
      const parts = meta.name.trim().split(' ');
      if (parts.length === 1) {
        userName = parts[0];
      } else {
        userName = `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
      }
    }
  }

  // Fetch plan_type from Supabase (profiles table, plan_type column)
  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      const userId = user.id;
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data && data.plan_type) {
        const plan = String(data.plan_type).toLowerCase();
        if (plan === 'gold') setUserPlan('Gold');
        else if (plan === 'diamond') setUserPlan('Diamond');
        else setUserPlan('Free');
      } else {
        setUserPlan('Free');
      }
    };
    fetchPlan();
  }, [user]);
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: theme.background }]}> 
        {/* Header */}
        <Header hidePlus={true} />

        {/* Avatar and Info */}
        <View style={[styles.avatarSection, { backgroundColor: theme.background, borderBottomColor: theme.border }]}> 
          <View style={[styles.avatar, { backgroundColor: theme.menu }]}> 
            <LinearGradient
              colors={[theme.accent, theme.accentSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                borderRadius: 48,
                overflow: 'hidden',
              }}
              pointerEvents="none"
            />
            <FontAwesome5 name="user" size={40} color={theme.text} />
          </View>
          <Text style={[styles.name, { color: theme.accentSecondary }]}>{userName || 'User Name'}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{userEmail || 'user@email.com'}</Text>
          {user && (
            <View style={[styles.planBadge, { backgroundColor: theme.menu }]}> 
              {userPlan === 'Gold' && (
                <>
                  <FontAwesome5 name="star" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                  <Text style={[styles.planText, { color: theme.text }]}>Gold Member</Text>
                </>
              )}
              {userPlan === 'Diamond' && (
                <>
                  <FontAwesome5 name="crown" size={16} color={theme.accentSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.planText, { color: theme.text }]}>Diamond Member</Text>
                </>
              )}
              {userPlan === 'Free' && (
                <>
                  <Feather name="zap" size={16} color={theme.accent} style={{ marginRight: 6 }} />
                  <Text style={[styles.planText, { color: theme.text }]}>Free Member</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Activity Buttons */}
        <View style={{ padding: 16 }}>
          <Text style={[styles.sectionTitle, { marginLeft: 0, marginTop: 0, color: theme.text }]}>Activity</Text>
          <TouchableOpacity
            style={[styles.menuBtn, { backgroundColor: theme.menu }]}
            onPress={() => navigation && navigation.navigate && navigation.navigate('Mission')}
          >
            <MaterialCommunityIcons name="bookmark-outline" size={22} color={theme.accent} style={styles.menuIcon} />
            <View>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Mission Statement</Text>
              <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>Learn about our purpose and goals</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuBtn, { backgroundColor: theme.menu }]}
            onPress={() => navigation && navigation.navigate && navigation.navigate('ContactUs')}
          >
            <Feather name="message-square" size={22} color={theme.accent} style={styles.menuIcon} />
            <View>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Contact Us</Text>
              <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>Get in touch with our support team</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: theme.menu }]} onPress={() => setTheme(isDarkMode ? 'light' : 'dark')}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny'}
                size={24}
                color={isDarkMode ? theme.accent : '#FFD700'}
                style={{ marginRight: 16 }}
              />
              <View>
                <Text style={[styles.menuTitle, { color: theme.text }]}>Dark & Light Mode</Text>
                <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>Toggle between light and dark themes</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  avatarSection: { alignItems: 'center', padding: 24, borderBottomWidth: 1 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12
  },
  avatarText: { fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  email: { marginBottom: 10 },
  planBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginTop: 8
  },
  planText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 14,
    marginBottom: 12,
    elevation: 1,
  },
  menuIcon: { marginRight: 16 },
  menuTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  menuSubtitle: { fontSize: 13 },
  switchIconWrap: { flexDirection: 'row', alignItems: 'center', marginRight: 16 }
});

export default ProfileScreen;

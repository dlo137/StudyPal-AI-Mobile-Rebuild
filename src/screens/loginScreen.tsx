import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const studyPalIcon = require('../../assets/studypal-icon.png');

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18181b' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#18181b',
    zIndex: 10,
  },
  closeBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    backgroundColor: 'transparent',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#23232a',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#23232a',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    zIndex: 2,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#4285F4',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#f43f5e',
    backgroundColor: '#3b1a1a',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  bottomText: {
    color: '#a0a0a0',
    fontSize: 15,
    textAlign: 'center',
  },
  linkText: {
    color: '#2da8ff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    gap: 10,
  },
  sideBtn: {
    flex: 1,
    marginHorizontal: 2,
    marginTop: 0,
  },
});

// Main LoginScreen component

import React, { useState } from 'react';
import SuccessModal from './SuccessModal';
import { supabase } from '../lib/supabase';


const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setShowFailure(true);
    } else if (data && (data.user || (data.session && data.session.user))) {
      const user = data.user || (data.session && data.session.user);
      setUserName(user?.user_metadata?.name || user?.email || undefined);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigation?.navigate && navigation.navigate('MainTabs', { screen: 'Chat', params: { userName } });
      }, 1200);
    } else {
      setShowFailure(true);
    }
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header with X icon */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation?.goBack && navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.centeredContent}>
          <Image source={studyPalIcon} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Log in</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#a0a0a0"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#a0a0a0"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          {/* Forgot Password link temporarily removed */}

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>{loading ? 'Logging in...' : 'Log in'}</Text>
          </TouchableOpacity>

          {/* Don't have an account? Create new account */}
          <View style={{ width: '100%', alignItems: 'center', marginTop: 16 }}>
            <Text style={{ color: '#fff', fontSize: 15, textAlign: 'center' }}>
              {`Don't Have an account? `}
              <Text
                style={{ color: '#4285F4', fontWeight: 'bold' }}
                onPress={() => navigation?.navigate && navigation.navigate('Signup')}
              >
                Create new account
              </Text>
            </Text>
          </View>
        </View>
        <SuccessModal
          visible={showSuccess}
          onClose={() => setShowSuccess(false)}
          userName={userName}
        />
        <Modal
          visible={showFailure}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFailure(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', minWidth: 260 }}>
              <Text style={{ fontSize: 18, color: '#b91c1c', fontWeight: 'bold', marginBottom: 12 }}>Login Failed</Text>
              <Text style={{ fontSize: 16, color: '#222', marginBottom: 20, textAlign: 'center' }}>Did not log in successfully. Please check your credentials.</Text>
              <TouchableOpacity style={{ backgroundColor: '#b91c1c', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }} onPress={() => setShowFailure(false)}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

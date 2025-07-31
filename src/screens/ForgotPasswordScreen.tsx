// For web password reset, make sure your web app has a route at /reset-password
// using your ResetPassword.tsx component. Example (React Router):
// <Route path="/reset-password" element={<ResetPassword />} />
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18181b' },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    backgroundColor: 'transparent',
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
  button: {
    width: '100%',
    backgroundColor: '#4285F4',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    color: '#fff',
    backgroundColor: '#23232a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  error: {
    color: '#f43f5e',
    backgroundColor: '#3b1a1a',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
});

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendReset = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    const redirectUrl = 'https://stud-pal-ai-mobile-rebuild-xktk.vercel.app/reset-password';
    // Debug: confirm the redirect URL used for Supabase password reset
    console.log('[ForgotPassword] Sending reset email with redirectTo:', redirectUrl);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    setLoading(false);
    if (error) {
      setError(error.message || 'Failed to send reset email.');
    } else {
      setMessage('A password reset link has been sent to your email.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centeredContent}>
          <Text style={styles.title}>Forgot Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#a0a0a0"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={handleSendReset} disabled={loading || !email}>
            <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#23232a', marginTop: 16 }]} onPress={() => navigation?.goBack && navigation.goBack()}>
            <Text style={[styles.buttonText, { color: '#fff' }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

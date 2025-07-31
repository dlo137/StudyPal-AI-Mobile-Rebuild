import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const ContactUsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  // Fetch user email from Supabase profiles table
  React.useEffect(() => {
    const fetchEmail = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user && user.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();
        if (data && data.email) {
          setFormData(prev => ({ ...prev, email: data.email }));
        }
      }
    };
    fetchEmail();
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      console.log('[Contact Form] Submitting formData:', formData);
      const response = await fetch('https://stud-pal-ai-mobile-rebuild-xktk.vercel.app/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      console.log('[Contact Form] Response status:', response.status);
      const responseBody = await response.text();
      console.log('[Contact Form] Response body:', responseBody);
      if (!response.ok) {
        throw new Error('Failed to send message.');
      }
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      console.log('[Contact Form] Submission successful.');
    } catch (e) {
      console.log('[Contact Form] Error:', e);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      console.log('[Contact Form] Submission finished.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}> 
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.goBack && navigation.goBack()}>
          <Feather name="x" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>CONTACT US</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={[styles.bodyContainer, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <LinearGradient colors={["#8C52FF", "#5CE1E6"]} style={styles.heroIconCircle}>
              <MaterialCommunityIcons name="message-text-outline" size={48} color="#fff" />
            </LinearGradient>
            <MaskedView
              maskElement={
                <Text style={[styles.heroTitleGradient, { color: theme.text }]}>Get In Touch</Text>
              }
            >
              <LinearGradient
                colors={["#5CE1E6", "#8C52FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 40 }}
              >
                <Text style={[styles.heroTitleGradient, { opacity: 0 }]}>Get In Touch</Text>
              </LinearGradient>
            </MaskedView>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}> 
              We're here to help! Reach out to us with any questions, feedback, or support needs.
            </Text>
          </View>

          {/* Contact Form */}
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            <Text style={[styles.formTitle, { color: theme.text }]}>Send us a Message</Text>
            {submitStatus === 'success' && (
              <View style={[styles.formStatus, { backgroundColor: '#1e3a1e', borderColor: '#22c55e' }]}> 
                <Text style={{ color: '#22c55e', textAlign: 'center' }}>Thank you for your message! We'll get back to you soon.</Text>
              </View>
            )}
            {submitStatus === 'error' && (
              <View style={[styles.formStatus, { backgroundColor: '#3b1e1e', borderColor: '#ef4444' }]}> 
                <Text style={{ color: '#ef4444', textAlign: 'center' }}>Something went wrong. Please try again later.</Text>
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: '#333' }]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textSecondary}
                value={formData.name}
                onChangeText={v => handleInputChange('name', v)}
                editable={!isSubmitting}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: '#333' }]}
              placeholder={formData.email || "your.email@example.com"}
              placeholderTextColor={theme.textSecondary}
              value={formData.email}
              onChangeText={v => handleInputChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Subject</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: '#333' }]}
                placeholder="How can we help you?"
                placeholderTextColor={theme.textSecondary}
                value={formData.subject}
                onChangeText={v => handleInputChange('subject', v)}
                editable={!isSubmitting}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Message</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top', backgroundColor: theme.card, color: theme.text, borderColor: '#333' }]}
                placeholder="Tell us more about your question or feedback..."
                placeholderTextColor={theme.textSecondary}
                value={formData.message}
                onChangeText={v => handleInputChange('message', v)}
                multiline
                numberOfLines={5}
                editable={!isSubmitting}
              />
            </View>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient colors={["#8C52FF", "#5CE1E6"]} style={styles.submitBtnGradient}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <MaterialCommunityIcons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.submitBtnText}>{isSubmitting ? 'Sending...' : 'Send Message'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Contact Info Card */}
          <View style={[styles.infoCardBig, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>Contact Information</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle}>
                <MaterialIcons name="email" size={20} color="#8C52FF" />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: theme.text }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.textSecondary }]}>studypalhelpdesk@gmail.com</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#141417' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#141417',
    zIndex: 10,
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontWeight: 'bold', fontSize: 18, color: '#fff', letterSpacing: 1 },
  bodyContainer: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#141417',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroTitleGradient: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: '#23232a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 20,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'left',
  },
  formStatus: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#18181b',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#fff', // white border
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  submitBtn: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  infoCardBig: {
    backgroundColor: '#23232a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 20,
    marginBottom: 24,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8C52FF22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 15,
  },
  infoValue: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  supportDetailCard: {
    backgroundColor: '#23232a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  supportDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8C52FF',
    marginBottom: 8,
    textAlign: 'center',
  },
  supportDetailText: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 4,
    textAlign: 'center',
  },
  ctaSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 15,
    color: '#a0a0a0',
    marginBottom: 12,
    textAlign: 'center',
    maxWidth: 320,
  },
  ctaButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C52FF',
  },
  ctaButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default ContactUsScreen;

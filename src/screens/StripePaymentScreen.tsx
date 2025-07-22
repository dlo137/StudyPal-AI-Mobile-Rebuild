import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CardField, useStripe } from '@stripe/stripe-react-native';

type PlanType = 'gold' | 'diamond';
interface PlanDetails {
  name: string;
  price: number;
  features: string[];
}
const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  gold: {
    name: 'Gold Plan',
    price: 9.99,
    features: [
      '150 Requests / Monthly',
      'Email Support',
      'Priority Access to New Features',
    ],
  },
  diamond: {
    name: 'Diamond Plan',
    price: 19.99,
    features: [
      '500 Requests / Monthly',
      'Email Support',
      'Priority Access to New Features',
      'Priority Support',
    ],
  },
};

const StripePaymentScreen = ({ route, navigation }: any) => {
  const { planType } = route.params as { planType: PlanType };
  const { theme } = useTheme();
  const { user } = useAuth();
  const { confirmPayment } = useStripe();
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const plan: PlanDetails = PLAN_DETAILS[planType] ?? PLAN_DETAILS.gold;

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      if (!cardDetails?.complete) {
        setError('Please enter complete card details.');
        setIsProcessing(false);
        return;
      }
      // 1. Create payment intent on your backend
      // Replace with your backend endpoint
      const response = await fetch('https://your-backend.com/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price * 100, // Stripe expects amount in cents
          currency: 'usd',
          planType,
          email: user?.email,
        }),
      });
      const { clientSecret, error: backendError } = await response.json();
      if (backendError || !clientSecret) {
        setError(backendError || 'Failed to create payment intent.');
        setIsProcessing(false);
        return;
      }
      // 2. Confirm payment with Stripe
      const { paymentIntent, error: stripeError } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: { email: user?.email },
        },
      });
      if (stripeError) {
        setError(stripeError.message);
        setIsProcessing(false);
        return;
      }
      if (paymentIntent) {
        setSucceeded(true);
      }
      setIsProcessing(false);
    } catch (err: any) {
      setError(err?.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.card }}>
        <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.card} />
        <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.accent }]}> 
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            {/* Success Icon */}
            <View style={{ backgroundColor: '#e6ffed', borderRadius: 24, padding: 8, marginBottom: 8 }}>
              {/* You can use a check icon from react-native-vector-icons or similar */}
              <Text style={{ fontSize: 32, color: 'green' }}>✔️</Text>
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Payment Successful!</Text>
            <Text style={[styles.successDesc, { color: theme.textSecondary }]}>Welcome to {plan.name}! Your subscription is now active.</Text>
          </View>
          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.goBack()}>
            <Text style={{ color: theme.text, fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.card }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.card} />
      <View style={[styles.modalContainer, { backgroundColor: theme.card }]}> 
        {/* Header with X icon */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        {/* Main content below header */}
        <View style={{ width: '100%', marginTop: 16 }}>
          <View style={{ marginBottom: 18, width: '100%' }}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Subscribe to {plan.name}</Text>
            <Text style={[styles.modalPrice, { color: theme.text }]}> 
              ${plan.price}/month
            </Text>
            <Text style={[styles.modalTrial, { color: theme.textSecondary }]}>7-day free trial, then ${plan.price} per month</Text>
          </View>

          <View style={{ marginBottom: 12, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>💳</Text>
              <Text style={[styles.label, { color: theme.text }]}>Card Information</Text>
            </View>
            <View style={[styles.cardInputBox, { borderColor: theme.accent, backgroundColor: theme.background, width: '100%' }]}> 
              <CardField
                postalCodeEnabled={true}
                placeholders={{ number: 'Card number' }}
                cardStyle={{
                  backgroundColor: theme.background,
                  textColor: theme.text,
                }}
                style={{ width: '100%', height: 50 }}
                onCardChange={(card: any) => {
                  let zip = card.postalCode || '';
                  // Remove non-digits and limit to 5
                  zip = zip.replace(/[^\d]/g, '').slice(0, 5);
                  // Only update cardDetails if zip is at most 5 digits
                  setCardDetails({ ...card, postalCode: zip });
                }}
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>❌</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.secureBox}>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>🔒 Your payment information is secure and encrypted</Text>
          </View>

          <View style={[styles.buttonRow, { alignItems: 'center', justifyContent: 'center' }]}> 
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.accent, backgroundColor: theme.background }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: theme.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.payBtn}
              onPress={handlePayment}
              disabled={isProcessing}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#8e2de2", "#1fd1f9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ minHeight: 56, width: '100%', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Subscribe</Text>
                    <Text style={{ color: '#fff', fontSize: 14, marginTop: 2 }}>${plan.price}/month</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          <View style={styles.featuresBox}>
            <Text style={[styles.featuresTitle, { color: theme.text }]}>What's included:</Text>
            {plan.features.map((feature: string, idx: number) => (
              <View key={idx} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#22c55e" style={{ marginRight: 6 }} />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#5a5c60ff', // darker gray
    marginVertical: 16,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 24,
    // Remove borderRadius to eliminate white corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    height: '100%',
    minHeight: '100%',
    backgroundColor: undefined,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 6, textAlign: 'left' },
  modalPrice: { fontSize: 20, fontWeight: 'bold', marginBottom: 2, textAlign: 'left' },
  modalTrial: { fontSize: 14, marginBottom: 8, marginTop: 12, textAlign: 'left' },
  label: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  cardInputBox: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 2, width: '100%' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffeaea', borderRadius: 8, padding: 8, marginBottom: 8 },
  errorIcon: { fontSize: 18, color: 'red', marginRight: 6 },
  errorText: { color: 'red', fontSize: 13 },
  secureBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 8, marginBottom: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 20, marginRight: 8, alignItems: 'center' },
  payBtn: { flex: 1, borderRadius: 8, paddingVertical: 20, alignItems: 'center' },
  featuresBox: { marginTop: 12, alignItems: 'flex-start', width: '100%' },
  featuresTitle: { fontWeight: 'bold', marginBottom: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureIcon: { fontSize: 16, marginRight: 6 },
  featureText: { fontSize: 13 },
  successTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  successDesc: { fontSize: 14, marginBottom: 8, textAlign: 'center' },
  closeBtn: { marginTop: 8, padding: 12, borderRadius: 8, alignItems: 'center' },
  // Removed closeIconBtn absolute positioning
  closeIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default StripePaymentScreen;

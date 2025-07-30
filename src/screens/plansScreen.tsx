import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import PlanUpgradeAlert from '../components/PlanUpgradeAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Feather } from '@expo/vector-icons';

import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';


const plans = [
  {
    key: 'free',
    title: 'Free Plan',
    price: '$0',
    features: [
      '10 Requests / Monthly',
      'Free Usage',
      'No Credit Card Required'
    ],
    icon: <Feather name="zap" size={11} color="#fff" />,
    gradient: ['#8C52FF', '#5CE1E6']
  },
  {
    key: 'gold',
    title: 'Gold Plan',
    price: '$4.99/mo',
    features: [
      '150 Requests / Monthly',
      'Email Support',
      'Priority Access to New Features'
    ],
    icon: <FontAwesome5 name="star" size={11} color="#fff" />,
    gradient: ['#8C52FF', '#FFD700']
  },
  {
    key: 'diamond',
    title: 'Diamond Plan',
    price: '$9.99/mo',
    features: [
      '500 Requests / Monthly',
      'Email Support',
      'Priority Access to New Features',
      'Priority Support'
    ],
    icon: <FontAwesome5 name="crown" size={11} color="#fff" />,
    gradient: ['#8C52FF', '#5CE1E6']
  }
];

const screenWidth = Dimensions.get('window').width;
const cardMargin = 6 * 2;
const cardsPerRow = 3;
const cardWidth = Math.floor((screenWidth - (cardsPerRow * cardMargin) - 24) / cardsPerRow);


const PlansScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [showPlanUpgrade, setShowPlanUpgrade] = useState(false);
  const [showPlanDowngrade, setShowPlanDowngrade] = useState(false);
  const [planChangeInfo, setPlanChangeInfo] = useState<{from: 'free' | 'gold' | 'diamond', to: 'free' | 'gold' | 'diamond'} | null>(null);

  // Refetch user plan after navigation or global plan change
  useEffect(() => {
    async function fetchUserPlan() {
      if (!user) {
        setUserPlan(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('plan_type')
          .eq('id', user.id)
          .maybeSingle();
        if (error) {
          console.log('❌ Error fetching user plan:', error.message);
          setUserPlan(null);
          return;
        }
        if (data && data.plan_type) {
          console.log('✅ Fetched plan_type:', data.plan_type);
          // Accept only valid plan values
          const plan = String(data.plan_type).toLowerCase();
          if (["free","gold","diamond"].includes(plan)) {
            setUserPlan(plan);
          } else {
            console.log('❌ Invalid plan_type value:', data.plan_type);
            setUserPlan(null);
          }
        } else {
          console.log('❌ No plan_type found for user:', user.id);
          setUserPlan(null);
        }
      } catch (err) {
        console.log('❌ Exception fetching user plan:', err);
        setUserPlan(null);
      }
    }
    fetchUserPlan();
    // Listen for global.fetchPlanAndUsage calls
    global.fetchPlanAndUsage = async () => {
      await fetchUserPlan();
    };
    // Refetch when coming back from StripePaymentScreen
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserPlan();
    });
    return () => {
      if (global.fetchPlanAndUsage) {
        global.fetchPlanAndUsage = undefined;
      }
      unsubscribe && unsubscribe();
    };
  }, [user, navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      {/* Header Section */}
      <Header hidePlus={true} />
      {/* Main Content Section */}
      <View style={styles.centeredContentWrapper}>
        <ScrollView contentContainerStyle={[styles.centeredScroll, { backgroundColor: theme.background }]}> 
          {/* Title and Description */}
          <View style={styles.titleSection}>
            <Text style={[styles.mainTitle, { color: theme.text }]}>StudyPal: AI Homework Helper</Text>
            <Text style={[styles.mainDesc, { color: theme.textSecondary }]}>
              Saves time and stress while ensuring clarity and quality in your homework, making it the smart choice for tackling assignments with ease.
            </Text>
          </View>
          {/* Plans Cards Section */}
          <View style={styles.cardsRow}>
            {plans.map(plan => {
              const isCurrent = user && userPlan === plan.key;
  const handleChoose = () => {
    if (!user) {
      navigation.navigate('Signup');
      return;
    }
    if (userPlan && userPlan !== plan.key) {
      // If downgrading (diamond->gold, diamond->free, gold->free)
      const isDowngrade =
        (userPlan === 'diamond' && (plan.key === 'gold' || plan.key === 'free')) ||
        (userPlan === 'gold' && plan.key === 'free');
      setPlanChangeInfo({ from: userPlan as 'free' | 'gold' | 'diamond', to: plan.key as 'free' | 'gold' | 'diamond' });
      if (isDowngrade) {
        setShowPlanDowngrade(true);
      } else {
        setShowPlanUpgrade(true);
      }
      return;
    }
    // If already on this plan, do nothing
  };
              // Determine border color for button
              const isLightBg = theme.background === '#fff' || theme.background === '#ffffff' || theme.background === 'white';
              const buttonBorderColor = isLightBg ? '#000' : '#f3f4f6';
              return (
                <View key={plan.key} style={[styles.card, { width: cardWidth, backgroundColor: theme.card, borderColor: theme.border }]}> 
                  {/* Card Header: Icon, Title, Price (top) */}
                  <View style={styles.cardHeaderSection}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.cardIcon, { backgroundColor: plan.gradient[0] }]}> 
                        {plan.icon}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{plan.title}</Text>
                        <Text style={[styles.cardPrice, { color: theme.textSecondary }]}>{plan.price}</Text>
                      </View>
                    </View>
                  </View>
                  {/* Card Features Section (middle, flex: 1) */}
                  <View style={styles.cardFeaturesSection}>
                    <View style={styles.cardFeatures}>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={styles.featureRow}>
                          <View style={[styles.featureDot, { backgroundColor: theme.accent }]} />
                          <Text style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {/* Card Button Section (bottom) */}
                  <View style={styles.cardButtonSection}>
                    <TouchableOpacity
                      style={[
                        styles.cardBtn,
                        isCurrent ? styles.cardBtnCurrent : styles.cardBtnChoose
                      ]}
                      activeOpacity={isCurrent ? 1 : 0.85}
                      disabled={isCurrent}
                      onPress={handleChoose}
                    >
                      {isCurrent ? (
                        <Text style={styles.cardBtnTextCurrent}>Current Plan</Text>
                      ) : (
                        <>
                          <LinearGradient
                            colors={[theme.accent, theme.accentSecondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                            pointerEvents="none"
                          />
                          <Text style={styles.cardBtnText}>Choose {plan.title.split(' ')[0]}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
          <PlanUpgradeAlert
            visible={showPlanUpgrade && !!planChangeInfo}
            onClose={() => setShowPlanUpgrade(false)}
            onConfirm={() => {
              setShowPlanUpgrade(false);
              if (planChangeInfo) {
                navigation.navigate('StripePaymentScreen', { planType: planChangeInfo.to });
                setPlanChangeInfo(null);
              }
            }}
            fromPlan={planChangeInfo?.from || 'free'}
            toPlan={planChangeInfo?.to || 'free'}
          />
          {/* Downgrade warning modal */}
          {showPlanDowngrade && planChangeInfo && (
            <PlanUpgradeAlert
              visible={showPlanDowngrade}
              onClose={() => setShowPlanDowngrade(false)}
              onConfirm={async () => {
                setShowPlanDowngrade(false);
                if (user && planChangeInfo) {
                  // Update plan_type in Supabase
                  const { error } = await supabase
                    .from('profiles')
                    .update({ plan_type: planChangeInfo.to })
                    .eq('id', user.id);
                  if (error) {
                    alert('Failed to downgrade plan: ' + error.message);
                  } else {
                    setUserPlan(planChangeInfo.to);
                    // Refetch plan from Supabase to ensure UI updates
                    if (typeof global.fetchPlanAndUsage === 'function') {
                      await global.fetchPlanAndUsage();
                    }
                  }
                  setPlanChangeInfo(null);
                }
              }}
              fromPlan={planChangeInfo.from}
              toPlan={planChangeInfo.to}
            />
          )}
          {/* Bottom Call-to-Action Section */}
          <View style={styles.bottomCta}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={[styles.trialBtn, { backgroundColor: theme.accent }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (!user) {
                    navigation.navigate('Signup');
                    return;
                  }
                  if (userPlan && userPlan !== 'diamond') {
                    setPlanChangeInfo({ from: userPlan as 'free' | 'gold' | 'diamond', to: 'diamond' });
                    setShowPlanUpgrade(true);
                    return;
                  }
                  // If already on diamond, do nothing
                }}
              >
                <Text style={[styles.trialBtnText, { color: theme.text }]}>Start Free Trial</Text>
              </TouchableOpacity>
              <Text style={[styles.trialText, { color: theme.textSecondary }]}>
                7-day free diamond trial, then $9.99/month
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#141417' },
  scroll: { paddingBottom: 32 },
  centeredContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  centeredScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    // borderBottomColor and backgroundColor are set via props from theme
    zIndex: 10,
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  titleSection: { alignItems: 'center', marginTop: 24, marginBottom: 16, paddingHorizontal: 12 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 14, color: '#fff', textAlign: 'center' },
  mainDesc: { color: '#b0b0b0', fontSize: 15, textAlign: 'center' },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
    marginTop: 18,
    marginHorizontal: 0,
  },
  card: {
    height: 200,
    backgroundColor: 'rgba(42,17,86,0.5)',
    borderRadius: 10,
    margin: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(75,33,122,0.5)',
    elevation: 3,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    shadowColor: '#8C52FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  cardHeaderSection: { marginBottom: 0 },
  cardFeaturesSection: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    marginBottom: 2,
  },
  cardButtonSection: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    overflow: 'hidden',
    padding: 3,
  },
  cardTitle: { fontWeight: 'bold', color: '#fff', fontSize: 11, flexShrink: 1, flexWrap: 'wrap' },
  cardPrice: { color: '#fff', fontWeight: 'bold', fontSize: 10, flexShrink: 1, flexWrap: 'wrap' },
  cardFeatures: { marginTop: 6, marginBottom: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  featureDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#8C52FF', marginRight: 5 },
  featureText: { fontSize: 10, color: '#888888', flexShrink: 1, flexWrap: 'wrap' },
  cardBtn: {
    marginTop: 1,
    marginBottom: 1,
    borderRadius: 8,
    width: '100%',
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    paddingVertical: 2,
  },
  cardBtnCurrent: {
    backgroundColor: '#6b7280',
    opacity: 0.7,
  },
  cardBtnChoose: {
    backgroundColor: undefined,
    overflow: 'hidden',
  },
  cardBtnText: { color: '#fff', fontSize: 11 },
  cardBtnTextCurrent: { color: '#fff', fontSize: 11 },
  bottomCta: { marginTop: 12, alignItems: 'stretch', paddingHorizontal: 18, width: '100%', flexDirection: 'row', boxSizing: 'border-box' },
  trialBtn: {
    flex: 1,
    backgroundColor: '#8C52FF',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 8,
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  trialBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  trialText: { color: '#b0b0b0', fontSize: 13, marginTop: 4, textAlign: 'center' }
});

export default PlansScreen;


import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons, MaterialCommunityIcons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const MissionScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      {/* Header (unified style) */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}> 
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.goBack && navigation.goBack()}>
          <Feather name="x" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>MISSION</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      {/* Mission content */}
      <ScrollView contentContainerStyle={[styles.bodyContainer, { paddingBottom: 64, backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient colors={["#8C52FF", "#5CE1E6"]} style={styles.heroIconCircle}>
            <MaterialCommunityIcons name="target" size={48} color="#fff" />
          </LinearGradient>
          <MaskedView
            maskElement={
              <Text style={[styles.heroTitle, { color: theme.text }]}>Our Mission</Text>
            }
          >
            <LinearGradient
              colors={["#5CE1E6", "#8C52FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 40 }}
            >
              <Text style={[styles.heroTitle, { opacity: 0 }]}>Our Mission</Text>
            </LinearGradient>
          </MaskedView>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}> 
            Empowering students worldwide to achieve academic excellence through intelligent, personalized learning assistance.
          </Text>
        </View>

        {/* Mission Values */}
        <View style={styles.valuesGrid}>
          <View style={[styles.valueCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            <View style={[styles.valueIconCircle, { backgroundColor: '#8C52FF22' }]}> 
              <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#8C52FF" />
            </View>
            <Text style={[styles.valueTitle, { color: theme.text }]}>Innovation</Text>
            <Text style={[styles.valueDesc, { color: theme.textSecondary }]}> 
              Leveraging cutting-edge AI technology to create smarter, more intuitive learning experiences.
            </Text>
          </View>
          <View style={[styles.valueCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            <View style={[styles.valueIconCircle, { backgroundColor: '#5CE1E622' }]}> 
              <MaterialCommunityIcons name="heart-outline" size={24} color="#5CE1E6" />
            </View>
            <Text style={[styles.valueTitle, { color: theme.text }]}>Accessibility</Text>
            <Text style={[styles.valueDesc, { color: theme.textSecondary }]}> 
              Making quality education assistance available to students everywhere, regardless of background or resources.
            </Text>
          </View>
          <View style={[styles.valueCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            <View style={[styles.valueIconCircle, { backgroundColor: '#8C52FF22' }]}> 
              <MaterialCommunityIcons name="target" size={24} color="#8C52FF" />
            </View>
            <Text style={[styles.valueTitle, { color: theme.text }]}>Excellence</Text>
            <Text style={[styles.valueDesc, { color: theme.textSecondary }]}> 
              Committed to delivering the highest quality educational support and continuously improving our platform.
            </Text>
          </View>
        </View>

        {/* Detailed Mission */}
        <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.detailTitle, { color: theme.text }]}>What We Stand For</Text>
          <View style={styles.detailTextBlock}>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}> 
              At StudyPal AI, we believe that every student deserves access to personalized, intelligent tutoring that adapts to their unique learning style and pace. Our mission is to democratize education by providing AI-powered assistance that helps students understand complex concepts, solve challenging problems, and achieve their academic goals.
            </Text>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}> 
              We are committed to creating a learning environment that is inclusive, supportive, and empowering. Our AI tutor is designed not just to provide answers, but to guide students through the learning process, helping them develop critical thinking skills and deep understanding of their subjects.
            </Text>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}> 
              Through continuous innovation and dedication to educational excellence, we strive to bridge the gap between traditional learning methods and the digital future of education, making quality tutoring accessible to students worldwide.
            </Text>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={[styles.ctaTitle, { color: theme.text }]}>Join Our Mission</Text>
          <Text style={[styles.ctaSubtitle, { color: theme.textSecondary }]}> 
            Be part of the educational revolution. Start your learning journey with StudyPal AI today.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => {
              if (navigation?.popToTop) navigation.popToTop();
              if (navigation?.navigate) navigation.navigate('MainTabs', { screen: 'Chat' });
            }}
          >
            <LinearGradient colors={["#8C52FF", "#5CE1E6"]} style={styles.ctaButtonGradient}>
              <Text style={styles.ctaButtonText}>Start Learning</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
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
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: 'transparent',
    color: '#fff',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#a0a0a0',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 8,
  },
  valuesGrid: {
    flexDirection: 'column',
    marginBottom: 32,
    gap: 0,
  },
  valueCard: {
    backgroundColor: '#23232a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    width: '100%',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  valueIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  valueDesc: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  detailCard: {
    backgroundColor: '#23232a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 20,
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  detailTextBlock: {
    marginTop: 4,
  },
  detailText: {
    fontSize: 15,
    color: '#a0a0a0',
    marginBottom: 8,
    lineHeight: 22,
  },
  ctaSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaTitle: {
    fontSize: 20,
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
  },
  ctaButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
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
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#23232a',
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
});

export default MissionScreen;

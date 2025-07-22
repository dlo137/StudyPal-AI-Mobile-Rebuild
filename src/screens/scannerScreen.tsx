
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';

const ScannerScreen = () => {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}> 
      <Header hidePlus={true} hideBranding={false} />
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <Text style={[styles.text, { color: theme.text }]}>Scanner Screen</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default ScannerScreen;

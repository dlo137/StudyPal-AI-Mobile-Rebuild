
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar, TouchableOpacity, Image } from 'react-native';
import { Camera, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';

const ScannerScreen = () => {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}> 
      <Header hidePlus={true} hideBranding={false} />
      {/* Navigation bar and blank body */}
      <View style={{ flex: 1, backgroundColor: theme.background }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});

export default ScannerScreen;

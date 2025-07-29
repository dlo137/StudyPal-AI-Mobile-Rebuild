import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const studyPalIcon = require('../../assets/studypal-icon.png');

interface HeaderProps {
  onProfilePress?: () => void;
  onUpgradePress?: () => void;
  onSignInPress?: () => void;
  hideBranding?: boolean;
  hidePlus?: boolean;
  rightContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ onProfilePress, onUpgradePress, onSignInPress, hideBranding, hidePlus, rightContent }) => {
  const navigation = useNavigation();
  const { isLoggedIn, user, signOut } = useAuth();
  const { theme } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  // Get first initial for logged in user
  let firstInitial = null;
  if (user) {
    const name = user.user_metadata?.name;
    if (name && typeof name === 'string' && name.trim().length > 0) {
      firstInitial = name.trim().charAt(0).toUpperCase();
    } else if (user.email && typeof user.email === 'string' && user.email.length > 0) {
      firstInitial = user.email.trim().charAt(0).toUpperCase();
    } else {
      firstInitial = '?';
    }
  }

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.background, borderBottomColor: theme.border }]}> 
      <View style={styles.leftGroup}>
        {!hideBranding && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>StudyPal</Text>
            <Image source={studyPalIcon} style={styles.logo} resizeMode="contain" />
            {!hidePlus && (
              <TouchableOpacity style={[styles.leftIconCircle, { backgroundColor: theme.menu }]} onPress={onSignInPress}>
                <MaterialIcons name="add" size={20} color={theme.text} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      <View style={styles.rightIcons}>
        {/* Insert rightContent (question counter) to the left of the upgrade button */}
        {rightContent && (
          <View style={[styles.counterBubble, { marginRight: 8 }]}> 
            {/* Only render the counter text, not the icon */}
            {typeof rightContent === 'string' || typeof rightContent === 'number'
              ? <Text style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{rightContent}</Text>
              : (React.isValidElement(rightContent) && rightContent.type === View
                  ? React.Children.map(rightContent.props.children, child => {
                      if (React.isValidElement(child) && child.type === Ionicons) {
                        return null;
                      }
                      return child;
                    })
                  : rightContent)}
          </View>
        )}
        <TouchableOpacity
          style={[styles.upgradeBtn, { backgroundColor: theme.card, borderColor: theme.accent }]}
          onPress={() => {
            if (navigation && typeof navigation.navigate === 'function') {
              (navigation as any).navigate('Plans');
            } else if (onUpgradePress) {
              onUpgradePress();
            }
          }}
        >
          <Text style={[styles.upgradeText, { color: theme.accent }]}>Upgrade</Text>
        </TouchableOpacity>
        <View>
          <TouchableOpacity style={[styles.profileCircle, { backgroundColor: theme.menu, borderColor: theme.menu }]} onPress={() => setMenuVisible((v) => !v)}>
            {firstInitial ? (
              <Text style={[styles.profileInitial, { color: theme.textSecondary }]}>{firstInitial}</Text>
            ) : (
              <Ionicons name="person-circle-outline" size={28} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
          {menuVisible && (
            <View style={[styles.dropdownMenu, { backgroundColor: theme.background, borderColor: theme.border }]}> 
              {isLoggedIn ? (
                <TouchableOpacity style={styles.menuItem} onPress={async () => { setMenuVisible(false); await signOut(); }}>
                  <Text style={[styles.menuItemText, { color: '#f43f5e' }]}>Sign Out</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      // Try navigation first, fallback to onSignInPress, else alert
                      if (navigation && typeof navigation.navigate === 'function') {
                        (navigation as any).navigate('Login');
                      } else if (onSignInPress) {
                        onSignInPress();
                      } else {
                        Alert.alert('Navigation not set up', 'No navigation or onSignInPress handler provided.');
                      }
                    }}
                  >
                    <Text style={[styles.menuItemText, { color: theme.text }]}>Log In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onUpgradePress && onUpgradePress(); }}>
                    <Text style={[styles.menuItemText, { color: theme.text }]}>Sign Up</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  counterBubble: {
    textAlign: 'center',
    backgroundColor: '#23232a',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    // Bubble width fits content, text is centered
  },
  
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    // backgroundColor and borderBottomColor set via theme
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  leftIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
    // backgroundColor set via theme
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    // color set via theme
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradeBtn: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 6,
    borderWidth: 2,
    // backgroundColor and borderColor set via theme
  },
  upgradeText: {
    fontWeight: 'bold',
    fontSize: 15,
    // color set via theme
  },
  profileCircle: {
    marginLeft: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor and borderColor set via theme
  },
  profileInitial: {
    fontWeight: 'bold',
    fontSize: 18,
    // color set via theme
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 100,
    zIndex: 100,
    // backgroundColor and borderColor set via theme
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    // color set via theme
  },
});

export default Header;

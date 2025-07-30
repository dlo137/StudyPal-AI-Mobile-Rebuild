import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';

interface LoggedOutModalProps {
  visible: boolean;
  onClose: () => void;
}

const LoggedOutModal: React.FC<LoggedOutModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>You've been logged out</Text>
          <Text style={styles.message}>You have successfully signed out of your account.</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 260,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#f43f5e',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    color: '#222',
    textAlign: 'center',
  },
});

export default LoggedOutModal;

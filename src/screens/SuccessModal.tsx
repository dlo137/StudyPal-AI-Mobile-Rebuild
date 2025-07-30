import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';


interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  title?: string;
  message?: string;
  showButton?: boolean;
}

const SuccessModal = ({ visible, onClose, userName, title, message, showButton }: SuccessModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title || 'Success!'}</Text>
          <Text style={styles.message}>
            {message || `You've successfully signed in${userName ? `, ${userName}` : ''}!`}
          </Text>
          {(showButton !== false) && (
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default SuccessModal;

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
    color: '#16a34a',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    color: '#222',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

type PlanType = 'free' | 'gold' | 'diamond';

interface PlanUpgradeAlertProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromPlan: PlanType;
  toPlan: PlanType;
}

const getPlanDisplayName = (plan: PlanType) => {
  switch (plan) {
    case 'free': return 'Free Plan';
    case 'gold': return 'Gold Plan';
    case 'diamond': return 'Diamond Plan';
    default: return 'Plan';
  }
};

const getPlanIcon = (plan: PlanType) => {
  switch (plan) {
    case 'diamond':
      return <MaterialCommunityIcons name="crown" size={28} color="#fff" style={{ backgroundColor: '#8C52FF', borderRadius: 16, padding: 6 }} />;
    case 'gold':
      return <MaterialCommunityIcons name="star" size={28} color="#fff" style={{ backgroundColor: '#FFD700', borderRadius: 16, padding: 6 }} />;
    case 'free':
    default:
      return <Feather name="zap" size={28} color="#fff" style={{ backgroundColor: '#8C52FF', borderRadius: 16, padding: 6 }} />;
  }
};

const getPlanBgColor = (plan: PlanType) => {
  switch (plan) {
    case 'diamond': return '#8C52FF';
    case 'gold': return '#FFD700';
    case 'free':
    default: return '#6b7280';
  }
};

export default function PlanUpgradeAlert({ visible, onClose, onConfirm, fromPlan, toPlan }: PlanUpgradeAlertProps) {
  const isUpgrade = (fromPlan === 'free' && (toPlan === 'gold' || toPlan === 'diamond')) || (fromPlan === 'gold' && toPlan === 'diamond');
  const isDowngrade = (fromPlan === 'diamond' && (toPlan === 'gold' || toPlan === 'free')) || (fromPlan === 'gold' && toPlan === 'free');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={24} color="#888" />
          </TouchableOpacity>

          {/* Warning Icon */}
          <View style={styles.iconCircle}>
            <Feather name="alert-triangle" size={32} color="#fff" />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isUpgrade ? 'Confirm Plan Upgrade' : isDowngrade ? 'Confirm Plan Downgrade' : 'Confirm Plan Change'}
          </Text>

          {/* Plan Change Visualization */}
          <View style={styles.planRow}>
            <View style={styles.planCol}>
              <View style={[styles.planIconCircle, { backgroundColor: getPlanBgColor(fromPlan) }]}>{getPlanIcon(fromPlan)}</View>
              <Text style={styles.planLabel}>{getPlanDisplayName(fromPlan)}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.planCol}>
              <View style={[styles.planIconCircle, { backgroundColor: getPlanBgColor(toPlan) }]}>{getPlanIcon(toPlan)}</View>
              <Text style={styles.planLabel}>{getPlanDisplayName(toPlan)}</Text>
            </View>
          </View>

          {/* Message */}
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {isUpgrade
                ? `You're about to upgrade from the ${getPlanDisplayName(fromPlan)} to the ${getPlanDisplayName(toPlan)}.`
                : isDowngrade
                ? `You're about to downgrade from the ${getPlanDisplayName(fromPlan)} to the ${getPlanDisplayName(toPlan)}.`
                : `You're about to change from the ${getPlanDisplayName(fromPlan)} to the ${getPlanDisplayName(toPlan)}.`}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmBtnText}>{isUpgrade ? 'Upgrade Now' : isDowngrade ? 'Downgrade' : 'Confirm Change'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: 340,
    maxWidth: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f59e42',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    textAlign: 'center',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  planCol: {
    alignItems: 'center',
    flex: 1,
  },
  planIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  planLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  arrow: {
    fontSize: 24,
    color: '#aaa',
    marginHorizontal: 8,
  },
  messageBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    width: '100%',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#8C52FF',
    borderRadius: 10,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 10,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

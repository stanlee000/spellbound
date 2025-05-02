import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AppIcon = ({ size = 32 }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Text style={styles.iconText}>Sb</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default AppIcon; 
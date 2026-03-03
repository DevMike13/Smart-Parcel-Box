import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { firestoreDB } from '../../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');
const tabList = ['Pending', 'Received'];

const DataScreen = () => {
  const [activeTab, setActiveTab] = useState(tabList[0]);
  
  const renderContent = () => {
    if (activeTab === 'Pending') {
      return (
        <>
          <Text style={styles.title}>Pending Parcel/s</Text>
        </>
      );
    }

    if (activeTab === 'Received') {
      return (
        <>
          <Text style={styles.title}>Received Parcel/s</Text>
          
        </>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabList.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setActiveTab(item)}
            style={[
              styles.tabButton,
              activeTab === item ? styles.activeTabButton : styles.inactiveTabButton,
              item === "Received" ? styles.borderLeftStyle : null,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === item ? styles.activeTabText : styles.inactiveTabText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>

      
    </View>
  );
};

export default DataScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { alignItems: 'center', paddingTop: 20, paddingBottom: 160 },
  title:{
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#2c2c2c',
    textAlign: 'center'
  },
  
  // TAB
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#c4c4c4',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    marginTop: 20,
    marginHorizontal: 20
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  activeTabButton: {
    backgroundColor: '#e8def8',
  },
  
  inactiveTabButton: {
    backgroundColor: '#fff',
  },
  
  tabText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  
  activeTabText: {
    color: '#2c2c2c',
    fontFamily: 'Inter-Bold',
  },
  
  inactiveTabText: {
    color: '#2c2c2c',
    fontFamily: 'Inter-Regular',
  },
  borderLeftStyle:{
    borderLeftWidth: 1
  },
  borderRightStyle:{
    borderRightWidth: 1
  }
});

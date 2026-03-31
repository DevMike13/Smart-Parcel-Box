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
  Image 
} from 'react-native';
import { firestoreDB } from '../../../firebase';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { Video } from 'expo-av';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { images } from '../../../constants';

const { width } = Dimensions.get('window');
const tabList = ['Pending', 'Received'];

const DataScreen = () => {
  const [activeTab, setActiveTab] = useState(tabList[0]);
  const [pendingParcels, setPendingParcels] = useState([]);
  const [receivedParcels, setReceivedParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});

  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  useEffect(() => {
    const storage = getStorage();

    const fetchImages = async (parcels) => {
      const urls = {};

      for (const parcel of parcels) {
        try {
          console.log('Trying:', parcel.TrackingNo);

          const videoRef = ref(storage, `${parcel.TrackingNo}.mp4`);
          const url = await getDownloadURL(videoRef);

          console.log('SUCCESS:', url);

          urls[parcel.TrackingNo] = url;
        } catch (err) {
          console.log('FAILED:', parcel.TrackingNo, err.message);
        }
      }

      setImageUrls(urls);
    };

    const pendingQuery = query(
      collection(firestoreDB, 'pendingParcels'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const pending = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(parcel => parcel.Status !== 'Delivered');

      setPendingParcels(pending);
      setLoading(false);
    });

    // ✅ Received listener
    const receivedQuery = query(
      collection(firestoreDB, 'receivedParcels'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeReceived = onSnapshot(receivedQuery, async (snapshot) => {
      const received = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setReceivedParcels(received);
      await fetchImages(received); // 🔥 load images here
      setLoading(false);
    });

    return () => {
      unsubscribePending();
      unsubscribeReceived();
    };
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // Helper function to format timestamp with time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return d.toLocaleString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderContent = () => {
    const data = activeTab === 'Pending' ? pendingParcels : receivedParcels;

    if (loading) {
      return <ActivityIndicator size="large" color="#1164fe" style={{ marginTop: 40 }} />;
    }

    if (data.length === 0) {
      return <Text style={styles.noDataText}>No {activeTab.toLowerCase()} parcels.</Text>;
    }

    return data.map(parcel => {
      const displayDate = activeTab === 'Pending' 
        ? formatDate(parcel.ETA) 
        : formatTimestamp(parcel.timestamp);

      return (
        <View key={parcel.id} style={[styles.parcelCard, { backgroundColor: activeTab === 'Pending' ? '#1164fe' : '#151515' } ]}>
          
          <View style={styles.headerRow}>
            <Text style={styles.cashboxText}>Cashbox: {parcel.Box}</Text>
            <Text style={styles.trackingText}>#{parcel.TrackingNo}</Text>
          </View>
          
          {activeTab === 'Received' && imageUrls[parcel.TrackingNo] && (
            // <TouchableOpacity
            //   onPress={() => {
            //     setSelectedImage(imageUrls[parcel.TrackingNo]);
            //     setModalVisible(true);
            //   }}
            // >
            //   <Image
            //     source={{ uri: imageUrls[parcel.TrackingNo] }}
            //     style={{ width: '100%', height: 200, borderRadius: 15, marginBottom: 10 }}
            //   />
            // </TouchableOpacity>
            <Video
              source={{ uri: imageUrls[parcel.TrackingNo] }}
              style={{ width: '100%', height: 200, borderRadius: 15, marginBottom: 20 }}
              useNativeControls
              resizeMode="contain"
              shouldPlay={false}
            />
          )}

          <View style={styles.infoRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {activeTab === 'Pending' ? `ETA: ${displayDate}` : `Time: ${displayDate}`}
              </Text>
            </View>
            <View style={[styles.badge, parcel.Status === 'Delivered' ? { backgroundColor: '#00C853' } : { backgroundColor: '#fff' }]}>
              <Text style={[styles.badgeText, parcel.Status === 'Delivered' ? { color: '#fff' } : { color: '#2c2c2c' }]}>
                {parcel.Status}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Payment: {parcel.PaymentStatus}</Text>
            </View>
          </View>
        </View>
      );
    });
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
      
      <Modal visible={modalVisible} transparent={true}>
        <View style={styles.modalContainer}>
          
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {/* Image */}
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullImage}
            resizeMode="contain"
          />

        </View>
      </Modal>
      
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

  parcelCard: {
    width: width * 0.9,
    height: 'auto',
    backgroundColor: '#1164fe',
    borderRadius: 35,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cashboxText: {
    fontFamily: 'Inter-Medium',
    color: '#fff',
    fontSize: 16,
  },
  trackingText: {
    fontFamily: 'Inter-Bold',
    color: '#fff',
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#1164fe',
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
  },

  // MODAL
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fullImage: {
    width: '100%',
    height: '80%',
  },

  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
});

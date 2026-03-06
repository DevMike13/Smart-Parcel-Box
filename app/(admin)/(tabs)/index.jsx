import { StyleSheet, Text, View, Image, Dimensions, ScrollView, TouchableOpacity, Switch, Modal, TextInput, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { images } from '../../../constants';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, onSnapshot, collection, addDoc, setDoc } from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import { firestoreDB, realtimeDB } from '../../../firebase';
import { useAuthStore } from '../../../store/useAuthStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');
const selection = ['COD', 'Paid'];

const HomeScreen = () => {
  const [activeSelection, setActiveSelection] = useState(selection[0]);

  const [modalVisible, setModalVisible] = useState(false);
  const [trackingNo, setTrackingNo] = useState('');
  const [eta, setEta] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [firestoreUser, setFirestoreUser] = useState(null);
  const user = useAuthStore((state) => state.user);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalVisibleC2, setConfirmModalVisibleC2] = useState(false);

  const [pbIsLocked, setpbIsLocked] = useState(true);

  const [cb1IsLocked, setcb1IsLocked] = useState(true);
  const [cb2IsLocked, setcb2IsLocked] = useState(true);

  // C2
  const [modalVisibleC2, setModalVisibleC2] = useState(false);
  const [trackingNoC2, setTrackingNoC2] = useState('');
  const [etaC2, setEtaC2] = useState(new Date());
  const [showDatePickerC2, setShowDatePickerC2] = useState(false);

  const [compartmentData, setCompartmentData] = useState(null);
  const [compartmentDataC2, setCompartmentDataC2] = useState(null);


  const formatDate = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date; // parse string from RTDB
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(firestoreDB, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setFirestoreUser(snap.data());
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const boxRef = ref(realtimeDB, 'Compartment/Box1');
    const unsubscribe = onValue(boxRef, (snapshot) => {
      if (snapshot.exists()) {
        setCompartmentData(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const boxRefC2 = ref(realtimeDB, 'Compartment/Box2');
    const unsubscribe = onValue(boxRefC2, (snapshot) => {
      if (snapshot.exists()) {
        setCompartmentDataC2(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, []);

  const saveCompartmentData = async (box = 'Box1') => {
    if (!trackingNo || !eta) {
      Alert.alert('Error', 'Please enter both Tracking Number and ETA');
      return;
    }

    try {
      await set(ref(realtimeDB, `Compartment/${box}`), {
        ETA: eta.toISOString(),
        TrackingNo: trackingNo,
        Status: 'Undelivered',
        PaymentStatus: activeSelection,
      });

      await set(ref(realtimeDB, `Compartment/${box}/Controls`), {
        LockStatus: 'Locked'
      });


      Alert.alert('Success', 'Compartment data saved!');
      setModalVisible(false);
      setTrackingNo('');
      setEta(new Date());
    } catch (error) {
      Alert.alert('Error', error.message);
    }

    try {
      await setDoc(doc(firestoreDB, 'pendingParcels', 'Box1'), {
        Box: 'Box1',
        TrackingNo: trackingNo,
        ETA: eta.toISOString(),
        Status: 'Undelivered',
        PaymentStatus: activeSelection,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating pending parcel in Firestore:", error);
    }

  };

  const saveCompartmentDataC2 = async (box = 'Box2') => {
    if (!trackingNoC2 || !etaC2) {
      Alert.alert('Error', 'Please enter both Tracking Number and ETA');
      return;
    }

    try {
      await set(ref(realtimeDB, `Compartment/${box}`), {
        ETA: etaC2.toISOString(),
        TrackingNo: trackingNoC2,
        Status: 'Undelivered',
        PaymentStatus: activeSelection,
      });

      await set(ref(realtimeDB, `Compartment/${box}/Controls`), {
        LockStatus: 'Locked'
      });

      Alert.alert('Success', 'Compartment data saved!');
      setModalVisibleC2(false);
      setTrackingNoC2('');
      setEtaC2(new Date());
    } catch (error) {
      Alert.alert('Error', error.message);
    }

    try {
      await setDoc(doc(firestoreDB, 'pendingParcels', 'Box2'), {
        Box: 'Box2',
        TrackingNo: trackingNoC2,
        ETA: etaC2.toISOString(),
        Status: 'Undelivered',
        PaymentStatus: activeSelection,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating pending parcel in Firestore:", error);
    }
  };

  // CONFIRMATION
  const handleSaveBox1 = () => {
    if (!trackingNo || !eta) {
      Alert.alert('Error', 'Please enter both Tracking Number and ETA');
      return;
    }

    // Check if existing status is Undelivered
    if (compartmentData?.Status === 'Undelivered') {
      setConfirmModalVisible(true); // show confirmation modal
    } else {
      saveCompartmentData('Box1');
    }
  };

  // Confirmed save for Box1
  const confirmSaveBox1 = async () => {
    setConfirmModalVisible(false);

    await saveCompartmentData('Box1');

    try {
      await setDoc(doc(firestoreDB, 'pendingParcels', 'Box1'), {
        Box: 'Box1',
        TrackingNo: trackingNo,
        ETA: eta.toISOString(),
        Status: 'Undelivered',
        PaymentStatus: activeSelection,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating pending parcel in Firestore:", error);
    }
    
  };

  const handleSaveBox2 = () => {
    if (!trackingNoC2 || !etaC2) {
      Alert.alert('Error', 'Please enter both Tracking Number and ETA');
      return;
    }

    if (compartmentDataC2?.Status === 'Undelivered') {
      setConfirmModalVisibleC2(true);
    } else {
      saveCompartmentDataC2('Box2');
    }
  };

  const confirmSaveBox2 = async () => {
    setConfirmModalVisibleC2(false);

    await saveCompartmentDataC2('Box2');

    try {
      await setDoc(doc(firestoreDB, 'pendingParcels', 'Box2'), {
        Box: 'Box2',
        TrackingNo: trackingNoC2,
        ETA: etaC2.toISOString(),
        Status: 'Undelivered',
        PaymentStatus: activeSelection,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating pending parcel in Firestore:", error);
    }
    
  };

  useEffect(() => {
    const lockRef = ref(realtimeDB, "OwnerAccess/LockStatus");

    const unsubscribe = onValue(lockRef, (snapshot) => {
      const value = snapshot.val();

      if (value === "Locked") {
        setpbIsLocked(true);
      } else if (value === "Unlocked") {
        setpbIsLocked(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const cb1Ref = ref(realtimeDB, "Compartment/Box1/Controls/LockStatus");
    const cb2Ref = ref(realtimeDB, "Compartment/Box2/Controls/LockStatus");

    const unsubCb1 = onValue(cb1Ref, (snapshot) => {
      const value = snapshot.val();
      setcb1IsLocked(value === "Locked");
    });

    const unsubCb2 = onValue(cb2Ref, (snapshot) => {
      const value = snapshot.val();
      setcb2IsLocked(value === "Locked");
    });

    // Cleanup
    return () => {
      unsubCb1();
      unsubCb2();
    };
  }, []);

  const toggleLock = () => {
    const newStatus = pbIsLocked ? "Unlocked" : "Locked";

    set(ref(realtimeDB, "OwnerAccess/LockStatus"), newStatus);
    setpbIsLocked(!pbIsLocked);
  };

  const toggleCb1Lock = () => {
    const newStatus = cb1IsLocked ? "Unlocked" : "Locked";
    set(ref(realtimeDB, "Compartment/Box1/Controls/LockStatus"), newStatus);
    setcb1IsLocked(!cb1IsLocked);
  };

  const toggleCb2Lock = () => {
    const newStatus = cb2IsLocked ? "Unlocked" : "Locked";
    set(ref(realtimeDB, "Compartment/Box2/Controls/LockStatus"), newStatus);
    setcb2IsLocked(!cb2IsLocked);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { flexGrow: 1 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileContainer}>
          <Image source={images.avatar} style={styles.avatar} resizeMode="cover" />
          <View>
            <Text style={styles.greetingText}>{firestoreUser?.fullname || 'N/A'}</Text>
            <Text style={styles.emailText}>{firestoreUser?.email || 'N/A'}</Text>
          </View>
        </View>
        <Text style={styles.title}>Setup Compartments</Text>

        <View style={[styles.card, { backgroundColor: '#1164fe' }]}>
          <View style={styles.headerContainer}>
            <Text style={styles.trackingText}>{compartmentData?.TrackingNo ? '#' + compartmentData.TrackingNo : '#----------'}</Text>
            <Text style={styles.compartmentText}>C1</Text>
          </View>
          <View style={styles.paymentContainer}>
            <View>
              <Text style={[styles.paymentTitle, { textAlign: 'right' }]}>Payment</Text>
              <Text style={styles.paymentValue}>{compartmentData?.PaymentStatus || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View>
              <Text style={styles.statusTitle}>Status</Text>
              <Text style={[
                  styles.statusValue, 
                  { 
                    color: compartmentData?.Status === 'Delivered' 
                          ? 'green' 
                          : compartmentData?.Status === 'Undelivered' 
                          ? '#2c2c2c' 
                          : '#2c2c2c'
                  }
              ]}>
                {compartmentData?.Status || '----------'}
              </Text>
            </View>
            <View>
              <Text style={[styles.statusTitle, { textAlign: 'right' }]}>ETA</Text>
              <Text style={styles.etaValue}>{compartmentData?.ETA ? formatDate(compartmentData.ETA) : '## #####, ####'}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={[styles.headerContainer, { alignItems: 'center' }]}>
            <Text style={[styles.trackingText, { fontSize: 14 }]}>Cashbox Control</Text>
            <View style={styles.lockRow}>
              <Ionicons 
                name={cb1IsLocked ? "lock-closed" : "lock-open"} 
                size={14} 
                color={cb1IsLocked ? "#ff4d4d" : "#00C853"} 
              />
              <Text style={styles.lockStatus}>
                {cb1IsLocked ? "Locked" : "Unlocked"}
              </Text>
              
              <Switch
                value={cb1IsLocked}
                onValueChange={toggleCb1Lock}
                trackColor={{ false: "#d9f2ff", true: "#00C853" }}
                thumbColor={"#ffffff"}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.setupButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.setupButtonText}>Setup Box</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { marginTop: 20, backgroundColor: '#151515' }]}>
          <View style={styles.headerContainer}>
            <Text style={styles.trackingText}>{compartmentDataC2?.TrackingNo ? '#' + compartmentDataC2.TrackingNo : '#----------'}</Text>
            <Text style={styles.compartmentText}>C2</Text>
          </View>
          <View style={styles.paymentContainer}>
            <View>
              <Text style={[styles.paymentTitle, { textAlign: 'right' }]}>Payment</Text>
              <Text style={styles.paymentValue}>{compartmentDataC2?.PaymentStatus || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View>
              <Text style={styles.statusTitle}>Status</Text>
              <Text style={[
                  styles.statusValue, 
                  { 
                    color: compartmentDataC2?.Status === 'Delivered' 
                          ? 'green' 
                          : compartmentDataC2?.Status === 'Undelivered' 
                          ? '#2c2c2c' 
                          : '#2c2c2c'
                  }
              ]}>
                {compartmentDataC2?.Status || '----------'}
              </Text>
            </View>
            <View>
              <Text style={[styles.statusTitle, { textAlign: 'right' }]}>ETA</Text>
              <Text style={styles.etaValue}>{compartmentDataC2?.ETA ? formatDate(compartmentDataC2.ETA) : '## #####, ####'}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={[styles.headerContainer, { alignItems: 'center' }]}>
            <Text style={[styles.trackingText, { fontSize: 14 }]}>Cashbox Control</Text>
            <View style={styles.lockRow}>
              <Ionicons 
                name={cb2IsLocked ? "lock-closed" : "lock-open"} 
                size={14} 
                color={cb2IsLocked ? "#ff4d4d" : "#00C853"} 
              />
              <Text style={styles.lockStatus}>
                {cb2IsLocked ? "Locked" : "Unlocked"}
              </Text>
              
              <Switch
                value={cb2IsLocked}
                onValueChange={toggleCb2Lock}
                trackColor={{ false: "#d9f2ff", true: "#00C853" }}
                thumbColor={"#ffffff"}
              />
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.setupButton, { backgroundColor: '#eeeeee'}]}
              onPress={() => setModalVisibleC2(true)}
            >
              <Text style={styles.setupButtonText}>Setup Box</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.card, { marginTop: 20, backgroundColor: '#151515' }]}>
          <View style={[styles.headerContainer, { alignItems: 'center' }]}>
            <Text style={styles.trackingText}>PB Lock Control</Text>
            <View style={styles.lockRow}>
              <Ionicons 
                name={pbIsLocked ? "lock-closed" : "lock-open"} 
                size={14} 
                color={pbIsLocked ? "#ff4d4d" : "#00C853"} 
              />
              <Text style={styles.lockStatus}>
                {pbIsLocked ? "Locked" : "Unlocked"}
              </Text>
              
              <Switch
                value={pbIsLocked}
                onValueChange={toggleLock}
                trackColor={{ false: "#d9f2ff", true: "#00C853" }}
                thumbColor={"#ffffff"}
              />
            </View>
          </View>
        </View>
        {/* ================= MODAL ================= */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Setup Box 1</Text>

              <View style={styles.tabContainer}>
                {selection.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setActiveSelection(item)}
                    style={[
                      styles.tabButton,
                      activeSelection === item ? styles.activeTabButton : styles.inactiveTabButton,
                      item === "Paid" ? styles.borderLeftStyle : null,
                    ]}
                  >
                    {activeSelection === item && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#1164fe"
                      />
                    )}
                    <Text
                      style={[
                        styles.tabText,
                        activeSelection === item ? styles.activeTabText : styles.inactiveTabText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                placeholder="Tracking Number"
                style={styles.input}
                value={trackingNo}
                onChangeText={setTrackingNo}
              />

              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ fontSize: 16, color: eta ? '#000' : '#999' }}>
                  {eta ? formatDate(eta) : 'Select ETA'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={eta}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setEta(selectedDate);
                    }
                  }}
                />
              )}

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#2c2c2c' }]}
                  onPress={handleSaveBox1}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#eeeeee' }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: '#2c2c2c'}]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ================= MODAL C2 ================= */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisibleC2}
          onRequestClose={() => setModalVisibleC2(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Setup Box 2</Text>
              
              <View style={styles.tabContainer}>
                {selection.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setActiveSelection(item)}
                    style={[
                      styles.tabButton,
                      activeSelection === item ? styles.activeTabButton : styles.inactiveTabButton,
                      item === "Paid" ? styles.borderLeftStyle : null,
                    ]}
                  >
                    {activeSelection === item && ( 
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#1164fe"
                      />
                    )}

                    <Text
                      style={[
                        styles.tabText,
                        activeSelection === item ? styles.activeTabText : styles.inactiveTabText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                placeholder="Tracking Number"
                style={styles.input}
                value={trackingNoC2}
                onChangeText={setTrackingNoC2}
              />

              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePickerC2(true)}
              >
                <Text style={{ fontSize: 16, color: etaC2 ? '#000' : '#999' }}>
                  {etaC2 ? formatDate(etaC2) : 'Select ETA'}
                </Text>
              </TouchableOpacity>

              {showDatePickerC2 && (
                <DateTimePicker
                  value={etaC2}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePickerC2(false);
                    if (selectedDate) {
                      setEtaC2(selectedDate);
                    }
                  }}
                />
              )}

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#2c2c2c' }]}
                  onPress={handleSaveBox2}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#eeeeee' }]}
                  onPress={() => setModalVisibleC2(false)}
                >
                  <Text style={[styles.modalButtonText, { color: '#2c2c2c'}]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>


        {/* CONFIRMATION */}
        {/* Confirmation Modal for Box1 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={confirmModalVisible}
          onRequestClose={() => setConfirmModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Override</Text>
              <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center', fontFamily: 'Inter-Regular' }}>
                Box 1 already has an "Undelivered" item. Do you want to override it?
              </Text>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#2c2c2c' }]}
                  onPress={confirmSaveBox1}
                >
                  <Text style={styles.modalButtonText}>Yes, Override</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#eeeeee' }]}
                  onPress={() => setConfirmModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: '#2c2c2c'}]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Confirmation Modal for Box2 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={confirmModalVisibleC2}
          onRequestClose={() => setConfirmModalVisibleC2(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Override</Text>
              <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center', fontFamily: 'Inter-Regular' }}>
                Box 2 already has an "Undelivered" item. Do you want to override it?
              </Text>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#2c2c2c' }]}
                  onPress={confirmSaveBox2}
                >
                  <Text style={styles.modalButtonText}>Yes, Override</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#eeeeee' }]}
                  onPress={() => setConfirmModalVisibleC2(false)}
                >
                  <Text style={[styles.modalButtonText, { color: '#2c2c2c'}]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
    flexGrow: 1
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    height: 'auto',
    padding: 10,
    borderRadius: 20,
  },
  profileContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  greetingText: {
    fontFamily: 'Inter-Bold',
    color: '#2c2c2c',
    fontSize: 16
  },
  emailText: {
    fontFamily: 'Inter-Regular',
    color: '#2c2c2c',
    fontSize: 14,
    marginTop: -3
  },
  avatar:{
    width: 50,
    height: 50,
    borderRadius: 100
  },
  title:{
    fontFamily: 'Inter-Bold',
    color: '#2c2c2c',
    fontSize: 18,
    marginTop: 40,
    marginBottom: 18
  }, 


  // CARD 
  card:{
    width: '100%',
    height: 'auto',
    borderRadius: 35,
    paddingVertical: 16
  },
  headerContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24
  },
  trackingText:{
    fontFamily: 'Inter-Medium',
    color: '#d9f2ff',
    fontSize: 18,
  },
  compartmentText:{
    fontFamily: 'Inter-Medium',
    color: '#2c2c2c',
    fontSize: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    paddingTop: 2,
    borderRadius: 80
  },
  paymentContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 10
  },
  paymentTitle:{
    fontFamily: 'Inter-Medium',
    color: '#d9f2ff',
    fontSize: 14,
    marginBottom: 3
  },
  paymentValue:{
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    backgroundColor: '#d9f2ff',
    paddingHorizontal: 8,
    borderRadius: 50,
    textAlign: 'center'
  },
  statusContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 12
  },
  statusTitle:{
    fontFamily: 'Inter-Medium',
    color: '#d9f2ff',
    fontSize: 14,
    marginBottom: 8
  },
  statusValue:{
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    backgroundColor: '#d9f2ff',
    paddingHorizontal: 8,
    borderRadius: 50
  },
  etaValue:{
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#d9f2ff',
  },
  buttonContainer:{
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 20
  },
  setupButton:{
    width: '100%',
    backgroundColor: '#c3ff17',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 40
  },
  setupButtonText:{
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#2c2c2c',
  },

  // Modal
  /* ===== BEAUTIFIED MODAL ===== */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', // Slightly transparent overlay
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fefefe',
    borderRadius: 25,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10, // Android shadow
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c2c2c', // Primary accent color
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    backgroundColor: '#eeeeee', // subtle input background
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5
  },
  modalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#d9f2ff',
  },

  // TAB
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#c4c4c4',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    paddingVertical: 10,
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
    fontFamily: 'Inter-Bold',
  },
  borderLeftStyle:{
    borderLeftWidth: 1
  },
  borderRightStyle:{
    borderRightWidth: 1
  },

  lockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  lockStatus: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  divider:{
    width: '85%',
    height: 1,
    backgroundColor: "#d9f2ff",
    marginHorizontal: 'auto',
    marginTop: 20
  }
});

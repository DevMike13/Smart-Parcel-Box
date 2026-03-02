import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { images } from '../constants';

export default function Index() {
  const router = useRouter();

   useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

   return (
    <View style={styles.container}>
      <LottieView
        source={images.parcel}
        autoPlay
        style={styles.animation}
      />
      <Text style={styles.title}>
        Smart Parcel Box
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  animation: {
    width: 300,
    height: 300,
    marginTop: -200
  },
  title:{
    fontFamily: 'Inter-Medium', 
    fontSize: 20, 
    color: "#2c2c2c"
  }
});

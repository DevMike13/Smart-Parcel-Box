import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { WebView } from "react-native-webview";
import { ref, onValue, set } from 'firebase/database';
import { realtimeDB } from '../../../firebase';

const { width, height } = Dimensions.get("window");

export default function LiveFeedScreen() {
  const [cameraIP, setCameraIP] = useState(null);

  useEffect(() => {
    const refCam = ref(realtimeDB, "/esp32cam_ip");
    const unsubCam = onValue(refCam, (snapshot) => {
      const value = snapshot.val();
      setCameraIP(value);
    });

    return () => {
      unsubCam();
    };
  }, []);

  if (!cameraIP) return null;

  const renderPattern = () => {
    const icons = [];
    const iconSize = 40;
    const spacing = 80;

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        icons.push(
          <Ionicons
            key={`${x}-${y}`}
            name={(x + y) % 160 === 0 ? "cube" : "cube-outline"}
            size={iconSize}
            color="#1164fe"
            style={{
              position: "absolute",
              left: x,
              top: y,
              opacity: 0.05, // subtle background
            }}
          />
        );
      }
    }

    return icons;
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        {renderPattern()}
      </View>
      <View style={styles.titleContainer}>
        <Ionicons name='videocam' size={26} color='#2c2c2c' />
        <Text style={styles.title}>Live Feed</Text>
      </View>
       
      <View style={styles.webContainer}>
        <WebView
          originWhitelist={['*']}
          // source={{ uri: `http://${cameraIP}` }}
          source={{
            html: `
              <html>
                <body style="margin:0; padding:0; background:black;">
                  <img src="http://${cameraIP}" style="width:100%; height:100%; object-fit:cover;" />
                </body>
              </html>
            `
          }}
          style={styles.webview}
          // javaScriptEnabled
          // domStorageEnabled
          // startInLoadingState
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleContainer:{
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10
  },
  title:{
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#2c2c2c',
    textAlign: 'center'
  },
  webContainer: {
    width: '100%',
    height: '50%',
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 5,
  },
  webview: {
    flex: 1,
  },
});

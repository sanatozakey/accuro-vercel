import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { Text } from 'react-native-paper';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 2500,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotsAnim1 = useRef(new Animated.Value(0)).current;
  const dotsAnim2 = useRef(new Animated.Value(0)).current;
  const dotsAnim3 = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.easeOut,
        useNativeDriver: true,
      }),
    ]).start();

    // Loading dots animation with delays
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim1, {
          toValue: -10,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim1, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotsAnim2, {
            toValue: -10,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotsAnim2, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 200);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotsAnim3, {
            toValue: -10,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotsAnim3, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 400);

    // Text fade in
    setTimeout(() => {
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.easeOut,
        useNativeDriver: true,
      }).start();
    }, 1000);

    // Fade out and finish
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, duration - 500);
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated background circles */}
      <View style={styles.circlesContainer}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Logo container */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo */}
        <Image
          source={require('../../assets/accuro_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Loading dots */}
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              { transform: [{ translateY: dotsAnim1 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { transform: [{ translateY: dotsAnim2 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { transform: [{ translateY: dotsAnim3 }] },
            ]}
          />
        </View>

        {/* Welcome text */}
        <Animated.View style={{ opacity: textAnim }}>
          <Text variant="titleLarge" style={styles.welcomeText}>
            Welcome to Accuro
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a', // Navy blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  circlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.2,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: '#3b82f6',
    top: '25%',
    left: '25%',
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: '#60a5fa',
    top: '33%',
    right: '25%',
  },
  circle3: {
    width: 300,
    height: 300,
    backgroundColor: '#2563eb',
    bottom: '25%',
    left: '33%',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    height: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
  },
  welcomeText: {
    color: '#ffffff',
    fontWeight: '300',
    letterSpacing: 1,
    marginTop: 8,
  },
});

export default SplashScreen;

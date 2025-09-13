import React, { useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';

type SlideButtonProps = {
  height?: number;
  onSlideComplete: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SlideButton({ height = 60, onSlideComplete }: SlideButtonProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      let newX = gestureState.dx;
      if (newX < 0) newX = 0;
      if (newX > SCREEN_WIDTH - height - 32) newX = SCREEN_WIDTH - height - 32; // -padding
      slideAnim.setValue(newX);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > SCREEN_WIDTH - height - 50) {
        // Slide completed
        onSlideComplete();
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      } else {
        // Slide back
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  return (
    <View style={[styles.container, { height, width: '100%' }]}>
      <Text style={styles.text}>สไลด์เพื่อยืนยัน</Text>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.slider, { transform: [{ translateX: slideAnim }], width: height, height: height, borderRadius: height / 2 }]}
      >
        <Text style={styles.sliderText}>{'>'}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB',
    borderRadius: 30,
    justifyContent: 'center',
    paddingHorizontal: 16, // เว้นขอบซ้ายขวา
    marginVertical: 10,
  },
  text: {
    position: 'absolute',
    alignSelf: 'center',
    fontWeight: 'bold',
    color: '#374151',
  },
  slider: {
    backgroundColor: '#4B65EA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
  },
  sliderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
});

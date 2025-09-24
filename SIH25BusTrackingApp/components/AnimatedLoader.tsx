import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

type AnimatedLoaderProps = { onAnimationComplete?: () => void };

const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({ onAnimationComplete }) => {
  const dash = 150;
  const circleAnim = useRef(new Animated.Value(0)).current; // 0..1 for dash offset and color
  const letterAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const circleLoop = Animated.loop(
      Animated.timing(circleAnim, { toValue: 1, duration: 4000, useNativeDriver: false })
    );
    circleLoop.start();

    // Staggered letter flash animations
    letterAnims.forEach((val, idx) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(idx * 150),
          Animated.timing(val, { toValue: 1, duration: 1400, useNativeDriver: false }),
          Animated.timing(val, { toValue: 0, duration: 1400, useNativeDriver: false }),
        ])
      );
      loop.start();
    });

    const timer = setTimeout(() => { onAnimationComplete && onAnimationComplete(); }, 3000);
    return () => { circleLoop.stop(); clearTimeout(timer); };
  }, [onAnimationComplete, letterAnims, circleAnim]);

  const stroke = circleAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#FDE68A'] });
  const dashOffset = circleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, dash * 2] });

  const letters = ['B', 'U', 'S', 'S', 'B', 'E', 'E'];
  const baseX = 100;
  const spacing = 24;
  const y = 58;

  return (
    <View style={styles.container}>
      <Svg width={320} height={140} viewBox="0 0 330 120">
        <AnimatedCircle
          cx="74.6"
          cy="47"
          r="18.5"
          strokeWidth={7}
          strokeLinecap="round"
          strokeMiterlimit={10}
          fill="none"
          stroke={stroke as any}
          strokeDasharray={`${dash}`}
          strokeDashoffset={dashOffset as any}
        />
        <G>
          {letters.map((ch, idx) => {
            const fill = letterAnims[idx].interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#FDE68A'] });
            return (
              <AnimatedSvgText
                key={`${ch}-${idx}`}
                x={baseX + idx * spacing}
                y={y}
                fontSize="28"
                fontWeight="700"
                fill={fill as any}
              >
                {ch}
              </AnimatedSvgText>
            );
          })}
        </G>
        <SvgText
          x={165}
          y={100}
          fontSize="14"
          fontFamily="Times New Roman"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          always buzzing, always on time
        </SvgText>
      </Svg>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText as any);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F59E0B' },
});

export default AnimatedLoader;

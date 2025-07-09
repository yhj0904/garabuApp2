import { ScrollView, StyleSheet, View } from 'react-native';

interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerBackgroundColor?: { light: string; dark: string };
  headerImage?: React.ReactNode;
}

export default function ParallaxScrollView({ 
  children, 
  headerBackgroundColor,
  headerImage 
}: ParallaxScrollViewProps) {
  return (
    <ScrollView style={styles.container}>
      {headerImage && (
        <View style={styles.header}>
          {headerImage}
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
}); 
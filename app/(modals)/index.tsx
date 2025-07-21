import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

export default function ModalIndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // 모달 홈은 자동으로 닫기
    router.back();
  }, [router]);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {FontAwesome} from '@expo/vector-icons';
import {colors, fontFamily, spacing} from '../../theme';

export default function AnnaWelcomePopup({onOpenChat}) {
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const {width} = useWindowDimensions();

  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Trigger popup open after delay
  useEffect(() => {
    const openTimer = setTimeout(() => {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, 5000);
    return () => clearTimeout(openTimer);
  }, []);

  // Auto-close timer
  useEffect(() => {
    if (!visible) return;
    let closeTimer = null;
    if (!input.trim()) {
      closeTimer = setTimeout(() => setVisible(false), 7000);
    }
    return () => closeTimer && clearTimeout(closeTimer);
  }, [visible, input]);

  const handleInputChange = text => setInput(text);

  const handleSend = () => {
    if (!input.trim()) return;
    setSending(true);
    if (onOpenChat) onOpenChat(input);
    setTimeout(() => {
      setInput('');
      setSending(false);
      setVisible(false);
    }, 300);
  };

  if (!visible) return null;

  const popupWidth = isDesktop ? 400 : isTablet ? 360 : width - 32;
  const popupBottom = isDesktop ? 120 : isTablet ? 100 : 80;
  const popupRight = isDesktop || isTablet ? 32 : 16;

  return (
    <Animated.View
      style={[
        styles.popup,
        {
          width: popupWidth,
          bottom: popupBottom,
          right: popupRight,
          opacity: fadeAnim,
        },
      ]}>
      <View style={styles.headerRow}>
        <FontAwesome
          name="smile-o"
          size={26}
          color={colors.gold}
          style={{marginRight: 12}}
        />
        <Text style={styles.title}>Hi, I'm Anna!</Text>
        <Pressable style={styles.closeButton} onPress={() => setVisible(false)}>
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
      </View>

      <Text style={styles.welcome}>
        Welcome to Rare Collectables. How can I help you today?
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={handleInputChange}
          style={styles.input}
          placeholder="Type a message..."
          editable={!sending}
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={styles.sendButton}
          onPress={handleSend}
          disabled={sending || !input.trim()}>
          <FontAwesome name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    zIndex: 999,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.gold,
    padding: 20,
    shadowColor: '#BFA054',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    boxShadow:
      Platform.OS === 'web' ? '0 4px 18px rgba(191,160,84,0.13)' : undefined,
    backdropFilter: Platform.OS === 'web' ? 'blur(12px)' : undefined,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gold,
    fontFamily,
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    ...(Platform.OS === 'web' ? {cursor: 'pointer'} : {}),
  },
  closeButtonText: {
    fontSize: 22,
    color: colors.onyxBlack,
    fontWeight: '700',
    lineHeight: 24,
  },
  welcome: {
    fontSize: 15.5,
    color: colors.onyxBlack,
    marginBottom: 14,
    fontFamily,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.onyxBlack,
    fontFamily,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: colors.gold,
    borderRadius: 13,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? {cursor: 'pointer'} : {}),
  },
});

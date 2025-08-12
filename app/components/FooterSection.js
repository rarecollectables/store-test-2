import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
    Alert,
} from 'react-native';
import {colors, spacing, fontFamily} from '../../theme';
import {FontAwesome, MaterialCommunityIcons} from '@expo/vector-icons';
import PaymentMethodsRow from '../(components)/PaymentMethodsRow';
import {useRouter} from 'expo-router'; 
import { supabase } from '../../lib/supabase/client';
import { trackEvent } from '../../lib/trackEvent';
export default function FooterSection({
  aboutText = 'Rare Collectables specializes in heart-crafted jewelry featuring sustainable, conflict-free stones. Our pieces are designed to celebrate love and create meaningful connections through timeless, ethically-sourced accessories.',
  socialLinks = ['facebook', 'instagram'],
  informationLinks = ['Blog', 'Contact', 'Return Policy', 'Privacy Policy'],
  accountLinks = ['My Account', 'Wishlist', 'Checkout'],
//   onSubscribe = email => {},
}) {
  const [email, setEmail] = React.useState('');
  const router = useRouter();



//   const onSubscribe = async email => {
//     await trackEvent({eventType: 'newsletter_send_click', metadata: {email}});
//     await trackEvent({
//       eventType: 'newsletter_subscribe_click',
//       metadata: {email},
//     });

//     if (!email.includes('@') || !email.includes('.')) {
//       return Alert.alert(
//         'Invalid email',
//         'Please enter a valid email address.',
//       );
//     }

//     try {
//       const {error} = await supabase
//         .from('newsletter_subscribers')
//         .insert([{email}]);

//       if (error) throw error;

//       Alert.alert('Subscribed', `Thanks for subscribing, ${email}!`);
//       setEmail('');
//     } catch (err) {
//       Alert.alert('Error', 'Subscription failed. Try again later.');
//     }
//   };


  return (
    <View style={styles.footer}>
      <View style={styles.columns}>
        {/* About */}
        <View style={styles.column}>
          <Text style={styles.heading}>About Jewelry</Text>
          <Text style={styles.text}>{aboutText}</Text>
          <View style={styles.socialIcons}>
            {socialLinks.includes('facebook') && (
              <Pressable onPress={() => router.push('https://www.facebook.com/profile.php?id=61573565127513')}>
                <FontAwesome
                  name="facebook-square"
                  size={22}
                  color="#3b5998"
                  style={styles.icon}
                />
              </Pressable>
            )}
            {socialLinks.includes('instagram') && (
              <Pressable onPress={() => router.push('https://www.instagram.com/rarecollectablesshop?igsh=OXVkdXZpN3c1N2s1')}>
                <FontAwesome
                  name="instagram"
                  size={22}
                  color="#C13584"
                  style={styles.icon}
                />
              </Pressable>
            )}
            {socialLinks.includes('linkedin') && (
              <Pressable onPress={() => router.push('https://www.linkedin.com/company/rare-collectables/')}>
                <FontAwesome
                  name="linkedin-square"
                  size={22}
                  color="#0077B5"
                  style={styles.icon}
                />
              </Pressable>
            )}
            {socialLinks.includes('threads') && (
              <MaterialCommunityIcons
                name="alpha-x-circle"
                size={22}
                color="#000"
                style={styles.icon}
              />
            )}
          </View>
        </View>

        {/* Info Links */}
        <View style={styles.column}>
          <Text style={styles.heading}>Information</Text>
          {informationLinks.map((item, i) => {
            if (item === 'Blog') {
              return (
                <Pressable key={i} onPress={() => router.push('/blog')}>
                  <Text style={styles.linkText}>{item}</Text>
                </Pressable>
              );
            } else if (item === 'Contact') {
              return (
                <Pressable key={i} onPress={() => router.push('/contact')}>
                  <Text style={styles.linkText}>{item}</Text>
                </Pressable>
              );
            } else if (item === 'Return Policy') {
              return (
                <Pressable key={i} onPress={() => router.push('/return-policy')}>
                  <Text style={styles.linkText}>{item}</Text>
                </Pressable>
              );
            } else if (item === 'Privacy Policy') {
              return (
                <Pressable key={i} onPress={() => router.push('/privacy-policy')}>
                  <Text style={styles.linkText}>{item}</Text>
                </Pressable>
              );
            } else {
              return (
                <Text key={i} style={styles.linkText}>
                  {item}
                </Text>
              );
            }
          })}
        </View>

        {/* Account Links */}
        <View style={styles.column}>
          <Text style={styles.heading}>My Account</Text>
          {accountLinks.map((item, i) => (
            <Text key={i} style={styles.linkText}>
              {item}
            </Text>
          ))}
        </View>

        {/* Newsletter */}
        <View style={styles.column}>
          <Text style={styles.heading}>Subscribe Our Newsletter</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter Your Email"
              style={styles.input}
              placeholderTextColor={colors.white}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email address"
            />
            <Pressable
              style={styles.subscribeButton}
               onPress={async () => {
                                await trackEvent({
                                  eventType: 'newsletter_send_click',
                                  metadata: {email},
                                });
                                await trackEvent({
                                  eventType: 'newsletter_subscribe_click',
                                  metadata: {email},
                                });
                                if (email.includes('@')) {
                                  Alert.alert(
                                    'Subscribed',
                                    `Thanks for subscribing, ${email}!`,
                                  );
                                  setEmail('');
                                } else {
                                  Alert.alert(
                                    'Invalid email',
                                    'Please enter a valid email address.',
                                  );
                                }
                              }}
              accessibilityRole="button"
              accessibilityLabel="Subscribe to newsletter">
              <MaterialCommunityIcons
                name="send-circle-outline"
                size={28}
                color={colors.white}
              />
            </Pressable>
          </View>
          <Text style={[styles.heading, {marginTop: spacing.sm}]}>
            Easy Payment Method
          </Text>
          <View style={styles.paymentRow}>
            <PaymentMethodsRow iconSize={38} pop style={{marginBottom: 4}} />

            {/* <Image
              source={require('../../assets/mastercard.png')}
              style={styles.paymentIcon}
            />
            <Image
              source={require('../../assets/visa.png')}
              style={styles.paymentIcon}
            />
            <Image
              source={require('../../assets/paypal.png')}
              style={styles.paymentIcon}
            /> */}
          </View>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.copyText}>
          Copyright © 2024 conception 1 PVT LTD All Right Reserved.
        </Text>
        <View style={styles.policyLinks}>
          <Pressable onPress={() => router.push('/terms-of-service')}>
            <Text style={styles.linkText}>Terms of Service</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/privacy-policy')}>
            <Text style={[styles.linkText, {marginLeft: spacing.md}]}>
              Privacy Policy
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/return-policy')}>
            <Text style={[styles.linkText, {marginLeft: spacing.md}]}>
              Return Policy
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/contact')}>
            <Text style={[styles.linkText, {marginLeft: spacing.md}]}>
              Contact Us
            </Text>
          </Pressable>
        </View>
      </View>

      {/* <View style={styles.bottomRow}>
        <Text style={styles.copyText}>
          Copyright © 2024 conception 1 PVT LTD All Right Reserved.
        </Text>
        <View style={styles.policyLinks}>
          <Text style={styles.linkText}>Terms & Condition</Text>
          <Text style={[styles.linkText, {marginLeft: spacing.md}]}>
            Privacy Policy
          </Text>
        </View>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#c5a35c',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  column: {
    flex: 1,
    minWidth: 180,
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.white,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.serif,
  },
  text: {
    color: colors.white,
    fontSize: 13,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  linkText: {
    color: colors.white,
    fontSize: 13,
    marginVertical: 2,
    fontFamily: fontFamily.sans,
  },
  socialIcons: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  icon: {
    marginRight: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: colors.white,
  },
  input: {
    flex: 1,
    paddingVertical: 4,
    color: colors.white,
  },
  subscribeButton: {
    paddingLeft: spacing.sm,
  },
  paymentRow: {
    width: '100%',
    // borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  paymentIcon: {
    width: 50,
    height: 30,
    marginRight: spacing.sm,
    resizeMode: 'contain',
  },
  bottomRow: {
    borderTopWidth: 0.5,
    borderColor: colors.white,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  copyText: {
    fontSize: 12,
    color: colors.white,
    fontFamily: fontFamily.sans,
  },
  policyLinks: {
    flexDirection: 'row',
  },
});

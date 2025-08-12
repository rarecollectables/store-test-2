import { Tabs, useRouter, usePathname } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { HomeOutlineIcon, ShoppingBagOutlineIcon } from '../components/SvgIcon';
import { Pressable, View, Text, Animated, Platform } from 'react-native';
import { useStore } from '../../context/store';
import React, { useRef, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { trackEvent } from '../../lib/trackEvent';

function GoldShimmer({ children, shimmer }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (shimmer) {
      shimmerAnim.setValue(0);
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [shimmer]);
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });
  return (
    <View style={{ position: 'relative' }}>
      {children}
      {shimmer && (
        <Animated.View style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 2,
          opacity: 0.6,
          transform: [{ translateX }],
        }} pointerEvents="none">
          <LinearGradient
            colors={["#E5DCC3", "#BFA054", "#E5DCC3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: 8 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

function TabBarIconWithBadge({ name, color, count, animate, size = 24, style, svgIcon }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (animate) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.25, duration: 140, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true })
      ]).start();
    }
  }, [count, animate]);
  return (
    <GoldShimmer shimmer={animate}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {svgIcon ? (
          React.cloneElement(svgIcon, { color, size })
        ) : (
          <FontAwesome name={name} size={size} color={color} style={style} />
        )}
        {count > 0 && (
          <View style={{
            position: 'absolute',
            right: -10,
            top: -6,
            backgroundColor: '#E5006D',
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 3
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{count}</Text>
          </View>
        )}
      </Animated.View>
    </GoldShimmer>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { cart = [], wishlist = [], lastAddedToCart, lastAddedToWishlist, setLastVisitedRoute } = useStore();
  const cartCount = Array.isArray(cart) ? cart.length : 0;
  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;
  
  // Add CSS to hide bottom navigation on desktop
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.id = 'hide-bottom-nav-desktop';
      style.innerHTML = `
        @media (min-width: 768px) {
          nav {
            display: none !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        const existingStyle = document.getElementById('hide-bottom-nav-desktop');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, []);

  // Create a style for the tab bar to hide on desktop
  const tabBarStyle = Platform.OS === 'web' ? {
    tabBarStyle: {
      '@media (min-width: 768px)': {
        display: 'none',
      },
    }
  } : {};

  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.OS === 'web' ? {
          // This will be hidden via CSS for desktop
          // Adding a data attribute to make it easier to target with CSS
          ['data-mobile-nav']: 'true',
        } : undefined
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeOutlineIcon size={24} color={color} />,
          tabBarButton: (props) => (
            <Pressable
              {...props}
              onPress={async () => {
                await trackEvent({ eventType: 'home_tab_click' });
                setLastVisitedRoute(pathname);
                props.navigation?.push('index');
                if (props.onPress) props.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel="Home Tab"
            >
              {props.children}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <ShoppingBagOutlineIcon size={24} color={color} />,
          tabBarButton: (props) => (
            <Pressable
              {...props}
              onPress={async () => {
                await trackEvent({ eventType: 'shop_tab_click' });
                setLastVisitedRoute(pathname);
                props.navigation?.push('shop');
                if (props.onPress) props.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel="Shop Tab"
            >
              {props.children}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color }) => (
            <TabBarIconWithBadge name="heart-o" color={color} count={wishlistCount} animate={!!lastAddedToWishlist} />
          ),
          tabBarButton: (props) => (
            <Pressable
              {...props}
              onPress={async () => {
                await trackEvent({ eventType: 'wishlist_tab_click' });
                setLastVisitedRoute(pathname);
                props.navigation?.push('wishlist');
                if (props.onPress) props.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel="Wishlist Tab"
            >
              {props.children}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome name="user-o" size={24} color={color} />,
          tabBarButton: (props) => (
            <Pressable
              {...props}
              onPress={async () => {
                await trackEvent({ eventType: 'profile_tab_click' });
                setLastVisitedRoute(pathname);
                props.navigation?.push('profile');
                if (props.onPress) props.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel="Profile Tab"
            >
              {props.children}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Bag',
          tabBarIcon: ({ color }) => (
            <TabBarIconWithBadge svgIcon={<ShoppingBagOutlineIcon />} color={color} count={cartCount} animate={!!lastAddedToCart} />
          ),
          tabBarButton: (props) => (
            <Pressable
              {...props}
              onPress={async () => {
                await trackEvent({ eventType: 'cart_tab_click' });
                setLastVisitedRoute(pathname);
                props.navigation?.push('cart');
                if (props.onPress) props.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel="Cart Tab"
            >
              {props.children}
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}

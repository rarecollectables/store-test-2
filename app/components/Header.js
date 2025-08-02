import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Platform, 
  Animated,
  useWindowDimensions,
  TextInput,
  ScrollView
} from 'react-native';
import { Link, useRouter, usePathname } from 'expo-router';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../context/store';
import { colors, fontFamily, spacing, borderRadius } from '../../theme/index.js';
import { trackEvent } from '../../lib/trackEvent';

// Categories for navigation
const CATEGORIES = [
  { 
    name: 'SHOP', 
    path: '/(tabs)/shop', 
    icon: 'shopping-bag',
    subcategories: [] 
  },
  // {
  //   name: 'GIFTS FOR HER',
  //   path: '/(tabs)/shop?category=GiftsForHer',
  //   icon: 'gift',
  //   subcategories: [
  //     { name: 'Birthday Gifts', path: '/(tabs)/shop?category=GiftsForHer&subcategory=Birthday' },
  //     { name: 'Anniversary Gifts', path: '/(tabs)/shop?category=GiftsForHer&subcategory=Anniversary' },
  //     { name: 'Romantic Gifts', path: '/(tabs)/shop?category=GiftsForHer&subcategory=Romantic' },
  //     { name: 'Luxury Gifts', path: '/(tabs)/shop?category=GiftsForHer&subcategory=Luxury' },
  //     { name: 'Special Occasion Gifts', path: '/(tabs)/shop?category=GiftsForHer&subcategory=SpecialOccasion' },
  //     { name: 'View All Gifts for Her', path: '/(tabs)/shop?category=GiftsForHer' },
  //   ]
  // },
  {
    name: 'TOP DEALS',
    path: '/(tabs)/shop?category=TopDeals',
    icon: 'tags',
    subcategories: [
      { name: 'Summer Steals Up to 40% Off Storewide', path: '/(tabs)/shop?category=TopDeals&subcategory=SummerSteals40' },
      { name: 'Summer Steals Up to 50% Off Select Styles', path: '/(tabs)/shop?category=TopDeals&subcategory=SummerSteals50' },
      { name: '20% off select Clearance', path: '/(tabs)/shop?category=TopDeals&subcategory=Clearance20' },
      { name: '40% Off SOKO', path: '/(tabs)/shop?category=TopDeals&subcategory=SOKO40' },
      { name: 'Summer Faves Under $250', path: '/(tabs)/shop?category=TopDeals&subcategory=SummerFaves250' },
      { name: 'Zales Essentials: Rings Designed and Priced For You', path: '/(tabs)/shop?category=TopDeals&subcategory=ZalesEssentials' },
      { name: 'Ear Party Under $250', path: '/(tabs)/shop?category=TopDeals&subcategory=EarParty250' },
      { name: 'Styles For Him Under $500', path: '/(tabs)/shop?category=TopDeals&subcategory=MensUnder500' },
      { name: 'Clearance 50% Off & Up', path: '/(tabs)/shop?category=TopDeals&subcategory=Clearance50' },
      { name: 'View All Offers', path: '/(tabs)/shop?category=TopDeals' },
    ]
  },
  // {
  //   name: 'Clearance',
  //   path: '/(tabs)/shop?category=Clearance',
  //   icon: 'certificate',
  //   subcategories: [
  //     { name: 'Rings', path: '/(tabs)/shop?category=Clearance&subcategory=Rings' },
  //     { name: 'Necklaces', path: '/(tabs)/shop?category=Clearance&subcategory=Necklaces' },
  //     { name: 'Earrings', path: '/(tabs)/shop?category=Clearance&subcategory=Earrings' },
  //     { name: 'Bracelets', path: '/(tabs)/shop?category=Clearance&subcategory=Bracelets' },
  //     { name: 'Watches', path: '/(tabs)/shop?category=Clearance&subcategory=Watches' },
  //     { name: 'View All Clearance', path: '/(tabs)/shop?category=Clearance' },
  //   ]
  // },
  {
    name: 'Rings',
    path: '/(tabs)/shop?category=Rings',
    icon: 'circle-o',
    subcategories: [
      { name: 'Engagement Rings', path: '/(tabs)/shop?category=Rings&subcategory=Engagement' },
      { name: 'Wedding Bands', path: '/(tabs)/shop?category=Rings&subcategory=WeddingBands' },
      { name: 'Fashion Rings', path: '/(tabs)/shop?category=Rings&subcategory=Fashion' },
      { name: 'View All Rings', path: '/(tabs)/shop?category=Rings' },
    ]
  },
  {
    name: 'Necklaces',
    path: '/(tabs)/shop?category=Necklaces',
    icon: 'diamond',
    subcategories: [
      { name: 'Pendants', path: '/(tabs)/shop?category=Necklaces&subcategory=Pendants' },
      { name: 'Chains', path: '/(tabs)/shop?category=Necklaces&subcategory=Chains' },
      { name: 'Chokers', path: '/(tabs)/shop?category=Necklaces&subcategory=Chokers' },
      { name: 'View All Necklaces', path: '/(tabs)/shop?category=Necklaces' },
    ]
  },
  {
    name: 'Earrings',
    path: '/(tabs)/shop?category=Earrings',
    icon: 'star-o',
    subcategories: [
      { name: 'Studs', path: '/(tabs)/shop?category=Earrings&subcategory=Studs' },
      { name: 'Hoops', path: '/(tabs)/shop?category=Earrings&subcategory=Hoops' },
      { name: 'Drops', path: '/(tabs)/shop?category=Earrings&subcategory=Drops' },
      { name: 'View All Earrings', path: '/(tabs)/shop?category=Earrings' },
    ]
  },
  // {
  //   name: 'Pre-Owned',
  //   path: '/(tabs)/shop?category=PreOwned',
  //   icon: 'history',
  //   subcategories: [
  //     { name: 'Women\'s', path: '/(tabs)/shop?category=PreOwned&subcategory=Womens' },
  //     { name: 'Men\'s', path: '/(tabs)/shop?category=PreOwned&subcategory=Mens' },
  //     { name: 'View All Pre-Owned', path: '/(tabs)/shop?category=PreOwned' },
  //     { name: 'Zales at Rocksbox Pre-Owned', path: '/(tabs)/shop?category=PreOwned&subcategory=Rocksbox' },
  //   ]
  // }
];

export default function Header({transparent = false}) {
  const {width: windowWidth, width} = useWindowDimensions();
  const [logoSize, setLogoSize] = useState({width: 200, height: 70});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState(null);
  const [mobileActiveCategoryIndex, setMobileActiveCategoryIndex] =
    useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cart = Array.isArray(store.cart) ? store.cart : [];
  const wishlist = Array.isArray(store.wishlist) ? store.wishlist : [];

  // Calculate counts with safeguards
  const cartCount = cart.reduce((total, item) => {
    const quantity = item && item.quantity ? parseInt(item.quantity) || 1 : 1;
    return total + quantity;
  }, 0);

  const wishlistCount = wishlist.length;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const isDesktop = windowWidth >= 1024;
  const menuAnimation = React.useRef(new Animated.Value(0)).current;
  const categoryMenuRef = React.useRef(null);
  const submenuRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = event => {
      if (submenuRef.current && !submenuRef.current.contains(event.target)) {
        setHoveredCategoryIndex(null); // Or any state to close submenu
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  

  // Update logo size when window width changes
  useEffect(() => {
    function updateLogoSize() {
      if (windowWidth < 480) {
        // Small mobile
        setLogoSize({width: 160, height: 55});
      } else if (windowWidth < 768) {
        // Tablet/large mobile
        setLogoSize({width: 180, height: 60});
      } else if (windowWidth < 1024) {
        // Small desktop
        setLogoSize({width: 200, height: 70});
      } else {
        // Large desktop
        setLogoSize({width: 220, height: 75});
      }
    }

    updateLogoSize();
  }, [windowWidth]);

  // Add scroll listener to change header appearance on scroll
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleScroll = () => {
        const scrollPosition = window.scrollY;
        if (scrollPosition > 50) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Handle mobile menu animation
  useEffect(() => {
    Animated.timing(menuAnimation, {
      toValue: mobileMenuOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    trackEvent({
      eventType: mobileMenuOpen ? 'mobile_menu_close' : 'mobile_menu_open',
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Log search event with consistent format and source information
      trackEvent({
        eventType: 'search',
        searchQuery: searchQuery.trim(),
        searchSource: 'header',
        deviceType: isDesktop ? 'desktop' : 'mobile',
      });

      // Also log search to Netlify function for better search analytics
      fetch('/.netlify/functions/logSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          source: 'header',
          user_id: null // Will use guest session ID in the function
        })
      }).catch(error => {
        console.error('Error logging search:', error);
        // Non-blocking - we don't want to interrupt the user experience
      });

      // Use router.replace instead of push to reset all other filters
      // This ensures only the search parameter is active (exclusive filtering)
      router.replace({
        pathname: '/(tabs)/shop',
        params: {search: searchQuery.trim()},
      });
      setSearchQuery('');

      // Close mobile menu if open
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    } else {
      // If search is empty, clear all parameters
      router.replace('/(tabs)/shop');
    }
  };

  const handleNavigation = path => {
    if (path) {
      router.push(path);
      if (!isDesktop) {
        setMobileMenuOpen(false);
        setMobileActiveCategoryIndex(null);
      }
      setActiveCategoryIndex(null);
      setHoveredCategoryIndex(null);
      trackEvent({
        eventType: 'header_navigation',
        metadata: {destination: path},
      });
    }
  };

  const handleCategoryClick = (index, path, isDesktopView) => {
    if (isDesktopView) {
      // For desktop: navigate directly to the category page
      handleNavigation(path);
    } else {
      // For mobile: if category has subcategories, toggle them, otherwise navigate
      if (
        CATEGORIES[index].subcategories &&
        CATEGORIES[index].subcategories.length > 0
      ) {
        setMobileActiveCategoryIndex(
          mobileActiveCategoryIndex === index ? null : index,
        );
      } else {
        handleNavigation(path);
      }
    }
  };

  // Close category dropdown when clicking outside
  useEffect(() => {
    if (isDesktop) {
      const handleClickOutside = event => {
        if (
          categoryMenuRef.current &&
          !categoryMenuRef.current.contains(event.target)
        ) {
          setActiveCategoryIndex(null);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDesktop]);

  // Handle hover events for desktop with delay to prevent menu disappearing too quickly
  const handleCategoryHover = index => {
    if (isDesktop) {
      clearTimeout(hoverTimeout);
      setHoveredCategoryIndex(index);
    }
  };

  const handleCategoryLeave = () => {
    if (isDesktop) {
      const timeout = setTimeout(() => {
        setHoveredCategoryIndex(null);
      }, 800);
      setHoverTimeout(timeout);
    }
  };

  const handleSubcategoryContainerEnter = () => {
    if (isDesktop) {
      clearTimeout(hoverTimeout);
      // Ensure the category stays hovered
      if (hoveredCategoryIndex === null) {
        // Find which category is showing this dropdown
        const categoryWithDropdown = CATEGORIES.findIndex(
          cat => cat.subcategories && cat.subcategories.length > 0,
        );
        if (categoryWithDropdown !== -1) {
          setHoveredCategoryIndex(categoryWithDropdown);
        }
      }
    }
  };

  const handleSubcategoryContainerLeave = () => {
    if (isDesktop) {
      const timeout = setTimeout(() => {
        setHoveredCategoryIndex(null);
      }, 800);
      setHoverTimeout(timeout);
    }
  };

  // Handle subcategory click
  const handleSubcategoryClick = path => {
    handleNavigation(path);
    setHoveredCategoryIndex(null);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // ... (rest of the code remains the same)

  const mobileMenuOpacity = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const mobileMenuTranslateY = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  return (
    <>
      <View
        style={[
          styles.headerContainer,
          {paddingTop: Platform.OS === 'ios' ? insets.top : 0},
          (transparent || !isScrolled) &&
            {
              // backgroundColor: 'transparent',
              // position: 'absolute',
              // zIndex: 10,
            },
          isScrolled && styles.headerScrolled,
        ]}>
        {/* Left: Logo */}
        <View style={styles.headerLeft}>
          <Link href="/(tabs)/" asChild>
            <Pressable style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/rare-collectables-logo.png')}
                style={[
                  styles.logo,
                  {width: logoSize.width, height: logoSize.height},
                ]}
                contentFit="contain"
                transition={300}
                accessibilityLabel="Rare Collectables logo"
              />
            </Pressable>
          </Link>
        </View>
        {/* {(isMobile || isTablet) && isMenuOpen && (
          <Animated.View style={styles.mobileMenu}>
            <View style={styles.mobileMenuHeader}>
              <Text style={styles.mobileMenuTitle}>Menu</Text>
              <Pressable onPress={() => setIsMenuOpen(false)}>
                <FontAwesome name="close" size={22} color={colors.gold} />
              </Pressable>
            </View>

            {CATEGORIES.map((category, index) => (
              <View
                key={`category-${index}`}
                style={styles.mobileCategoryWrapper}>
                <Pressable
                  style={[
                    styles.navItem,
                    pathname.includes(category.path.split('?')[0]) &&
                      styles.activeNavItem,
                  ]}
                  onPress={() => {
                    Toggle expanded index
                    setHoveredCategoryIndex(prev =>
                      prev === index ? null : index,
                    );
                  }}>
                  <Text
                    style={[
                      styles.categoryText,
                      pathname.includes(category.path.split('?')[0]) &&
                        styles.activeNavText,
                    ]}>
                    {category.name
                      .toLowerCase()
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  {category.subcategories?.length > 0 && (
                    <FontAwesome
                      name={
                        hoveredCategoryIndex === index
                          ? 'angle-up'
                          : 'angle-down'
                      }
                      size={12}
                      color={colors.darkGray}
                      style={styles.dropdownIcon}
                    />
                  )}
                </Pressable>

                Subcategories for Mobile - Shown on Press
                {hoveredCategoryIndex === index &&
                  category.subcategories?.length > 0 && (
                    <View style={styles.mobileSubcategoryContainer}>
                      {category.subcategories.map((subcategory, subIndex) => (
                        <Pressable
                          key={`subcategory-${index}-${subIndex}`}
                          style={styles.subcategoryItem}
                          onPress={() =>
                            handleSubcategoryClick(subcategory.path)
                          }>
                          <View style={styles.subcategoryItemContent}>
                            <FontAwesome
                              name="chevron-right"
                              size={12}
                              color={colors.gold}
                              style={styles.subcategoryIcon}
                            />
                            <Text style={styles.subcategoryText}>
                              {subcategory.name}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
              </View>
            ))}
          </Animated.View>
        )} */}

        {/* Center: Categories Menu (Desktop only) */}
        {isDesktop && (
          <View style={styles.headerCenter} ref={categoryMenuRef}>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((category, index) => (
                <View
                  key={`category-${index}`}
                  onMouseEnter={() => handleCategoryHover(index)}
                  // onMouseLeave={handleCategoryLeave}
                  style={styles.categoryWrapper}>
                  <Pressable
                    style={[
                      styles.navItem,
                      styles.categoryItem,
                      pathname.includes(category.path.split('?')[0]) &&
                        styles.activeNavItem,
                      hoveredCategoryIndex === index &&
                        styles.hoveredCategoryItem,
                    ]}
                    onPress={() =>
                      handleCategoryClick(index, category.path, true)
                    }
                    onHoverIn={() => handleCategoryHover(index)}
                    onHoverOut={handleCategoryLeave}>
                    <Text
                      style={[
                        styles.categoryText,
                        pathname.includes(category.path.split('?')[0]) &&
                          styles.activeNavText,
                        hoveredCategoryIndex === index &&
                          styles.hoveredCategoryText,
                      ]}>
                      {category.name
                        .toLowerCase()
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                    {category.subcategories?.length > 0 && (
                      <FontAwesome
                        name="angle-down"
                        size={12}
                        color={
                          hoveredCategoryIndex === index
                            ? colors.gold
                            : colors.darkGray
                        }
                        style={styles.dropdownIcon}
                      />
                    )}
                  </Pressable>

                  {/* Subcategories */}
                  {hoveredCategoryIndex === index &&
                    category.subcategories?.length > 0 && (
                      <Animated.View
                        ref={submenuRef}
                        style={[styles.subcategoriesDropdown, {opacity: 1}]}
                        onHoverIn={handleSubcategoryContainerEnter}
                        onHoverOut={handleSubcategoryContainerLeave}>
                        <Text style={styles.subcategoryHeader}>
                          {category.name}
                        </Text>
                        <View style={styles.scrollWrapper}>
                          <View style={styles.subcategoryGrid}>
                            {category.subcategories.map(
                              (subcategory, subIndex) => (
                                <Pressable
                                  key={`subcategory-${index}-${subIndex}`}
                                  style={({hovered}) => [
                                    styles.subcategoryItem,
                                    hovered && styles.subcategoryItemHover,
                                  ]}
                                  onPress={() =>
                                    handleSubcategoryClick(subcategory.path)
                                  }>
                                  <View style={styles.subcategoryItemContent}>
                                    <Text style={styles.subcategoryText}>
                                      {subcategory.name}
                                    </Text>
                                  </View>
                                </Pressable>
                              ),
                            )}
                          </View>
                        </View>
                        {/* <View style={styles.subcategoryGrid}>
                          {category.subcategories.map(
                            (subcategory, subIndex) => (
                              <Pressable
                                key={`subcategory-${index}-${subIndex}`}
                                style={({hovered}) => [
                                  styles.subcategoryItem,
                                  hovered && styles.subcategoryItemHover,
                                ]}
                                onPress={() =>
                                  handleSubcategoryClick(subcategory.path)
                                }>
                                <View style={styles.subcategoryItemContent}>
                                  <FontAwesome
                                    name="chevron-right"
                                    size={12}
                                    color={colors.gold}
                                    style={styles.subcategoryIcon}
                                  />
                                  <Text style={styles.subcategoryText}>
                                    {subcategory.name}
                                  </Text>
                                </View>
                              </Pressable>
                            ),
                          )}
                        </View> */}
                      </Animated.View>
                    )}
                </View>
              ))}
            </View>
          </View>
        )}
        {!isDesktop && (
          <Animated.View
            style={[
              styles.mobileMenu,
              {
                position: 'absolute',
                top: isTablet ? 80 : 74,
                left: isTablet ? 20 : 0,
                right: isTablet ? 20 : 0,
                padding: 16,
                backgroundColor: 'white',
                borderRadius: 16,
                elevation: 10,
                zIndex: 999,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowOffset: {width: 0, height: 4},
                shadowRadius: 6,
                maxWidth: isTablet ? 600 : '100%',
                alignSelf: isTablet ? 'center' : 'stretch',
                display: mobileMenuOpen ? 'flex' : 'none',
              },
            ]}>
            {/* Mobile Search Bar */}
            <View style={styles.mobileSearchContainer}>
              <TextInput
                style={styles.mobileSearchInput}
                placeholder="Search products..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                accessibilityLabel="Search products"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.mobileSearchButton}
                onPress={handleSearch}
                accessibilityRole="button"
                accessibilityLabel="Submit search">
                <FontAwesome name="search" size={16} color={colors.white} />
              </Pressable>
            </View>
            {/* Mobile Categories */}
            <View style={styles.mobileCategoriesContainer}>
              {CATEGORIES.map((category, index) => (
                <View key={`mobile-category-${index}`}>
                  <Pressable
                    style={[
                      styles.mobileCategoryItem,
                      mobileActiveCategoryIndex === index &&
                        styles.mobileActiveCategoryItem,
                    ]}
                    onPress={() =>
                      handleCategoryClick(index, category.path, false)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={category.name}>
                    <View style={styles.mobileCategoryContent}>
                      <FontAwesome
                        name={category.icon}
                        size={16}
                        color={colors.gold}
                        style={styles.mobileCategoryIcon}
                      />
                      <Text
                        style={[
                          styles.mobileCategoryText,
                          mobileActiveCategoryIndex === index &&
                            styles.mobileActiveCategoryText,
                        ]}>
                        {category.name}
                      </Text>
                    </View>
                    {category.subcategories &&
                      category.subcategories.length > 0 && (
                        <FontAwesome
                          name={
                            mobileActiveCategoryIndex === index
                              ? 'angle-up'
                              : 'angle-down'
                          }
                          size={16}
                          color={colors.darkGray}
                        />
                      )}
                  </Pressable>

                  {/* Mobile Subcategories */}
                  {category.subcategories &&
                    category.subcategories.length > 0 &&
                    mobileActiveCategoryIndex === index && (
                      <View style={styles.mobileSubcategoriesContainer}>
                        {category.subcategories.map((subcategory, subIndex) => (
                          <Pressable
                            key={`mobile-subcategory-${index}-${subIndex}`}
                            style={styles.mobileSubcategoryItem}
                            onPress={() => handleNavigation(subcategory.path)}
                            accessibilityRole="button"
                            accessibilityLabel={subcategory.name}>
                            <Text style={styles.mobileSubcategoryText}>
                              {subcategory.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}
        {/* Right: Search + Icons */}
        <View style={styles.headerRight}>
          {isDesktop && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={colors.textLight}
                textAlign="center"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <Pressable style={styles.searchButton} onPress={handleSearch}>
                <FontAwesome name="search" size={18} color={colors.white} />
              </Pressable>
            </View>
          )}
          <View style={styles.headerIcons}>
            <Pressable
              style={styles.iconButton}
              onPress={() => handleNavigation('/(tabs)/wishlist')}>
              <FontAwesome name="heart" size={22} color={colors.gold} />
              {wishlistCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{wishlistCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => handleNavigation('/(tabs)/cart')}>
              <FontAwesome name="shopping-bag" size={22} color={colors.gold} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
            {!isDesktop && (
              <Pressable
                onPress={toggleMobileMenu}
                style={styles.menuButton}
                accessibilityRole="button"
                accessibilityLabel="Toggle menu">
                <FontAwesome
                  name={mobileMenuOpen ? 'times' : 'bars'}
                  size={24}
                  color={colors.gold}
                />
              </Pressable>
            )}
          </View>
          {/* {(isMobile || isTablet) && (
            <Pressable
              onPress={() => setIsMenuOpen(true)}
              style={styles.hamburgerButton}
              accessibilityLabel="Open menu"
              accessibilityRole="button">
              <FontAwesome name="bars" size={24} color={colors.gold} />
            </Pressable>
          )} */}
        </View>
      </View>
    </>
    // <>
    //   <View
    //     style={[
    //       styles.headerContainer,
    //       {paddingTop: Platform.OS === 'ios' ? insets.top : 0},
    //       isScrolled && styles.headerScrolled,
    //     ]}>
    //     Left: Logo
    //     <Link href="/(tabs)/" asChild>
    //       <Pressable style={styles.logoContainer}>
    //         <Image
    //           source={require('../../assets/images/rare-collectables-logo.png')}
    //           style={[
    //             styles.logo,
    //             {width: logoSize.width, height: logoSize.height},
    //           ]}
    //           contentFit="contain"
    //           transition={300}
    //           accessibilityLabel="Rare Collectables logo"
    //         />
    //       </Pressable>
    //     </Link>

    //     Center: Categories Menu (Desktop only)
    //     {isDesktop && (
    //       <View style={styles.categoriesRow} ref={categoryMenuRef}>
    //         <View style={styles.categoriesContainer}>
    //           {CATEGORIES.map((category, index) => (
    //             <View key={`category-${index}`} style={styles.categoryWrapper}>
    //               <Pressable
    //                 style={[
    //                   styles.navItem,
    //                   styles.categoryItem,
    //                   pathname.includes(category.path.split('?')[0]) &&
    //                     styles.activeNavItem,
    //                   hoveredCategoryIndex === index &&
    //                     styles.hoveredCategoryItem,
    //                 ]}
    //                 onPress={() =>
    //                   handleCategoryClick(index, category.path, true)
    //                 }
    //                 onHoverIn={() => handleCategoryHover(index)}
    //                 onHoverOut={handleCategoryLeave}
    //                 accessibilityRole="button"
    //                 accessibilityLabel={category.name}>
    //                 <Text
    //                   style={[
    //                     styles.categoryText,
    //                     pathname.includes(category.path.split('?')[0]) &&
    //                       styles.activeNavText,
    //                     hoveredCategoryIndex === index &&
    //                       styles.hoveredCategoryText,
    //                   ]}>
    //                   {category.name}
    //                 </Text>
    //                 {category.subcategories?.length > 0 && (
    //                   <FontAwesome
    //                     name="angle-down"
    //                     size={12}
    //                     color={
    //                       hoveredCategoryIndex === index
    //                         ? colors.gold
    //                         : colors.darkGray
    //                     }
    //                     style={styles.dropdownIcon}
    //                   />
    //                 )}
    //               </Pressable>

    //               Subcategories Dropdown
    //               {hoveredCategoryIndex === index &&
    //                 category.subcategories?.length > 0 && (
    //                   <View
    //                     style={styles.subcategoriesDropdown}
    //                     onHoverIn={handleSubcategoryContainerEnter}
    //                     onHoverOut={handleSubcategoryContainerLeave}>
    //                     {category.subcategories.map((subcategory, subIndex) => (
    //                       <Pressable
    //                         key={`subcategory-${index}-${subIndex}`}
    //                         style={styles.subcategoryItem}
    //                         onPress={() =>
    //                           handleSubcategoryClick(subcategory.path)
    //                         }
    //                         accessibilityRole="button"
    //                         accessibilityLabel={subcategory.name}>
    //                         <Text style={styles.subcategoryText}>
    //                           {subcategory.name}
    //                         </Text>
    //                       </Pressable>
    //                     ))}
    //                   </View>
    //                 )}
    //             </View>
    //           ))}
    //         </View>
    //       </View>
    //     )}

    //     Right: Search + Wishlist + Cart
    //     <View style={styles.searchAndIcons}>
    //       {/* Search */}
    //       {isDesktop && (
    //         <View style={styles.searchContainer}>
    //           <TextInput
    //             style={styles.searchInput}
    //             placeholder="Search products..."
    //             placeholderTextColor={colors.textLight}
    //             textAlign="center"
    //             value={searchQuery}
    //             onChangeText={setSearchQuery}
    //             onFocus={() => setIsSearchFocused(true)}
    //             onBlur={() => setIsSearchFocused(false)}
    //             onSubmitEditing={handleSearch}
    //             returnKeyType="search"
    //             accessibilityLabel="Search products"
    //           />
    //           <Pressable
    //             style={styles.searchButton}
    //             onPress={handleSearch}
    //             accessibilityRole="button"
    //             accessibilityLabel="Submit search">
    //             <FontAwesome name="search" size={18} color={colors.white} />
    //           </Pressable>
    //         </View>
    //       )}

    //       Icons
    //       <View style={styles.headerIcons}>
    //         Wishlist
    //         <Pressable
    //           style={styles.iconButton}
    //           onPress={() => handleNavigation('/(tabs)/wishlist')}
    //           accessibilityRole="button"
    //           accessibilityLabel="Wishlist">
    //           <FontAwesome name="heart" size={22} color={colors.gold} />
    //           {wishlistCount > 0 && (
    //             <View style={styles.badge}>
    //               <Text style={styles.badgeText}>{wishlistCount}</Text>
    //             </View>
    //           )}
    //         </Pressable>

    //         Cart
    //         <Pressable
    //           style={styles.iconButton}
    //           onPress={() => handleNavigation('/(tabs)/cart')}
    //           accessibilityRole="button"
    //           accessibilityLabel="Shopping cart">
    //           <FontAwesome name="shopping-bag" size={22} color={colors.gold} />
    //           {cartCount > 0 && (
    //             <View style={styles.badge}>
    //               <Text style={styles.badgeText}>{cartCount}</Text>
    //             </View>
    //           )}
    //         </Pressable>
    //       </View>
    //     </View>
    //   </View>
    // </>
  );
}

const styles = StyleSheet.create({
  /* Announcement bar styles removed */
  headerLeft: {
    // flex: 1,
    justifyContent: 'flex-start',
    // width:'20%',
    // borderWidth:1
  },

  headerCenter: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(191, 161, 74, 0.2)',
    position: 'sticky',
    top: 30,
    left: 0,
    right: 0,
    zIndex: 100,
    ...(Platform.OS === 'web'
      ? {
          transition: 'all 0.3s ease',
        }
      : {}),
  },
  headerScrolled: {
    paddingVertical: spacing.s,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }
      : {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 3,
        }),
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  logo: {
    resizeMode: 'contain',
  },
  menuButton: {
    padding: spacing.sm,
    zIndex: 1100,
  },
  categoriesRow: {
    width: '100%',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(191, 161, 74, 0.2)',
    paddingVertical: spacing.m,
    paddingHorizontal: 0,
    zIndex: 99,
    display: 'flex',
    justifyContent: 'center',
  },
  desktopNav: {
    width: '100%',
    maxWidth: 1200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    marginTop: 0,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  categoryWrapper: {
    position: 'relative',
    marginBottom: spacing.m,
    paddingHorizontal: spacing.xs,
  },
  navItem: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    marginHorizontal: 0,
    borderRadius: 0,
    position: 'relative',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeNavItem: {
    borderBottomWidth: 3,
    borderBottomColor: colors.gold,
    backgroundColor: 'transparent',
  },
  hoveredCategoryItem: {
    backgroundColor: 'transparent',
    borderBottomWidth: 3,
    borderBottomColor: colors.gold,
  },
  navText: {
    color: colors.darkGray,
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryText: {
    color: colors.darkGray,
    fontWeight: '600',
    fontFamily: fontFamily.sans,
    fontSize: 14,
    letterSpacing: 1.2,
  },
  activeNavText: {
    color: colors.gold,
    fontWeight: '600',
  },
  hoveredCategoryText: {
    color: colors.gold,
  },
  dropdownIcon: {
    marginLeft: spacing.xs,
  },
  subcategoriesDropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(191, 161, 74, 0.3)',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    minWidth: 300,
    maxWidth: 320,
    zIndex: 200,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
        }
      : {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 6},
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 6,
        }),
  },
  subcategoryItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(191, 161, 74, 0.1)',
    marginBottom: spacing.xs,
    transition: 'all 0.2s ease',
    ...(Platform.OS === 'web'
      ? {
          ':hover': {
            backgroundColor: 'rgba(191, 161, 74, 0.08)',
          },
        }
      : {}),
  },
  subcategoryText: {
    color: colors.darkGray,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: spacing.xs,
    fontFamily: fontFamily.sans,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: spacing.md,
    minWidth: 100,
  },
  iconButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e53935', // Red color for better visibility
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.white,
    zIndex: 10,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mobileMenu: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 70 : 60,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    padding: spacing.m,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    zIndex: 1000,
    maxHeight: '80vh',
    overflow: 'auto',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
        }
      : {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 6},
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 6,
        }),
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 90,
  },
  mobileSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  mobileSearchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  mobileSearchButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  mobileCategoriesContainer: {
    paddingTop: 8,
    // borderWidth:1,
    marginBottom: 20,
    // width: '100%',
    // marginTop: spacing.md,
    // borderTopWidth: 1,
  },
  mobileCategoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileActiveCategoryItem: {
    backgroundColor: '#f9f5ed',
    borderLeftWidth: 4,
    borderLeftColor: '#bfa054',
  },
  mobileCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileCategoryIcon: {
    marginRight: 10,
  },
  mobileCategoryText: {
    // color: colors.darkGray,
    fontSize: 16,
    color: '#222',
    fontFamily: fontFamily.sans,
  },
  mobileActiveCategoryText: {
    fontWeight: '600',
    color: '#bfa054',

    // color: colors.gold,
    // fontWeight: '600',
  },
  mobileSubcategoriesContainer: {
    backgroundColor: '#f7f7f7',
    paddingLeft: 20,
  },
  mobileSubcategoryItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mobileSubcategoryText: {
    fontSize: 15,
    color: '#555',
    // color: colors.darkGray,
    // fontSize: 14,
    fontFamily: fontFamily.sans,
  },
  mobileCategoriesHeader: {
    borderTopColor: 'rgba(191, 161, 74, 0.2)',
    paddingTop: spacing.md,
  },
  mobileCategoryWrapper: {
    marginBottom: spacing.xs,
  },
  mobileNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  expandedMobileCategoryItem: {
    backgroundColor: colors.gold,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  activeMobileNavItem: {
    backgroundColor: colors.gold,
  },
  mobileNavIcon: {
    marginRight: spacing.sm,
  },
  mobileDropdownIcon: {
    marginLeft: 'auto',
  },
  mobileNavText: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    color: colors.text,
    flex: 1,
  },
  activeMobileNavText: {
    color: colors.white,
    fontWeight: '600',
  },
  // mobileSubcategoriesContainer: {
  //   backgroundColor: colors.ivory,
  //   borderBottomLeftRadius: borderRadius.md,
  //   borderBottomRightRadius: borderRadius.md,
  //   paddingVertical: spacing.sm,
  //   paddingHorizontal: spacing.md,
  //   marginBottom: spacing.md,
  //   borderLeftWidth: 1,
  //   borderRightWidth: 1,
  //   borderBottomWidth: 1,
  //   borderColor: 'rgba(191, 161, 74, 0.2)',
  // },
  // mobileSubcategoryItem: {
  //   paddingVertical: spacing.m,
  //   paddingHorizontal: spacing.md,
  //   borderBottomWidth: 1,
  //   borderBottomColor: 'rgba(191, 161, 74, 0.2)',
  //   marginBottom: spacing.xs,
  // },
  // mobileSubcategoryText: {
  //   fontFamily: fontFamily.sans,
  //   fontSize: 15,
  //   color: colors.onyxBlack,
  //   paddingLeft: spacing.xl,
  //   fontWeight: '500',
  //   letterSpacing: 0.3,
  // },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 998,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 400,
    marginHorizontal: spacing.l,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    borderTopLeftRadius: borderRadius.sm,
    borderBottomLeftRadius: borderRadius.sm,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.text,
    outlineStyle: 'none', // Remove focus outline
    outlineWidth: 0,
    WebkitTapHighlightColor: 'transparent', // Remove tap highlight on mobile
    WebkitAppearance: 'none', // Remove default styling on iOS
    WebkitOutline: 'none', // Safari specific
    backgroundColor: colors.white,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: colors.gold,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: borderRadius.sm,
    borderBottomRightRadius: borderRadius.sm,
    marginLeft: -1,
  },
  // mobileSearchContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginBottom: spacing.m,
  //   width: '100%',
  // },
  // mobileSearchInput: {
  //   flex: 1,
  //   height: 40,
  //   borderWidth: 1,
  //   borderColor: colors.softGoldBorder,
  //   borderRadius: borderRadius.sm,
  //   paddingHorizontal: spacing.m,
  //   paddingVertical: spacing.xs,
  //   fontFamily: fontFamily.sans,
  //   fontSize: 14,
  //   color: colors.text,
  //   backgroundColor: colors.white,
  // },
  // mobileSearchButton: {
  //   backgroundColor: colors.gold,
  //   height: 40,
  //   width: 40,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   borderTopRightRadius: borderRadius.sm,
  //   borderBottomRightRadius: borderRadius.sm,
  //   marginLeft: -1,
  // },
  subcategoryHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    fontFamily: fontFamily.sans,
  },

  scrollWrapper: {
    maxHeight: 300, // or use '100%' if parent container handles height
    overflow: 'auto', // enables scroll in web
    padding: 10,
  },
  
  subcategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // if using React Native Web
    justifyContent: 'flex-start',
    marginTop: 12,
  },

  subcategoryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 6,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  subcategoryItemHover: {
    backgroundColor: '#f0f0f0',

    // backgroundColor: 'rgba(191, 161, 74, 0.08)',
    borderColor: colors.gold,
  },

  subcategoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  subcategoryIcon: {
    marginRight: spacing.sm,
  },

  subcategoryText: {
    // fontSize: 14,
    fontFamily: fontFamily.sans,
    // color: colors.darkGray,
    // fontWeight: '500',
    // flexShrink: 1,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  hamburgerButton: {
    padding: 10,
    marginRight: 16,
  },

  // mobileMenu: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   backgroundColor: colors.white,
  //   zIndex: 999,
  //   paddingTop: 60,
  //   paddingHorizontal: 20,
  // },

  mobileMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginTop: 10,
  },

  mobileMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gold,
  },

  mobileMenuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingLeft: 10,
  },

  mobileMenuText: {
    fontSize: 16,
    color: colors.onyxBlack,
  },
});


// return (
  //   <>
  //     {/* Main Header Container - Top Row with Logo and Icons */}
  //     <View style={[
  //       styles.headerContainer, 
  //       { paddingTop: Platform.OS === 'ios' ? insets.top : 0 },
  //       isScrolled && styles.headerScrolled
  //     ]}>
  //         {/* Mobile Menu Toggle Button */}
  //         {!isDesktop && (
  //           <Pressable
  //             onPress={toggleMobileMenu}
  //             style={styles.menuButton}
  //             accessibilityRole="button"
  //             accessibilityLabel="Toggle menu"
  //           >
  //             <FontAwesome name={mobileMenuOpen ? 'times' : 'bars'} size={24} color={colors.gold} />
  //           </Pressable>
  //         )}
          
  //         {/* Logo */}
  //         <Link href="/(tabs)/" asChild>
  //           <Pressable style={styles.logoContainer}>
  //             <Image
  //               source={require('../../assets/images/rare-collectables-logo.png')}
  //               style={[styles.logo, { width: logoSize.width, height: logoSize.height }]}
  //               contentFit="contain"
  //               transition={300}
  //               accessibilityLabel="Rare Collectables logo"
  //             />
  //           </Pressable>
  //         </Link>
          
  //         {/* Desktop Search Bar */}
  //         {isDesktop && (
  //           <View style={styles.searchContainer}>
  //             <TextInput
  //               style={styles.searchInput}
  //               placeholder="Search products..."
  //               placeholderTextColor={colors.textLight}
  //               textAlign="center"
  //               value={searchQuery}
  //               onChangeText={setSearchQuery}
  //               onFocus={() => setIsSearchFocused(true)}
  //               onBlur={() => setIsSearchFocused(false)}
  //               onSubmitEditing={handleSearch}
  //               returnKeyType="search"
  //               accessibilityLabel="Search products"
  //             />
  //             <Pressable 
  //               style={styles.searchButton} 
  //               onPress={handleSearch}
  //               accessibilityRole="button"
  //               accessibilityLabel="Submit search"
  //             >
  //               <FontAwesome name="search" size={18} color={colors.white} />
  //             </Pressable>
  //           </View>
  //         )}
          
  //         {/* Header Icons (Cart & Wishlist) */}
  //         <View style={styles.headerIcons}>
  //           {/* Wishlist Icon */}
  //           <Pressable
  //             style={styles.iconButton}
  //             onPress={() => handleNavigation('/(tabs)/wishlist')}
  //             accessibilityRole="button"
  //             accessibilityLabel="Wishlist"
  //           >
  //             <FontAwesome name="heart" size={22} color={colors.gold} />
  //             {wishlistCount > 0 && (
  //               <View style={styles.badge}>
  //                 <Text style={styles.badgeText}>{wishlistCount}</Text>
  //               </View>
  //             )}
  //           </Pressable>
            
  //           {/* Cart Icon */}
  //           <Pressable
  //             style={styles.iconButton}
  //             onPress={() => handleNavigation('/(tabs)/cart')}
  //             accessibilityRole="button"
  //             accessibilityLabel="Shopping cart"
  //           >
  //             <FontAwesome name="shopping-bag" size={22} color={colors.gold} />
  //             {cartCount > 0 && (
  //               <View style={styles.badge}>
  //                 <Text style={styles.badgeText}>{cartCount}</Text>
  //               </View>
  //             )}
  //           </Pressable>
  //         </View>
  //       </View>
        
  //       {/* Desktop Navigation - Categories Row */}
  //       {isDesktop && (
  //         <View style={styles.categoriesRow} ref={categoryMenuRef}>
  //           <View style={styles.categoriesContainer}>
  //             {CATEGORIES.map((category, index) => (
  //               <View key={`category-${index}`} style={styles.categoryWrapper}>
  //                 <Pressable
  //                   style={[styles.navItem, styles.categoryItem,
  //                     pathname.includes(category.path.split('?')[0]) && styles.activeNavItem,
  //                     (hoveredCategoryIndex === index) && styles.hoveredCategoryItem
  //                   ]}
  //                   onPress={() => handleCategoryClick(index, category.path, true)}
  //                   onHoverIn={() => handleCategoryHover(index)}
  //                   onHoverOut={handleCategoryLeave}
  //                   accessibilityRole="button"
  //                   accessibilityLabel={category.name}
  //                 >
  //                   <Text style={[
  //                     styles.categoryText,
  //                     pathname.includes(category.path.split('?')[0]) && styles.activeNavText,
  //                     (hoveredCategoryIndex === index) && styles.hoveredCategoryText
  //                   ]}>
  //                     {category.name}
  //                   </Text>
  //                   {category.subcategories && category.subcategories.length > 0 && (
  //                     <FontAwesome 
  //                       name="angle-down" 
  //                       size={12} 
  //                       color={hoveredCategoryIndex === index ? colors.gold : colors.darkGray} 
  //                       style={styles.dropdownIcon} 
  //                     />
  //                   )}
  //                 </Pressable>
                  
  //                 {/* Subcategories Dropdown */}
  //                 {category.subcategories && category.subcategories.length > 0 && hoveredCategoryIndex === index && (
  //                   <View 
  //                     style={styles.subcategoriesDropdown}
  //                     onHoverIn={handleSubcategoryContainerEnter}
  //                     onHoverOut={handleSubcategoryContainerLeave}
  //                   >
  //                     {category.subcategories.map((subcategory, subIndex) => (
  //                       <Pressable
  //                         key={`subcategory-${index}-${subIndex}`}
  //                         style={styles.subcategoryItem}
  //                         onPress={() => handleSubcategoryClick(subcategory.path)}
  //                         accessibilityRole="button"
  //                         accessibilityLabel={subcategory.name}
  //                       >
  //                         <Text style={styles.subcategoryText}>{subcategory.name}</Text>
  //                       </Pressable>
  //                     ))}
  //                   </View>
  //                 )}
  //               </View>
  //             ))}
  //           </View>
  //         </View>
  //       )}
        
  //       {/* Mobile Menu Dropdown */}
  //       {!isDesktop && (
  //         <Animated.View 
  //           style={[
  //             styles.mobileMenu,
  //             {
  //               transform: [{ translateY: mobileMenuTranslateY }],
  //               opacity: mobileMenuOpacity,
  //               display: mobileMenuOpen ? 'flex' : 'none'
  //             }
  //           ]}
  //         >
  //           {/* Mobile Search Bar */}
  //           <View style={styles.mobileSearchContainer}>
  //             <TextInput
  //               style={styles.mobileSearchInput}
  //               placeholder="Search products..."
  //               placeholderTextColor={colors.textLight}
  //               value={searchQuery}
  //               onChangeText={setSearchQuery}
  //               onSubmitEditing={handleSearch}
  //               returnKeyType="search"
  //               accessibilityLabel="Search products"
  //               autoCapitalize="none"
  //               autoCorrect={false}
  //             />
  //             <Pressable 
  //               style={styles.mobileSearchButton} 
  //               onPress={handleSearch}
  //               accessibilityRole="button"
  //               accessibilityLabel="Submit search"
  //             >
  //               <FontAwesome name="search" size={16} color={colors.white} />
  //             </Pressable>
  //           </View>
  //           {/* Mobile Categories */}
  //           <View style={styles.mobileCategoriesContainer}>
  //             {CATEGORIES.map((category, index) => (
  //               <View key={`mobile-category-${index}`}>
  //                 <Pressable
  //                   style={[styles.mobileCategoryItem, 
  //                     mobileActiveCategoryIndex === index && styles.mobileActiveCategoryItem
  //                   ]}
  //                   onPress={() => handleCategoryClick(index, category.path, false)}
  //                   accessibilityRole="button"
  //                   accessibilityLabel={category.name}
  //                 >
  //                   <View style={styles.mobileCategoryContent}>
  //                     <FontAwesome name={category.icon} size={16} color={colors.gold} style={styles.mobileCategoryIcon} />
  //                     <Text style={[styles.mobileCategoryText, 
  //                       mobileActiveCategoryIndex === index && styles.mobileActiveCategoryText
  //                     ]}>
  //                       {category.name}
  //                     </Text>
  //                   </View>
  //                   {category.subcategories && category.subcategories.length > 0 && (
  //                     <FontAwesome 
  //                       name={mobileActiveCategoryIndex === index ? "angle-up" : "angle-down"} 
  //                       size={16} 
  //                       color={colors.darkGray} 
  //                     />
  //                   )}
  //                 </Pressable>
                  
  //                 {/* Mobile Subcategories */}
  //                 {category.subcategories && category.subcategories.length > 0 && mobileActiveCategoryIndex === index && (
  //                   <View style={styles.mobileSubcategoriesContainer}>
  //                     {category.subcategories.map((subcategory, subIndex) => (
  //                       <Pressable
  //                         key={`mobile-subcategory-${index}-${subIndex}`}
  //                         style={styles.mobileSubcategoryItem}
  //                         onPress={() => handleNavigation(subcategory.path)}
  //                         accessibilityRole="button"
  //                         accessibilityLabel={subcategory.name}
  //                       >
  //                         <Text style={styles.mobileSubcategoryText}>{subcategory.name}</Text>
  //                       </Pressable>
  //                     ))}
  //                   </View>
  //                 )}
  //               </View>
  //             ))}
  //           </View>
  //         </Animated.View>
  //       )}
        
  //       {/* Overlay for mobile menu */}
  //       {!isDesktop && mobileMenuOpen && (
  //         <Pressable
  //           style={styles.overlay}
  //           onPress={() => setMobileMenuOpen(false)}
  //           accessibilityRole="button"
  //           accessibilityLabel="Close menu"
  //         />
  //       )}
  
  //     </>
  //   );

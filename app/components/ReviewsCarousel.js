// import React, { useRef, useState } from 'react';
// import { View, Text, StyleSheet, FlatList, useWindowDimensions, Animated } from 'react-native';
// import { FontAwesome } from '@expo/vector-icons';
// import { colors, spacing, borderRadius, fontFamily } from '../../theme';



// const REVIEWS = [
//   {
//     id: '1',
//     name: 'Amelia R.',
//     review: 'Absolutely stunning necklace! The packaging was beautiful and delivery was fast. Highly recommend!',
//     rating: 5,
//   },
//   {
//     id: '2',
//     name: 'Sophie L.',
//     review: 'Bought a bracelet for my mum—she loved it! Superb quality and elegant design.',
//     rating: 5,
//   },
//   {
//     id: '3',
//     name: 'Emily W.',
//     review: 'Customer service was very helpful. The earrings are gorgeous and hypoallergenic!',
//     rating: 4,
//   },
//   {
//     id: '4',
//     name: 'Chloe T.',
//     review: 'I get compliments every time I wear my new ring. Will definitely shop again.',
//     rating: 5,
//   },
//   {
//     id: '5',
//     name: 'Olivia G.',
//     review: 'Quick shipping, lovely presentation, and the necklace sparkles beautifully.',
//     rating: 4,
//   },
// ];

// function StarRating({ rating }) {
//   return (
//     <View style={{ flexDirection: 'row', marginBottom: 4 }}>
//       {[...Array(5)].map((_, i) => (
//         <FontAwesome
//           key={i}
//           name={i < rating ? 'star' : 'star-o'}
//           size={16}
//           color={colors.gold}
//           style={{ marginRight: 2 }}
//         />
//       ))}
//     </View>
//   );
// }

// export default function ReviewsCarousel({ reviews = REVIEWS }) {
//   const { width } = useWindowDimensions();
//   const flatListRef = useRef(null);
//   const scrollX = useRef(new Animated.Value(0)).current;
//   const [currentIndex, setCurrentIndex] = useState(0);

//   // Listen to scrollX to update the dot indicator
//   React.useEffect(() => {
//     const cardWidth = Math.min(width * 0.9, 400) + spacing.sm * 2;
//     const listener = scrollX.addListener(({ value }) => {
//       const index = Math.round(value / cardWidth);
//       setCurrentIndex(index);
//     });
//     return () => scrollX.removeListener(listener);
//   }, [width, scrollX]);

//   return (
//     <View style={styles.carouselContainer}>
//       <FlatList
//         ref={flatListRef}
//         data={reviews}
//         keyExtractor={(item) => item.id}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToAlignment="center"
//         decelerationRate={0.95}
//         contentContainerStyle={{ alignItems: 'center', width: width }}
//         style={{ width: width }}
//         onScroll={Animated.event(
//           [{ nativeEvent: { contentOffset: { x: scrollX } } }],
//           { useNativeDriver: false }
//         )}
//         renderItem={({ item }) => (
//           <View style={[styles.card, { width: Math.min(width * 0.9, 400) }]}> 
//             <Text style={styles.reviewText}>{item.review}</Text>
//             <StarRating rating={item.rating} />
//             <Text style={styles.reviewer}>— {item.name}</Text>
//           </View>
//         )}
//       />
//       <View style={styles.dotsRow}>
//         {reviews.map((_, i) => (
//           <View
//             key={i}
//             style={[
//               styles.dot,
//               { backgroundColor: i === currentIndex ? colors.gold : colors.softGoldBorder },
//             ]}
//           />
//         ))}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   carouselContainer: {
//     width: '100%',
//     alignItems: 'center',
//     marginTop: spacing.lg,
//     marginBottom: spacing.lg,
//   },
//   card: {
//     minHeight: 120,
//     backgroundColor: colors.white,
//     borderRadius: borderRadius.lg,
//     padding: spacing.lg,
//     marginHorizontal: spacing.sm,
//     alignItems: 'center',
//     shadowColor: colors.gold,
//     shadowOpacity: 0.13,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 6 },
//     elevation: 3,
//   },
//   reviewText: {
//     fontSize: 16,
//     color: colors.onyxBlack,
//     fontFamily: fontFamily.serif,
//     textAlign: 'center',
//     marginBottom: 10,
//     fontStyle: 'italic',
//     letterSpacing: 0.1,
//   },
//   reviewer: {
//     marginTop: 6,
//     fontSize: 15,
//     color: colors.gold,
//     fontFamily: fontFamily.sans,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   dotsRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 12,
//   },
//   dot: {
//     width: 9,
//     height: 9,
//     borderRadius: 5,
//     marginHorizontal: 4,
//   },
// });


import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import {Feather, FontAwesome} from '@expo/vector-icons';
import {colors, spacing, fontFamily} from '../../theme';

const REVIEWS = [
  {
    id: '1',
    name: 'Amelia R.',
    role: 'Product Manager',
    review:
      'Absolutely stunning necklace! The packaging was beautiful and delivery was fast. Highly recommend!',
    rating: 5,
    avatar: require('../../assets/images/Reviews/1.jpg'),
    url: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils//waterdrop-moissanite-review.webp',
  },
  {
    id: '2',
    name: 'Sophie L.',
    role: 'Creative Lead',
    review:
      'Bought a bracelet for my mum—she loved it! Superb quality and elegant design.',
    rating: 5,
    avatar: require('../../assets/images/Reviews/1.jpg'),
    url: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils//ring-1-review.jpg',
  },
  {
    id: '3',
    name: 'Emily W.',
    role: 'UI Designer',
    review:
      'Customer service was very helpful. The earrings are gorgeous and hypoallergenic!',
    rating: 4,
    avatar: require('../../assets/images/Reviews/1.jpg'),
    url: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils//ring-2-review.jpg',
  },
  // {
  //   id: '4',
  //   name: 'Chloe T.',
  //   role: 'Marketing Manager',
  //   review:
  //     'I get compliments every time I wear my new ring. Will definitely shop again.',
  //   rating: 5,
  //   avatar: require('../../assets/images/Reviews/1.jpg'),
  // },
  // {
  //   id: '5',
  //   name: 'Olivia G.',
  //   role: 'Brand Strategist',
  //   review:
  //     'Quick shipping, lovely presentation, and the necklace sparkles beautifully.',
  //   rating: 4,
  //   avatar: require('../../assets/images/Reviews/1.jpg'),
  // },
];

function StarRating({rating}) {
  return (
    <View style={{flexDirection: 'row', marginBottom: 6}}>
      {[...Array(5)].map((_, i) => (
        <FontAwesome
          key={i}
          name={i < rating ? 'star' : 'star-o'}
          size={14}
          color={colors.gold}
          style={{marginRight: 2}}
        />
      ))}
    </View>
  );
}

export default function CustomerReviewsCarousel({reviews = REVIEWS}) {
  const {width} = useWindowDimensions();
  const flatListRef = useRef(null);
  const [scrollX, setScrollX] = useState(0);

  // Responsive card width
  const CARD_WIDTH =
    width >= 1024
      ? 280 // Desktop
      : width >= 768
      ? 220 // Tablet
      : 180; // Mobile

  const SCROLL_DISTANCE = CARD_WIDTH + spacing.sm * 2;

  const scrollTo = direction => {
    let newOffset =
      scrollX + (direction === 'left' ? -SCROLL_DISTANCE : SCROLL_DISTANCE);

    // Clamp to 0 or max scroll range
    newOffset = Math.max(0, newOffset);
    flatListRef.current.scrollToOffset({offset: newOffset, animated: true});
    setScrollX(newOffset);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Customer Reviews</Text>

      <View style={styles.carouselRow}>
        {/* Left Arrow */}
        {width > 768 && (
          <TouchableOpacity onPress={() => scrollTo('left')}>
            <Feather name="chevron-left" size={30} color={colors.onyxBlack} />
          </TouchableOpacity>
        )}

        {/* Scrollable Cards */}
        <View style={[styles.flatlistContainer, {width: width * 0.66}]}>
          <FlatList
            ref={flatListRef}
            data={reviews}
            horizontal
            keyExtractor={item => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={SCROLL_DISTANCE}
            decelerationRate="fast"
            onScroll={event => setScrollX(event.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
            contentContainerStyle={{paddingHorizontal: spacing.sm}}
            renderItem={({item}) => (
              <View style={[styles.card, {width: CARD_WIDTH}]}>
                <View
                  style={[
                    styles.avatarContainer,
                    {
                      width: CARD_WIDTH - 40,
                      height: CARD_WIDTH + 30,
                    },
                  ]}>
                  <Image
                  source={{uri:item?.url}}
                    // source={item.avatar}
                    style={[
                      styles.avatar,
                      {
                        width: CARD_WIDTH - 40,
                        height: CARD_WIDTH + 30,
                      },
                    ]}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.name}>{item.name}</Text>
                <StarRating rating={item.rating} />
                <Text style={styles.review}>{item.review}</Text>
              </View>
            )}
          />
        </View>

        {/* Right Arrow */}
        {width > 768 && (
          <TouchableOpacity onPress={() => scrollTo('right')}>
            <Feather name="chevron-right" size={30} color={colors.onyxBlack} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 32,
    backgroundColor: '#FAF7EF',
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold,
    fontFamily: fontFamily.serif,
    marginBottom: spacing.md,
  },
  carouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flatlistContainer: {
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing.lg,
    marginHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
  },
  avatarContainer: {
    borderRadius: 200,
    overflow: 'hidden',
    marginBottom: spacing.xs,
    borderWidth: 4,
    borderColor: colors.softGoldBorder,
  },
  avatar: {
    borderRadius: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.serif,
    color: colors.onyxBlack,
    marginTop: spacing.xs,
  },
  review: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.onyxBlack,
    fontFamily: fontFamily.serif,
    lineHeight: 16,
    marginTop: 6,
  },
});


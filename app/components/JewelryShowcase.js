import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');
const CONTAINER_WIDTH = width * 0.7;

const JewelryShowcase = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerContainer}>
        {/* Left big image */}
        <Image
          source={{
            uri: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/18-3-Necklace.jpg',
          }}
          style={styles.leftImage}
        />

        {/* Right content */}
        <View style={styles.rightSection}>
          <Text style={styles.heading}>We Have Everything Which Trendy</Text>
          <Text style={styles.description}>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book.
          </Text>

          <View style={styles.rightImages}>
            <Image
              source={{
                uri: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/18-2-Necklace.jpg',
              }}
              style={styles.rightImage}
            />
            <Image
              source={{
                uri: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/17-2-Necklace.jpg',
              }}
              style={styles.rightImage}
            />
          </View>
        </View>
      </View>

      {/* Bottom horizontal line */}
      <View style={styles.line} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f5ee',
    paddingVertical: 30,
    alignItems: 'center',
  },
  innerContainer: {
    width: CONTAINER_WIDTH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    // borderWidth: 1,
  },
  leftImage: {
    width: CONTAINER_WIDTH * 0.35,
    height: CONTAINER_WIDTH * 0.4,
    borderRadius: 10,
    resizeMode: 'cover',
    // borderWidth: 1,
  },
  rightSection: {
    width: CONTAINER_WIDTH * 0.65,
    marginLeft: 10,
    // borderWidth: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c59d39',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#333',
    marginBottom: 12,
    lineHeight: 18,
  },
  rightImages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    // borderWidth:1,
    width: '100%',
    gap: 10,
  },
  rightImage: {
    width: '50%',
    height: CONTAINER_WIDTH * 0.29,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  line: {
    height: 2,
    backgroundColor: '#000',
    width: CONTAINER_WIDTH * 0.4,
    marginTop: 30,
    borderRadius: 1,
  },
});

export default JewelryShowcase;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import Header from '../components/Header';
import FooterSection from '../components/FooterSection';
import SEO from '../../components/SEO';
import Breadcrumbs from '../../components/Breadcrumbs';

// Blog post data - in a real app, this would come from a database or CMS
const BLOG_POSTS = [
  {
    id: 'emotional-significance-heart-jewelry',
    slug: 'emotional-significance-heart-jewelry',
    title: 'The Emotional Significance of Heart Jewelry: More Than Just a Symbol',
    excerpt: 'Explore the deep emotional connections and personal meanings behind heart-shaped jewelry and why it remains one of the most cherished symbols in the world of accessories.',
    image: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/1-2-Necklace.avif',
    date: '2025-08-12',
    author: 'Rare Collectables Team',
    category: 'Jewelry Insights'
  },
  {
    id: 'heart-crafted-jewelry-guide',
    slug: 'heart-crafted-jewelry-guide',
    title: 'The Ultimate Guide to Heart-Crafted Jewelry',
    excerpt: 'Discover the beauty and symbolism behind heart-crafted jewelry pieces and why they make the perfect gift for your loved ones.',
    image: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/1-2-Necklace.avif',
    date: '2025-08-10',
    author: 'Rare Collectables Team',
    category: 'Jewelry Guide'
  },
  {
    id: 'sustainable-stones-jewelry',
    slug: 'sustainable-stones-jewelry',
    title: 'Sustainable and Conflict-Free Stones: The Ethical Choice',
    excerpt: 'Learn about our commitment to using only sustainable and conflict-free stones in our jewelry collections.',
    image: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/3-1-Necklace.avif',
    date: '2025-08-05',
    author: 'Rare Collectables Team',
    category: 'Sustainability'
  },
  {
    id: 'perfect-jewelry-gifts-women',
    slug: 'perfect-jewelry-gifts-women',
    title: 'Perfect Jewelry Gifts for Every Woman in Your Life',
    excerpt: 'Find the ideal jewelry gift for mothers, sisters, partners, and friends with our curated selection guide.',
    image: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/3-5-Necklace.avif',
    date: '2025-07-28',
    author: 'Rare Collectables Team',
    category: 'Gift Guide'
  }
];

export default function BlogIndex() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [responsiveStyles, setResponsiveStyles] = useState({});

  useEffect(() => {
    setResponsiveStyles(getResponsiveStyles(width));
  }, [width]);

  const getResponsiveStyles = (currentWidth) => {
    // Desktop
    if (currentWidth >= 1024) {
      return {
        container: {
          paddingHorizontal: spacing.xxl,
        },
        blogGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        },
        blogCard: {
          width: 'calc(33.33% - 20px)',
          marginBottom: spacing.xl,
        }
      };
    }
    // Tablet
    else if (currentWidth >= 768) {
      return {
        container: {
          paddingHorizontal: spacing.xl,
        },
        blogGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        },
        blogCard: {
          width: 'calc(50% - 15px)',
          marginBottom: spacing.xl,
        }
      };
    }
    // Mobile
    else {
      return {
        container: {
          paddingHorizontal: spacing.lg,
        },
        blogGrid: {
          flexDirection: 'column',
        },
        blogCard: {
          width: '100%',
          marginBottom: spacing.xl,
        }
      };
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const navigateToBlogPost = (slug) => {
    router.push(`/blog/${slug}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SEO
        title="Jewelry Blog | Heart-Crafted & Sustainable Jewelry"
        description="Explore our blog for insights on heart-crafted jewelry, sustainable and conflict-free stones, and perfect gift ideas for the women in your life."
        image="https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/1-2-Necklace.avif"
        url="https://rarecollectables.co.uk/blog"
        type="website"
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={[styles.container, responsiveStyles.container]}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' }
            ]}
            currentPageLabel="Blog"
          />
          
          <View style={styles.headerContainer}>
            <Text style={styles.pageTitle}>Our Jewelry Blog</Text>
            <Text style={styles.pageSubtitle}>
              Insights, guides, and stories about our heart-crafted jewelry collections,
              sustainable practices, and gift ideas.
            </Text>
          </View>
          
          <View style={[styles.blogGrid, responsiveStyles.blogGrid]}>
            {BLOG_POSTS.map((post) => (
              <Pressable
                key={post.id}
                style={[styles.blogCard, responsiveStyles.blogCard]}
                onPress={() => navigateToBlogPost(post.slug)}
              >
                <Image
                  source={{ uri: post.image }}
                  style={styles.blogImage}
                  resizeMode="cover"
                />
                <View style={styles.blogCardContent}>
                  <Text style={styles.blogCategory}>{post.category}</Text>
                  <Text style={styles.blogTitle}>{post.title}</Text>
                  <Text style={styles.blogExcerpt}>{post.excerpt}</Text>
                  <View style={styles.blogMeta}>
                    <Text style={styles.blogDate}>{formatDate(post.date)}</Text>
                    <Text style={styles.blogAuthor}>{post.author}</Text>
                  </View>
                  <Pressable
                    style={styles.readMoreButton}
                    onPress={() => navigateToBlogPost(post.slug)}
                  >
                    <Text style={styles.readMoreText}>Read More</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
        
        <FooterSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerContainer: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  pageTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.onyxBlack,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 24,
  },
  blogGrid: {
    marginTop: spacing.xl,
  },
  blogCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.softGoldBorder,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  blogImage: {
    width: '100%',
    height: 200,
  },
  blogCardContent: {
    padding: spacing.lg,
  },
  blogCategory: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    color: colors.gold,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  blogTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onyxBlack,
    marginBottom: spacing.sm,
    lineHeight: 28,
  },
  blogExcerpt: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.textGray,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  blogMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  blogDate: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    color: colors.textGray,
  },
  blogAuthor: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    color: colors.textGray,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  readMoreText: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.gold,
    fontWeight: 'bold',
  },
});

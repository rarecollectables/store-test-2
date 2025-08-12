import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import FooterSection from '../components/FooterSection';
import SEO from '../../components/SEO';
import Breadcrumbs from '../../components/Breadcrumbs';
import BlogSEO from '../../components/BlogSEO';

// Blog post data - in a real app, this would come from a database or CMS
const BLOG_POSTS = {
  'heart-crafted-jewelry-guide': {
    title: 'The Ultimate Guide to Heart-Crafted Jewelry',
    excerpt: 'Discover the beauty and symbolism behind heart-crafted jewelry pieces and why they make the perfect gift for your loved ones.',
    image: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/1-2-Necklace.avif',
    date: '2025-08-10',
    author: 'Rare Collectables Team',
    category: 'Jewelry Guide',
    content: `
      <h2>The Timeless Appeal of Heart-Crafted Jewelry</h2>
      <p>Heart-crafted jewelry has been a symbol of love and affection for centuries. At Rare Collectables, we've perfected the art of creating exquisite heart-shaped pieces that capture the essence of emotion and connection.</p>
      
      <p>Our heart-crafted jewelry collection features pendants, earrings, bracelets, and rings that showcase the universal symbol of love in various elegant designs. Each piece is meticulously crafted to ensure that the heart shape is perfectly proportioned and beautifully finished.</p>
      
      <h2>Why Heart-Shaped Jewelry Makes the Perfect Gift</h2>
      <p>Heart-shaped jewelry is more than just a beautiful accessory; it's a meaningful gift that communicates love and appreciation. Whether you're celebrating an anniversary, birthday, Valentine's Day, or simply want to show someone how much they mean to you, a heart-crafted piece from our collection speaks volumes.</p>
      
      <p>The versatility of heart jewelry makes it suitable for recipients of all ages and style preferences. From subtle, minimalist designs to bold statement pieces, there's a heart-crafted item for everyone.</p>
      
      <h2>Our Commitment to Quality and Sustainability</h2>
      <p>At Rare Collectables, we believe that beautiful jewelry shouldn't come at the expense of ethical practices. That's why all our heart-crafted pieces feature conflict-free stones and sustainable materials. We work closely with suppliers who share our commitment to responsible sourcing and fair labor practices.</p>
      
      <p>Each heart-shaped stone in our collection is carefully selected for its clarity, color, and cut. We use only the finest materials to ensure that your jewelry not only looks beautiful but also stands the test of time.</p>
      
      <h2>Caring for Your Heart-Crafted Jewelry</h2>
      <p>To keep your heart-shaped jewelry looking its best, we recommend storing it in a cool, dry place away from direct sunlight. Clean your pieces regularly with a soft cloth and mild soap solution, and avoid exposing them to harsh chemicals or extreme temperatures.</p>
      
      <p>With proper care, your heart-crafted jewelry from Rare Collectables will continue to shine brightly for years to come, serving as a lasting reminder of the love and connection it represents.</p>
    `
  },
  'sustainable-stones-jewelry': {
    title: 'Sustainable and Conflict-Free Stones: The Ethical Choice',
    excerpt: 'Learn about our commitment to using only sustainable and conflict-free stones in our jewelry collections.',
    image: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/3-1-Necklace.avif',
    date: '2025-08-05',
    author: 'Rare Collectables Team',
    category: 'Sustainability',
    content: `
      <h2>Our Commitment to Ethical Sourcing</h2>
      <p>At Rare Collectables, we believe that beautiful jewelry should never come at the cost of ethical compromises. That's why we've made a firm commitment to using only sustainable and conflict-free stones in all our collections.</p>
      
      <p>When you purchase a piece from our collection, you can be confident that it has been created with respect for both people and the planet. We carefully vet all our suppliers and work only with those who share our values of transparency, sustainability, and ethical practices.</p>
      
      <h2>What Makes a Stone Conflict-Free?</h2>
      <p>Conflict-free stones are those that have been sourced through legitimate, ethical channels that do not finance armed conflict or contribute to human rights abuses. Our stones come with certification that verifies their ethical origins, giving you peace of mind about your purchase.</p>
      
      <p>We adhere to the Kimberley Process and other international standards that help prevent the trade of conflict diamonds and other precious stones. By choosing Rare Collectables, you're supporting these important global initiatives.</p>
      
      <h2>Sustainable Practices in Jewelry Making</h2>
      <p>Sustainability extends beyond just the sourcing of stones. At Rare Collectables, we implement eco-friendly practices throughout our production process. This includes using recycled metals where possible, minimizing waste, and reducing our carbon footprint.</p>
      
      <p>Our packaging is also designed with sustainability in mind, using recycled and biodegradable materials that reflect our commitment to environmental stewardship.</p>
      
      <h2>The Beauty of Ethical Choices</h2>
      <p>Choosing sustainable and conflict-free jewelry doesn't mean compromising on beauty or quality. In fact, knowing the ethical story behind your jewelry adds an extra layer of meaning and value to each piece.</p>
      
      <p>Our collections showcase that ethical jewelry can be just as stunning, if not more so, than conventional alternatives. When you wear a piece from Rare Collectables, you're not just adorning yourself with something beautiful—you're making a statement about your values.</p>
    `
  },
  'perfect-jewelry-gifts-women': {
    title: 'Perfect Jewelry Gifts for Every Woman in Your Life',
    excerpt: 'Find the ideal jewelry gift for mothers, sisters, partners, and friends with our curated selection guide.',
    image: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/3-5-Necklace.avif',
    date: '2025-07-28',
    author: 'Rare Collectables Team',
    category: 'Gift Guide',
    content: `
      <h2>Finding the Perfect Jewelry Gift</h2>
      <p>Selecting the right jewelry gift for the women in your life can sometimes feel overwhelming. With so many options available, how do you choose something that truly reflects their personality and style? At Rare Collectables, we've created this guide to help you find the perfect piece for every occasion and recipient.</p>
      
      <h2>For Mothers: Timeless Elegance</h2>
      <p>Mothers often appreciate jewelry that symbolizes family bonds and lasting love. Consider our heart-shaped pendant necklaces that can be personalized with birthstones representing children or grandchildren. Alternatively, our elegant bracelet collections offer sophisticated pieces that complement any outfit, making them perfect for daily wear.</p>
      
      <p>For a truly special gift, our limited-edition mother's collection features unique designs that celebrate the irreplaceable role mothers play in our lives.</p>
      
      <h2>For Partners: Romantic Expressions</h2>
      <p>When choosing jewelry for a romantic partner, consider pieces that symbolize your unique connection. Our heart-crafted jewelry collection offers beautiful options that express love without being cliché. From subtle heart-shaped earrings to statement pendant necklaces, these pieces communicate your feelings in a tangible form.</p>
      
      <p>For anniversaries or other significant milestones, consider our premium collections featuring ethically sourced gemstones that add color and meaning to your gift.</p>
      
      <h2>For Sisters and Friends: Trendy and Personal</h2>
      <p>Sisters and close friends often share special bonds that can be celebrated through thoughtfully chosen jewelry. Our friendship collections include matching pieces that can be shared, as well as individual items that reflect shared memories or inside jokes.</p>
      
      <p>Consider our adjustable bracelets or versatile necklaces that can be styled in multiple ways to suit different tastes and occasions.</p>
      
      <h2>The Gift of Sustainable Luxury</h2>
      <p>Regardless of who you're shopping for, all women appreciate knowing that their beautiful jewelry hasn't come at an ethical cost. By choosing Rare Collectables, you're giving not just a beautiful accessory, but also the gift of conscious consumption.</p>
      
      <p>Our conflict-free stones and sustainable practices ensure that your gift will be treasured not just for its beauty, but also for the values it represents.</p>
    `
  }
};

export default function BlogPost() {
  const { slug } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [responsiveStyles, setResponsiveStyles] = useState({});
  const post = BLOG_POSTS[slug] || null;

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
        content: {
          maxWidth: 800,
          marginHorizontal: 'auto',
        }
      };
    }
    // Tablet
    else if (currentWidth >= 768) {
      return {
        container: {
          paddingHorizontal: spacing.xl,
        },
        content: {
          maxWidth: 700,
          marginHorizontal: 'auto',
        }
      };
    }
    // Mobile
    else {
      return {
        container: {
          paddingHorizontal: spacing.lg,
        },
        content: {
          width: '100%',
        }
      };
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // If post not found
  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView style={styles.scrollView}>
          <View style={[styles.container, responsiveStyles.container]}>
            <Text style={styles.notFoundText}>Blog post not found</Text>
          </View>
          <FooterSection />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Create structured data for the blog post
  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.image,
    "datePublished": post.date,
    "author": {
      "@type": "Organization",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Rare Collectables",
      "logo": {
        "@type": "ImageObject",
        "url": "https://rarecollectables.co.uk/logo.png"
      }
    },
    "description": post.excerpt
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SEO
        title={`${post.title} | Rare Collectables Blog`}
        description={post.excerpt}
        image={post.image}
        url={`https://rarecollectables.co.uk/blog/${slug}`}
        type="article"
        structuredData={blogStructuredData}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={[styles.container, responsiveStyles.container]}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/blog' }
            ]}
            currentPageLabel={post.title}
          />
          
          <View style={[styles.content, responsiveStyles.content]}>
            <Text style={styles.category}>{post.category}</Text>
            <Text style={styles.title}>{post.title}</Text>
            
            <View style={styles.meta}>
              <Text style={styles.date}>{formatDate(post.date)}</Text>
              <Text style={styles.author}>By {post.author}</Text>
            </View>
            
            <Image
              source={{ uri: post.image }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            
            <View style={styles.blogContent}>
              {/* In a real app, you would use a HTML renderer like react-native-render-html */}
              {/* For simplicity, we're just showing the raw HTML content */}
              <Text style={styles.contentText}>
                {post.content.replace(/<[^>]*>/g, '')}
              </Text>
            </View>
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
  notFoundText: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onyxBlack,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  content: {
    marginTop: spacing.lg,
  },
  category: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.gold,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.onyxBlack,
    marginBottom: spacing.md,
    lineHeight: 40,
  },
  meta: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  date: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.textGray,
    marginRight: spacing.md,
  },
  author: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.textGray,
  },
  featuredImage: {
    width: '100%',
    height: 400,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  blogContent: {
    marginBottom: spacing.xxl,
  },
  contentText: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 26,
  },
});

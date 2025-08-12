import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import FooterSection from '../components/FooterSection';
import SEO from '../../components/SEO';
import Breadcrumbs from '../../components/Breadcrumbs';

export default function EmotionalSignificanceHeartJewelry() {
  const { width } = useWindowDimensions();
  const [responsiveStyles, setResponsiveStyles] = useState({});
  
  // Current date in ISO format for SEO
  const currentDate = new Date().toISOString().split('T')[0];

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

  // Blog post data
  const post = {
    title: "The Emotional Significance of Heart Jewelry: More Than Just a Symbol",
    excerpt: "Explore the deep emotional connections and personal meanings behind heart-shaped jewelry and why it remains one of the most cherished symbols in the world of accessories.",
    image: "https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/1-2-Necklace.avif",
    date: currentDate,
    author: "Rare Collectables Team",
    category: "Jewelry Insights"
  };

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
    "description": post.excerpt,
    "keywords": [
      "heart jewelry", 
      "emotional significance", 
      "heart-shaped jewelry", 
      "jewelry symbolism",
      "sustainable jewelry",
      "gift jewelry"
    ]
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SEO
        title={`${post.title} | Rare Collectables Blog`}
        description={post.excerpt}
        image={post.image}
        url="https://rarecollectables.co.uk/blog/emotional-significance-heart-jewelry"
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
              <Text style={styles.date}>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              <Text style={styles.author}>By {post.author}</Text>
            </View>
            
            <Image
              source={{ uri: post.image }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            
            <View style={styles.blogContent}>
              <Text style={styles.paragraph}>
                The heart shape is perhaps one of the most universally recognized symbols in human history. From ancient cave drawings to modern digital emojis, the heart has transcended time and culture to become the ultimate representation of love, affection, and emotional connection. When this powerful symbol is crafted into jewelry, it takes on an even deeper significance—becoming not just an accessory, but a tangible expression of our most profound emotions.
              </Text>
              
              <Text style={styles.heading}>A Symbol with Ancient Roots</Text>
              <Text style={styles.paragraph}>
                While we might think of heart jewelry as a relatively modern concept, the heart as a symbol has been used in adornment for thousands of years. Archaeological discoveries have revealed heart-shaped decorative items dating back to ancient civilizations. However, it wasn't until the Middle Ages that heart-shaped jewelry began to gain popularity in Europe, often exchanged as tokens of affection between lovers or worn as symbols of devotion.
              </Text>
              
              <Text style={styles.heading}>Beyond Romantic Love</Text>
              <Text style={styles.paragraph}>
                Though heart jewelry is often associated with romantic relationships, its significance extends far beyond this single dimension. Heart-crafted pieces can symbolize:
              </Text>
              
              <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointBold}>Family bonds:</Text> Heart jewelry is often exchanged between parents and children, siblings, or extended family members to represent the unbreakable connections of kinship.</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointBold}>Self-love:</Text> Many people choose heart jewelry as a reminder to prioritize their own emotional wellbeing and practice self-compassion.</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointBold}>Friendship:</Text> Heart-shaped accessories can symbolize the deep platonic love between friends who support each other through life's journey.</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointBold}>Memorial:</Text> Heart jewelry can serve as a touching tribute to loved ones who have passed, keeping their memory close to our hearts in a literal sense.</Text>
              
              <Text style={styles.heading}>The Personal Touch: Customization and Meaning</Text>
              <Text style={styles.paragraph}>
                What makes heart jewelry particularly special is its ability to be personalized. From engraved messages to birthstones representing loved ones, heart-crafted pieces can be customized to tell your unique story. This personalization transforms a beautiful accessory into a deeply meaningful keepsake that carries emotional significance for both the giver and receiver.
              </Text>
              
              <Text style={styles.paragraph}>
                At Rare Collectables, our heart-crafted jewelry collection features pieces that can be customized with sustainable, conflict-free stones—allowing you to express your values alongside your emotions. Each stone is carefully selected not just for its beauty, but for its ethical sourcing, ensuring that your expression of love doesn't come at a cost to others or the environment.
              </Text>
              
              <Text style={styles.heading}>The Psychology of Giving Heart Jewelry</Text>
              <Text style={styles.paragraph}>
                The act of giving heart jewelry carries its own psychological significance. When we present someone with a heart-shaped piece, we're often communicating emotions that might be difficult to express in words. It's a tangible representation of abstract feelings—a way of saying "you are in my heart" without speaking a word.
              </Text>
              
              <Text style={styles.paragraph}>
                Research in gift-giving psychology suggests that presents with symbolic meaning create stronger emotional connections than purely practical gifts. Heart jewelry, with its rich symbolism, creates a powerful emotional association that can strengthen bonds between people and create lasting memories.
              </Text>
              
              <Text style={styles.heading}>Sustainable Heart Jewelry: Love for People and Planet</Text>
              <Text style={styles.paragraph}>
                In today's conscious consumer landscape, the emotional significance of heart jewelry extends to how it's made. Knowing that your symbol of love hasn't caused harm to communities or the environment adds another layer of meaning to these special pieces.
              </Text>
              
              <Text style={styles.paragraph}>
                Our collection at Rare Collectables features heart-crafted jewelry made with sustainable practices and conflict-free stones. This commitment ensures that when you give the gift of heart jewelry, you're sharing not just personal love but a broader care for our global community and planet.
              </Text>
              
              <Text style={styles.heading}>Finding the Perfect Heart Piece</Text>
              <Text style={styles.paragraph}>
                Whether you're selecting heart jewelry for yourself or as a gift, consider these factors to find a piece with true emotional resonance:
              </Text>
              
              <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointBold}>Personal style:</Text> Choose a piece that reflects the wearer's aesthetic preferences—whether that's minimalist, vintage-inspired, or bold and contemporary.</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointBold}>Wearability:</Text> The most meaningful jewelry is worn regularly, so select something appropriate for the recipient's lifestyle.</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointBold}>Quality:</Text> A piece that's meant to carry emotional significance should be crafted to last, becoming an heirloom that can be passed down through generations.</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointBold}>Ethical sourcing:</Text> Choose heart jewelry made with sustainable materials and conflict-free stones to ensure your symbol of love has a positive impact.</Text>
              
              <Text style={styles.conclusion}>
                Heart-crafted jewelry is more than just an accessory—it's a powerful emotional talisman that connects us to our loved ones and to ourselves. When you choose a heart-shaped piece from our collection at Rare Collectables, you're not just selecting beautiful jewelry; you're creating a lasting symbol of the connections that matter most in life.
              </Text>
              
              <Text style={styles.callToAction}>
                Explore our collection of heart-crafted jewelry featuring sustainable, conflict-free stones, and find the perfect piece to express your most heartfelt emotions.
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
  paragraph: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  heading: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onyxBlack,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  bulletPoint: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 26,
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
  },
  bulletPointBold: {
    fontWeight: 'bold',
  },
  conclusion: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 26,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  callToAction: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    color: colors.gold,
    lineHeight: 28,
    marginTop: spacing.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.softGoldBorder,
  },
});

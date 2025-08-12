/**
 * Fuzzy search utility for finding products with related terms
 * Implements multiple search strategies to find products even when search terms don't exactly match
 */

/**
 * Calculate Levenshtein distance between two strings
 * This measures how many single-character edits are needed to change one string into another
 */
export function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  return track[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 * 1 means identical, 0 means completely different
 */
export function stringSimilarity(str1, str2) {
  if (!str1.length && !str2.length) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / Math.max(str1.length, str2.length);
}

/**
 * Break a string into tokens/words
 */
export function tokenize(str) {
  return str.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)             // Split on whitespace
    .filter(Boolean);         // Remove empty strings
}

/**
 * Get common words to exclude from search relevance calculations
 */
export function getStopWords() {
  return new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'for', 'nor', 'on', 'at', 'to', 'by',
    'from', 'in', 'out', 'with', 'about', 'of', 'this', 'that', 'these', 'those',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could',
    'may', 'might', 'must', 'it', 'its', 'it\'s', 'they', 'them', 'their',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how'
  ]);
}

/**
 * Calculate relevance score between search query and text
 * Uses multiple strategies:
 * 1. Exact match (highest score)
 * 2. Contains all words (high score)
 * 3. Contains some words (medium score)
 * 4. Fuzzy match on individual words (lower score)
 */
export function calculateRelevance(searchQuery, text) {
  if (!searchQuery || !text) return 0;
  
  const query = searchQuery.toLowerCase();
  const targetText = text.toLowerCase();
  
  // Strategy 1: Exact match (highest score)
  if (targetText.includes(query)) {
    return 1;
  }
  
  const queryTokens = tokenize(query);
  const textTokens = tokenize(targetText);
  const stopWords = getStopWords();
  
  // Filter out stop words for more meaningful comparison
  const filteredQueryTokens = queryTokens.filter(token => !stopWords.has(token));
  
  // If all tokens are stop words, revert to original tokens
  const effectiveQueryTokens = filteredQueryTokens.length ? filteredQueryTokens : queryTokens;
  
  // Strategy 2: Contains all words in any order (high score)
  // This is critical for multi-word queries like "Gold Heart" matching "18K Gold Plated Heart Pendant"
  const allWordsPresent = effectiveQueryTokens.every(queryToken => 
    targetText.includes(queryToken)
  );
  
  if (allWordsPresent) {
    // Calculate how close the words are to each other in the target text
    // Higher score if words appear closer together
    const positions = effectiveQueryTokens.map(token => targetText.indexOf(token));
    const validPositions = positions.filter(pos => pos !== -1);
    
    if (validPositions.length >= 2) {
      const minPos = Math.min(...validPositions);
      const maxPos = Math.max(...validPositions);
      const distance = maxPos - minPos;
      const textLength = targetText.length;
      
      // Score higher if words are closer together (relative to text length)
      const proximityFactor = 1 - Math.min(distance / textLength, 0.5);
      return 0.85 + (proximityFactor * 0.15); // Score between 0.85 and 1.0
    }
    
    return 0.9; // Default high score if all words are present
  }
  
  // Strategy 3: Contains some words (medium score)
  const matchingTokens = effectiveQueryTokens.filter(queryToken => 
    targetText.includes(queryToken)
  );
  
  if (matchingTokens.length > 0) {
    return 0.7 * (matchingTokens.length / effectiveQueryTokens.length);
  }
  
  // Strategy 4: Fuzzy match on individual words (lower score)
  let maxSimilarity = 0;
  
  // For each query token, find the best matching text token
  for (const queryToken of effectiveQueryTokens) {
    let bestTokenSimilarity = 0;
    
    for (const textToken of textTokens) {
      const similarity = stringSimilarity(queryToken, textToken);
      bestTokenSimilarity = Math.max(bestTokenSimilarity, similarity);
    }
    
    maxSimilarity += bestTokenSimilarity;
  }
  
  // Average the similarities and scale to a maximum of 0.5
  return effectiveQueryTokens.length ? (maxSimilarity / effectiveQueryTokens.length) * 0.5 : 0;
}

/**
 * Generate alternative search terms for better matching
 * @param {string} query - The original search query
 * @returns {string[]} - Array of alternative search terms
 */
export function generateAlternativeTerms(query) {
  if (!query) return [];
  
  const terms = [query.toLowerCase()];
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
  // For multi-word queries, add individual words as alternatives
  if (words.length > 1) {
    words.forEach(word => {
      if (!terms.includes(word)) {
        terms.push(word);
      }
    });
    
    // Add permutations of the words for better matching
    if (words.length <= 3) { // Limit permutations to avoid explosion
      const permutations = generatePermutations(words);
      permutations.forEach(perm => {
        const permStr = perm.join(' ');
        if (!terms.includes(permStr)) {
          terms.push(permStr);
        }
      });
    }
  }
  
  return terms;
}

/**
 * Generate permutations of words
 * @param {string[]} words - Array of words
 * @returns {string[][]} - Array of word permutations
 */
function generatePermutations(words) {
  if (words.length <= 1) return [words];
  
  const result = [];
  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const remaining = [...words.slice(0, i), ...words.slice(i + 1)];
    const permutations = generatePermutations(remaining);
    
    for (const perm of permutations) {
      result.push([current, ...perm]);
    }
  }
  
  return result;
}

/**
 * Calculate token set ratio between two sets of tokens
 * @param {string[]} tokens1 - First set of tokens
 * @param {string[]} tokens2 - Second set of tokens
 * @returns {number} - Token set ratio (0-1)
 */
function tokenSetRatio(tokens1, tokens2) {
  const intersection = tokens1.filter(token => tokens2.includes(token));
  const union = [...new Set([...tokens1, ...tokens2])];
  
  return intersection.length / union.length;
}

/**
 * Calculate relevance score between search query and text using token set ratio
 * @param {string} searchQuery - The original search query
 * @param {string} text - The text to search
 * @returns {number} - Relevance score (0-1)
 */
export function calculateRelevanceTokenSetRatio(searchQuery, text) {
  if (!searchQuery || !text) return 0;
  
  const queryTokens = tokenize(searchQuery);
  const textTokens = tokenize(text);
  
  return tokenSetRatio(queryTokens, textTokens);
}


/**
 * Generate alternative search terms based on common jewelry-related word variations
 */
export function generateAlternativeTermsJewelry(query) {
  const alternatives = [query];
  const lowerQuery = query.toLowerCase();
  
  // Common jewelry term variations
  const variations = {
    'necklace': ['pendant', 'chain', 'choker', 'collar'],
    'pendant': ['necklace', 'charm'],
    'earring': ['stud', 'hoop', 'drop', 'dangle'],
    'bracelet': ['bangle', 'cuff', 'chain'],
    'ring': ['band', 'signet'],
    'gold': ['golden', 'yellow gold', 'rose gold', 'white gold', 'plated'],
    'silver': ['sterling', 'sterling silver'],
    'diamond': ['diamonds', 'brilliant', 'solitaire'],
    'ruby': ['red stone', 'red gem'],
    'sapphire': ['blue stone', 'blue gem'],
    'emerald': ['green stone', 'green gem'],
    'pearl': ['pearls', 'cultured pearl'],
    'heart': ['love', 'romantic', 'valentine', 'heart-shaped', 'hearts'],
    'gift': ['present', 'surprise'],
    'women': ['woman', 'lady', 'ladies', 'female', 'her'],
    'jewellery': ['jewelry', 'jewel', 'jewels'],
    'stone': ['gem', 'gemstone', 'crystal'],
    'sustainable': ['eco-friendly', 'ethical', 'responsible'],
    'conflict-free': ['ethical', 'fair trade', 'responsible'],
    'handmade': ['handcrafted', 'artisan', 'hand-crafted', 'hand crafted'],
    'set': ['collection', 'suite', 'ensemble', 'pair']
  };
  
  // Check if any words in the search query have variations
  Object.keys(variations).forEach(term => {
    if (lowerQuery.includes(term)) {
      // Add variations of this term
      variations[term].forEach(variant => {
        const newQuery = lowerQuery.replace(term, variant);
        alternatives.push(newQuery);
      });
    }
  });
  
  // Handle plural/singular variations
  if (lowerQuery.endsWith('s')) {
    alternatives.push(lowerQuery.slice(0, -1)); // Remove trailing 's'
  } else {
    alternatives.push(`${lowerQuery}s`); // Add trailing 's'
  }
  
  // For multi-word queries, add word order variations
  const words = lowerQuery.split(/\s+/);
  if (words.length > 1) {
    // Add reverse order for two-word queries
    if (words.length === 2) {
      alternatives.push(`${words[1]} ${words[0]}`);
    }
    
    // Add each word individually for broader matching
    words.forEach(word => {
      if (word.length > 2) { // Only add meaningful words (longer than 2 chars)
        alternatives.push(word);
      }
    });
  }
  
  return [...new Set(alternatives)]; // Remove duplicates
}
/**
 * Calculate token overlap between query and text
 * @param {string} query - Search query
 * @param {string} text - Text to search
 * @returns {object} - Overlap metrics
 */
function calculateTokenOverlap(query, text) {
  const queryTokens = tokenize(query);
  const textTokens = tokenize(text);
  
  if (queryTokens.length === 0 || textTokens.length === 0) {
    return { overlap: 0, queryRatio: 0, textRatio: 0, sequence: false };
  }
  
  // Count matching tokens
  const matches = queryTokens.filter(token => textTokens.includes(token));
  const overlap = matches.length;
  
  // Calculate ratios
  const queryRatio = overlap / queryTokens.length;
  const textRatio = overlap / textTokens.length;
  
  // Check if tokens appear in sequence
  let sequence = false;
  if (overlap > 1) {
    // Check if the matched tokens appear in the same sequence in the text
    let lastIndex = -1;
    let inSequence = true;
    
    for (const token of queryTokens) {
      if (!textTokens.includes(token)) continue;
      
      const tokenIndex = textTokens.indexOf(token, lastIndex > -1 ? lastIndex + 1 : 0);
      if (tokenIndex === -1 || (lastIndex > -1 && tokenIndex <= lastIndex)) {
        inSequence = false;
        break;
      }
      lastIndex = tokenIndex;
    }
    
    sequence = inSequence;
  }
  
  return { overlap, queryRatio, textRatio, sequence };
}

/**
 * Perform advanced search on products
 * @param {Array} products - Array of products to search
 * @param {string} query - Search query
 * @param {number} threshold - Minimum score threshold (0-1)
 * @returns {Array} - Filtered and sorted products by relevance
 */
export function fuzzySearchProducts(products, query, threshold = 0.2) {
  if (!query) return products;
  
  console.log(`Searching for "${query}" with threshold ${threshold}`);
  
  // Score each product based on token overlap and other metrics
  const scoredProducts = products.map(product => {
    const nameText = product.name || '';
    const descriptionText = product.description || '';
    const categoryText = product.category || '';
    
    // Calculate token overlap metrics for name, description, and category
    const nameOverlap = calculateTokenOverlap(query, nameText);
    const descOverlap = calculateTokenOverlap(query, descriptionText);
    const catOverlap = calculateTokenOverlap(query, categoryText);
    
    // Calculate base score from token overlap
    let score = 0;
    let matchReason = '';
    
    // Debug logging
    console.log(`Product: "${nameText}"`);
    console.log(`- Name overlap: ${nameOverlap.overlap}, ratio: ${nameOverlap.queryRatio.toFixed(2)}, sequence: ${nameOverlap.sequence}`);
    
    // Exact match (all query tokens in name)
    if (nameOverlap.queryRatio === 1) {
      // Perfect match if all tokens match and they make up most of the name
      if (nameOverlap.textRatio > 0.8) {
        score = 0.99; // Almost perfect match
        matchReason = 'exact-match';
      } 
      // Strong match if all query tokens match but there are other tokens in the name
      else {
        score = 0.9;
        matchReason = 'all-tokens-in-name';
      }
      
      // Bonus for tokens appearing in sequence
      if (nameOverlap.sequence) {
        score += 0.05;
        matchReason += '-in-sequence';
      }
    }
    // Partial match (some query tokens in name)
    else if (nameOverlap.overlap > 0) {
      // Base score depends on how many query tokens match
      score = 0.5 + (nameOverlap.queryRatio * 0.4);
      matchReason = 'partial-name-match';
      
      // Bonus for tokens appearing in sequence
      if (nameOverlap.sequence) {
        score += 0.05;
        matchReason += '-in-sequence';
      }
    }
    
    // Check if description has better match
    if (descOverlap.queryRatio > nameOverlap.queryRatio) {
      const descScore = 0.4 + (descOverlap.queryRatio * 0.4);
      if (descScore > score) {
        score = descScore;
        matchReason = 'description-match';
        
        // Bonus for tokens appearing in sequence
        if (descOverlap.sequence) {
          score += 0.05;
          matchReason += '-in-sequence';
        }
      }
    }
    
    // Check if category has better match
    if (catOverlap.queryRatio > 0) {
      const catScore = 0.4 + (catOverlap.queryRatio * 0.3);
      if (catScore > score) {
        score = catScore;
        matchReason = 'category-match';
      }
    }
    
    // Special case for "Rose Gold" in product name when searching for "Gold"
    if (query.toLowerCase().includes('gold') && 
        nameText.toLowerCase().includes('rose gold')) {
      score = Math.max(score, 0.85);
      matchReason = 'gold-variant-match';
    }
    
    // Special case for "Heart" variations
    if (query.toLowerCase().includes('heart') && 
        (nameText.toLowerCase().includes('heart shaped') || 
         nameText.toLowerCase().includes('heart-shaped') || 
         nameText.toLowerCase().includes('heart pendant'))) {
      score = Math.max(score, 0.85);
      matchReason = 'heart-variant-match';
    }
    
    // Special case for "Pendant" variations
    if (query.toLowerCase().includes('pendant') && 
        (nameText.toLowerCase().includes('necklace') && 
         nameText.toLowerCase().includes('pendant'))) {
      score = Math.max(score, 0.85);
      matchReason = 'pendant-variant-match';
    }
    
    // Special case for "Gold Heart Pendant" query
    if (query.toLowerCase().includes('gold') && 
        query.toLowerCase().includes('heart') && 
        query.toLowerCase().includes('pendant')) {
      // Check if product name has all three terms
      const hasGold = nameText.toLowerCase().includes('gold');
      const hasHeart = nameText.toLowerCase().includes('heart');
      const hasPendant = nameText.toLowerCase().includes('pendant') || 
                         nameText.toLowerCase().includes('necklace');
      
      if (hasGold && hasHeart && hasPendant) {
        score = Math.max(score, 0.95); // Very high score
        matchReason = 'gold-heart-pendant-match';
      }
      else if ((hasGold && hasHeart) || (hasGold && hasPendant) || (hasHeart && hasPendant)) {
        score = Math.max(score, 0.8); // High score for 2/3 terms
        matchReason = 'partial-gold-heart-pendant-match';
      }
    }
    
    console.log(`- Final score: ${score.toFixed(2)}, reason: ${matchReason}`);
    
    return {
      ...product,
      relevanceScore: score,
      matchReason: matchReason
    };
  });
  
  // Debug log for top matches
  const topMatches = scoredProducts
    .filter(p => p.relevanceScore >= threshold)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
  
  console.log('Top matches:', topMatches.map(p => ({
    name: p.name,
    score: p.relevanceScore.toFixed(2),
    reason: p.matchReason
  })));
  
  // Filter by threshold and sort by relevance
  return scoredProducts
    .filter(product => product.relevanceScore >= threshold)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

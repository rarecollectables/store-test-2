const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase configuration is missing.');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your environment.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixCategoryTypos() {
  try {
    console.log('🔍 Checking for category typos...\n');

    // First, let's see what we have
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, category')
      .or('category.eq.Neklaces,category.eq.RIngs');

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      process.exit(1);
    }

    console.log(`Found ${products.length} products with typos:\n`);

    // Group by category
    const neklaces = products.filter(p => p.category === 'Neklaces');
    const rings = products.filter(p => p.category === 'RIngs');

    if (neklaces.length > 0) {
      console.log(`📿 ${neklaces.length} products with "Neklaces" (should be "Necklaces"):`);
      neklaces.forEach(p => console.log(`   - ${p.id}: ${p.name}`));
      console.log('');
    }

    if (rings.length > 0) {
      console.log(`💍 ${rings.length} products with "RIngs" (should be "Rings"):`);
      rings.forEach(p => console.log(`   - ${p.id}: ${p.name}`));
      console.log('');
    }

    if (products.length === 0) {
      console.log('✅ No typos found! All categories are correct.');
      return;
    }

    // Fix Neklaces -> Necklaces
    if (neklaces.length > 0) {
      console.log('🔧 Fixing "Neklaces" -> "Necklaces"...');
      const { error: necklacesError } = await supabase
        .from('products')
        .update({ category: 'Necklaces' })
        .eq('category', 'Neklaces');

      if (necklacesError) {
        console.error('Error updating Neklaces:', necklacesError);
      } else {
        console.log(`✅ Updated ${neklaces.length} products from "Neklaces" to "Necklaces"\n`);
      }
    }

    // Fix RIngs -> Rings
    if (rings.length > 0) {
      console.log('🔧 Fixing "RIngs" -> "Rings"...');
      const { error: ringsError } = await supabase
        .from('products')
        .update({ category: 'Rings' })
        .eq('category', 'RIngs');

      if (ringsError) {
        console.error('Error updating RIngs:', ringsError);
      } else {
        console.log(`✅ Updated ${rings.length} products from "RIngs" to "Rings"\n`);
      }
    }

    // Verify the fix
    console.log('🔍 Verifying fixes...');
    const { data: remainingTypos, error: verifyError } = await supabase
      .from('products')
      .select('id, category')
      .or('category.eq.Neklaces,category.eq.RIngs');

    if (verifyError) {
      console.error('Error verifying:', verifyError);
    } else if (remainingTypos.length === 0) {
      console.log('✅ All category typos have been fixed successfully!\n');
      
      // Show current category distribution
      const { data: allProducts } = await supabase
        .from('products')
        .select('category');
      
      const categoryCounts = allProducts.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {});

      console.log('📊 Current category distribution:');
      Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`   ${category}: ${count} products`);
        });
    } else {
      console.log(`⚠️  Warning: ${remainingTypos.length} products still have typos`);
    }

  } catch (error) {
    console.error('Error fixing category typos:', error);
    process.exit(1);
  }
}

// Run the fix
fixCategoryTypos();

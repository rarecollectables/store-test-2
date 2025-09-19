// lib/supabase/products.js
// Utility for fetching products from Supabase
import { supabase } from './client';

/**
 * Fetch shipping labels for a list of product IDs from the Supabase products table.
 * @param {string[]} productIds - Array of product IDs
 * @returns {Promise<Array<{id: string, shipping_label: string | null}>>}
 */
export async function fetchProductsShipping(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  const { data, error } = await supabase
    .from('products')
    .select('id, shipping_label')
    .in('id', productIds);
  if (error) throw error;
  return data;
}

/**
 * Fetch a single product by ID from the database
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product data
 */
export async function fetchProductById(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  
  if (error) {
    console.error('Failed to fetch product:', error);
    throw new Error('Product not found');
  }
  
  return data;
}

/**
 * Image Service
 * 
 * Handles image uploads to Supabase Storage with base64 fallback
 */

import { supabase } from '../config/supabase';

const STORAGE_BUCKET = 'book-covers';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} bookId - Optional book ID for naming (or 'temp' for new books)
 * @returns {Promise<{url: string|null, error: object|null}>}
 */
export const uploadImageToStorage = async (file, bookId = 'temp') => {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      return { url: null, error: { message: 'File must be an image' } };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { url: null, error: { message: 'Image size must be less than 5MB' } };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${bookId}-${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image to storage:', error);
      return { url: null, error };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error in uploadImageToStorage:', error);
    return { url: null, error };
  }
};

/**
 * Delete image from Supabase Storage
 * @param {string} imageUrl - The image URL to delete
 * @returns {Promise<{success: boolean, error: object|null}>}
 */
export const deleteImageFromStorage = async (imageUrl) => {
  try {
    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/book-covers/filename.jpg
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (!fileName || fileName.includes('data:') || fileName.includes('placeholder')) {
      // Not a storage URL, nothing to delete
      return { success: true, error: null };
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting image from storage:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in deleteImageFromStorage:', error);
    return { success: false, error };
  }
};

/**
 * Convert file to base64 data URL (fallback)
 * @param {File} file - The image file
 * @returns {Promise<{dataUrl: string|null, error: object|null}>}
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ dataUrl: reader.result, error: null });
    };
    reader.onerror = () => {
      resolve({ dataUrl: null, error: { message: 'Error reading file' } });
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Upload image with fallback to base64
 * @param {File} file - The image file to upload
 * @param {string} bookId - Optional book ID for naming
 * @returns {Promise<{url: string|null, isBase64: boolean, error: object|null}>}
 */
export const uploadImageWithFallback = async (file, bookId = 'temp') => {
  // Try Supabase Storage first
  const storageResult = await uploadImageToStorage(file, bookId);
  
  if (storageResult.url && !storageResult.error) {
    return {
      url: storageResult.url,
      isBase64: false,
      error: null
    };
  }

  // Fallback to base64 if storage fails
  console.warn('Storage upload failed, falling back to base64:', storageResult.error);
  const base64Result = await fileToBase64(file);
  
  if (base64Result.dataUrl) {
    return {
      url: base64Result.dataUrl,
      isBase64: true,
      error: null
    };
  }

  return {
    url: null,
    isBase64: false,
    error: base64Result.error || storageResult.error
  };
};


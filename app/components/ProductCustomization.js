import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../theme';

// Tag-to-field mapping for customization
const TAG_TO_FIELD_MAP = {
  'Text on Bracelet Top': { key: 'braceletTop', label: 'Text on Bracelet Top' },
  'Text on Bracelet Bottom': { key: 'braceletBottom', label: 'Text on Bracelet Bottom' },
  'Text on Pendant Front': { key: 'pendantFront', label: 'Text on Pendant Front' },
  'Text on Pendant Back': { key: 'pendantBack', label: 'Text on Pendant Back' },
  'Text on Ring': { key: 'ringText', label: 'Text on Ring' },
  'Text on Right Cufflink': { key: 'rightCufflink', label: 'Text on Right Cufflink' },
  'Text on Left Cufflink': { key: 'leftCufflink', label: 'Text on Left Cufflink' },
  'Text on Right Earring': { key: 'rightEarring', label: 'Text on Right Earring' },
  'Text on Left Earring': { key: 'leftEarring', label: 'Text on Left Earring' },
};

// Font options for customization
const FONT_OPTIONS = [
  { value: '1', label: 'Font 1 - Classic Script' },
  { value: '2', label: 'Font 2 - Modern Sans' },
  { value: '3', label: 'Font 3 - Elegant Serif' },
  { value: '4', label: 'Font 4 - Bold Block' },
  { value: '5', label: 'Font 5 - Cursive Flow' },
  { value: '6', label: 'Font 6 - Vintage Style' },
  { value: '7', label: 'Font 7 - Minimalist' },
  { value: '8', label: 'Font 8 - Decorative' },
];

export default function ProductCustomization({ 
  product, 
  customization, 
  onCustomizationChange,
  style 
}) {
  const [errors, setErrors] = useState({});

  // Determine which fields to show based on product tags
  const getCustomizationFields = () => {
    if (!product || !product.tags) return [];

    // Check if product is customizable by looking for 'personalised' tag
    const isCustomizable = product.tags.includes('personalised');
    
    if (!isCustomizable) return [];

    // Find all customization tags and create fields
    const customizationFields = [];
    
    Object.keys(TAG_TO_FIELD_MAP).forEach(tagName => {
      if (product.tags.includes(tagName)) {
        const fieldConfig = TAG_TO_FIELD_MAP[tagName];
        customizationFields.push({
          key: fieldConfig.key,
          label: fieldConfig.label,
          maxLength: 12, // All fields have 12 character limit
          placeholder: 'Up to 12 characters'
        });
      }
    });

    return customizationFields;
  };

  // Check if product has 'want note' tag
  const hasWantNote = product?.tags?.includes('want note');

  const fields = getCustomizationFields();

  // Don't render if no customization fields and no want note
  if (fields.length === 0 && !hasWantNote) return null;

  const handleChange = (key, value, maxLength) => {
    // Enforce character limit
    if (value.length > maxLength) {
      setErrors({
        ...errors,
        [key]: `Maximum ${maxLength} characters allowed`
      });
      return;
    }

    // Clear error for this field
    setErrors({
      ...errors,
      [key]: null
    });

    // Update customization
    onCustomizationChange({
      ...customization,
      [key]: value
    });
  };

  const handleFontChange = (fontValue) => {
    onCustomizationChange({
      ...customization,
      selectedFont: fontValue
    });
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Personalization</Text>
        <Text style={styles.subtitle}>Add custom text to make it uniquely yours</Text>
      </View>

      {/* Font Selection - Full Width */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Font Style</Text>
        <View style={styles.dropdownWrapper}>
          <select
            value={customization.selectedFont || '1'}
            onChange={(e) => handleFontChange(e.target.value)}
            style={styles.dropdown}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </View>
        <Text style={styles.fontNote}>
          📄 Refer to font reference document for visual examples
        </Text>
      </View>

      {/* Text Fields - 2 Column Layout on Desktop */}
      <View style={styles.fieldsGrid}>
        {fields.map((field) => (
          <View key={field.key} style={styles.gridItem}>
            <Text style={styles.label}>{field.label}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={customization[field.key] || ''}
                onChangeText={(text) => handleChange(field.key, text, field.maxLength)}
                placeholder={field.placeholder}
                placeholderTextColor="#999"
                maxLength={field.maxLength}
              />
              <Text style={styles.charCount}>
                {customization[field.key]?.length || 0}/{field.maxLength}
              </Text>
            </View>
            {errors[field.key] && (
              <Text style={styles.error}>{errors[field.key]}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Want Note Field */}
      {hasWantNote && (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Add Note</Text>
          <Text style={styles.noteDescription}>
            Add any special instructions or notes for this item
          </Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              value={customization.wantNote || ''}
              onChangeText={(text) => handleChange('wantNote', text, 255)}
              placeholder="Enter your note here (up to 255 characters)"
              placeholderTextColor="#999"
              maxLength={255}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {customization.wantNote?.length || 0}/255
            </Text>
          </View>
          {errors.wantNote && (
            <Text style={styles.error}>{errors.wantNote}</Text>
          )}
        </View>
      )}

      {/* Show preview if any customization is entered */}
      {(Object.values(customization).some(val => val && val !== 'selectedFont') || customization.selectedFont) && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Preview:</Text>
          {customization.selectedFont && (
            <Text style={styles.previewText}>
              Font: <Text style={styles.previewValue}>
                {FONT_OPTIONS.find(f => f.value === customization.selectedFont)?.label || 'Font 1'}
              </Text>
            </Text>
          )}
          {fields.map((field) => 
            customization[field.key] ? (
              <Text key={field.key} style={styles.previewText}>
                {field.label}: <Text style={styles.previewValue}>{customization[field.key]}</Text>
              </Text>
            ) : null
          )}
          {customization.wantNote && (
            <Text style={styles.previewText}>
              Note: <Text style={styles.previewValue}>{customization.wantNote}</Text>
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fefefe',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    minWidth: 280, // Minimum width before wrapping to single column
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  charCount: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#999',
  },
  dropdownWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdown: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
  },
  fontNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  noteDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    position: 'relative',
  },
  textArea: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 30, // Make room for character count
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    maxHeight: 150,
  },
  error: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 4,
  },
  preview: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  previewValue: {
    fontWeight: '600',
    color: '#333',
  },
});

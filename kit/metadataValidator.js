// Ported from packz-framework src/services/MetadataValidator.ts (8e01e71).
// File-size policy: no hard cap unless one is passed in. Warn past 409,600 bytes
// (400 * 1024). That note is the JSON file. A reveal transaction is limited to
// 400,000 weight units (bitcoin::policy::MAX_STANDARD_TX_WEIGHT).
// docs/src/guides/wallet.md says 390,000 weight units should be safe.
// Trait hygiene warnings are reported only. Values are not rewritten.

import { hasOffChainImageUrl, isGammaOnChainItem } from './convert.js';
import { isValidInscriptionId, parseCanonicalInscriptionId } from './inscriptionId.js';
const OFFCHAIN_IMAGE_NOTE = 'These are off-chain image URLs, not on-chain metadata.';

function imageFieldValues(item) {
  const values = [];
  if (typeof item?.image === 'string') values.push(item.image);
  const meta = item?.meta;
  if (meta && typeof meta === 'object' && !Array.isArray(meta) && typeof meta.image === 'string') values.push(meta.image);
  return values;
}

// https:// and data:image/ point off-chain. Recursive inscription content is
// /content/<inscription id> (docs/src/inscriptions/recursion.md).
function isOffChainImageValue(value) {
  const text = String(value).trim();
  return /^https?:\/\//i.test(text) || /^data:image\//i.test(text);
}

function attributesOf(item) {
  if (Array.isArray(item?.meta?.attributes)) return item.meta.attributes;
  if (Array.isArray(item?.attributes)) return item.attributes;
  if (item?.t && typeof item.t === 'object' && !Array.isArray(item.t)) {
    return Object.entries(item.t).map(([trait_type, value]) => ({ trait_type, value }));
  }
  return null;
}

export function byteSize(text) {
  return new TextEncoder().encode(String(text)).length;
}

function logResult(valid, errors, warnings, stats) {
  console.info('Metadata validation complete', { valid, errorCount: errors.length, warningCount: warnings.length, stats });
}

export class MetadataValidator {
  static MAX_ITEMS = 10000;
  static MAX_TRAIT_CATEGORIES = 100;
  static WARN_FILE_SIZE = 400 * 1024;

  static validateJSONMetadata(data) {
    const errors = [];
    const warnings = [];
    if (!Array.isArray(data)) {
      errors.push({ field: 'root', message: 'Metadata must be an array of items', severity: 'critical' });
      return this.buildResult(false, errors, warnings);
    }
    if (data.length === 0) {
      errors.push({ field: 'root', message: 'Metadata array cannot be empty', severity: 'critical' });
      return this.buildResult(false, errors, warnings);
    }
    if (data.length > this.MAX_ITEMS) {
      errors.push({ field: 'root', message: `Collection exceeds maximum size of ${this.MAX_ITEMS} items`, severity: 'critical' });
      return this.buildResult(false, errors, warnings);
    }

    let validItems = 0;
    const traitCategories = new Set();
    const seenIds = new Map();
    let missingIds = 0;
    let duplicateIds = 0;
    let badIds = 0;

    data.forEach((item, index) => {
      const itemErrors = this.validateMetadataItem(item, index);
      const canonical = item && item.id != null && item.id !== '' ? parseCanonicalInscriptionId(item.id) : null;
      if (!item || item.id == null || item.id === '') missingIds += 1;
      else if (!canonical) badIds += 1;
      else if (seenIds.has(canonical.id)) {
        duplicateIds += 1;
        itemErrors.push({ field: 'id', message: `Duplicate inscription ID: ${canonical.id}`, severity: 'error', index });
      } else seenIds.set(canonical.id, index);
      errors.push(...itemErrors);
      if (itemErrors.length === 0) validItems += 1;
      const attributes = attributesOf(item) || [];
      attributes.forEach((attr) => {
        if (attr && attr.trait_type) traitCategories.add(attr.trait_type);
      });
    });

    if (traitCategories.size === 0) {
      warnings.push({
        field: 'attributes',
        message: 'No trait categories found in collection',
        recommendation: 'Add attributes to make your collection more interesting',
      });
    } else if (traitCategories.size > this.MAX_TRAIT_CATEGORIES) {
      warnings.push({
        field: 'attributes',
        message: `Very large number of trait categories (${traitCategories.size})`,
        recommendation: 'Consider consolidating similar traits',
      });
    }

    if (data.some((item) => hasOffChainImageUrl(item))) {
      warnings.push({
        field: 'image',
        message: OFFCHAIN_IMAGE_NOTE,
        severity: 'info',
      });
    }
    const gammaRows = data.filter((item) => isGammaOnChainItem(item)).length;
    if (gammaRows > 0) {
      warnings.push({
        field: 'id',
        message: `${gammaRows} ${gammaRows === 1 ? 'row has' : 'rows have'} no inscription id yet. id-based exports are disabled for those rows.`,
      });
    }
    const offChainImages = data.filter((item) => (
      isGammaOnChainItem(item) && imageFieldValues(item).some(isOffChainImageValue)
    )).length;
    if (offChainImages > 0) {
      warnings.push({
        field: 'image',
        message: `${offChainImages} on-chain ${offChainImages === 1 ? 'row uses' : 'rows use'} an off-chain image (https:// or data:image/). The inscribed file is the image. A recursive image is /content/<inscription id>.`,
      });
    }
    warnings.push(...this.traitHygiene(data));

    const totalTraits = data.reduce((sum, item) => sum + ((attributesOf(item) || []).length), 0);
    const stats = {
      totalItems: data.length,
      validItems,
      invalidItems: data.length - validItems,
      traitCategories: traitCategories.size,
      traitKeys: [...traitCategories],
      averageTraitsPerItem: totalTraits / data.length,
      missingIds,
      duplicateIds,
      badIds,
    };
    return this.buildResult(errors.length === 0, errors, warnings, stats);
  }

  static validateMetadataItem(item, index) {
    const errors = [];
    const gamma = isGammaOnChainItem(item);
    if (!item || !item.id) {
      if (!gamma) errors.push({ field: 'id', message: 'Missing inscription ID', severity: 'critical', index });
    } else if (!isValidInscriptionId(item.id)) {
      errors.push({ field: 'id', message: `Invalid inscription ID format: ${item.id}`, severity: 'error', index });
    }
    const name = item?.meta?.name || item?.name || (gamma ? item.file : '');
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Missing or invalid name', severity: 'error', index });
    }
    const attributes = attributesOf(item);
    if (attributes) {
      if (!Array.isArray(attributes)) {
        errors.push({ field: 'attributes', message: 'Attributes must be an array', severity: 'error', index });
      } else {
        attributes.forEach((attr, attrIndex) => {
          if (!attr || !attr.trait_type || typeof attr.trait_type !== 'string') {
            errors.push({ field: `attributes[${attrIndex}].trait_type`, message: 'Missing or invalid trait_type', severity: 'error', index });
          }
          if (!attr || attr.value === undefined || attr.value === null) {
            errors.push({ field: `attributes[${attrIndex}].value`, message: 'Missing attribute value', severity: 'error', index });
          }
        });
      }
    }
    return errors;
  }

  static validateCBORMetadata(metadata) {
    const errors = [];
    const warnings = [];
    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name is required', severity: 'critical' });
    }
    if (!metadata.description || metadata.description.trim().length === 0) {
      warnings.push({ field: 'description', message: 'Description is empty', recommendation: 'Add a description to provide context' });
    }
    if (metadata.image) errors.push(...this.validateImagePath(metadata.image));
    if (metadata.attributes) {
      if (!Array.isArray(metadata.attributes)) {
        errors.push({ field: 'attributes', message: 'Attributes must be an array', severity: 'error' });
      } else {
        metadata.attributes.forEach((attr, index) => {
          if (!attr.trait_type) errors.push({ field: `attributes[${index}].trait_type`, message: 'Missing trait_type', severity: 'error' });
          if (attr.value === undefined || attr.value === null) errors.push({ field: `attributes[${index}].value`, message: 'Missing value', severity: 'error' });
        });
      }
    }
    return this.buildResult(errors.length === 0, errors, warnings);
  }

  static validateImagePath(imagePath) {
    const errors = [];
    if (imagePath.startsWith('/content/')) {
      const inscriptionId = imagePath.replace('/content/', '');
      if (!isValidInscriptionId(inscriptionId)) {
        errors.push({ field: 'image', message: 'Invalid inscription ID in image path', severity: 'error' });
      }
    } else if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      try { new URL(imagePath); } catch { errors.push({ field: 'image', message: 'Invalid image URL', severity: 'error' }); }
    } else if (!imagePath.startsWith('data:image/')) {
      errors.push({ field: 'image', message: 'Image must be inscription reference, URL, or data URI', severity: 'error' });
    }
    return errors;
  }

  static validateFileSize(jsonString, settings = {}) {
    const errors = [];
    const warnings = [];
    const sizeInBytes = byteSize(jsonString);
    const maxBytes = settings.maxBytes == null ? null : settings.maxBytes;
    const warnBytes = settings.warnBytes == null ? this.WARN_FILE_SIZE : settings.warnBytes;
    const bytes = sizeInBytes.toLocaleString('en-US');
    if (maxBytes != null && sizeInBytes > maxBytes) {
      errors.push({
        field: 'fileSize',
        message: `Metadata file is ${bytes} bytes, over the ${maxBytes.toLocaleString('en-US')} byte cap.`,
        severity: 'critical',
      });
    } else if (maxBytes != null && sizeInBytes > maxBytes * 0.8) {
      warnings.push({
        field: 'fileSize',
        message: `Metadata file is ${bytes} bytes.`,
        recommendation: 'Consider reducing the file to stay under the byte cap set for this check.',
      });
    }
    if (sizeInBytes > warnBytes) {
      warnings.push({
        field: 'fileSize',
        message: `JSON file is ${bytes} bytes. One reveal transaction is limited to 400,000 weight units. 390,000 weight units should be safe.`,
        recommendation: 'Trim traits if a tool you use has a smaller file cap.',
      });
    }
    return this.buildResult(errors.length === 0, errors, warnings);
  }

  static validateComplete(jsonString, settings = {}) {
    const allErrors = [];
    const allWarnings = [];
    const sizeResult = this.validateFileSize(jsonString, settings);
    allErrors.push(...sizeResult.errors);
    allWarnings.push(...sizeResult.warnings);
    if (sizeResult.errors.some((e) => e.severity === 'critical')) return this.buildResult(false, allErrors, allWarnings);
    try {
      const data = JSON.parse(jsonString);
      const metadataResult = this.validateJSONMetadata(data);
      allErrors.push(...metadataResult.errors);
      allWarnings.push(...metadataResult.warnings);
      return this.buildResult(allErrors.length === 0, allErrors, allWarnings, metadataResult.stats);
    } catch (error) {
      allErrors.push({ field: 'json', message: `JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'critical' });
      return this.buildResult(false, allErrors, allWarnings);
    }
  }

  static traitKeysOf(item) {
    const keys = [];
    for (const attr of attributesOf(item) || []) {
      if (!attr || typeof attr.trait_type !== 'string' || attr.trait_type === '') continue;
      keys.push(attr.trait_type);
    }
    return keys;
  }

  static traitHygiene(data) {
    const warnings = [];
    const perItem = data.map((item) => this.traitKeysOf(item));
    const universe = [];
    const seenKey = new Set();
    const seenFold = new Map();
    for (const keys of perItem) {
      for (const key of keys) {
        if (!seenKey.has(key)) {
          seenKey.add(key);
          universe.push(key);
        }
        const fold = key.toLowerCase();
        if (!seenFold.has(fold)) seenFold.set(fold, []);
        const variants = seenFold.get(fold);
        if (!variants.includes(key)) variants.push(key);
      }
    }
    for (const key of universe) {
      const missing = perItem.filter((keys) => !keys.includes(key)).length;
      if (missing > 0) {
        warnings.push({
          field: 'attributes',
          message: `Trait "${key}" is missing on ${missing} ${missing === 1 ? 'item' : 'items'}. Use "None" instead of leaving it out.`,
        });
      }
    }
    for (const variants of seenFold.values()) {
      if (variants.length < 2) continue;
      const label = variants.length === 2
        ? `${variants[0]} and ${variants[1]}`
        : `${variants.slice(0, -1).join(', ')}, and ${variants[variants.length - 1]}`;
      warnings.push({
        field: 'attributes',
        message: `Trait keys differ only by case: ${label}.`,
      });
    }
    perItem.forEach((keys, index) => {
      const counts = new Map();
      for (const key of keys) counts.set(key, (counts.get(key) || 0) + 1);
      for (const [key, count] of counts) {
        if (count < 2) continue;
        warnings.push({
          field: 'attributes',
          index,
          message: `Duplicate trait_type "${key}" on one item.`,
        });
      }
    });
    return warnings;
  }

  static buildResult(valid, errors, warnings, stats) {
    const flagged = warnings.filter((w) => w.severity !== 'info');
    let summary;
    if (valid && errors.length === 0 && flagged.length === 0) summary = '✅ All validation checks passed. Metadata is ready for deployment.';
    else if (errors.length > 0) {
      const critical = errors.filter((e) => e.severity === 'critical').length;
      summary = `❌ Validation failed: ${errors.length} error(s)${critical > 0 ? ` (${critical} critical)` : ''}`;
      if (flagged.length > 0) summary += `, ${flagged.length} warning(s)`;
    } else summary = `⚠️ ${flagged.length} warning(s) found. Review before deploying.`;
    logResult(valid, errors, warnings, stats);
    return { valid, errors, warnings, summary, stats };
  }
}

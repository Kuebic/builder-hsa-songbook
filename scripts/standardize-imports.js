#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Map of relative paths to @features aliases
const importMappings = {
  // Songs feature
  '../types/song.types': '@features/songs/types/song.types',
  '../types/chord.types': '@features/songs/types/chord.types',
  '../types/verse.types': '@features/songs/types/verse.types',
  '../hooks/': '@features/songs/hooks/',
  '../utils/': '@features/songs/utils/',
  
  // Profile feature
  '../types/profile.types': '@features/profile/types/profile.types',
  '../hooks/': '@features/profile/hooks/',
  
  // Categories feature
  '../types/category.types': '@features/categories/types/category.types',
  '../hooks/': '@features/categories/hooks/',
  '../utils/': '@features/categories/utils/',
};

function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Get the feature name from path
  const featureMatch = filePath.match(/\/features\/([^/]+)\//);
  if (!featureMatch) return false;
  
  const currentFeature = featureMatch[1];
  
  // Update relative imports within the same feature
  const importRegex = /from ["'](\.\.[^"']+)["']/g;
  
  content = content.replace(importRegex, (match, relativePath) => {
    // Skip if already using @features
    if (relativePath.includes('@features')) return match;
    
    // Construct absolute feature path
    let absolutePath = relativePath;
    
    // Handle types imports
    if (relativePath.includes('/types/')) {
      absolutePath = `@features/${currentFeature}${relativePath.substring(2)}`;
      modified = true;
      return `from "${absolutePath}"`;
    }
    
    // Handle hooks imports
    if (relativePath.includes('/hooks/')) {
      absolutePath = `@features/${currentFeature}${relativePath.substring(2)}`;
      modified = true;
      return `from "${absolutePath}"`;
    }
    
    // Handle utils imports
    if (relativePath.includes('/utils/')) {
      absolutePath = `@features/${currentFeature}${relativePath.substring(2)}`;
      modified = true;
      return `from "${absolutePath}"`;
    }
    
    // Handle components imports
    if (relativePath.includes('/components/')) {
      absolutePath = `@features/${currentFeature}${relativePath.substring(2)}`;
      modified = true;
      return `from "${absolutePath}"`;
    }
    
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

// Find all TypeScript files in features directory
const files = glob.sync('client/features/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}']
});

console.log(`Found ${files.length} files to process...`);

let updatedCount = 0;
files.forEach(file => {
  if (updateImports(file)) {
    updatedCount++;
  }
});

console.log(`\n✨ Updated ${updatedCount} files with standardized imports.`);
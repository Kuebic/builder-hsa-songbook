#!/bin/bash

echo "Standardizing imports to use @features path aliases..."

# Counter for updated files
updated=0

# Process songs feature components
for file in client/features/songs/components/*.tsx client/features/songs/components/**/*.tsx; do
  if [ -f "$file" ]; then
    # Update relative imports to use @features
    if grep -q 'from "\.\./types' "$file"; then
      sed -i 's|from "\.\./types/song\.types"|from "@features/songs/types/song.types"|g' "$file"
      sed -i 's|from "\.\./types/chord\.types"|from "@features/songs/types/chord.types"|g' "$file"
      sed -i 's|from "\.\./types/verse\.types"|from "@features/songs/types/verse.types"|g' "$file"
      echo "✅ Updated: $file"
      ((updated++))
    fi
    
    if grep -q 'from "\.\./hooks' "$file"; then
      sed -i 's|from "\.\./hooks/\([^"]*\)"|from "@features/songs/hooks/\1"|g' "$file"
      echo "✅ Updated: $file"
      ((updated++))
    fi
    
    if grep -q 'from "\.\./utils' "$file"; then
      sed -i 's|from "\.\./utils/\([^"]*\)"|from "@features/songs/utils/\1"|g' "$file"
      echo "✅ Updated: $file"
      ((updated++))
    fi
  fi
done

# Process songs feature hooks
for file in client/features/songs/hooks/*.ts; do
  if [ -f "$file" ]; then
    if grep -q 'from "\.\./types' "$file"; then
      sed -i 's|from "\.\./types/song\.types"|from "@features/songs/types/song.types"|g' "$file"
      sed -i 's|from "\.\./types/chord\.types"|from "@features/songs/types/chord.types"|g' "$file"
      sed -i 's|from "\.\./types/verse\.types"|from "@features/songs/types/verse.types"|g' "$file"
      echo "✅ Updated: $file"
      ((updated++))
    fi
    
    if grep -q 'from "\.\./utils' "$file"; then
      sed -i 's|from "\.\./utils/\([^"]*\)"|from "@features/songs/utils/\1"|g' "$file"
      echo "✅ Updated: $file"
      ((updated++))
    fi
  fi
done

# Process profile feature
for file in client/features/profile/components/*.tsx client/features/profile/hooks/*.ts; do
  if [ -f "$file" ]; then
    if grep -q 'from "\.\./types' "$file"; then
      sed -i 's|from "\.\./types/profile\.types"|from "@features/profile/types/profile.types"|g' "$file"
      echo "✅ Updated: $file"
      ((updated++))
    fi
    
    if grep -q 'from "\.\./hooks' "$file"; then
      sed -i 's|from "\.\./hooks/\([^"]*\)"|from "@features/profile/hooks/\1"|g' "$file"
      echo "✅ Updated: $file"
      ((updated++))
    fi
  fi
done

# Process categories feature
for file in client/features/categories/components/*.tsx client/features/categories/components/**/*.tsx client/features/categories/hooks/*.ts; do
  if [ -f "$file" ]; then
    if grep -q 'from "\.\./types' "$file"; then
      sed -i 's|from "\.\./types/category\.types"|from "@features/categories/types/category.types"|g' "$file"
      echo "✅ Updated: $file"
      ((updated++))
    fi
    
    if grep -q 'from "\.\./hooks' "$file"; then
      sed -i 's|from "\.\./hooks/\([^"]*\)"|from "@features/categories/hooks/\1"|g' "$file"
      echo "✅ Updated: $file"
      ((updated++))
    fi
    
    if grep -q 'from "\.\./utils' "$file"; then
      sed -i 's|from "\.\./utils/\([^"]*\)"|from "@features/categories/utils/\1"|g' "$file"
      echo "✅ Updated: $file"
      ((updated++))
    fi
  fi
done

echo ""
echo "✨ Standardized imports in $updated files"
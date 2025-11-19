#!/bin/bash

# Script to copy assistant avatars from asistentes-landing repository
# Usage: ./scripts/copy_assistant_avatars.sh [path-to-asistentes-landing]

ASISTENTES_LANDING_PATH="${1:-../asistentes-landing}"
TARGET_DIR="frontend/src/assets/images/assistants"

echo "📋 Copying assistant avatars from asistentes-landing repository..."
echo "   Source: $ASISTENTES_LANDING_PATH"
echo "   Target: $TARGET_DIR"
echo ""

# Check if source directory exists
if [ ! -d "$ASISTENTES_LANDING_PATH" ]; then
    echo "❌ Error: Directory $ASISTENTES_LANDING_PATH does not exist"
    echo ""
    echo "Please provide the path to the asistentes-landing repository:"
    echo "  ./scripts/copy_assistant_avatars.sh /path/to/asistentes-landing"
    echo ""
    echo "Or clone it first:"
    echo "  git clone https://github.com/mabrutsky10/asistentes-landing.git ../asistentes-landing"
    exit 1
fi

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# List of assistants and their possible image locations
declare -A ASSISTANTS=(
    ["guillote"]="guillote"
    ["quela"]="quela"
    ["pela"]="pela"
    ["chori"]="chori"
    ["marta"]="marta florentina"
)

# Try to find and copy images
for assistant_id in "${!ASSISTANTS[@]}"; do
    possible_names=(${ASSISTANTS[$assistant_id]})
    found=false
    
    echo "🔍 Looking for $assistant_id avatar..."
    
    # Search in common locations
    search_paths=(
        "$ASISTENTES_LANDING_PATH/src/assets/images/assistants"
        "$ASISTENTES_LANDING_PATH/src/assets/assistants"
        "$ASISTENTES_LANDING_PATH/public/images/assistants"
        "$ASISTENTES_LANDING_PATH/public/assistants"
        "$ASISTENTES_LANDING_PATH/assets/images/assistants"
        "$ASISTENTES_LANDING_PATH/assets/assistants"
    )
    
    for search_path in "${search_paths[@]}"; do
        if [ -d "$search_path" ]; then
            for name in "${possible_names[@]}"; do
                # Try different extensions
                for ext in png jpg jpeg PNG JPG JPEG; do
                    if [ -f "$search_path/${name}.${ext}" ] || [ -f "$search_path/${name}_avatar.${ext}" ] || [ -f "$search_path/${name}-avatar.${ext}" ]; then
                        # Find the actual file
                        if [ -f "$search_path/${name}.${ext}" ]; then
                            cp "$search_path/${name}.${ext}" "$TARGET_DIR/${assistant_id}.png"
                        elif [ -f "$search_path/${name}_avatar.${ext}" ]; then
                            cp "$search_path/${name}_avatar.${ext}" "$TARGET_DIR/${assistant_id}.png"
                        elif [ -f "$search_path/${name}-avatar.${ext}" ]; then
                            cp "$search_path/${name}-avatar.${ext}" "$TARGET_DIR/${assistant_id}.png"
                        fi
                        echo "   ✅ Copied $assistant_id.png"
                        found=true
                        break 3
                    fi
                done
            done
        fi
    done
    
    if [ "$found" = false ]; then
        echo "   ⚠️  Could not find $assistant_id avatar. Please copy it manually."
    fi
done

echo ""
echo "✅ Done! Check $TARGET_DIR for the copied images."
echo ""
echo "If some images were not found, you can manually copy them:"
echo "  1. Find the images in the asistentes-landing repository"
echo "  2. Copy them to: $TARGET_DIR"
echo "  3. Name them: guillote.png, quela.png, pela.png, chori.png, marta.png"


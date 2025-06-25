#!/bin/bash

# Script to generate app icons from SVG source
# Requires ImageMagick (convert command)

ICON_DIR="assets/icons"
SVG_SOURCE="$ICON_DIR/icon.svg"

echo "Generating app icons from $SVG_SOURCE..."

# Create icon directory if it doesn't exist
mkdir -p "$ICON_DIR"

# Check if source SVG exists
if [ ! -f "$SVG_SOURCE" ]; then
    echo "Error: Source SVG file not found at $SVG_SOURCE"
    exit 1
fi

# Generate PNG icons for different sizes
echo "Generating PNG icons..."
convert "$SVG_SOURCE" -resize 16x16 "$ICON_DIR/icon_16x16.png"
convert "$SVG_SOURCE" -resize 32x32 "$ICON_DIR/icon_32x32.png"
convert "$SVG_SOURCE" -resize 48x48 "$ICON_DIR/icon_48x48.png"
convert "$SVG_SOURCE" -resize 64x64 "$ICON_DIR/icon_64x64.png"
convert "$SVG_SOURCE" -resize 128x128 "$ICON_DIR/icon_128x128.png"
convert "$SVG_SOURCE" -resize 256x256 "$ICON_DIR/icon_256x256.png"
convert "$SVG_SOURCE" -resize 512x512 "$ICON_DIR/icon_512x512.png"
convert "$SVG_SOURCE" -resize 1024x1024 "$ICON_DIR/icon_1024x1024.png"

# Generate main icon.png (256x256)
cp "$ICON_DIR/icon_256x256.png" "$ICON_DIR/icon.png"

# Generate ICO file for Windows (multiple sizes in one file)
echo "Generating Windows ICO file..."
convert "$ICON_DIR/icon_16x16.png" "$ICON_DIR/icon_32x32.png" "$ICON_DIR/icon_48x48.png" "$ICON_DIR/icon_64x64.png" "$ICON_DIR/icon_128x128.png" "$ICON_DIR/icon_256x256.png" "$ICON_DIR/icon.ico"

# Generate ICNS file for macOS (if icnsutil is available)
echo "Generating macOS ICNS file..."
if command -v iconutil >/dev/null 2>&1; then
    # Create iconset directory
    ICONSET_DIR="$ICON_DIR/icon.iconset"
    mkdir -p "$ICONSET_DIR"
    
    # Copy icons with proper naming for iconset
    cp "$ICON_DIR/icon_16x16.png" "$ICONSET_DIR/icon_16x16.png"
    cp "$ICON_DIR/icon_32x32.png" "$ICONSET_DIR/icon_16x16@2x.png"
    cp "$ICON_DIR/icon_32x32.png" "$ICONSET_DIR/icon_32x32.png"
    cp "$ICON_DIR/icon_64x64.png" "$ICONSET_DIR/icon_32x32@2x.png"
    cp "$ICON_DIR/icon_128x128.png" "$ICONSET_DIR/icon_128x128.png"
    cp "$ICON_DIR/icon_256x256.png" "$ICONSET_DIR/icon_128x128@2x.png"
    cp "$ICON_DIR/icon_256x256.png" "$ICONSET_DIR/icon_256x256.png"
    cp "$ICON_DIR/icon_512x512.png" "$ICONSET_DIR/icon_256x256@2x.png"
    cp "$ICON_DIR/icon_512x512.png" "$ICONSET_DIR/icon_512x512.png"
    cp "$ICON_DIR/icon_1024x1024.png" "$ICONSET_DIR/icon_512x512@2x.png"
    
    # Generate ICNS
    iconutil -c icns "$ICONSET_DIR" -o "$ICON_DIR/icon.icns"
    
    # Clean up iconset directory
    rm -rf "$ICONSET_DIR"
    
    echo "macOS ICNS file generated successfully"
else
    echo "iconutil not found - skipping ICNS generation (macOS only)"
    # Create a placeholder ICNS file using ImageMagick
    convert "$ICON_DIR/icon_512x512.png" "$ICON_DIR/icon.icns"
fi

echo "Icon generation complete!"
echo "Generated files:"
ls -la "$ICON_DIR"/*.png "$ICON_DIR"/*.ico "$ICON_DIR"/*.icns 2>/dev/null || true

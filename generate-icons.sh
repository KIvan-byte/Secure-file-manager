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

# Check if ImageMagick is installed
if ! command -v convert >/dev/null 2>&1; then
    echo "Error: ImageMagick (convert command) is not installed."
    echo "Install it with: sudo apt-get install imagemagick (Ubuntu/Debian)"
    echo "or: sudo dnf install ImageMagick (Fedora/RHEL)"
    exit 1
fi

# Generate PNG icons for different sizes with better quality
echo "Generating PNG icons..."

# Check if Inkscape is available (better SVG rendering)
if command -v inkscape >/dev/null 2>&1; then
    echo "Using Inkscape for better SVG rendering..."
    inkscape "$SVG_SOURCE" --export-type=png --export-filename="$ICON_DIR/icon_16x16.png" --export-width=16 --export-height=16
    inkscape "$SVG_SOURCE" --export-type=png --export-filename="$ICON_DIR/icon_32x32.png" --export-width=32 --export-height=32
    inkscape "$SVG_SOURCE" --export-type=png --export-filename="$ICON_DIR/icon_48x48.png" --export-width=48 --export-height=48
    inkscape "$SVG_SOURCE" --export-type=png --export-filename="$ICON_DIR/icon_64x64.png" --export-width=64 --export-height=64
    inkscape "$SVG_SOURCE" --export-type=png --export-filename="$ICON_DIR/icon_128x128.png" --export-width=128 --export-height=128
    inkscape "$SVG_SOURCE" --export-type=png --export-filename="$ICON_DIR/icon_256x256.png" --export-width=256 --export-height=256
    inkscape "$SVG_SOURCE" --export-type=png --export-filename="$ICON_DIR/icon_512x512.png" --export-width=512 --export-height=512
    inkscape "$SVG_SOURCE" --export-type=png --export-filename="$ICON_DIR/icon_1024x1024.png" --export-width=1024 --export-height=1024
else
    echo "Using ImageMagick for SVG conversion..."
    # Use better settings for SVG to PNG conversion
    convert "$SVG_SOURCE" -background transparent -density 300 -resize 16x16 -quality 100 "$ICON_DIR/icon_16x16.png"
    convert "$SVG_SOURCE" -background transparent -density 300 -resize 32x32 -quality 100 "$ICON_DIR/icon_32x32.png"
    convert "$SVG_SOURCE" -background transparent -density 300 -resize 48x48 -quality 100 "$ICON_DIR/icon_48x48.png"
    convert "$SVG_SOURCE" -background transparent -density 300 -resize 64x64 -quality 100 "$ICON_DIR/icon_64x64.png"
    convert "$SVG_SOURCE" -background transparent -density 300 -resize 128x128 -quality 100 "$ICON_DIR/icon_128x128.png"
    convert "$SVG_SOURCE" -background transparent -density 300 -resize 256x256 -quality 100 "$ICON_DIR/icon_256x256.png"
    convert "$SVG_SOURCE" -background transparent -density 300 -resize 512x512 -quality 100 "$ICON_DIR/icon_512x512.png"
    convert "$SVG_SOURCE" -background transparent -density 300 -resize 1024x1024 -quality 100 "$ICON_DIR/icon_1024x1024.png"
fi

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

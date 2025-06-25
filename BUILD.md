# Building Application for Different Platforms

## Requirements

Before building, make sure you have installed:

- Node.js (v16 or higher)
- npm or yarn
- Git

### For Linux builds:
- Basic development tools (build-essential)

### For Windows builds (cross-platform from Linux):
- wine (for signing and some operations)

## Install Dependencies

```bash
npm install
```

## Generate Icons

If you changed the icon, generate new ones:

```bash
./generate-icons.sh
```

## Build Commands

### Development
```bash
# Run in development mode
npm run dev
```

### Production Build
```bash
# Build web part
npm run build

# Run built application
npm start
```

### Build Distributions

#### Build for current platform
```bash
npm run dist
```

#### Build for Linux only
```bash
npm run dist:linux
```

#### Build for Windows only
```bash
npm run dist:win
```

#### Build for all platforms
```bash
npm run dist:all
```

#### Test build (without packaging)
```bash
npm run pack
```

## Build Results

Built applications will be located in the `dist/` folder:

### Linux:
- `*.AppImage` - Portable application for Linux
- `*.deb` - Package for Debian/Ubuntu
- `*.rpm` - Package for RedHat/Fedora/SUSE
- `*.tar.gz` - Archive for manual installation

### Windows:
- `*.exe` - NSIS installer
- `*-portable.exe` - Portable version
- `*.zip` - Archive for manual installation

### macOS (if built on macOS):
- `*.dmg` - Disk image for macOS
- `*.zip` - Archive for macOS

## Installation and Distribution

### Linux AppImage
```bash
chmod +x Secure-File-Manager-*.AppImage
./Secure-File-Manager-*.AppImage
```

### Linux DEB package
```bash
sudo dpkg -i secure-file-manager_*.deb
sudo apt-get install -f  # if dependencies are needed
```

### Linux RPM package
```bash
sudo rpm -i secure-file-manager-*.rpm
# or
sudo dnf install secure-file-manager-*.rpm
```

### Windows
Run the `.exe` installer or extract the portable version.

## Cross-Platform Building

The project is configured for cross-platform building from Linux:

- **Linux → Windows**: Supported
- **Linux → macOS**: Requires additional tools
- **Windows → Linux**: Supported with WSL
- **macOS → all platforms**: Full support

## Application Signing

For production releases, it's recommended to set up signing:

### Windows
Add certificate to environment variables:
```bash
export CSC_LINK=path/to/certificate.p12
export CSC_KEY_PASSWORD=certificate_password
```

### macOS
```bash
export CSC_LINK=path/to/certificate.p12
export CSC_KEY_PASSWORD=certificate_password
export APPLE_ID=your@apple.id
export APPLE_ID_PASSWORD=app_specific_password
```

## Automatic Updates

The application is configured for automatic updates via GitHub Releases. To activate:

1. Create a GitHub Token with repository permissions
2. Add to environment variables:
```bash
export GH_TOKEN=your_github_token
```

3. Build and publish:
```bash
npm run dist -- --publish=always
```

## Build Debugging

For detailed build logs:
```bash
DEBUG=electron-builder npm run dist
```

## Troubleshooting

### Native module errors
```bash
npm run postinstall
```

### Permission issues (Linux)
```bash
sudo chown -R $USER:$USER node_modules
```

### Clear cache
```bash
rm -rf node_modules dist build
npm install
```

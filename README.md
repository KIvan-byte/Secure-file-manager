# 🔒 Secure File Manager

A modern, secure file management application with advanced encryption, secure file sharing, P2P synchronization, and comprehensive security auditing.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20macOS-lightgrey.svg)
![Build Status](https://github.com/KIvan-byte/Secure-file-manager/workflows/Build%20and%20Release/badge.svg)

## ✨ Features

### 🛡️ Security First
- **Military-grade AES-256-GCM encryption** for file protection
- **PBKDF2 key derivation** with 100,000+ iterations
- **Two-factor authentication (2FA)** support
- **Rate limiting and intrusion detection**
- **Secure session management**

### 📁 File Management
- **Encrypted file storage** with master password protection
- **File compression and archive management**
- **Advanced file properties and metadata**
- **Secure file explorer** with encryption status indicators

### 🔗 Secure Sharing
- **One-time secure sharing links** with expiration
- **Password-protected shared files**
- **Access logging and analytics**
- **QR code generation** for easy sharing

### 🌐 Synchronization
- **Zero-knowledge P2P file synchronization**
- **Encrypted data transmission**
- **Conflict resolution and versioning**
- **Offline-first architecture**

### 📊 Analytics & Monitoring
- **Comprehensive access logging**
- **Security dashboard with threat detection**
- **File access analytics and reports**
- **Real-time security alerts**

### 📝 Additional Features
- **Encrypted secure notes** with rich text editing
- **Cross-platform compatibility** (Linux, Windows, macOS)
- **Modern, intuitive user interface**
- **Customizable security settings**

## 🚀 Quick Start

### Download Pre-built Packages

Visit our [Releases page](https://github.com/KIvan-byte/Secure-file-manager/releases) to download the latest version:

#### Linux
- **AppImage**: Universal Linux executable (recommended)
- **DEB Package**: For Ubuntu/Debian systems
- **TAR.GZ**: Manual installation archive

#### Windows
- **NSIS Installer**: Easy installation with shortcuts
- **Portable EXE**: Run without installation
- **ZIP Archive**: Extract and run

#### macOS
- **DMG Installer**: Standard macOS installation
- **ZIP Archive**: Extract and run

### Installation

#### Linux (AppImage - Recommended)
```bash
# Download the AppImage
wget https://github.com/KIvan-byte/Secure-file-manager/releases/latest/download/Secure-File-Manager-1.0.0.AppImage

# Make it executable
chmod +x Secure-File-Manager-1.0.0.AppImage

# Run the application
./Secure-File-Manager-1.0.0.AppImage
```

#### Linux (DEB Package)
```bash
# Download and install
sudo dpkg -i secure-file-manager_1.0.0_amd64.deb

# Fix dependencies if needed
sudo apt-get install -f

# Run from terminal or application menu
secure-file-manager
```

#### Windows
1. Download the NSIS installer
2. Run the installer as administrator
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

#### macOS
1. Download the DMG file
2. Open the DMG and drag to Applications folder
3. Launch from Applications or Launchpad

## 🛠️ Development

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.11+ (for native modules)
- **Git** for version control
- **Docker** (optional, for Linux builds)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/KIvan-byte/Secure-file-manager.git
cd Secure-file-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will start with hot-reload enabled. The web interface runs on `http://localhost:5174` and Electron will launch automatically.

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build the web application
npm run preview      # Preview the built application

# Production
npm start            # Build and start in production mode
npm run start:prod   # Start in production mode (requires build)

# Building packages
npm run dist         # Build for current platform
npm run dist:linux   # Build Linux packages
npm run dist:win     # Build Windows packages  
npm run dist:mac     # Build macOS packages
npm run dist:all     # Build for all platforms

# Maintenance
npm run clean        # Clean build directories
npm run clean:cache  # Clean npm and Electron caches
```

### Project Structure

```
secure-file-manager/
├── src/                    # React application source
│   ├── components/         # React components
│   ├── utils/             # Utility functions
│   ├── App.jsx           # Main application component
│   └── index.jsx         # Application entry point
├── utils/                 # Node.js utilities (Electron main process)
│   ├── encryption-utils.js    # Encryption/decryption functions
│   ├── file-utils.js          # File system operations
│   ├── security-middleware.js # Security and authentication
│   └── ...                    # Other utility modules
├── assets/               # Application assets and icons  
├── build/               # Built web application (generated)
├── dist/                # Built Electron packages (generated)
├── main.js              # Electron main process
├── preload.js           # Electron preload script
├── package.json         # Project configuration
└── vite.config.mjs      # Vite build configuration
```

## 🔧 Building from Source

### Local Build

```bash
# Install dependencies
npm install

# Build web application
npm run build

# Build Electron packages for current platform
npm run dist
```

### Docker Build (Linux)

```bash
# Build Docker image
docker build -t secure-file-manager-builder .

# Build Linux packages
docker run --rm -v $(pwd):/workspace secure-file-manager-builder
```

### Cross-Platform Build

To build for all platforms, you need access to each target OS or use CI/CD:

```bash
# On Linux: Build Linux packages
npm run dist:linux

# On Windows: Build Windows packages  
npm run dist:win

# On macOS: Build macOS packages
npm run dist:mac
```

## 🚀 Release Process

### Manual Releases (Recommended)

Our CI/CD pipeline creates releases only when manually triggered, giving you full control:

1. **Go to GitHub Actions**:
   - Navigate to: https://github.com/KIvan-byte/Secure-file-manager/actions
   - Select **"Build and Release"** workflow
   - Click **"Run workflow"**

2. **Configure the release**:
   - **Release Type**: 
     - `draft` - Creates a draft release for review
     - `prerelease` - Marks as pre-release (beta, alpha, rc)
     - `release` - Creates a public release
   - **Version Tag**: e.g., `v1.0.1`, `v1.1.0`, `v2.0.0-beta.1`
   - **Build Platforms**: Choose which platforms to build:
     - `linux` - Only Linux packages
     - `windows` - Only Windows packages
     - `macos` - Only macOS packages
     - `linux,windows` - Both Linux and Windows
     - `linux,windows,macos` - All platforms
   - **Skip Release**: Check to build packages without creating a release

3. **Automatic process**:
   - GitHub Actions builds for selected platforms
   - Creates GitHub release with changelogs (if not skipped)
   - Uploads all build artifacts
   - Publishes release notes

### Quick Release Commands

For convenience, you can also use npm version commands locally and then trigger the workflow:

```bash
# Update version locally (optional)
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0  
npm version major   # 1.0.0 → 2.0.0

# Commit and push changes
git push origin main

# Then manually trigger the workflow in GitHub Actions
# with the corresponding version tag (e.g., v1.0.1)
```

## 🔒 Security

### Encryption Details
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000+ (configurable)
- **Salt**: Cryptographically random 32-byte salt per file
- **Authentication**: Built-in AEAD authentication

### Security Features
- **Master Password**: Protects encryption keys
- **Session Security**: Automatic timeout and secure storage
- **File Integrity**: Cryptographic verification of all encrypted files
- **Memory Protection**: Secure memory handling for sensitive data
- **Audit Logging**: Comprehensive security event logging

### Reporting Security Issues

Please report security vulnerabilities privately to: **security@secure-file-manager.com**

Do not create public issues for security vulnerabilities.

## 📊 CI/CD Pipeline

Our automated build and release pipeline includes:

### 🔄 Continuous Integration
- **Multi-platform builds**: Linux, Windows, macOS
- **Quality assurance**: Code analysis, security scanning
- **Automated testing**: Unit tests, integration tests
- **Dependency monitoring**: Vulnerability scanning, updates

### 🚀 Continuous Deployment
- **Automated releases**: Tag-triggered releases
- **Multi-format packages**: AppImage, DEB, NSIS, DMG, etc.
- **Release notes**: Auto-generated changelogs
- **Asset distribution**: GitHub Releases integration

### Build Status

| Platform | Status | Packages |
|----------|--------|----------|
| 🐧 **Linux** | ![Linux Build](https://github.com/KIvan-byte/Secure-file-manager/workflows/Build%20and%20Release/badge.svg) | AppImage, DEB, TAR.GZ |
| 🪟 **Windows** | ![Windows Build](https://github.com/KIvan-byte/Secure-file-manager/workflows/Build%20and%20Release/badge.svg) | NSIS, Portable, ZIP |
| 🍎 **macOS** | ![macOS Build](https://github.com/KIvan-byte/Secure-file-manager/workflows/Build%20and%20Release/badge.svg) | DMG, ZIP |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/) and [React](https://reactjs.org/)
- Icons from [React Icons](https://react-icons.github.io/react-icons/)
- Encryption powered by Node.js crypto module
- UI components styled with [Styled Components](https://styled-components.com/)

## 📞 Support

- **Documentation**: Check our [Wiki](https://github.com/KIvan-byte/Secure-file-manager/wiki)
- **Issues**: [GitHub Issues](https://github.com/KIvan-byte/Secure-file-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/KIvan-byte/Secure-file-manager/discussions)
- **Email**: support@secure-file-manager.com

## 🗺️ Roadmap

### Upcoming Features
- [ ] **Cloud Storage Integration** (encrypted)
- [ ] **Team Collaboration** features
- [ ] **Mobile Applications** (iOS/Android)
- [ ] **Browser Extension** for secure downloads
- [ ] **Advanced Backup** and versioning
- [ ] **Enterprise Features** (SSO, LDAP)

### Version History
- **v1.0.0** - Initial release with core security features
- **Future releases** - Check [Releases](https://github.com/KIvan-byte/Secure-file-manager/releases)

---

<div align="center">

**🔒 Secure File Manager** - *Protecting your files with military-grade security*

[![Download Latest Release](https://img.shields.io/badge/Download-Latest%20Release-brightgreen?style=for-the-badge)](https://github.com/KIvan-byte/Secure-file-manager/releases/latest)

</div>
- npm package manager

### Installation

1. Clone the repository
```bash
git clone https://github.com/KIvan-byte/Secure-file-manager.git
cd Secure-file-manager
```

2. Install dependencies
```bash
npm install
```

### Development Mode
Run in development mode with hot reload:
```bash
npm run dev
```
This will:
- Start Vite development server on port 5174
- Launch Electron app connected to dev server
- Enable DevTools for debugging

### Production Mode
Build and run the production version:
```bash
npm start
```
This will:
- Build the React app with Vite to static files
- Launch Electron app with built files
- No DevTools or hot reload

### Other Commands
```bash
npm run build      # Build React app for production
npm run preview    # Preview production build
npm run start:prod # Run production build without rebuilding
```

## Architecture

### Frontend
- **React 18.2.0** - Modern UI library with hooks
- **Vite 7.0.0** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Styled Components** - CSS-in-JS styling
- **Recharts** - Beautiful data visualizations

### Backend
- **Electron 28.2.0** - Cross-platform desktop app framework
- **Node.js** - Server-side JavaScript runtime
- **Express** - Web server for file sharing
- **LowDB** - Lightweight JSON database

### Security Stack
- **AES-256-CBC** - Military-grade encryption
- **PBKDF2** - Key derivation function
- **TOTP** - Time-based one-time passwords for 2FA
- **Zero-knowledge architecture** - No sensitive data stored

### File System
- **Custom utilities** - Safe file operations
- **Archive support** - ZIP, TAR, TAR.GZ formats
- **P2P networking** - WebSocket-based peer discovery

## Usage

### File Explorer

The main file explorer interface allows you to:
- Browse directories by clicking on folder icons
- View file details and preview supported file types
- Use the search bar to find files quickly
- Right-click on files for additional options

### File Encryption

1. Navigate to the file you want to encrypt
2. Click the lock icon in the file actions
3. Enter a strong password
4. Click "Encrypt File"

To decrypt:
1. Navigate to the encrypted file (with .enc extension)
2. Click the unlock icon
3. Enter the original password
4. Click "Decrypt File"

### File Compression

1. Select multiple files using the checkboxes
2. Click "Compress" button in the toolbar
3. Choose compression format (ZIP or TAR.GZ)
4. Specify output location
5. Click "Compress Files"

### File Sharing

1. Navigate to the file you want to share
2. Click the share icon
3. If sharing an encrypted file, you can optionally allow recipients to decrypt it
4. Set expiration time or use one-time access
5. Click "Generate Secure Share Link"
6. Copy and share the secure link

**File sharing server runs on port 3001** and uses your local IP address for secure network sharing.

### P2P Synchronization

1. Open Settings and navigate to Zero-Knowledge Sync
2. Enter a master password (same on all devices)
3. Enable sync and add files to synchronization
4. Other devices with the same password will auto-discover and sync
5. Files are encrypted end-to-end during transfer

### Two-Factor Authentication

1. Go to Settings → Security → Two-Factor Authentication
2. Click "Enable 2FA"
3. Scan the QR code with Google Authenticator or similar app
4. Enter the verification code to confirm setup
5. 2FA will be required for sensitive operations

### Analytics Dashboard

The analytics section provides:
- Overview of file statistics
- Storage usage visualization by file type
- Activity trends and security metrics
- Interactive charts and detailed logs

## Configuration

### File Sharing Server
- **Port**: 3001 (configurable)
- **IP Detection**: Automatic local network IP
- **Security**: One-time links with encryption keys
- **CORS**: Enabled for web browser access

### Database
- **Type**: LowDB (JSON-based)
- **Location**: User data directory
- **Backup**: Automatic on changes
- **Encryption**: Sensitive data encrypted at rest

### P2P Network
- **Discovery Port**: 8889 (UDP broadcast)
- **Data Port**: 8888 (TCP connections)
- **Encryption**: AES-256-CBC for all transfers
- **Authentication**: Device ID + master password

## Security

### Data Protection
- **Zero-Knowledge Architecture**: All encryption happens locally
- **No Cloud Storage**: All data remains on your devices
- **Strong Encryption**: AES-256-CBC with PBKDF2 key derivation
- **Secure Key Generation**: Cryptographically secure random keys
- **No Password Storage**: Passwords never stored or transmitted

### File Sharing Security
- **One-Time Links**: Links expire after single use or time limit
- **Encryption Keys**: Each share has unique encryption key
- **IP Restriction**: Server only accessible on local network
- **Audit Logging**: All access attempts logged
- **Optional Decryption**: Encrypted files can be shared with decryption option

### P2P Security
- **End-to-End Encryption**: All peer communication encrypted
- **Device Authentication**: Peers authenticated via master password
- **Network Isolation**: Only local network discovery
- **No Central Server**: Direct peer-to-peer connections
- **Data Integrity**: File checksums verify transfer integrity

### Two-Factor Authentication
- **TOTP Standard**: Compatible with Google Authenticator
- **Time-Based Codes**: 6-digit codes change every 30 seconds
- **Backup Codes**: Available for account recovery
- **Optional Setup**: Can be enabled for additional security

## Development

### Project Structure
```
├── src/                    # React frontend source
│   ├── components/         # React components
│   └── index.jsx          # Main React entry point
├── utils/                  # Utility modules
│   ├── encryption-utils.js # File encryption/decryption
│   ├── compression-utils.js# Archive operations
│   ├── file-utils.js      # Safe file operations
│   ├── two-factor-auth.js # 2FA implementation
│   ├── p2p-network.js     # P2P networking
│   └── zero-knowledge-sync.js # Sync manager
├── main.js                # Electron main process
├── preload.js            # Electron preload script
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies and scripts
└── index.html           # Main HTML file
```

### Technology Stack
- **Frontend**: React 18.2.0 + Vite 7.0.0
- **Desktop**: Electron 28.2.0
- **Styling**: Styled Components + React Icons
- **Charts**: Recharts for analytics
- **Database**: LowDB for local storage
- **Networking**: WebSocket + UDP for P2P
- **Security**: Node.js crypto module

### Build System Migration
This project has been migrated from Create React App to Vite for:
- **Faster builds** - 10x faster than webpack
- **Better dev experience** - Instant hot reload
- **Modern tooling** - Native ES modules
- **Smaller bundles** - Better tree shaking
- **Zero vulnerabilities** - Updated dependencies

### Contributing
1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Run security audit: `npm audit`
5. Submit pull request with description

## Troubleshooting

### Common Issues

**File sharing link shows wrong IP address**
- Fixed in latest version using Node.js built-in networking
- Server now correctly detects local IP address

**Electron app won't start in development**
- Ensure Vite dev server is running on port 5174
- Check if `npm run dev` shows both Vite and Electron starting

**Files not syncing between devices**
- Verify both devices use same master password
- Check network connectivity between devices
- Ensure UDP port 8889 and TCP port 8888 are not blocked

**Encryption/Decryption fails**
- Verify password is entered correctly
- Check file hasn't been corrupted or modified
- Ensure sufficient disk space for output file

**2FA setup not working**
- Verify system clock is accurate
- Try entering code multiple times (30-second window)
- Check QR code scanned correctly in authenticator app

### Logs and Debugging
- **Electron logs**: Check console in DevTools (development mode)
- **File operations**: Logged to application data directory
- **Network activity**: P2P connections logged to console
- **Security events**: All encryption/sharing logged

### Performance Tips
- **Large files**: Compression and encryption may take time
- **P2P sync**: Performance depends on network speed
- **File preview**: Large images may take time to load
- **Search**: Content search is disk-intensive for large directories

## Changelog

### v1.0.0 (Current)
- Migrated from Create React App to Vite
- Fixed file sharing IP address detection
- Removed all security vulnerabilities
- Updated to modern dependencies
- Improved build performance
- Enhanced P2P synchronization
- Added comprehensive 2FA support

## License

This project is licensed under a Custom License - see the [LICENSE](LICENSE) file for details.

**Note**: This code is provided for review and academic purposes only. Commercial use requires written permission.

## Acknowledgments

- **Electron Team** - For the excellent desktop framework
- **React Team** - For the powerful UI library  
- **Vite Team** - For the blazing fast build tool
- **Security Community** - For encryption best practices
- **Contributors** - For testing and feedback

---

**Built with care for secure file management**

[Report Bug](https://github.com/KIvan-byte/Secure-file-manager/issues) · [Request Feature](https://github.com/KIvan-byte/Secure-file-manager/issues) · [Security Report](mailto:security@example.com)

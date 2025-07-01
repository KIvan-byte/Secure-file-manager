# Secure File Manager

A modern, secure file management application built with Electron, React, and Vite. Features advanced encryption, secure file sharing, P2P synchronization, and comprehensive security auditing.

[![License: Custom](https://img.shields.io/badge/License-Custom-red.svg)](https://github.com/KIvan-byte/Secure-file-manager/blob/main/LICENSE)
[![Electron](https://img.shields.io/badge/Electron-28.2.0-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-646CFF.svg)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/Security-Zero_Vulnerabilities-green.svg)](#security)

## Features

### File Management
- Intuitive file system navigation and browsing
- Detailed file information (size, permissions, dates, hashes)
- Built-in file preview for images, text, PDFs, and more
- Advanced search functionality (filename and content search)
- File operations (copy, move, delete, rename)

### Advanced Security
- Military-grade AES-256-CBC encryption
- Zero-knowledge architecture - passwords never stored
- Secure file sharing with one-time links
- Optional decryption for shared encrypted files
- Comprehensive access logging and audit trails
- Two-factor authentication (2FA) support

### P2P Synchronization
- Zero-knowledge peer-to-peer file synchronization
- Local network device discovery
- End-to-end encrypted file transfers
- Multi-device sync without cloud dependency
- Secure peer connections with device authentication

### Compression & Archives
- Create ZIP and TAR.GZ archives
- Extract multiple archive formats
- Password-protected compression
- Batch compression operations

### Analytics & Monitoring
- File usage statistics and trends
- Storage analysis by file type
- Security activity monitoring
- Interactive charts and visualizations
- Detailed activity logs

### Modern Interface
- Dark/Light theme support
- Responsive design for all screen sizes
- Intuitive user experience
- Fast performance with Vite
- Cross-platform compatibility (Windows, macOS, Linux)

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
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

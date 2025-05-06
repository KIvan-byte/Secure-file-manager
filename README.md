# 🔐 SecureFileManager

> A comprehensive file management application with advanced security features built with Electron and React.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-24.0.0-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)

## ✨ Features

### 📁 File Management
- 📂 Browse and navigate through your file system
- 📊 View detailed file information (size, date modified, etc.)
- 👁️ Preview files within the application (images, text, PDFs, etc.)
- 🖱️ Drag and drop file operations
- 🔍 Search for files by name and content

### 🔒 Security
- 🛡️ End-to-end file encryption using AES-256-CBC
- 🔑 Password protection for sensitive files
- 🕵️ No password storage - only you have access to your encrypted data
- 🔗 Secure file sharing with optional decryption
- ⏱️ One-time access links for shared files

### 📦 Compression
- 🗜️ Compress files and folders into ZIP or TAR.GZ archives
- 📤 Extract compressed archives
- 🔐 Password protection for archives

### 📊 Analytics
- 📈 Track file usage and activity
- 💾 View storage usage by file type
- 🔍 Monitor security activity (encryptions, shares)
- 📊 Visualize usage patterns with interactive charts
- 📝 Activity logs for tracking file operations

### 🌟 Additional Features
- 📱 Responsive design for different screen sizes
- 🌙 Dark mode support
- 💻 Cross-platform compatibility (Windows, macOS, Linux)
- 🔐 Secure local storage of application settings

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js (v14.x or higher)
- npm (v7.x or higher)

### ⚙️ Installation

1. Clone the repository
```bash
git clone https://github.com/KIvan-byte/Secure-file-manager.git
cd securefilemanager
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

5. Create executable for your platform
```bash
npm run package
```

## 📖 Usage

### 📂 File Explorer

The main file explorer interface allows you to:
- Browse directories by clicking on folder icons
- View file details and preview supported file types
- Use the search bar to find files quickly
- Right-click on files for additional options

### 🔒 File Encryption

1. Navigate to the file you want to encrypt
2. Click the lock icon in the file actions
3. Enter a strong password
4. Click "Encrypt File"

To decrypt:
1. Navigate to the encrypted file (with .enc extension)
2. Click the unlock icon
3. Enter the original password
4. Click "Decrypt File"

### 📦 File Compression

1. Select multiple files using the checkboxes
2. Click "Compress" button in the toolbar
3. Choose compression format (ZIP or TAR.GZ)
4. Specify output location
5. Click "Compress Files"

### 🔗 File Sharing

1. Navigate to the file you want to share
2. Click the share icon
3. If sharing an encrypted file, you can optionally allow recipients to decrypt it
4. Click "Generate Secure Share Link"
5. Copy and share the one-time use link

### 📊 Analytics Dashboard

The analytics section provides:
- Overview of file statistics
- Storage usage visualization
- Activity trends and patterns
- Security metrics

## ⚙️ Configuration

Application settings can be configured through the Settings interface:
- Default directories
- Security preferences
- UI preferences

## 🛡️ Security Considerations

- All encryption is performed locally; no keys are sent to any servers
- Passwords are never stored, ensure you remember them for encrypted files
- One-time use links expire after being accessed once

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details
# CI/CD Documentation for Secure File Manager

This document describes the continuous integration and deployment setup for the Secure File Manager project.

## Overview

The CI/CD pipeline is implemented using GitHub Actions and provides:

-  **Automated Building** for Linux, Windows, and macOS
-  **Comprehensive Testing** across multiple environments
-  **Security Scanning** and vulnerability detection
-  **Automated Releases** with proper versioning
-  **Quality Assurance** through code analysis

## Workflows

### 1. Build and Release (`build-and-release.yml`)

**Triggers:**
- Push to `main` branch
- Push of version tags (`v*`)
- Pull requests to `main` branch

**Features:**
- **Linux Build**: Uses Docker container for consistent environment
- **Windows Build**: Native Windows runner with Node.js setup
- **macOS Build**: Only triggered on tag pushes (optional)
- **Automated Releases**: Creates GitHub releases when tags are pushed

**Build Outputs:**
- **Linux**: AppImage, DEB, RPM, TAR.GZ packages
- **Windows**: NSIS installer, Portable executable, ZIP archive
- **macOS**: DMG installer, ZIP archive

### 2. Automated Testing (`test.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests
- Daily scheduled runs (6 AM UTC)

**Test Matrix:**
- **Node.js versions**: 16, 18, 20
- **Operating systems**: Ubuntu, Windows, macOS
- **Electron app testing**: Cross-platform startup verification

**Test Types:**
- Unit and integration tests
- Security vulnerability scanning
- Performance analysis
- Bundle size optimization
- Secret detection

### 3. Code Quality Check (`code-quality.yml`)

**Features:**
- Dependency analysis and vulnerability scanning
- Package size monitoring
- License compliance checking
- Build artifact analysis
- Outdated package detection

### 4. Version Management (`version-bump.yml`)

**Manual Trigger**: Workflow dispatch with version type selection

**Version Types:**
- `patch`: Bug fixes (1.0.0 → 1.0.1)
- `minor`: New features (1.0.0 → 1.1.0)
- `major`: Breaking changes (1.0.0 → 2.0.0)
- `prerelease`: Pre-release versions (1.0.0 → 1.0.1-beta.0)

## Docker Build Environment

The Linux build uses a custom Docker container (`Dockerfile`) that includes:

### System Dependencies
- Node.js 18 (Bullseye base)
- Build tools (build-essential, git, python3)
- GUI libraries (GTK3, GBM, NSS, etc.)
- Electron-specific dependencies
- Virtual display support (Xvfb)

### Security Features
- Non-root user execution
- Minimal attack surface
- Proper cache management
- Environment isolation

### Build Optimization
- Multi-layer caching
- Dependency pre-installation
- Optimized package installation

## Local Development

### Prerequisites
- Node.js 16+ 
- npm
- Docker (recommended for Linux builds)

### Build Script Usage

```bash
# Make script executable
chmod +x local-build.sh

# Build for specific platform
./local-build.sh linux
./local-build.sh windows
./local-build.sh mac

# Build for all platforms
./local-build.sh all

# Show help
./local-build.sh help
```

### Build Targets

| Target | Packages | Requirements |
|--------|----------|--------------|
| `linux` | AppImage, DEB, RPM | Docker (recommended) |
| `windows` | NSIS, Portable, ZIP | Any OS |
| `mac` | DMG, ZIP | macOS only |
| `all` | All available | Platform dependent |

## Release Process

### Automated Release (Recommended)

1. **Create Version Tag**:
   ```bash
   # Use GitHub Actions workflow dispatch
   # Go to Actions → Version Bump and Tag → Run workflow
   ```

2. **Automatic Process**:
   - Version bump in `package.json`
   - Git tag creation
   - Build for all platforms
   - GitHub release creation
   - Asset upload

### Manual Release

1. **Bump Version**:
   ```bash
   npm version patch  # or minor, major
   ```

2. **Push Tag**:
   ```bash
   git push origin main --tags
   ```

3. **Monitor Build**:
   - Check GitHub Actions for build status
   - Review generated release assets

## Environment Variables and Secrets

### Required Secrets (Optional)
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `CSC_LINK`: Code signing certificate (Windows/macOS)
- `CSC_KEY_PASSWORD`: Certificate password

### Environment Configuration
- `NODE_ENV=production`: Production build mode
- `CI=true`: Continuous integration flag
- Cache directories for improved build performance

## Monitoring and Troubleshooting

### Build Monitoring
- **GitHub Actions Dashboard**: Monitor workflow status
- **Build Artifacts**: Download and test generated packages
- **Step Summary**: Review detailed build information

### Common Issues

1. **Node.js Version Mismatch**
   - Ensure Node.js 16+ is used
   - Check matrix builds for compatibility

2. **Docker Build Failures**
   - Verify Dockerfile syntax
   - Check system dependencies
   - Monitor Docker image size

3. **Package Size Issues**
   - Review dependency analysis
   - Optimize bundle size
   - Remove unused dependencies

4. **Cross-Platform Compatibility**
   - Test on target platforms
   - Check native module compatibility
   - Verify file path handling

### Debug Commands

```bash
# Check build logs
npm run build --verbose

# Test Docker build locally
docker build -t test-build .
docker run --rm -v $(pwd):/workspace -w /workspace test-build npm run dist:linux

# Analyze bundle size
npm run build
du -sh build/*
```

## Security Considerations

### Build Security
-  Non-root user in Docker container
-  Dependency vulnerability scanning
-  Secret detection in source code
-  Signed packages (when certificates available)

### Supply Chain Security
-  `npm ci` for reproducible builds
-  Dependency pinning
-  Regular security audits
-  Build environment isolation

## Performance Optimization

### Build Performance
- Multi-layer Docker caching
- npm cache optimization
- Parallel job execution
- Artifact caching

### Package Optimization
- Bundle size monitoring
- Dependency analysis
- Unused code elimination
- Asset optimization

## Maintenance

### Regular Tasks
- **Weekly**: Review dependency updates
- **Monthly**: Security audit review
- **Quarterly**: Build environment updates
- **As needed**: Workflow optimization

### Updates Required
- Node.js version updates
- GitHub Actions version updates
- System dependency updates
- Security patch applications

## Support and Contributing

For CI/CD related issues:
1. Check GitHub Actions logs
2. Review this documentation
3. Test local build process
4. Create detailed issue reports

### Workflow Modifications
- Test changes in feature branches
- Use workflow dispatch for testing
- Monitor resource usage
- Document configuration changes

---

**Last Updated**: July 2025  
**Maintainer**: CI/CD Team  
**Documentation Version**: 1.0

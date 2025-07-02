# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Secure File Manager seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to: [ivankorobkin0@gmail.com]

Include the following information:
- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- We will acknowledge receipt of your vulnerability report within 72 hours
- We will provide a detailed response within 7 days indicating the next steps
- We will work with you to understand and validate the vulnerability
- We will keep you informed of our progress throughout the process
- We will credit you in our security advisory (unless you prefer to remain anonymous)

### Security Measures

This project includes several security measures:

#### Code Security
- Regular dependency updates via Dependabot
- Automated security scanning in CI/CD pipeline
- Code signing for release binaries (when available)
- Input validation and sanitization

#### Build Security
- Docker-based build environment isolation
- Non-root user execution in containers
- Minimal attack surface in build images
- Secure artifact handling

#### Application Security
- AES-256-GCM encryption for file protection
- PBKDF2 key derivation with 100,000+ iterations
- Two-factor authentication support
- Rate limiting and intrusion detection
- Secure session management
- Zero-knowledge architecture for P2P sync

#### Dependencies
- Regular security audits with `npm audit`
- Automated vulnerability detection
- Dependency version pinning for reproducible builds
- Supply chain attack prevention

### Security Best Practices for Users

1. **Keep the application updated** to the latest version
2. **Use strong master passwords** for secure notes and encryption
3. **Enable two-factor authentication** when available
4. **Regularly review access logs** for suspicious activity
5. **Use secure sharing practices** with expiring links
6. **Keep your system updated** with latest security patches

### Scope

This security policy applies to:
- The main Secure File Manager application
- Build and deployment infrastructure
- Dependencies and third-party libraries
- Documentation and guides

Out of scope:
- User-generated content and configurations
- Third-party plugins or extensions
- Issues in underlying operating systems
- Social engineering attacks

### Recognition

We believe in coordinated disclosure and will recognize security researchers who:
- Follow our responsible disclosure process
- Provide sufficient detail to reproduce the issue
- Avoid accessing or modifying user data
- Do not perform attacks against our infrastructure

Thank you for helping keep Secure File Manager and our users safe!

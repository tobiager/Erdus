# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

The Erdus team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing the maintainers directly. You can find maintainer contact information in the repository's main page.

Include the following information in your report:
- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### Response Timeline

We will respond to security vulnerability reports within 48 hours. We will work with you to understand and resolve the issue as quickly as possible.

## Security Considerations

### Client-Side Processing
Erdus is designed with privacy and security in mind:
- **100% client-side processing**: All file processing happens in your browser
- **No server uploads**: Files never leave your device
- **No data collection**: We don't collect or store any user data
- **Offline capable**: Works completely offline after initial load

### Dependencies
We regularly update dependencies to address known security vulnerabilities. The project uses:
- Automated dependency scanning
- Regular security audits with `npm audit`
- Dependabot for automated security updates

### Browser Security
- Uses modern ES modules and secure JavaScript practices
- Content Security Policy headers in production deployment
- No unsafe eval() or innerHTML usage
- Sanitized file processing with proper error handling

## Security Best Practices for Users

1. **Keep your browser updated** to ensure you have the latest security patches
2. **Only process trusted files** - while Erdus processes files client-side, be cautious with files from unknown sources
3. **Use HTTPS** when accessing the web version
4. **Verify file integrity** after conversion using the built-in validation

## Vulnerability Disclosure Policy

We believe in responsible disclosure and will:
1. Confirm receipt of your vulnerability report
2. Provide an estimated timeframe for resolution
3. Notify you when the vulnerability is resolved
4. Credit you in our security advisories (if desired)

Thank you for helping keep Erdus and our users safe!
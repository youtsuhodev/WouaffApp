# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please:

1. **Do not** open a public GitHub issue
2. Send details to the project maintainers via email or open a [draft security advisory](https://github.com/your-username/wouaff/security/advisories/new)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

You should receive a response within 48 hours. We'll keep you informed as we work on a fix.

## Responsible Disclosure

We ask that you:

- Give us reasonable time to fix the issue before disclosing it publicly
- Make every effort to avoid privacy violations, data destruction, or service disruption

## Security Measures

This project implements:

- **End-to-end encryption** (ECDH P-256 + AES-256-GCM)
- **Session-based authentication** with httpOnly cookies
- **Rate limiting** on authentication and messaging endpoints
- **XSS prevention** through HTML sanitization
- **Input validation** on all API endpoints
- **Dependency scanning** (review dependencies regularly)

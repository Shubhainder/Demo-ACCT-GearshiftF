# Privacy Policy & Data Handling

 

## Overview

The Adaptive Cognitive Control Task (ACCT) is designed with privacy and data protection as core principles. This document outlines our data collection, storage, and handling practices.

## Data Collection

### What We Collect

The ACCT collects the following data during experiment sessions:

1. **Performance Data**:
   - Response times (milliseconds)
   - Accuracy (correct/incorrect)
   - Trial-by-trial data
   - Block performance metrics
   - Difficulty level adjustments

2. **Session Metadata**:
   - Unique session ID (generated locally)
   - Session start/end times
   - Completion status
   - Browser/device information (if enabled)

3. **Authentication Data**:
   - Username (demo mode only)
   - Locally generated user ID
   - Login timestamp

### What We Do NOT Collect

- **NO** personally identifiable information (PII)
- **NO** names, emails, or contact information
- **NO** IP addresses
- **NO** geolocation data
- **NO** cross-site tracking
- **NO** third-party analytics

## Data Storage

### Local Storage

- All participant data is **immediately saved to browser localStorage**
- Data persists on the participant's device
- Participants can clear data by clearing browser storage

### Firebase Cloud Storage (Optional)

If Firebase is configured:

- Data is stored in **Firestore** with pseudonymous user IDs
- Writes are batched (every 10 trials or 30 seconds) for efficiency
- Data is encrypted in transit (HTTPS)
- Data is encrypted at rest (Firebase default)

## Data Access & Control

### Participant Rights

Participants have the right to:

1. **Access**: View their data via the completion screen
2. **Export**: Download data in CSV or JSON format
3. **Delete**: Clear local data by clearing browser storage
4. **Opt-out**: Close browser to discontinue participation

### Researcher Access

- Researchers can access aggregated data via the admin dashboard
- Admin dashboard requires password authentication
- No individual participant identification is possible

## Data Retention

- **Local Storage**: Data persists until participant clears browser storage
- **Firebase**: Data retained according to research protocol (typically 2-5 years)
- **Post-Study**: Participants are informed about data retention during debrief

## Data Security

### Security Measures

1. **Content Security Policy (CSP)**: Prevents XSS attacks
2. **Input Sanitization**: All user inputs are sanitized
3. **Rate Limiting**: Login attempts are rate-limited (5 attempts per 5 minutes)
4. **HTTPS Only**: All data transmission uses encrypted connections
5. **No External Scripts**: No third-party tracking or analytics

 

 

## Research Ethics

### Informed Consent

- Participants receive full information about data collection
- Consent is required before experiment starts
- Participants can withdraw at any time

### Data Anonymization

- User IDs are pseudonymous (randomly generated)
- No link between user IDs and real identities
- Data aggregated for analysis

### Institutional Review Board (IRB)

Researchers using ACCT should:
- Obtain IRB approval before data collection
- Follow institutional data handling protocols
- Provide participants with IRB contact information

## Third-Party Services

### Firebase (Optional)

If Firebase is enabled:
- **Provider**: Google Cloud Platform
- **Purpose**: Cloud data storage
- **Data Location**: Configurable (US, EU, etc.)
-  

### Chart.js (Visualization)

- **Provider**: Chart.js (open source)
- **Purpose**: Data visualization only
- **Data Sharing**: None (runs locally)

## Changes to This Policy

We may update this privacy policy to reflect changes in:
- Legal requirements
- Data practices
- Platform features

 

## Contact

For privacy questions or concerns:
- **Email**: privacy@example.com
- **GitHub Issues**: https://github.com/shubhainder/Demo-ACCT-GearshiftF/issues

## Acknowledgment

By using the ACCT, participants acknowledge that they have read and understood this privacy policy.

---

**Note to Researchers**: Customize this policy to match your institution's requirements and obtain legal review before deployment.

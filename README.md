# Secure Payslip Manager (Local Desktop App)

This is a secure, offline-first desktop application for managing employees and generating PDF payslips. It uses a local SQLite database and requires a master password for access.

## Features
- **Secure Access**: Master password protection (bcrypt hashed).
- **Local Database**: All data stored securely in `userData` (SQLite).
- **Payslip Generation**: Generates professional PDF payslips.
- **Email Delivery**: Send payslips via SMTP directly from the app.
- **Employee Management**: Manage staff details, bank info, and status.

## Prerequisites
To build and run this application, you must have the following installed:
1. **Node.js**: [Download Here](https://nodejs.org/) (LTS Version recommended).
   - Verify with `node -v` and `npm -v`.

## Installation & Setup

1. **Install Dependencies**
   Open a terminal in this folder and run:
   ```bash
   npm install
   ```
   *Note: If you encounter errors with `better-sqlite3`, ensure you have build tools installed, or try running `npm install --build-from-source`.*

2. **Run in Development Mode**
   To start the app for testing:
   ```bash
   npm run dev
   ```

3. **Build Installer / Executable**
   To create the final `.exe` file (Windows):
   ```bash
   npm run dist
   ```
   The output installer will be in the `dist/` or `dist-electron/` folder.

## Initial Setup (First Run)
1. Launch the application.
2. You will be prompted to create a **Master Password**.
   - Make sure to remember this password. **There is no recovery option** for security reasons.
3. Once set, use this password to login.

## Configuration
- **SMTP Settings**: Go to the "Settings" tab in the app to configure your email provider (Gmail, Outlook, etc.) for sending payslips.
  - **Note**: The "From" address is hardcoded to `raohamzabadar@euroshub.com` for security and compliance. You cannot change this in the settings. Ensure your SMTP user is authorized to send as this address.
- **Database Backup**: The database is located at:
  - Windows: `%APPDATA%\payslip-manager\payslip.db`
  - You can back up this file manually.

## Security Note
- Passwords are hashed using `bcrypt`.
- No data is sent to the cloud (except via your SMTP server).
- PDFs are stored locally in your Documents folder under `Payslips/`.

## Troubleshooting
- **Build Errors**: Ensure you have C++ build tools if `better-sqlite3` fails. Windows users can run:
  `npm install --global --production windows-build-tools` (Admin PowerShell)
- **PDF Fonts**: The app uses standard fonts to ensure compatibility.

---
**Author**: Antigravity
**License**: MIT

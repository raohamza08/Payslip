# Admin Password Management Guide

## Overview
Each user (Super Admin, Admin, and Employee) in the EuroShub Portal has their own unique password. When prompted for a "master password" during sensitive operations, the system validates against **your individual password**, not a shared system password.

## How It Works

### 1. Individual User Passwords
- Every user account has its own password stored securely (hashed with bcrypt)
- **Super Admin**: Set during initial system setup
- **Admin**: Set when the Super Admin adds them to the whitelist and they sign up
- **Employee**: Set when they create their account after being whitelisted

### 2. Password Confirmation
When you perform sensitive actions (like sending payslips, accessing reports, etc.), the system asks for your password to confirm it's really you. This validates against **your own password**, not the Super Admin's password.

### 3. Changing Your Password

#### For All Users (Admin, Super Admin, Employee):
1. Navigate to **Settings** (from the sidebar)
2. Click on the **Security** tab
3. Fill in the password change form:
   - **Current Password**: Your existing password
   - **New Password**: Must be at least 8 characters
   - **Confirm New Password**: Re-type your new password
4. Click **Change Password**
5. You'll see a success message if the change was successful

#### Important Notes:
- Your current password must be correct to make the change
- The new password must be at least 8 characters long
- Both new password fields must match
- After changing your password, use the new password for all future logins and confirmations

## Security Best Practices

### For Super Admins:
- Use a strong, unique password for your account
- Change your password periodically (every 3-6 months)
- Never share your password with anyone
- When adding new admins, ensure they set strong passwords

### For Admins:
- Set a strong password when you first create your account
- Your password is independent of the Super Admin's password
- Change your password if you suspect it has been compromised
- Use the Security tab in Settings to update your password anytime

### For Employees:
- Set a secure password when you sign up
- Change your password regularly
- Your password protects your personal payslip and attendance data

## Troubleshooting

### "Current password is incorrect"
- Double-check you're entering your current password correctly
- Passwords are case-sensitive
- If you've forgotten your password, contact the Super Admin for a reset

### "Password must be at least 8 characters"
- Ensure your new password is 8 or more characters long
- Consider using a mix of letters, numbers, and symbols for better security

### "Passwords do not match"
- Make sure both the "New Password" and "Confirm New Password" fields contain exactly the same text

## Technical Details

### Backend Implementation
- Passwords are hashed using bcrypt with 10 salt rounds
- Password verification happens at `/api/auth/confirm` endpoint
- Password changes are processed at `/api/auth/change-password` endpoint
- All password operations are logged for security auditing

### Database Storage
- User passwords are stored in the `users` table
- Each user has their own `password_hash` field
- Passwords are never stored in plain text
- The system uses Supabase for secure data storage

## FAQ

**Q: Can the Super Admin see my password?**
A: No. Passwords are hashed and cannot be reversed. Even the Super Admin cannot see your actual password.

**Q: What happens if I forget my password?**
A: Contact the Super Admin. They can reset your account or help you regain access.

**Q: Can I use the same password as another user?**
A: While technically possible, it's not recommended for security reasons. Each user should have a unique password.

**Q: How often should I change my password?**
A: It's recommended to change your password every 3-6 months, or immediately if you suspect it has been compromised.

**Q: Is my password encrypted during transmission?**
A: Yes, when deployed with HTTPS, all password transmissions are encrypted. For local development, ensure you're using the app in a secure environment.

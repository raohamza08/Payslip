# Master Password System Guide

## Overview
The EuroShub Portal now uses a **dual-password system** for admin users:
- **Login Password**: Used to log into the system
- **Master Password**: Used to access sensitive sections (payroll, reports, attendance, etc.)

This separation provides enhanced security by requiring a second password for critical operations.

## ⚠️ CRITICAL: Database Update Required

Before using this feature, you must update your database schema.
1. Open `UPDATE_SCHEMA.sql` in the project root
2. Copy the SQL commands
3. Go to your Supabase Dashboard → SQL Editor
4. Paste and run the commands to add the necessary columns

## How It Works

### For Super Admin (Initial Setup)
During the initial system setup:
1. You create your Super Admin account with a single password
2. This password is used for **both** login and master password initially
3. You can later change either password independently in Settings

### For Admin Users
When the Super Admin adds an admin to the whitelist:
1. Super Admin selects the role as "Admin" when whitelisting the email
2. When the admin signs up, they must provide:
   - **Login Password**: For daily login (minimum 8 characters)
   - **Master Password**: For accessing sensitive sections (minimum 8 characters)
3. These two passwords can be different for better security

### For Employees
Employees only need a **Login Password**:
- No master password required
- Cannot access protected administrative sections
- Simple signup process with just email and password

## Protected Sections

The following sections require **Master Password** confirmation:
- ✅ Attendance Management
- ✅ Reports & KPIs
- ✅ Leave Requests (Admin view)
- ✅ Asset Management
- ✅ Disciplinary Actions
- ✅ Sending Payslips via Email

## Step-by-Step Workflows

### 1. Super Admin: Adding a New Admin

1. Navigate to **Whitelist** (in the sidebar under SYSTEM)
2. Enter the admin's email address
3. Select **"Admin"** from the Role dropdown
4. Click **"Add to Whitelist"**
5. The admin will receive instructions to sign up

### 2. Admin: Signing Up

1. Go to the signup page
2. Enter your whitelisted email address
3. The system automatically detects you're an admin
4. Fill in:
   - **Login Password**: Your daily login password
   - **Master Password**: Your security password for sensitive sections
   - **Confirm Master Password**: Re-type your master password
5. Click **"Sign Up"**
6. You'll see a confirmation: "Account created as admin! Please login."

### 3. Admin: Accessing Protected Sections

1. Log in with your **Login Password**
2. Navigate to a protected section (e.g., Attendance)
3. A security prompt appears: "Please enter Admin PIN to continue"
4. Enter your **Master Password** (not your login password)
5. Access granted!

### 4. Employee: Signing Up

1. Go to the signup page
2. Enter your whitelisted email address
3. Fill in:
   - **Login Password**: Your password for the system
4. Click **"Sign Up"**
5. You'll see: "Account created as employee! Please login."

## Security Best Practices

### For Super Admins:
- ✅ Use a **strong, unique** master password
- ✅ **Never share** your master password
- ✅ Assign roles carefully when whitelisting
- ✅ Periodically review who has admin access
- ✅ Change your master password every 3-6 months

### For Admins:
- ✅ Use **different passwords** for login and master password
- ✅ Make your master password **stronger** (it protects sensitive data)
- ✅ **Never write down** your master password
- ✅ Don't share your master password with other admins
- ✅ If you suspect compromise, change it immediately in Settings

### For Employees:
- ✅ Use a strong login password
- ✅ Change your password regularly
- ✅ Don't share your credentials

## Password Requirements

### Login Password:
- Minimum 8 characters
- Used for daily system access
- Can be changed in Settings → Security

### Master Password (Admin only):
- Minimum 8 characters
- Used for accessing sensitive sections
- Should be **different** from login password
- Can be changed in Settings → Security

## Changing Your Passwords

### Changing Login Password:
1. Go to **Settings** → **Security** tab
2. Fill in the "Change Password" form:
   - Current Password
   - New Password
   - Confirm New Password
3. Click **"Change Password"**

### Changing Master Password:
Currently, master password can only be set during signup. A future update will allow changing it in Settings.

## Troubleshooting

### "Master password is required for admin accounts"
- **Cause**: You're signing up as an admin but didn't provide a master password
- **Solution**: Fill in both the "Master Password" and "Confirm Master Password" fields

### "Master passwords do not match"
- **Cause**: The two master password fields don't match
- **Solution**: Ensure both fields contain exactly the same password

### "Incorrect master password"
- **Cause**: You entered the wrong master password when accessing a protected section
- **Solution**: Enter your **master password**, not your login password

### "Master password not configured"
- **Cause**: Your admin account was created before the master password system was implemented
- **Solution**: Contact the Super Admin to reset your account

### I forgot my master password
- **Contact**: Super Admin
- **Action**: The Super Admin can reset your account or help you regain access

## Technical Details

### Database Schema:
```sql
users table:
- email (unique)
- password_hash (for login)
- master_password_hash (for admin users only)
- role (super_admin, admin, or employee)
```

### Whitelist Schema:
```sql
whitelist table:
- email (unique)
- role (super_admin, admin, or employee)
- created_at
```

### Password Hashing:
- All passwords are hashed using **bcrypt** with 10 salt rounds
- Passwords are never stored in plain text
- Even admins cannot see other users' passwords

### API Endpoints:
- `POST /api/auth/signup` - Accepts `masterPassword` for admin users
- `POST /api/auth/confirm` - Validates master password for admins
- `POST /api/whitelist` - Accepts `role` parameter

## FAQ

**Q: Can I use the same password for login and master password?**
A: Yes, but it's not recommended for security reasons. Using different passwords provides better protection.

**Q: What happens if I enter my login password when prompted for master password?**
A: Access will be denied. The system specifically checks your master password for protected sections.

**Q: Can employees access protected sections?**
A: No. Even if they somehow reach a protected section, the system will deny access.

**Q: Can I change my master password after signup?**
A: Currently, master password can only be set during signup. A future update will add this feature to Settings.

**Q: What if I'm already an admin but don't have a master password?**
A: Contact the Super Admin. They may need to remove and re-add you to the whitelist so you can sign up again with a master password.

**Q: How do I know which password to use?**
A: 
- **Login screen**: Use your Login Password
- **Security prompts** (when accessing sensitive sections): Use your Master Password

**Q: Is the master password encrypted during transmission?**
A: Yes, when deployed with HTTPS, all password transmissions are encrypted. For local development, ensure you're using the app in a secure environment.

## Migration Notes

If you're upgrading from a previous version:
1. Existing super admin accounts will use their login password as the master password
2. Existing admin accounts may need to be recreated to set a master password
3. Employee accounts are unaffected
4. The whitelist now includes a role column - existing entries default to "employee"

## Support

For issues or questions:
- Contact your Super Admin
- Check the Activity Logs for security events
- Review this guide for common solutions

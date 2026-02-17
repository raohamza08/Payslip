const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const archiver = require('archiver');
const PdfPrinter = require('pdfmake');
const fs = require('fs');
const os = require('os');
const supabase = require('./supabase');
// Local NeDB fallback removed - Using Supabase only

const fileUpload = require('express-fileupload');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const PDF_DIR = path.join(__dirname, '../uploads/payslips');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const DOCS_DIR = path.join(UPLOADS_DIR, 'documents');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR);

const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

// Ensure Storage Buckets
(async function ensureBuckets() {
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('[INIT] Failed to list buckets:', error.message);
            return;
        }
        if (!buckets.find(b => b.name === 'documents')) {
            console.log('[INIT] Creating "documents" bucket...');
            const { error: createError } = await supabase.storage.createBucket('documents', {
                public: false // Restricted, we serve via proxy
            });
            if (createError) console.error('[INIT] Failed to create bucket:', createError.message);
        }
        if (!buckets.find(b => b.name === 'payslips')) {
            console.log('[INIT] Creating "payslips" bucket...');
            const { error: createError } = await supabase.storage.createBucket('payslips', {
                public: false
            });
            if (createError) console.error('[INIT] Failed to create payslips bucket:', createError.message);
        }
    } catch (e) {
        console.error('[INIT] Bucket check failed:', e.message);
    }
})();

// Logging Helper
async function logActivity(user_email, action, status, details = '', req = null) {
    try {
        const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : 'system';
        await supabase.from('logs').insert({
            user_email,
            action,
            status,
            details,
            ip_address: ip
        });
    } catch (e) {
        console.error('[LOG ERROR]', e);
    }
}

// Notification Helper
async function createNotification({ user_id, target_user_id, title, message, type, link }) {
    try {
        // user_id is optional (specific user), target_user_id can be role or email/ID
        await supabase.from('notifications').insert({
            user_id,
            target_user_id,
            title,
            message,
            type,
            link
        });
    } catch (e) {
        console.error('[NOTIF ERROR]', e);
    }
}

// Auth Routes
app.get('/api/auth/is-setup', async (req, res) => {
    try {
        const { data, error } = await supabase.from('config').select('is_setup').eq('id', 1).maybeSingle();
        if (error && error.code !== 'PGRST116') throw error;
        res.json({ isSetup: data?.is_setup || false });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/setup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: config, error: configError } = await supabase.from('config').select('is_setup').eq('id', 1).maybeSingle();

        if (config?.is_setup) {
            return res.status(400).json({ error: "System already setup" });
        }

        const hash = await bcrypt.hash(password, 10);
        // Create Super Admin User with master password
        const { error: userError } = await supabase.from('users').insert({
            email,
            password_hash: hash,
            master_password_hash: hash, // Same password for both initially
            role: 'super_admin',
            permissions: ['employees', 'payroll', 'attendance', 'reports', 'expenses', 'performance', 'assets', 'warnings', 'email', 'admin-leaves'] // All permissions for super_admin
        });
        if (userError) throw userError;

        // Also whitelist the admin
        await supabase.from('whitelist').upsert({ email }, { onConflict: 'email' });

        // Mark as setup
        const { error: configErr } = await supabase.from('config').upsert({
            id: 1,
            is_setup: true,
            master_password_hash: hash
        });
        if (configErr) throw configErr;

        await logActivity(email, 'INITIAL_SETUP', 'SUCCESS', 'System initialized and super admin created', req);
        res.json({ success: true });
    } catch (e) {
        await logActivity('system', 'INITIAL_SETUP', 'FAIL', `System setup failed: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, masterPassword } = req.body;

        // 1. Check Whitelist and get assigned role
        const { data: whitelisted } = await supabase.from('whitelist').select('email, role').eq('email', email).single();
        if (!whitelisted) {
            await logActivity(email, 'SIGNUP_ATTEMPT', 'FAIL', 'Email not whitelisted', req);
            return res.status(403).json({ error: "Email not whitelisted. Contact admin." });
        }

        // 2. Check if user already exists
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
        if (existing) {
            await logActivity(email, 'SIGNUP_ATTEMPT', 'FAIL', 'User already registered', req);
            return res.status(400).json({ error: "User already registered." });
        }

        // 3. Validate master password for admin users
        const assignedRole = whitelisted.role || 'employee';
        if ((assignedRole === 'admin' || assignedRole === 'super_admin') && !masterPassword) {
            return res.status(400).json({ error: "Master password is required for admin accounts." });
        }

        // 4. Create User
        const passwordHash = await bcrypt.hash(password, 10);
        const userInsert = {
            email,
            password_hash: passwordHash,
            role: assignedRole,
            permissions: []
        };

        // Add master password hash for admin users
        if (assignedRole === 'admin' || assignedRole === 'super_admin') {
            userInsert.master_password_hash = await bcrypt.hash(masterPassword, 10);
        }

        await supabase.from('users').insert(userInsert);

        await logActivity(email, 'SIGNUP_SUCCESS', 'SUCCESS', `New ${assignedRole} registered`, req);
        res.json({ success: true, role: assignedRole });
    } catch (e) {
        await logActivity(req.body.email || 'unknown', 'SIGNUP_ATTEMPT', 'ERROR', `Signup failed: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/check-role', async (req, res) => {
    try {
        const { email } = req.body;
        const { data: whitelisted } = await supabase.from('whitelist').select('role').eq('email', email).maybeSingle();

        if (whitelisted) {
            res.json({ exists: true, role: whitelisted.role });
        } else {
            res.json({ exists: false });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: user } = await supabase.from('users').select('*').eq('email', email).single();

        if (!user) {
            await logActivity(email, 'LOGIN_ATTEMPT', 'FAIL', 'User not found', req);
            return res.status(401).json({ success: false, error: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            await logActivity(email, 'LOGIN_ATTEMPT', 'FAIL', 'Invalid password', req);
            return res.status(401).json({ success: false, error: "Invalid credentials" });
        }

        await logActivity(email, 'LOGIN_SUCCESS', 'SUCCESS', `Logged in as ${user.role}`, req);
        res.json({
            success: true,
            user: {
                email: user.email,
                role: user.role,
                name: user.name, // If you have it
                permissions: Array.isArray(user.permissions) ? user.permissions : []
            }
        });
    } catch (e) {
        await logActivity(req.body.email || 'unknown', 'LOGIN_ATTEMPT', 'ERROR', `Login failed: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/auth/me', async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        if (!email) return res.status(401).json({ error: 'Not authenticated' });

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, role, permissions')
            .eq('email', email)
            .single();

        if (error || !user) throw new Error('User not found');

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : []
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/confirm', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: user } = await supabase.from('users').select('role, master_password_hash').eq('email', email).single();
        if (!user) {
            await logActivity(email, 'CONFIRM_PASSWORD', 'FAIL', 'User not found for confirmation', req);
            return res.status(401).json({ success: false });
        }

        // For admin users, verify against master password
        if (user.role === 'admin' || user.role === 'super_admin') {
            if (!user.master_password_hash) {
                await logActivity(email, 'CONFIRM_PASSWORD', 'FAIL', 'Master password not set', req);
                return res.status(401).json({ success: false, error: 'Master password not configured' });
            }
            const match = await bcrypt.compare(password, user.master_password_hash);
            if (match) {
                await logActivity(email, 'CONFIRM_PASSWORD', 'SUCCESS', 'Master password confirmed', req);
            } else {
                await logActivity(email, 'CONFIRM_PASSWORD', 'FAIL', 'Incorrect master password', req);
            }
            res.json({ success: match });
        } else {
            // Employees shouldn't be accessing protected sections
            await logActivity(email, 'CONFIRM_PASSWORD', 'FAIL', 'Employee attempted to access protected section', req);
            res.status(403).json({ success: false, error: 'Access denied' });
        }
    } catch (e) {
        await logActivity(req.body.email || 'unknown', 'CONFIRM_PASSWORD', 'ERROR', `Confirmation failed: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/change-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        // 1. Verify user exists and current password is correct
        const { data: user } = await supabase.from('users').select('password_hash').eq('email', email).single();
        if (!user) {
            await logActivity(email, 'CHANGE_PASSWORD', 'FAIL', 'User not found', req);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) {
            await logActivity(email, 'CHANGE_PASSWORD', 'FAIL', 'Current password incorrect', req);
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }

        // 2. Hash new password and update
        const newHash = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: newHash })
            .eq('email', email);

        if (updateError) throw updateError;

        await logActivity(email, 'CHANGE_PASSWORD', 'SUCCESS', 'Password changed successfully', req);
        res.json({ success: true });
    } catch (e) {
        await logActivity(req.body.email || 'unknown', 'CHANGE_PASSWORD', 'ERROR', `Password change failed: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

// User Management Routes (Super Admin Only)
app.get('/api/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, role, created_at, permissions')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users/reset-master-password', async (req, res) => {
    try {
        const { email, newMasterPassword } = req.body;
        const adminEmail = req.headers['x-user-email'] || 'unknown';

        // Verify the user exists and is an admin
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('email', email)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(400).json({ error: 'Can only reset master password for admin users' });
        }

        // Hash and update master password
        const newHash = await bcrypt.hash(newMasterPassword, 10);
        const { error: updateError } = await supabase
            .from('users')
            .update({ master_password_hash: newHash })
            .eq('email', email);

        if (updateError) throw updateError;

        await logActivity(adminEmail, 'RESET_MASTER_PASSWORD', 'SUCCESS', `Reset master password for ${email}`, req);
        res.json({ success: true });
    } catch (e) {
        await logActivity(req.headers['x-user-email'] || 'unknown', 'RESET_MASTER_PASSWORD', 'ERROR', `Failed to reset master password: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users/reset-login-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const adminEmail = req.headers['x-user-email'] || 'unknown';

        // Verify user exists
        const { data: user } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash and update login password
        const newHash = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: newHash })
            .eq('email', email);

        if (updateError) throw updateError;

        await logActivity(adminEmail, 'RESET_LOGIN_PASSWORD', 'SUCCESS', `Reset login password for ${email}`, req);
        res.json({ success: true });
    } catch (e) {
        await logActivity(req.headers['x-user-email'] || 'unknown', 'RESET_LOGIN_PASSWORD', 'ERROR', `Failed to reset login password: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        const adminEmail = req.headers['x-user-email'] || 'unknown';

        // 1. Update user role
        const { data: updatedUser, error: userError } = await supabase
            .from('users')
            .update({ role })
            .eq('id', req.params.id)
            .select('email')
            .single();

        if (userError) throw userError;

        // 2. Also update whitelist for consistency
        if (updatedUser && updatedUser.email) {
            await supabase
                .from('whitelist')
                .update({ role })
                .eq('email', updatedUser.email);
        }

        await logActivity(adminEmail, 'UPDATE_USER_ROLE', 'SUCCESS', `Updated role for ${updatedUser.email} to ${role}`, req);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/users/:id/permissions', async (req, res) => {
    try {
        const { permissions } = req.body;
        const adminEmail = req.headers['x-user-email'] || 'unknown';

        const { error } = await supabase
            .from('users')
            .update({ permissions })
            .eq('id', req.params.id);

        if (error) throw error;

        await logActivity(adminEmail, 'UPDATE_USER_PERMISSIONS', 'SUCCESS', `Updated permissions for user ID ${req.params.id}`, req);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// Whitelist Routes (Super Admin Only - Front-end should enforce this check)
app.get('/api/whitelist', async (req, res) => {
    try {
        const { data } = await supabase.from('whitelist').select('*').order('created_at', { ascending: false });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/whitelist', async (req, res) => {
    try {
        const { email, role } = req.body;
        const userEmail = req.headers['x-user-email'] || 'unknown';

        // Default to employee if no role specified
        const assignedRole = role || 'employee';

        await supabase.from('whitelist').insert({ email, role: assignedRole });
        await logActivity(userEmail, 'ADD_WHITELIST_EMAIL', 'SUCCESS', `Added ${email} to whitelist as ${assignedRole}`, req);
        res.json({ success: true });
    } catch (e) {
        await logActivity(req.headers['x-user-email'] || 'unknown', 'ADD_WHITELIST_EMAIL', 'ERROR', `Failed to add ${req.body.email} to whitelist: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/whitelist/:id', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'] || 'unknown';
        const { data: whitelistedEmail } = await supabase.from('whitelist').select('email').eq('id', req.params.id).single();
        await supabase.from('whitelist').delete().eq('id', req.params.id);
        await logActivity(userEmail, 'DELETE_WHITELIST_EMAIL', 'SUCCESS', `Removed ${whitelistedEmail?.email || req.params.id} from whitelist`, req);
        res.json({ success: true });
    } catch (e) {
        await logActivity(req.headers['x-user-email'] || 'unknown', 'DELETE_WHITELIST_EMAIL', 'ERROR', `Failed to delete whitelist entry ${req.params.id}: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

// Employee Routes
app.get('/api/employees', async (req, res) => {
    try {
        const { data, error } = await supabase.from('employees').select('*').order('name');

        if (error) throw error;
        const { data: extensions } = await supabase.from('employee_extensions').select('*');
        const extMap = (extensions || []).reduce((acc, ext) => ({ ...acc, [ext.employee_id]: ext }), {});

        const mergedEmployees = (data || []).map(emp => ({
            ...emp,
            ...(extMap[emp.id] || {})
        }));
        res.json(mergedEmployees);
    } catch (e) {
        console.error('[EMPLOYEES] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/employees', async (req, res) => {
    try {
        const fullData = { ...req.body };
        const userEmail = req.headers['x-user-email'] || 'unknown';

        // Sanitize date fields: Postgres rejects empty strings for DATE
        const dateFields = ['joining_date', 'leaving_date', 'probation_end_date', 'dob'];
        dateFields.forEach(field => {
            if (fullData[field] === '') fullData[field] = null;
        });

        // 1. Separate Employees table fields from Extensions
        const extensionFields = ['office_number', 'shift_start', 'shift_end', 'shift_type'];
        const emp = {};
        const ext = {};

        // Also exclude UI fields and nested objects that don't belong in the table
        const excludeFields = ['_id', 'created_at', 'updated_at', 'increments'];

        Object.keys(fullData).forEach(key => {
            if (excludeFields.includes(key)) return;
            if (extensionFields.includes(key)) {
                ext[key] = fullData[key];
            } else {
                emp[key] = fullData[key];
            }
        });

        if (emp.id) {
            // Update Employees
            const { error: empError } = await supabase.from('employees').update(emp).eq('id', emp.id);
            if (empError) {
                console.error('[EMPLOYEES] Update error:', empError);
                throw new Error(`Employee Update Failed: ${empError.message}`);
            }

            // Update/Insert Extensions
            if (Object.keys(ext).length > 0) {
                const { error: extError } = await supabase.from('employee_extensions').upsert({ employee_id: emp.id, ...ext });
                if (extError) console.error('[EXTENSIONS] Update error:', extError);
            }

            await logActivity(userEmail, 'UPDATE_EMPLOYEE', 'SUCCESS', `Updated employee: ${emp.name}`, req);
            res.json({ id: emp.id });
        } else {
            // Create New
            emp.id = uuidv4();
            const { error: empError } = await supabase.from('employees').insert(emp);
            if (empError) {
                console.error('[EMPLOYEES] Insert error:', empError);
                throw new Error(`Employee Creation Failed: ${empError.message}`);
            }

            // Create Extensions
            if (Object.keys(ext).length > 0) {
                await supabase.from('employee_extensions').insert({ employee_id: emp.id, ...ext });
            }

            await logActivity(userEmail, 'CREATE_EMPLOYEE', 'SUCCESS', `Created employee: ${emp.name}`, req);
            res.json({ id: emp.id });
        }
    } catch (e) {
        console.error('[EMPLOYEES] Full Error:', e);
        await logActivity(req.headers['x-user-email'] || 'unknown', req.body.id ? 'UPDATE_EMPLOYEE' : 'CREATE_EMPLOYEE', 'ERROR', `Failed to ${req.body.id ? 'update' : 'create'} employee: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'] || 'unknown';
        const { data: emp } = await supabase.from('employees').select('name').eq('id', req.params.id).single();
        const { error } = await supabase.from('employees').delete().eq('id', req.params.id);
        if (error) throw error;

        // Supabase foreign keys with ON DELETE CASCADE will handle the rest (increments, payroll_defaults)

        await logActivity(userEmail, 'DELETE_EMPLOYEE', 'SUCCESS', `Deleted employee: ${emp?.name || req.params.id}`, req);
        res.json({ success: true });
    } catch (e) {
        await logActivity(req.headers['x-user-email'] || 'unknown', 'DELETE_EMPLOYEE', 'ERROR', `Failed to delete employee ${req.params.id}: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

// === MODULE 1: COMPANY EXPENSES ===
app.get('/api/expenses', async (req, res) => {
    try {
        const { start, end, category } = req.query;
        let query = supabase.from('expenses').select('*');

        if (start && end) {
            query = query.gte('expense_date', start).lte('expense_date', end);
        }
        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('expense_date', { ascending: false });

        if (error) throw error;

        // Map id to _id for frontend compatibility
        const expenses = (data || []).map(ex => ({ ...ex, _id: ex.id }));
        res.json(expenses);
    } catch (e) {
        console.error('[EXPENSES] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/expenses', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const expense = { ...req.body };
        delete expense._id; // Ensure we don't send existing local temp ID

        const { data, error } = await supabase.from('expenses').insert(expense).select().single();
        if (error) throw error;

        await logActivity(userEmail, 'CREATE_EXPENSE', 'SUCCESS', `Created expense: ${expense.title}`, req);
        res.json({ ...data, _id: data.id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/expenses/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const { _id, ...updateData } = req.body;
        const { data, error } = await supabase.from('expenses').update(updateData).eq('id', req.params.id).select().single();
        if (error) throw error;

        // Notify Employee
        if (updateData.status && data.employee_id) {
            const { data: emp } = await supabase.from('employees').select('email').eq('id', data.employee_id).single();
            if (emp) {
                await createNotification({
                    target_user_id: emp.email,
                    title: 'Expense Request Update',
                    message: `Your expense request "${data.title}" has been updated to "${updateData.status}".`,
                    type: 'expense',
                    link: '/portal'
                });
            }
        }

        await logActivity(userEmail, 'UPDATE_EXPENSE', 'SUCCESS', `Updated expense: ${updateData.title}`, req);
        res.json({ success: true, ...data, _id: data.id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/expenses/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const { error } = await supabase.from('expenses').delete().eq('id', req.params.id);
        if (error) throw error;

        await logActivity(userEmail, 'DELETE_EXPENSE', 'SUCCESS', `Deleted expense ID: ${req.params.id}`, req);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// === MODULE 3: INCREMENTS ===
app.get('/api/employees/:id/increments', async (req, res) => {
    try {
        const { data, error } = await supabase.from('increments').select('*').eq('employee_id', req.params.id).order('effective_date', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (e) {
        console.error('[INCREMENTS] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/employees/:id/increments', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        console.log('[INCREMENT] Received data:', req.body);
        console.log('[INCREMENT] Employee ID:', req.params.id);

        const {
            increment_percentage,
            increment_amount,
            old_salary,
            new_salary,
            reason,
            effective_date
        } = req.body;

        // Validate required fields
        if (!effective_date) {
            throw new Error('Effective date is required');
        }

        if (!new_salary && !increment_amount) {
            throw new Error('Either new_salary or increment_amount must be provided');
        }

        // Prepare increment record with all fields
        const increment = {
            employee_id: req.params.id,
            amount: Number(increment_amount) || 0,
            increment_percentage: increment_percentage ? Number(increment_percentage) : null,
            old_salary: old_salary ? Number(old_salary) : null,
            new_salary: new_salary ? Number(new_salary) : null,
            description: reason || '',
            effective_date
        };

        console.log('[INCREMENT] Inserting record into DB:', increment);

        const { data: insertedData, error: insertError } = await supabase.from('increments').insert(increment).select().single();
        if (insertError) {
            console.error('[INCREMENT] Insert Error:', insertError);
            throw new Error(`Failed to save increment record: ${insertError.message}`);
        }

        console.log('[INCREMENT] Successfully inserted. Result ID:', insertedData.id);

        // Update employee's monthly_salary if new_salary is provided
        if (new_salary) {
            console.log(`[INCREMENT] Attempting update on employees table for ID: ${req.params.id} to salary: ${new_salary}`);

            const { data: updatedEmployee, error: updateError } = await supabase
                .from('employees')
                .update({ monthly_salary: Number(new_salary) })
                .eq('id', req.params.id)
                .select();

            if (updateError) {
                console.error('[INCREMENT] Critical Salary Update Failure:', updateError);
                // We keep going but log this loudly
            } else if (!updatedEmployee || updatedEmployee.length === 0) {
                console.warn(`[INCREMENT] Salary update FAILED - NO ROWS AFFECTED. ID: ${req.params.id}`);
            } else {
                console.log('[INCREMENT] Employee record updated. Confirmed new salary in DB:', updatedEmployee[0].monthly_salary);
            }
        }

        await logActivity(
            userEmail,
            'ADD_INCREMENT',
            'SUCCESS',
            `Added ${increment_percentage ? increment_percentage + '%' : increment_amount} increment for employee ${req.params.id}. New salary: ${new_salary}`,
            req
        );

        console.log('[INCREMENT] Process Finished Successfully');
        res.json(insertedData);
    } catch (e) {
        console.error('[INCREMENT] Error:', e);
        console.error('[INCREMENT] Stack:', e.stack);
        res.status(500).json({ error: e.message });
    }
});

// Payslip Routes
// Payslip Routes
app.get('/api/payslips', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    try {
        // Check user role
        let isAdmin = false;
        let employeeId = null;

        if (userEmail) {
            // Check role in Supabase
            const { data: user } = await supabase.from('users').select('role').eq('email', userEmail).single();
            if (user && (user.role === 'admin' || user.role === 'super_admin')) {
                isAdmin = true;
            } else {
                // Get employee ID for current user
                // Try Supabase first
                const { data: emp } = await supabase.from('employees').select('id').eq('email', userEmail).single();
                if (emp) {
                    employeeId = emp.id;
                } else {
                    // No fallback
                }
            }
        }

        // --- Supabase Fetch ---
        let query = supabase.from('payslips').select('*').order('created_at', { ascending: false });
        if (!isAdmin && employeeId) {
            // Filter out drafts (where email_sent_at is NULL). Using gt('1970...') is a robust way to filter non-null timestamps.
            query = query.eq('employee_id', employeeId).gt('email_sent_at', '1970-01-01');
        } else if (!isAdmin && !employeeId) {
            // Employee but no ID found => return empty
            return res.json([]);
        }

        const { data: payslips, error: pError } = await query;

        let finalPayslips = [];
        let empMap = {};

        if (payslips && payslips.length > 0) {
            finalPayslips = payslips;
            // Fetch employees for mapping names
            const { data: employees } = await supabase.from('employees').select('id, name, email');
            if (employees) {
                empMap = employees.reduce((acc, e) => ({ ...acc, [e.id]: e }), {});
            }
        } else {
            // Supabase empty, return empty
            finalPayslips = [];
            empMap = {};
        }

        const result = finalPayslips.map(p => ({
            ...p,
            employee_name: empMap[p.employee_id]?.name || 'Unknown',
            employee_email: empMap[p.employee_id]?.email || ''
        }));
        res.json(result);
    } catch (e) {
        console.error('[PAYSLIPS] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Payslip Preview (No DB Insert)
app.post('/api/payslip/preview', async (req, res) => {
    try {
        const data = req.body;

        console.log('[PREVIEW] Generating PDF in memory...');
        const pdfBuffer = await generatePDF(data);
        console.log('[PREVIEW] PDF generated, size:', pdfBuffer.length, 'bytes');

        // Stream the buffer directly to response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
        res.send(pdfBuffer);
    } catch (e) {
        console.error('Preview Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/payslips/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        // 1. Get payslip record to find the filename
        const { data: payslip, error: fetchError } = await supabase
            .from('payslips')
            .select('pdf_path, employee_id')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !payslip) throw new Error('Payslip not found');

        // 2. Delete from Database
        const { error: dbError } = await supabase.from('payslips').delete().eq('id', req.params.id);
        if (dbError) throw dbError;

        // 3. Delete from Storage
        if (payslip.pdf_path) {
            const { error: storageError } = await supabase.storage.from('payslips').remove([payslip.pdf_path]);
            if (storageError) console.error('[STORAGE] Delete error:', storageError.message);
        }

        await logActivity(userEmail, 'DELETE_PAYSLIP', 'SUCCESS', `Deleted payslip ${req.params.id}`, req);
        res.json({ success: true });
    } catch (e) {
        console.error('[PAYSLIP] Delete Error:', e);
        await logActivity(userEmail, 'DELETE_PAYSLIP', 'ERROR', `Failed to delete payslip ${req.params.id}: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/payslip/generate', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const data = req.body;

        // Validation
        if (!data || !data.employee) {
            throw new Error('Invalid payload: missing employee data');
        }

        console.log('[PAYSLIP] Starting generation for:', data.employee.name);
        console.log('[PAYSLIP] Increments:', data.increments?.length || 0);

        const payslipId = uuidv4();
        const filename = `Payslip_${data.employee.name.replace(/\s+/g, '_')}_${data.issue_date}_${payslipId.substring(0, 6)}.pdf`;

        console.log('[PAYSLIP] Generating PDF in memory...');
        const pdfBuffer = await generatePDF(data);
        console.log('[PAYSLIP] PDF generated successfully, size:', pdfBuffer.length, 'bytes');

        // Upload directly to Supabase Storage (no local file needed)
        console.log('[PAYSLIP] Uploading to Supabase Storage...');
        const { error: uploadError } = await supabase.storage
            .from('payslips')
            .upload(filename, pdfBuffer, { contentType: 'application/pdf', upsert: true });

        if (uploadError) {
            console.error('[STORAGE] Upload error:', uploadError);
            throw new Error(`Failed to upload PDF: ${uploadError.message}`);
        }

        console.log('[PAYSLIP] Upload successful');

        const payslipRecord = {
            id: payslipId,
            employee_id: data.employee.id,
            pay_period_start: data.pay_period_start,
            pay_period_end: data.pay_period_end,
            issue_date: data.issue_date,
            pay_frequency: data.pay_frequency,
            earnings: data.earnings,
            deductions: data.deductions,
            gross_pay: data.gross_pay,
            total_deductions: data.total_deductions,
            net_pay: data.net_pay,
            net_pay_words: data.net_pay_words,
            payment_method: data.payment_method,
            transaction_ref: data.transaction_ref || data.transaction_reference,
            leaves: data.leaves || [],
            notes: data.notes,
            pdf_path: filename,
            created_at: new Date()
        };

        console.log('[PAYSLIP] Inserting record to database...');
        const { error } = await supabase.from('payslips').insert(payslipRecord);
        if (error) {
            console.error('[PAYSLIP] Database insert error:', error);
            throw error;
        }

        await logActivity(userEmail, 'GENERATE_PAYSLIP', 'SUCCESS', `Generated payslip for ${data.employee.name} (${data.pay_period_start} to ${data.pay_period_end})`, req);
        console.log('[PAYSLIP] Success!');
        res.json({ success: true, id: payslipId, filename, url: `/api/payslips/${filename}/download` });
    } catch (e) {
        console.error('[PDF] FULL ERROR:', e);
        console.error('[PDF] Error stack:', e.stack);
        console.error('[PDF] Error details:', {
            message: e.message,
            name: e.name,
            employee: req.body?.employee?.name
        });
        await logActivity(userEmail, 'GENERATE_PAYSLIP', 'ERROR', `Failed to generate payslip for ${req.body.employee?.name || 'unknown employee'}: ${e.message}`, req);
        res.status(500).json({ error: e.message, stack: process.env.NODE_ENV === 'development' ? e.stack : undefined });
    }
});

app.get('/api/payslips/:filename/download', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(PDF_DIR, filename);
    const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';

    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
        return res.sendFile(filePath);
    }

    // Try fetching from Supabase Storage
    try {
        const { data, error } = await supabase.storage.from('payslips').download(filename);
        if (error || !data) throw error || new Error('File not found');

        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
        res.send(buffer);
    } catch (e) {
        res.status(404).json({ error: "Payslip not found" });
    }
});

// Config Routes
// Config Routes
app.get('/api/config/smtp', async (req, res) => {
    try {
        const { data: config } = await supabase.from('config').select('smtp_settings').eq('id', 1).single();
        if (config && config.smtp_settings) {
            res.json(config.smtp_settings);
        } else {
            // Return empty or defaults if not set (don't return hardcoded sensitive data)
            res.json({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: { user: '', pass: '' }
            });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/config/smtp', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const smtpConfig = req.body;
        // Upsert into config table (assuming id=1 exists, update smtp_settings column)
        const { error } = await supabase.from('config').update({ smtp_settings: smtpConfig }).eq('id', 1);

        if (error) {
            // If update fails, maybe column missing? assuming it exists for now based on plan
            throw error;
        }

        await logActivity(userEmail, 'UPDATE_SMTP_CONFIG', 'SUCCESS', 'Updated SMTP settings', req);
        res.json({ success: true });
    } catch (e) {
        await logActivity(userEmail, 'UPDATE_SMTP_CONFIG', 'ERROR', `Failed to update SMTP: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

// Email Route
app.post('/api/email/send', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        // Get SMTP Config FIRST to fail fast
        const { data: config } = await supabase.from('config').select('smtp_settings').eq('id', 1).single();
        if (!config || !config.smtp_settings || !config.smtp_settings.auth || !config.smtp_settings.auth.user) {
            return res.status(400).json({ error: "SMTP Configuration missing. Please go to Settings > Email Settings to configure." });
        }
        const smtpConfig = config.smtp_settings;

        // Auto-fix common SSL misconfigurations based on port
        if (parseInt(smtpConfig.port) === 587) smtpConfig.secure = false;
        if (parseInt(smtpConfig.port) === 465) smtpConfig.secure = true;

        const { payslipId } = req.body;
        const { data: payslip, error: pError } = await supabase.from('payslips').select('*').eq('id', payslipId).single();
        if (!payslip) {
            await logActivity(userEmail, 'SEND_PAYSLIP_EMAIL', 'FAIL', `Payslip ${payslipId} not found for email`, req);
            return res.status(404).json({ error: "Payslip not found" });
        }

        const { data: emp, error: eError } = await supabase.from('employees').select('*').eq('id', payslip.employee_id).single();
        if (!emp || !emp.email) {
            await logActivity(userEmail, 'SEND_PAYSLIP_EMAIL', 'FAIL', `Employee for payslip ${payslipId} has no email`, req);
            return res.status(400).json({ error: "Employee has no email" });
        }

        // Download PDF from Supabase Storage directly to memory (serverless-friendly)
        console.log('[EMAIL] Downloading PDF from storage:', payslip.pdf_path);
        const { data: storageData, error: sError } = await supabase.storage
            .from('payslips')
            .download(path.basename(payslip.pdf_path));

        if (sError || !storageData) {
            console.error('[EMAIL] Failed to download PDF for email:', sError);
            return res.status(404).json({ error: 'Payslip PDF file not found. Please regenerate.' });
        }

        // Convert to buffer for email attachment
        const arrayBuffer = await storageData.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);
        console.log('[EMAIL] PDF downloaded, size:', pdfBuffer.length, 'bytes');

        console.log('[EMAIL] Sending payslip to:', emp.email);
        const transporter = nodemailer.createTransport(smtpConfig);

        await transporter.sendMail({
            from: `"EurosHub HR" <${smtpConfig.auth.user}>`,
            to: emp.email,
            subject: `EurosHub - Payslip for ${payslip.pay_period_start} to ${payslip.pay_period_end}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #17a2b8;">EurosHub Payslip</h2>
          <p>Dear ${emp.name},</p>
          <p>Please find attached your payslip for the period <strong>${payslip.pay_period_start}</strong> to <strong>${payslip.pay_period_end}</strong>.</p>
          <p>If you have any questions, please contact the HA department.</p>
          <br>
          <p>Best regards,<br><strong>EurosHub HA Department</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">This is an automated email. Please do not reply.</p>
        </div>
      `,
            attachments: [{
                filename: path.basename(payslip.pdf_path),
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        });

        console.log('[EMAIL] Successfully sent to:', emp.email);
        const { error: uError } = await supabase.from('payslips').update({ email_sent_at: new Date() }).eq('id', payslipId);
        if (uError) throw uError;
        await logActivity(userEmail, 'SEND_PAYSLIP_EMAIL', 'SUCCESS', `Sent payslip ${payslipId} to ${emp.email}`, req);
        res.json({ success: true });
    } catch (e) {
        console.error('[EMAIL] Error:', e);
        await logActivity(userEmail, 'SEND_PAYSLIP_EMAIL', 'ERROR', `Failed to send payslip email for ${req.body.payslipId}: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/email/custom', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const { to, subject, html } = req.body;
        // Get SMTP Config from DB
        const { data: config } = await supabase.from('config').select('smtp_settings').eq('id', 1).single();
        if (!config || !config.smtp_settings || !config.smtp_settings.auth || !config.smtp_settings.auth.user) {
            throw new Error("SMTP Configuration missing.");
        }
        const smtpConfig = config.smtp_settings;
        const transporter = nodemailer.createTransport(smtpConfig);
        await transporter.sendMail({
            from: `"EurosHub" <${smtpConfig.auth.user}>`,
            to,
            subject,
            html
        });
        await logActivity(userEmail, 'SEND_CUSTOM_EMAIL', 'SUCCESS', `Sent email to ${to}`, req);
        res.json({ success: true });
    } catch (e) {
        console.error('[EMAIL] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Config Routes
app.get('/api/config', async (req, res) => {
    try {
        const { data: config } = await supabase.from('config').select('*').eq('id', 1).single();
        res.json(config || {});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/config', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const config = req.body;
        const { error } = await supabase.from('config').update(config).eq('id', 1);
        if (error) throw error;
        await logActivity(userEmail, 'UPDATE_CONFIG', 'SUCCESS', 'System configuration updated', req);
        res.json({ success: true });
    } catch (e) {
        await logActivity(userEmail, 'UPDATE_CONFIG', 'ERROR', `Failed to update system configuration: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

// Payroll Defaults Routes
app.get('/api/payroll/defaults', async (req, res) => {
    try {
        const { data, error } = await supabase.from('payroll_defaults').select('*');
        if (error) throw error;

        const defaults = {};
        data.forEach(row => {
            defaults[row.employee_id] = {
                earnings: row.earnings || [],
                deductions: row.deductions || []
            };
        });
        res.json(defaults);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/payslips/bulk-zip', async (req, res) => {
    const { payslipIds } = req.body;
    const userEmail = req.headers['x-user-email'] || 'unknown';

    try {
        const { data: payslips, error } = await supabase.from('payslips').select('*').in('id', payslipIds);
        if (error) throw error;

        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment(`Payslips_${new Date().toISOString().slice(0, 10)}.zip`);
        archive.pipe(res);

        for (const ps of payslips) {
            const fileName = path.basename(ps.pdf_path);
            const localPath = path.join(PDF_DIR, fileName);

            // Check if exists locally, if not download from Supabase
            if (!fs.existsSync(localPath)) {
                const { data, error: dlError } = await supabase.storage.from('payslips').download(fileName);
                if (!dlError && data) {
                    const arrayBuffer = await data.arrayBuffer();
                    fs.writeFileSync(localPath, Buffer.from(arrayBuffer));
                }
            }

            if (fs.existsSync(localPath)) {
                // Determine a nice name for the file in ZIP: EmployeeName_MonthYear.pdf
                const employeeName = ps.employee_name || 'Payslip';
                const safeName = `${employeeName.replace(/\s+/g, '_')}_${ps.pay_period_start}.pdf`;
                archive.file(localPath, { name: safeName });
            }
        }

        await archive.finalize();
        await logActivity(userEmail, 'BULK_DOWNLOAD_ZIP', 'SUCCESS', `Downloaded ZIP for ${payslipIds.length} payslips`, req);
    } catch (e) {
        console.error('[ZIP_ERROR]', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/payroll/defaults', async (req, res) => {
    // Expects body: { defaults: { empId: { earnings: [], deductions: [] }, ... } }
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const { defaults } = req.body;
        for (const [empId, defs] of Object.entries(defaults)) {
            const { error } = await supabase.from('payroll_defaults').upsert({
                employee_id: empId,
                earnings: defs.earnings,
                deductions: defs.deductions,
                updated_at: new Date()
            }, { onConflict: 'employee_id' });

            if (error) {
                console.error(`[PAYROLL_DEFAULTS] Failed for ${empId}:`, error);
                throw error;
            }
        }
        await logActivity(userEmail, 'UPDATE_PAYROLL_DEFAULTS', 'SUCCESS', 'Bulk updated payroll defaults', req);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Attendance Routes
app.get('/api/attendance', async (req, res) => {
    try {
        const { date } = req.query;
        let query = supabase.from('attendance').select('*');
        if (date) query = query.eq('date', date);
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/attendance/mark', async (req, res) => {
    try {
        const { employee_id, date, status, notes } = req.body;
        const userEmail = req.headers['x-user-email'] || 'unknown';
        const { data: existing } = await supabase.from('attendance').select('id').eq('employee_id', employee_id).eq('date', date).single();

        if (existing) {
            const { error } = await supabase.from('attendance').update({ status, notes }).eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('attendance').insert({ employee_id, date, status, notes });
            if (error) throw error;
        }
        await logActivity(userEmail, 'MARK_ATTENDANCE', 'SUCCESS', `Marked ${status} for employee ${employee_id} on ${date}`, req);
        res.json({ success: true });
    } catch (e) {
        await logActivity(req.headers['x-user-email'] || 'unknown', 'MARK_ATTENDANCE', 'ERROR', `Failed to mark attendance for employee ${req.body.employee_id} on ${req.body.date}: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/attendance/report-manual', async (req, res) => {
    try {
        const { month, year } = req.query;
        const monthStr = month.toString().padStart(2, '0');
        const start = `${year}-${monthStr}-01`;
        const end = `${year}-${monthStr}-31`;

        const { data: attendance, error: aError } = await supabase.from('attendance').select('*').gte('date', start).lte('date', end);
        if (aError) throw aError;
        const { data: employees, error: eError } = await supabase.from('employees').select('id, name, employee_id');
        if (eError) throw eError;

        const report = employees.map(emp => {
            const empAtt = attendance.filter(a => a.employee_id === emp.id);
            return {
                id: emp.id,
                employee_id: emp.employee_id,
                name: emp.name,
                present: empAtt.filter(a => a.status === 'Present').length,
                absent: empAtt.filter(a => a.status === 'Absent').length,
                leave: empAtt.filter(a => a.status === 'Leave').length,
                total: empAtt.length
            };
        });
        res.json(report);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 1. PORTAL DASHBOARD ---
app.get('/api/portal/dashboard', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        // Try Supabase first
        const { data: emp, error: empError } = await supabase.from('employees').select('*').eq('email', userEmail).single();

        let profile = emp;
        let dashboardData = {
            leaves: [],
            recentPayslips: [],
            warnings: [],
            assets: [],
            recentPerformance: null
        };

        // If Supabase works and found employee
        if (profile && !empError) {
            const [leaves, payslips, warnings, assets, performance, performanceHistory] = await Promise.all([
                supabase.from('leave_requests').select('*').eq('employee_id', emp.id),
                supabase.from('payslips').select('*').eq('employee_id', emp.id).order('created_at', { ascending: false }).limit(5),
                supabase.from('warnings').select('*').eq('employee_id', emp.id),
                supabase.from('assets').select('*').eq('assigned_to', emp.id),
                supabase.from('performance_reviews').select('*').eq('employee_id', emp.id).order('created_at', { ascending: false }).limit(1),
                supabase.from('performance_reviews').select('*').eq('employee_id', emp.id).order('review_date', { ascending: true })
            ]);

            dashboardData = {
                leaves: leaves.data || [],
                recentPayslips: payslips.data || [],
                warnings: warnings.data || [],
                assets: assets.data || [],
                recentPerformance: performance.data ? performance.data[0] : null,
                performanceHistory: performanceHistory.data || []
            };
        } else {
            // If no profile found in Supabase
            return res.status(404).json({ error: "Employee profile not found in Supabase" });
        }

        // Calculate sitting hours for current month
        let monthlySittingHours = 0;
        if (profile && profile.biometric_id) {
            const now = new Date();
            const startOfMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
            const endOfMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-31`;

            const { data: logs } = await supabase.from('biometric_logs')
                .select('*')
                .eq('biometric_id', profile.biometric_id)
                .gte('timestamp', startOfMonth)
                .lte('timestamp', endOfMonth);

            if (logs && logs.length > 0) {
                const dayMap = {};
                logs.forEach(log => {
                    const day = new Date(log.timestamp).toISOString().split('T')[0];
                    if (!dayMap[day]) dayMap[day] = { in: null, out: null };
                    if (log.direction === 'IN' && (!dayMap[day].in || new Date(log.timestamp) < new Date(dayMap[day].in))) {
                        dayMap[day].in = log.timestamp;
                    }
                    if (log.direction === 'OUT' && (!dayMap[day].out || new Date(log.timestamp) > new Date(dayMap[day].out))) {
                        dayMap[day].out = log.timestamp;
                    }
                });

                Object.values(dayMap).forEach(times => {
                    if (times.in && times.out) {
                        const h = (new Date(times.out) - new Date(times.in)) / (1000 * 60 * 60);
                        if (h > 0) monthlySittingHours += h;
                    }
                });
            }
        }

        res.json({
            profile: { ...profile, sitting_hours: monthlySittingHours.toFixed(2) },
            ...dashboardData
        });
    } catch (e) {
        console.error('[PORTAL] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- 2. LEAVE MANAGEMENT ---
app.get('/api/leaves', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'];
        const { employee_id } = req.query;

        // Check user role
        let userRole = 'employee';
        if (userEmail) {
            const { data: user } = await supabase.from('users').select('role').eq('email', userEmail).single();
            if (user) userRole = user.role;
        }

        const isAdmin = userRole === 'super_admin' || userRole === 'admin';

        let query = supabase.from('leave_requests').select('*, employees!leave_requests_employee_id_fkey(name)');

        // If not admin and specific employee_id not requested, default to own leaves
        if (!isAdmin) {
            // Get employee_id from user's email
            const { data: emp } = await supabase.from('employees').select('id').eq('email', userEmail).single();
            if (emp) {
                query = query.eq('employee_id', emp.id);
            } else {
                // If no employee profile link, return empty (or handle gracefully)
                query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // Force empty
            }
        } else {
            // Admin is viewing. If specific employee_id requested (filtering), apply it.
            if (employee_id) {
                query = query.eq('employee_id', employee_id);
            }
            // Otherwise return all (no filter applied)
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('[LEAVES] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/leaves/request', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        let leaveData = { ...req.body };

        // Auto-resolve employee_id from logged-in user if not provided
        if (!leaveData.employee_id && userEmail) {
            // Try Supabase first
            const { data: emp } = await supabase.from('employees').select('id').eq('email', userEmail).single();
            if (emp) {
                leaveData.employee_id = emp.id;
            }
        }

        // Sanitize dates for Postgres
        ['start_date', 'end_date'].forEach(f => {
            if (leaveData[f]) leaveData[f] = leaveData[f].split('T')[0];
            if (leaveData[f] === '') leaveData[f] = null;
        });

        // Try Supabase first, but catch schema errors
        const { data, error } = await supabase.from('leave_requests').insert(leaveData).select().single();

        if (error) throw error;

        await logActivity(userEmail, 'LEAVE_REQUEST', 'SUCCESS', `Requested ${leaveData.leave_type} leave from ${leaveData.start_date}`, req);

        // Notify Admins
        await createNotification({
            target_user_id: 'admin',
            title: 'New Leave Request',
            message: `${userEmail} requested ${leaveData.leave_type} leave.`,
            type: 'leave',
            link: '/leaves'
        });

        return res.json(data);
    } catch (e) {
        console.error('[LEAVES] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/leaves/:id/status', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const { status, comment } = req.body;

        // Try Supabase first
        let supabaseSuccess = false;
        let data = null;
        try {
            const result = await supabase.from('leave_requests').update({ status, comment }).eq('id', req.params.id).select().single();
            if (!result.error && result.data) {
                data = result.data;
                supabaseSuccess = true;
            }
        } catch (sbError) {
            console.log('[LEAVES] Supabase update failed, attempting local...');
        }

        if (supabaseSuccess) {
            await logActivity(userEmail, 'LEAVE_STATUS_UPDATE', 'SUCCESS', `Leave ${req.params.id} marked as ${status}`, req);

            // Notify Employee
            const { data: leaveReq } = await supabase.from('leave_requests').select('*, employees(email)').eq('id', req.params.id).single();
            if (leaveReq && leaveReq.employees) {
                await createNotification({
                    target_user_id: leaveReq.employees.email,
                    title: `Leave Request ${status}`,
                    message: `Your leave request for ${leaveReq.leave_type} has been ${status.toLowerCase()}.${comment ? ' Comment: ' + comment : ''}`,
                    type: 'leave',
                    link: '/portal'
                });
            }

            return res.json(data);
        } else {
            return res.status(500).json({ error: "Failed to update leave status in Supabase" });
        }

    } catch (e) {
        console.error('[LEAVES] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- 3. PERFORMANCE ---
app.get('/api/performance', async (req, res) => {
    try {
        const { employee_id } = req.query;
        let query = supabase.from('performance_reviews').select('*, employees!performance_reviews_employee_id_fkey(name)');
        if (employee_id) query = query.eq('employee_id', employee_id);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/performance', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const reviewData = req.body;
        // Sanitize ratings to numbers for DB
        ['quality_rating', 'speed_rating', 'initiative_rating', 'teamwork_rating', 'attendance_rating', 'final_rating'].forEach(f => {
            if (reviewData[f] !== undefined && reviewData[f] !== null) {
                reviewData[f] = Number(reviewData[f]);
            }
        });

        // Sanitize date
        if (reviewData.review_date) {
            reviewData.review_date = reviewData.review_date.split('T')[0];
        }
        if (reviewData.review_date === '') reviewData.review_date = null;

        const { error } = await supabase.from('performance_reviews').insert(reviewData);
        if (error) throw error;

        await logActivity(userEmail, 'ADD_PERFORMANCE_REVIEW', 'SUCCESS', `Review added for ${reviewData.employee_id}`, req);

        // Notify Employee
        const { data: emp } = await supabase.from('employees').select('email').eq('id', reviewData.employee_id).single();
        if (emp) {
            await createNotification({
                target_user_id: emp.email,
                title: 'New Performance Review',
                message: `Your KPI rating for period ${reviewData.period} has been published.`,
                type: 'performance',
                link: '/portal'
            });
        }

        res.json({ success: true });

    } catch (e) {
        console.error('[PERFORMANCE] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- 4. WARNINGS (DISCIPLINE) ---
app.get('/api/warnings', async (req, res) => {
    try {
        const { employee_id } = req.query;
        let query = supabase.from('warnings').select('*').order('created_at', { ascending: false });
        if (employee_id) query = query.eq('employee_id', employee_id);

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- 4. TICKETS ---
app.get('/api/tickets', async (req, res) => {
    try {
        const { employee_id } = req.query;
        let query = supabase.from('tickets').select('*, employees(name)');
        if (employee_id) query = query.eq('employee_id', employee_id);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tickets', async (req, res) => {
    try {
        const { data, error } = await supabase.from('tickets').insert(req.body).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/tickets/:id/resolve', async (req, res) => {
    try {
        const { data, error } = await supabase.from('tickets').update({ status: 'Resolved', admin_notes: req.body.notes }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/assets', async (req, res) => {
    try {
        const { assigned_to } = req.query;
        // Specify the foreign key relationship to avoid ambiguity
        let query = supabase.from('assets').select('*, employees!assets_assigned_to_fkey(name)');
        if (assigned_to) query = query.eq('assigned_to', assigned_to);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/assets', async (req, res) => {
    try {
        const assetData = req.body;
        ['purchase_date', 'assigned_date', 'return_date'].forEach(f => {
            if (assetData[f] === '') assetData[f] = null;
        });

        const { data, error } = await supabase.from('assets').insert(assetData).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/assets/:id', async (req, res) => {
    try {
        const assetData = req.body;
        ['purchase_date', 'assigned_date', 'return_date'].forEach(f => {
            if (assetData[f] === '') assetData[f] = null;
        });

        // Remove virtual fields if any before updating
        delete assetData.employees;

        const { data, error } = await supabase.from('assets').update(assetData).eq('id', req.params.id).select().single();
        if (error) throw error;

        // Notify Employee if assigned
        if (data.assigned_to && data.status === 'Assigned') {
            const { data: emp } = await supabase.from('employees').select('email').eq('id', data.assigned_to).single();
            if (emp) {
                await createNotification({
                    target_user_id: emp.email,
                    title: 'Asset Assigned',
                    message: `New asset "${data.name}" has been assigned to you.`,
                    type: 'asset',
                    link: '/portal'
                });
            }
        }

        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/assets/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('assets').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 6. WARNINGS ---
app.get('/api/warnings', async (req, res) => {
    try {
        const { employee_id } = req.query;
        let query = supabase.from('warnings').select('*, employees!warnings_employee_id_fkey(name)');
        if (employee_id) query = query.eq('employee_id', employee_id);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/warnings', async (req, res) => {
    try {
        const warningData = req.body;
        // Map severity to level if level is missing (for DB compatibility)
        if (warningData.severity && !warningData.level) {
            warningData.level = warningData.severity;
        }
        if (warningData.date === '') warningData.date = null;
        const { data, error } = await supabase.from('warnings').insert(warningData).select().single();
        if (error) throw error;

        // Notify Employee
        const { data: emp } = await supabase.from('employees').select('email').eq('id', warningData.employee_id).single();
        if (emp) {
            await createNotification({
                target_user_id: emp.email,
                title: 'Disciplinary Warning',
                message: `A ${warningData.level} severity warning has been issued to you.`,
                type: 'warning',
                link: '/portal'
            });
        }

        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/warnings/:id/explanation', async (req, res) => {
    try {
        const { explanation } = req.body;
        const userEmail = req.headers['x-user-email'] || 'unknown';
        const { data, error } = await supabase.from('warnings')
            .update({ explanation, explanation_date: new Date() })
            .eq('id', req.params.id)
            .select('*, employees(name)')
            .single();

        if (error) throw error;

        // Notify Admins
        await createNotification({
            target_user_id: 'admin',
            title: 'Warning Explanation Submitted',
            message: `${data.employees.name} submitted an explanation for their warning.`,
            type: 'warning',
            link: '/discipline'
        });

        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notifications', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'];
        if (!userEmail) return res.json([]);

        // 1. Get user role to determine access
        const { data: user } = await supabase.from('users').select('role').eq('email', userEmail).single();
        const role = user ? user.role : 'employee';

        let query = supabase.from('notifications').select('*');

        if (role === 'admin' || role === 'super_admin') {
            // Admins see their own AND 'admin' targeted notifs
            query = query.or(`target_user_id.eq."${userEmail}",target_user_id.eq.admin`);
        } else {
            // Employees ONLY see notifs targeted mainly to them
            query = query.eq('target_user_id', userEmail);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('[NOTIF GET ERROR]', e);
        res.status(500).json({ error: e.message });
    }
});



app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});



// --- 8. HOLIDAYS ---
app.get('/api/holidays', async (req, res) => {
    try {
        const { data, error } = await supabase.from('holidays').select('*').order('holiday_date');
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/holidays', async (req, res) => {
    try {
        const { data, error } = await supabase.from('holidays').insert(req.body).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 9. BIOMETRIC SYNC & SITTING HOURS ---
app.post('/api/biometric/sync', async (req, res) => {
    try {
        const { logs, direction } = req.body;
        // logs is an array: [{ deviceUserId, timestamp, ... }]
        const formattedLogs = logs.map(l => ({
            biometric_id: l.deviceUserId,
            direction,
            timestamp: l.recordTime,
            device_ip: req.ip
        }));

        // Deduplicate
        const seen = new Set();
        const uniqueLogs = [];
        for (const log of formattedLogs) {
            const key = `${log.biometric_id}-${log.timestamp}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueLogs.push(log);
            }
        }

        const { data, error } = await supabase.from('biometric_logs').upsert(uniqueLogs, { onConflict: ['biometric_id', 'timestamp'] });
        if (error) throw error;
        res.json({ success: true, count: uniqueLogs.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/attendance/report', async (req, res) => {
    try {
        const { month, year } = req.query;
        const { data: employees } = await supabase.from('employees').select('id, name, biometric_id, employee_id, shift_type');

        const m = parseInt(month);
        const y = parseInt(year);
        const startDate = `${y}-${m.toString().padStart(2, '0')}-01`;
        const endDate = new Date(y, m, 0).toISOString().split('T')[0]; // Correct last day of month

        const report = await Promise.all(employees.map(async emp => {
            let present = 0;
            let sittingHours = 0;
            if (emp.biometric_id) {
                const { data: logs } = await supabase.from('biometric_logs')
                    .select('*')
                    .eq('biometric_id', emp.biometric_id)
                    .gte('timestamp', `${startDate}T00:00:00`)
                    .lte('timestamp', `${endDate}T23:59:59`);

                if (logs && logs.length > 0) {
                    const dayMap = {};
                    logs.forEach(log => {
                        const day = new Date(log.timestamp).toISOString().split('T')[0];
                        if (!dayMap[day]) dayMap[day] = { in: null, out: null };
                        if (log.direction === 'IN' && (!dayMap[day].in || new Date(log.timestamp) < new Date(dayMap[day].in))) {
                            dayMap[day].in = log.timestamp;
                        }
                        if (log.direction === 'OUT' && (!dayMap[day].out || new Date(log.timestamp) > new Date(dayMap[day].out))) {
                            dayMap[day].out = log.timestamp;
                        }
                    });

                    Object.values(dayMap).forEach(times => {
                        if (times.in && times.out) {
                            const h = (new Date(times.out) - new Date(times.in)) / (1000 * 60 * 60);
                            if (h > 0) sittingHours += h;
                        }
                    });

                    present = Object.keys(dayMap).length;
                }
            }

            const { data: approvedLeaves } = await supabase.from('leave_requests')
                .select('days_count')
                .eq('employee_id', emp.id)
                .eq('status', 'Approved')
                .gte('start_date', startDate)
                .lte('end_date', endDate);

            const leave = (approvedLeaves || []).reduce((acc, l) => acc + (Number(l.days_count) || 0), 0);
            const total = new Date(y, m, 0).getDate(); // Actual days in month
            const absent = Math.max(0, total - present - leave);

            return {
                id: emp.id,
                employee_id: emp.employee_id,
                name: emp.name,
                present,
                leave: leave || 0,
                absent,
                total,
                sitting_hours: sittingHours.toFixed(2),
                shift_type: emp.shift_type
            };
        }));

        res.json(report);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/attendance/sitting-hours', async (req, res) => {
    try {
        const { employee_id, month, year } = req.query;
        const { data: emp } = await supabase.from('employees').select('biometric_id').eq('id', employee_id).single();
        if (!emp || !emp.biometric_id) return res.json([]);

        // Fix: Calculate actual last day of month to avoid invalid dates (e.g. Feb 30)
        const lastDay = new Date(year, month, 0).getDate();
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

        const { data: logs, error } = await supabase.from('biometric_logs')
            .select('*')
            .eq('biometric_id', emp.biometric_id)
            .gte('timestamp', startDate)
            .lte('timestamp', endDate)
            .order('timestamp', { ascending: true });

        if (error) throw error;

        // Group by day and calculate diff between first IN and last OUT
        const dayMap = {};
        logs.forEach(log => {
            const day = new Date(log.timestamp).toISOString().split('T')[0];
            if (!dayMap[day]) dayMap[day] = { in: null, out: null };
            if (log.direction === 'IN' && (!dayMap[day].in || new Date(log.timestamp) < new Date(dayMap[day].in))) {
                dayMap[day].in = log.timestamp;
            }
            if (log.direction === 'OUT' && (!dayMap[day].out || new Date(log.timestamp) > new Date(dayMap[day].out))) {
                dayMap[day].out = log.timestamp;
            }
        });

        const result = Object.entries(dayMap).map(([day, times]) => {
            let hours = 0;
            if (times.in && times.out) {
                hours = (new Date(times.out) - new Date(times.in)) / (1000 * 60 * 60);
            }
            return { day, hours: hours > 0 ? hours.toFixed(2) : 0, in: times.in, out: times.out };
        });

        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Batch Import Biometric Logs (from Sheet)
app.post('/api/biometric/import', async (req, res) => {
    try {
        const { logs } = req.body;
        if (!Array.isArray(logs)) return res.status(400).json({ error: 'Logs must be array' });

        const { data: employees, error: empError } = await supabase.from('employees').select('id, name, biometric_id, employee_id');
        if (empError) throw new Error(`Failed to fetch employees: ${empError.message}`);

        const nameMap = {};
        const bioIdMap = {};
        const empCodeMap = {};

        (employees || []).forEach(e => {
            if (e.name) nameMap[e.name.toLowerCase().trim()] = e;
            if (e.biometric_id) bioIdMap[e.biometric_id.toString().toLowerCase().trim()] = e;
            if (e.employee_id) empCodeMap[e.employee_id.toString().toLowerCase().trim()] = e;
        });

        const toInsert = [];
        const bioIdUpdates = {};

        for (const log of logs) {
            const { name, userId, timestamp, type } = log;
            const logUserId = (userId || '').toString().toLowerCase().trim();
            const logName = (name || '').toLowerCase().trim();

            // Try matching by BioId, then EmpCode, then Name
            let emp = bioIdMap[logUserId] || empCodeMap[logUserId] || nameMap[logName];

            if (emp) {
                let bioId = emp.biometric_id;
                // Auto-link Biometric ID if missing and we matched by name/empCode
                if (!bioId && userId) {
                    bioId = userId.toString();
                    bioIdUpdates[emp.id] = bioId;
                    emp.biometric_id = bioId;
                    bioIdMap[bioId.toLowerCase().trim()] = emp; // Update map for subsequent logs
                }

                if (bioId) {
                    toInsert.push({
                        biometric_id: bioId,
                        timestamp: timestamp,
                        direction: (type || '').toUpperCase().includes('OUT') ? 'OUT' : 'IN'
                    });
                }
            }
        }

        // Apply Biometric ID updates to employees table
        for (const [id, bioId] of Object.entries(bioIdUpdates)) {
            await supabase.from('employees').update({ biometric_id: bioId }).eq('id', id);
        }

        // Insert Logs
        if (toInsert.length > 0) {
            // Deduplicate local array to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
            const seen = new Set();
            const uniqueToInsert = [];
            for (const item of toInsert) {
                const key = `${item.biometric_id}-${item.timestamp}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueToInsert.push(item);
                }
            }

            const { error } = await supabase.from('biometric_logs').upsert(uniqueToInsert, { onConflict: 'biometric_id, timestamp' });
            if (error) throw error;
        }

        res.json({ success: true, processed: toInsert.length, updated: Object.keys(bioIdUpdates).length });
    } catch (e) {
        console.error('[BIO IMPORT]', e);
        res.status(500).json({ error: e.message });
    }
});

// Admin: Get All Logs matches
app.get('/api/biometric/all', async (req, res) => {
    try {
        const { date } = req.query;
        let query = supabase.from('biometric_logs').select('*').order('timestamp', { ascending: false }).limit(200);

        if (date) {
            query = query.gte('timestamp', `${date}T00:00:00`).lte('timestamp', `${date}T23:59:59`);
        }

        const { data: logs, error } = await query;
        if (error) throw error;

        // Fetch employees map for names and shifts
        const { data: employees } = await supabase.from('employees').select('name, biometric_id, employee_id, shift_type');
        const bioMap = {};
        employees.forEach(e => {
            if (e.biometric_id) bioMap[e.biometric_id] = e;
        });

        const result = logs.map(l => {
            const emp = bioMap[l.biometric_id];
            return {
                ...l,
                name: emp ? emp.name : 'Unknown',
                empCode: emp ? emp.employee_id : '-',
                shift: emp ? emp.shift_type : '-'
            };
        });

        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Employee: Get My Logs
app.get('/api/biometric/me', async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        if (!email) return res.status(401).send('Auth required');

        const { data: emp } = await supabase.from('employees').select('biometric_id').eq('email', email).single();
        if (!emp || !emp.biometric_id) return res.json([]);

        const { data, error } = await supabase.from('biometric_logs')
            .select('*')
            .eq('biometric_id', emp.biometric_id)
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PDF CONFIG ---
app.get('/api/config/pdf', async (req, res) => {
    try {
        const { data, error } = await supabase.from('app_config').select('value').eq('key', 'pdf_settings').single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
            throw error;
        }
        res.json(data ? data.value : {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/config/pdf', async (req, res) => {
    try {
        const { error } = await supabase.from('app_config').upsert({
            key: 'pdf_settings',
            value: req.body,
            updated_at: new Date()
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- PAYROLL DEFAULTS ---
app.get('/api/payroll/defaults', async (req, res) => {
    try {
        const { data, error } = await supabase.from('app_config').select('value').eq('key', 'payroll_defaults').single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data ? data.value : {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/payroll/defaults', async (req, res) => {
    try {
        console.log('[PAYROLL DEFAULTS] Saving...', JSON.stringify(req.body.defaults).length, 'bytes');
        const { error } = await supabase.from('app_config').upsert({
            key: 'payroll_defaults',
            value: req.body.defaults,
            updated_at: new Date()
        });
        if (error) {
            console.error('[PAYROLL DEFAULTS] Error:', error);
            throw error;
        }
        console.log('[PAYROLL DEFAULTS] Saved successfully.');
        res.json({ success: true });
    } catch (e) {
        console.error('[PAYROLL DEFAULTS] Exception:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- 10. ONBOARDING ---
app.get('/api/onboarding/submissions', async (req, res) => {
    try {
        const { data, error } = await supabase.from('onboarding_submissions').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/onboarding/submit', async (req, res) => {
    try {
        const { data, error } = await supabase.from('onboarding_submissions').insert(req.body).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin Logs Route
app.get('/api/admin/logs', async (req, res) => {

    try {
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 11. DOCUMENTS ---
app.post('/api/documents/upload', async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        const { employee_id, name } = req.body;
        const uploadedBy = req.headers['x-user-email'] || 'admin';
        const docFile = req.files.file;

        const fileName = `${Date.now()}_${docFile.name}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, docFile.data, {
                contentType: docFile.mimetype,
                upsert: false
            });

        if (uploadError) throw new Error(`Storage Upload Failed: ${uploadError.message}`);

        // DB Insert
        const { data, error } = await supabase.from('documents').insert({
            employee_id,
            name,
            file_path: fileName,
            file_type: docFile.mimetype,
            uploaded_by: uploadedBy
        }).select().single();

        if (error) throw error;

        // Notify Employee
        const { data: emp } = await supabase.from('employees').select('email').eq('id', employee_id).single();
        if (emp) {
            await createNotification({
                target_user_id: emp.email,
                title: 'New Document Uploaded',
                message: `A new document "${name}" has been uploaded to your profile.`,
                type: 'document',
                link: '/portal'
            });
        }

        res.json(data);
    } catch (e) {
        console.error('[DOC UPLOAD ERROR]', e);
        res.status(500).json({ error: e.message });
    }
});

// Dynamic Download Handler (Fallback for Supabase Storage)
// ... (keep existing) ...
app.get('/uploads/documents/:filename', async (req, res) => {
    // ... (keep existing) ...
    const { filename } = req.params;
    try {
        const localPath = path.join(__dirname, '../uploads/documents', filename);
        if (fs.existsSync(localPath)) return res.sendFile(localPath);
        const { data, error } = await supabase.storage.from('documents').download(filename);
        if (error || !data) return res.status(404).send('Document not found');
        const buffer = Buffer.from(await data.arrayBuffer());
        res.setHeader('Content-Type', data.type);
        res.send(buffer);
    } catch (e) {
        res.status(500).send('Error retrieving document');
    }
});

// --- 12. UTILS ---
app.get('/api/proxy/csv', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL required' });

        // Basic validation
        if (!url.includes('google.com/spreadsheets')) {
            return res.status(400).json({ error: 'Only Google Sheets allowed' });
        }

        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).json({ error: `Fetch failed: ${response.statusText}. Ensure sheet is public.` });
        }
        const text = await response.text();
        res.send(text);
    } catch (e) {
        console.error('[PROXY ERROR]', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/documents/:employee_id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('documents')
            .select('*')
            .eq('employee_id', req.params.employee_id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/documents/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('documents').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// PDF Generation Function - Returns Buffer for serverless compatibility
async function generatePDF(data) {
    try {
        console.log('[PDF] Starting PDF generation...');
        console.log('[PDF] Employee:', data.employee?.name);
        console.log('[PDF] Has increments:', !!data.increments, 'Count:', data.increments?.length || 0);

        // Load settings from Supabase
        let settings = {
            headerColor: '#17a2b8',
            textColor: '#333333',
            tableHeaderBg: '#17a2b8',
            tableHeaderColor: '#ffffff',
            companyName: 'EurosHub',
            companySubtitle: 'Payroll Department',
            accentColor: '#17a2b8'
        };

        try {
            const { data: configRows } = await supabase.from('app_config').select('value').eq('key', 'pdf_settings').single();
            if (configRows && configRows.value) {
                settings = { ...settings, ...configRows.value };
            }
        } catch (e) {
            console.warn('Failed to load PDF settings from Supabase:', e.message);
        }

        console.log('[PDF] Settings loaded, creating document...');

        return new Promise((resolve, reject) => {
            const printer = new PdfPrinter(fonts);

            // Load logo from settings OR local file as fallback
            let logoImage = settings.logo || null;

            if (!logoImage) {
                try {
                    const logoPath = path.join(__dirname, 'assets', 'logo.png');
                    if (fs.existsSync(logoPath)) {
                        const logoBuffer = fs.readFileSync(logoPath);
                        logoImage = `data:image/png;base64,${logoBuffer.toString('base64')}`;
                        console.log('[PDF] Using local logo file fallback');
                    } else {
                        console.warn('[PDF] No local logo found at:', logoPath);
                    }
                } catch (err) {
                    console.warn('[PDF] Failed to load local logo:', err.message);
                }
            }

            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
                content: [
                    // Professional Header
                    {
                        columns: [
                            logoImage ? { image: logoImage, width: 70, margin: [0, 0, 0, 10] } : { text: '' },
                            {
                                stack: [
                                    { text: settings.companyName, style: 'companyName', alignment: 'right' },
                                    { text: settings.companySubtitle, style: 'subtitle', alignment: 'right' },
                                    { text: 'SALARY SLIP', style: 'docTitle', alignment: 'right', margin: [0, 5, 0, 0] }
                                ]
                            }
                        ],
                        margin: [0, 0, 0, 15]
                    },

                    // Divider
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: settings.headerColor }], margin: [0, 0, 0, 20] },

                    // Employee & Period Info
                    {
                        columns: [
                            {
                                width: '*',
                                stack: [
                                    { text: 'EMPLOYEE INFORMATION', style: 'sectionHeader', margin: [0, 0, 0, 10] },
                                    { columns: [{ width: 90, text: 'Name:', bold: true, color: '#555' }, { text: data.employee.name, color: settings.textColor }], margin: [0, 0, 0, 5] },
                                    { columns: [{ width: 90, text: 'Employee ID:', bold: true, color: '#555' }, { text: data.employee.employee_id || data.employee.id, color: settings.textColor }], margin: [0, 0, 0, 5] },
                                    { columns: [{ width: 90, text: 'Department:', bold: true, color: '#555' }, { text: data.employee.department || 'N/A', color: settings.textColor }], margin: [0, 0, 0, 5] },
                                    { columns: [{ width: 90, text: 'Designation:', bold: true, color: '#555' }, { text: data.employee.job_title || 'N/A', color: settings.textColor }], margin: [0, 0, 0, 5] },
                                    { columns: [{ width: 90, text: 'Joining Date:', bold: true, color: '#555' }, { text: data.employee.joining_date || 'N/A', color: settings.textColor }] }
                                ]
                            },
                            {
                                width: '*',
                                stack: [
                                    { text: 'PAYMENT DETAILS', style: 'sectionHeader', margin: [25, 0, 0, 10] },
                                    { columns: [{ width: 100, text: 'Pay Period:', bold: true, color: '#555' }, { text: new Date(data.pay_period_start).toLocaleString('default', { month: 'long', year: 'numeric' }), color: settings.textColor }], margin: [25, 0, 0, 5] },
                                    { columns: [{ width: 100, text: 'Issue Date:', bold: true, color: '#555' }, { text: data.issue_date, color: settings.textColor }], margin: [25, 0, 0, 5] },
                                    { columns: [{ width: 100, text: 'Payment Method:', bold: true, color: '#555' }, { text: data.payment_method || 'Bank Transfer', color: settings.textColor }], margin: [25, 0, 0, 5] },
                                    ...(data.employee.bank_name ? [{ columns: [{ width: 100, text: 'Bank:', bold: true, color: '#555' }, { text: data.employee.bank_name, color: settings.textColor }], margin: [25, 0, 0, 5] }] : []),
                                    ...(data.employee.account_number ? [{ columns: [{ width: 100, text: 'Account:', bold: true, color: '#555' }, { text: String(data.employee.account_number), color: settings.textColor, fontSize: 9 }], margin: [25, 0, 0, 5] }] : []),
                                    { columns: [{ width: 100, text: 'Frequency:', bold: true, color: '#555' }, { text: data.pay_frequency || 'Monthly', color: settings.textColor }], margin: [25, 0, 0, 5] }
                                ]
                            }
                        ],
                        columnGap: 20,
                        margin: [0, 0, 0, 25]
                    },

                    // Earnings & Deductions Table
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', 'auto', 20, '*', 'auto'],
                            body: [
                                [
                                    { text: 'EARNINGS', style: 'tableHeader', colSpan: 2, alignment: 'left' }, {},
                                    { text: '', border: [false, false, false, false] },
                                    { text: 'DEDUCTIONS', style: 'tableHeader', colSpan: 2, alignment: 'left' }, {}
                                ],
                                ...buildEarningsDeductionsRows(data.earnings, data.deductions, settings),
                                [
                                    { text: 'GROSS PAY', bold: true, fillColor: '#f0f9ff', color: settings.accentColor, fontSize: 11 },
                                    { text: (data.currency || 'USD') + ' ' + data.gross_pay.toFixed(2), bold: true, fillColor: '#f0f9ff', color: settings.accentColor, fontSize: 11, alignment: 'right' },
                                    { text: '', border: [false, false, false, false] },
                                    { text: 'TOTAL DEDUCTIONS', bold: true, fillColor: '#fff5f5', color: '#dc3545', fontSize: 11 },
                                    { text: (data.currency || 'USD') + ' ' + data.total_deductions.toFixed(2), bold: true, fillColor: '#fff5f5', color: '#dc3545', fontSize: 11, alignment: 'right' }
                                ]
                            ]
                        },
                        layout: {
                            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
                            vLineWidth: () => 0,
                            hLineColor: (i) => (i === 0 || i === 1) ? settings.tableHeaderBg : '#e0e0e0',
                            paddingLeft: () => 10,
                            paddingRight: () => 10,
                            paddingTop: () => 8,
                            paddingBottom: () => 8
                        },
                        margin: [0, 0, 0, 20]
                    },

                    // Net Pay Highlight
                    {
                        table: {
                            widths: ['*', 'auto'],
                            body: [[
                                { text: 'NET PAY', style: 'netPayLabel' },
                                { text: (data.currency || 'USD') + ' ' + data.net_pay.toFixed(2), style: 'netPayAmount' }
                            ]]
                        },
                        layout: 'noBorders',
                        fillColor: '#e8f8f5',
                        margin: [0, 0, 0, 5]
                    },
                    { text: `In Words: ${data.net_pay_words}`, style: 'netPayWords', margin: [0, 5, 0, 20] },

                    // Attendance Summary (if provided)
                    data.attendance ? {
                        stack: [
                            { text: 'ATTENDANCE SUMMARY', style: 'sectionHeader', margin: [0, 10, 0, 8] },
                            {
                                columns: [
                                    { text: `Total Days: ${data.attendance.total}`, fontSize: 10 },
                                    { text: `Present: ${data.attendance.present}`, fontSize: 10, color: 'green' },
                                    { text: `Absent: ${data.attendance.absent}`, fontSize: 10, color: 'red' },
                                    { text: `Leaves: ${data.attendance.leave}`, fontSize: 10, color: 'orange' }
                                ],
                                margin: [0, 0, 0, 20]
                            }
                        ]
                    } : {},

                    // Increments Section (New)
                    (data.increments && Array.isArray(data.increments) && data.increments.length > 0) ? {
                        stack: [
                            { text: 'ANNUAL INCREMENTS', style: 'sectionHeader', margin: [0, 10, 0, 8] },
                            {
                                table: {
                                    widths: ['*', 'auto', 'auto'],
                                    body: [
                                        [{ text: 'Date', style: 'tableHeader' }, { text: 'Amount', style: 'tableHeader' }, { text: 'New Basic Salary', style: 'tableHeader' }],
                                        ...data.increments.filter(inc => inc && (inc.effective_date || inc.date)).map(inc => [
                                            { text: inc.effective_date || inc.date || '-', fontSize: 10 },
                                            { text: (data.currency || 'USD') + ' ' + (Number(inc.amount) || 0).toFixed(2), fontSize: 10, alignment: 'right' },
                                            { text: (data.currency || 'USD') + ' ' + (Number(inc.new_salary) || 0).toFixed(2), fontSize: 10, alignment: 'right' }
                                        ])
                                    ]
                                },
                                layout: {
                                    hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 1 : 0.5; },
                                    vLineWidth: function (i, node) { return 0; },
                                    hLineColor: function (i) { return '#e0e0e0'; },
                                    paddingLeft: function (i) { return 8; },
                                    paddingRight: function (i) { return 8; },
                                },
                                margin: [0, 0, 0, 20]
                            }
                        ]
                    } : {},
                    // Notes Section
                    data.notes ? {
                        stack: [
                            { text: 'NOTES', style: 'sectionHeader', margin: [0, 10, 0, 8] },
                            { text: data.notes, fontSize: 10, color: '#555', margin: [0, 0, 0, 20] }
                        ]
                    } : {},

                    // Footer
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0, 0, 0, 15] },
                    { text: 'This is a computer-generated payslip and does not require a signature.', style: 'footer', alignment: 'center' },
                    { text: '© 2026 EurosHub. All rights reserved.', style: 'footer', alignment: 'center', margin: [0, 5, 0, 0] }
                ],
                styles: {
                    companyName: { fontSize: 22, bold: true, color: settings.headerColor },
                    subtitle: { fontSize: 10, color: '#666', italics: true },
                    docTitle: { fontSize: 14, bold: true, color: '#333' },
                    sectionHeader: { fontSize: 11, bold: true, color: settings.headerColor, decoration: 'underline' },
                    tableHeader: { fontSize: 10, bold: true, fillColor: settings.tableHeaderBg, color: settings.tableHeaderColor },
                    netPayLabel: { fontSize: 16, bold: true, color: settings.accentColor },
                    netPayAmount: { fontSize: 20, bold: true, color: settings.accentColor, alignment: 'right' },
                    netPayWords: { fontSize: 10, italics: true, color: '#666' },
                    footer: { fontSize: 8, color: '#888' }
                },
                defaultStyle: { font: 'Helvetica', fontSize: 10 }
            };

            const pdfDoc = printer.createPdfKitDocument(docDefinition);

            // Collect PDF data in memory instead of writing to disk
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                console.log('[PDF] Generated successfully in memory, size:', pdfBuffer.length, 'bytes');
                resolve(pdfBuffer);
            });
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    } catch (error) {
        console.error('[PDF] Generation failed:', error);
        console.error('[PDF] Error stack:', error.stack);
        throw error;
    }
}

function buildEarningsDeductionsRows(earnings, deductions, settings) {
    const rows = [];
    const maxRows = Math.max(earnings.length, deductions.length);
    const textColor = settings?.textColor || '#333';

    for (let i = 0; i < maxRows; i++) {
        const earn = earnings[i] || { name: '', amount: 0 };
        const ded = deductions[i] || { name: '', amount: 0 };

        rows.push([
            { text: earn.name || '', color: textColor },
            { text: earn.name ? (typeof earn.amount === 'number' ? earn.amount.toFixed(2) : earn.amount) : '', alignment: 'right', color: textColor },
            { text: '', border: [false, false, false, false] },
            { text: ded.name || '', color: textColor },
            { text: ded.name ? (typeof ded.amount === 'number' ? ded.amount.toFixed(2) : ded.amount) : '', alignment: 'right', color: textColor }
        ]);
    }

    return rows;
}

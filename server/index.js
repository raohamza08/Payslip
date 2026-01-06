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
const localDb = require('./localDb');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

const PDF_DIR = path.join(os.tmpdir(), 'payslips_generated');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

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

// Auth Routes
app.get('/api/auth/is-setup', async (req, res) => {
    try {
        const { data } = await supabase.from('config').select('is_setup').eq('id', 1).single();
        res.json({ isSetup: data?.is_setup || false });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// PDF Config Routes
app.get('/api/config/pdf', (req, res) => {
    try {
        const settingsPath = path.join(__dirname, '../data/pdf_settings.json');
        if (fs.existsSync(settingsPath)) {
            res.json(JSON.parse(fs.readFileSync(settingsPath, 'utf8')));
        } else {
            res.json({});
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/config/pdf', (req, res) => {
    try {
        const settingsPath = path.join(__dirname, '../data/pdf_settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(req.body, null, 4));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/setup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: config } = await supabase.from('config').select('is_setup').eq('id', 1).single();
        if (config?.is_setup) return res.status(400).json({ error: "Already setup" });

        const hash = await bcrypt.hash(password, 10);
        // Create Super Admin User
        await supabase.from('users').insert({
            email,
            password_hash: hash,
            role: 'super_admin'
        });

        // Mark as setup
        await supabase.from('config').update({ is_setup: true, master_password_hash: hash }).eq('id', 1);

        await logActivity(email, 'INITIAL_SETUP', 'SUCCESS', 'System initialized and super admin created', req);
        res.json({ success: true });
    } catch (e) {
        await logActivity('system', 'INITIAL_SETUP', 'FAIL', `System setup failed: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check Whitelist
        const { data: whitelisted } = await supabase.from('whitelist').select('email').eq('email', email).single();
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

        // 3. Create User
        const hash = await bcrypt.hash(password, 10);
        await supabase.from('users').insert({
            email,
            password_hash: hash,
            role: 'employee'
        });

        await logActivity(email, 'SIGNUP_SUCCESS', 'SUCCESS', 'New user registered', req);
        res.json({ success: true });
    } catch (e) {
        await logActivity(req.body.email || 'unknown', 'SIGNUP_ATTEMPT', 'ERROR', `Signup failed: ${e.message}`, req);
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
        res.json({ success: true, user: { email: user.email, role: user.role } });
    } catch (e) {
        await logActivity(req.body.email || 'unknown', 'LOGIN_ATTEMPT', 'ERROR', `Login failed: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/confirm', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: user } = await supabase.from('users').select('password_hash').eq('email', email).single();
        if (!user) {
            await logActivity(email, 'CONFIRM_PASSWORD', 'FAIL', 'User not found for confirmation', req);
            return res.status(401).json({ success: false });
        }
        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            await logActivity(email, 'CONFIRM_PASSWORD', 'SUCCESS', 'Password confirmed', req);
        } else {
            await logActivity(email, 'CONFIRM_PASSWORD', 'FAIL', 'Incorrect password for confirmation', req);
        }
        res.json({ success: match });
    } catch (e) {
        await logActivity(req.body.email || 'unknown', 'CONFIRM_PASSWORD', 'ERROR', `Confirmation failed: ${e.message}`, req);
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
        const { email } = req.body;
        const userEmail = req.headers['x-user-email'] || 'unknown';
        await supabase.from('whitelist').insert({ email });
        await logActivity(userEmail, 'ADD_WHITELIST_EMAIL', 'SUCCESS', `Added ${email} to whitelist`, req);
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
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/employees', async (req, res) => {
    try {
        const emp = req.body;
        const userEmail = req.headers['x-user-email'] || 'unknown';

        // Sanitize date fields: Postgres rejects empty strings for DATE
        const dateFields = ['joining_date', 'leaving_date', 'probation_end_date', 'dob'];
        dateFields.forEach(field => {
            if (emp[field] === '') emp[field] = null;
        });

        if (emp.id) {
            const { error } = await supabase.from('employees').update(emp).eq('id', emp.id);
            if (error) throw error;
            await logActivity(userEmail, 'UPDATE_EMPLOYEE', 'SUCCESS', `Updated employee: ${emp.name}`, req);
            res.json({ id: emp.id });
        } else {
            emp.id = uuidv4();
            const { error } = await supabase.from('employees').insert(emp);
            if (error) throw error;
            await logActivity(userEmail, 'CREATE_EMPLOYEE', 'SUCCESS', `Created employee: ${emp.name}`, req);
            res.json({ id: emp.id });
        }
    } catch (e) {
        await logActivity(req.headers['x-user-email'] || 'unknown', req.body.id ? 'UPDATE_EMPLOYEE' : 'CREATE_EMPLOYEE', 'ERROR', `Failed to ${req.body.id ? 'update' : 'create'} employee ${req.body.name || req.body.id}: ${e.message}`, req);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'] || 'unknown';
        const { data: emp } = await supabase.from('employees').select('name').eq('id', req.params.id).single();
        const { error } = await supabase.from('employees').delete().eq('id', req.params.id);
        if (error) throw error;

        // Also cleanup local data
        await localDb.employeeExtensions.remove({ employee_id: req.params.id }, { multi: true });
        await localDb.increments.remove({ employee_id: req.params.id }, { multi: true });

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
        let query = {};
        if (start && end) {
            query.expense_date = { $gte: start, $lte: end };
        }
        if (category) {
            query.category = category;
        }
        const expenses = await localDb.expenses.find(query).sort({ expense_date: -1 });
        res.json(expenses);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/expenses', async (req, res) => {
    try {
        const expense = { ...req.body, created_at: new Date() };
        const newDoc = await localDb.expenses.insert(expense);
        res.json(newDoc);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/expenses/:id', async (req, res) => {
    try {
        const { _id, ...updateData } = req.body;
        updateData.updated_at = new Date();
        await localDb.expenses.update({ _id: req.params.id }, { $set: updateData });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        await localDb.expenses.remove({ _id: req.params.id }, {});
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// === MODULE 3: INCREMENTS ===
app.get('/api/employees/:id/increments', async (req, res) => {
    try {
        const increments = await localDb.increments.find({ employee_id: req.params.id }).sort({ effective_date: -1 });
        res.json(increments);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/employees/:id/increments', async (req, res) => {
    try {
        const increment = {
            ...req.body,
            employee_id: req.params.id,
            created_at: new Date()
        };
        const newDoc = await localDb.increments.insert(increment);
        res.json(newDoc);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Payslip Routes
app.get('/api/payslips', async (req, res) => {
    try {
        const { data: payslips, error: pError } = await supabase.from('payslips').select('*').order('created_at', { ascending: false });
        if (pError) throw pError;
        const { data: employees, error: eError } = await supabase.from('employees').select('id, name, email');
        if (eError) throw eError;

        const empMap = new Map(employees.map(e => [e.id, e]));
        const result = payslips.map(p => ({
            ...p,
            employee_name: empMap.get(p.employee_id)?.name || 'Unknown',
            employee_email: empMap.get(p.employee_id)?.email || ''
        }));
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/payslip/generate', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
        const data = req.body;
        const payslipId = uuidv4();
        const filename = `Payslip_${data.employee.name.replace(/\s+/g, '_')}_${data.issue_date}_${payslipId.substring(0, 6)}.pdf`;
        const filePath = path.join(PDF_DIR, filename);

        await generatePDF(data, filePath);

        // Upload to Supabase Storage
        const fileBuffer = fs.readFileSync(filePath);
        const { error: uploadError } = await supabase.storage
            .from('payslips')
            .upload(filename, fileBuffer, { contentType: 'application/pdf', upsert: true });

        if (uploadError) {
            console.error('[STORAGE] Upload error:', uploadError);
            // We can continue even if storage fails if local file exists, 
            // but for Vercel it's better to know if it failed.
        }

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

        const { error } = await supabase.from('payslips').insert(payslipRecord);
        if (error) throw error;
        await logActivity(userEmail, 'GENERATE_PAYSLIP', 'SUCCESS', `Generated payslip for ${data.employee.name} (${data.pay_period_start} to ${data.pay_period_end})`, req);
        res.json({ success: true, id: payslipId, filename, url: `/api/payslips/${filename}/download` });
    } catch (e) {
        console.error('[PDF] Error:', e);
        await logActivity(userEmail, 'GENERATE_PAYSLIP', 'ERROR', `Failed to generate payslip for ${req.body.employee?.name || 'unknown employee'}: ${e.message}`, req);
        res.status(500).json({ error: e.message });
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
app.get('/api/config/smtp', async (req, res) => {
    try {
        // Return hardcoded config for display purposes
        res.json({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: { user: 'hamzabadar.euroshub@gmail.com', pass: '****' }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/config/smtp', async (req, res) => {
    // Accept but ignore - config is hardcoded
    res.json({ success: true });
});

// Email Route
app.post('/api/email/send', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    try {
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

        const filePath = path.join(PDF_DIR, path.basename(payslip.pdf_path));
        let finalPath = filePath;

        // Ensure file exists (download from storage if missing in /tmp)
        if (!fs.existsSync(filePath)) {
            const { data: storageData, error: sError } = await supabase.storage.from('payslips').download(path.basename(payslip.pdf_path));
            if (sError || !storageData) throw sError || new Error('Could not download PDF for email');

            const arrayBuffer = await storageData.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
        }

        const smtpConfig = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'hamzabadar.euroshub@gmail.com',
                pass: 'cajq tdba zjln iwrj'
            }
        };

        console.log('[EMAIL] Sending payslip to:', emp.email);
        const transporter = nodemailer.createTransport(smtpConfig);

        await transporter.sendMail({
            from: '"EurosHub HR" <hamzabadar.euroshub@gmail.com>',
            to: emp.email,
            subject: `EurosHub - Payslip for ${payslip.pay_period_start} to ${payslip.pay_period_end}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #17a2b8;">EurosHub Payslip</h2>
          <p>Dear ${emp.name},</p>
          <p>Please find attached your payslip for the period <strong>${payslip.pay_period_start}</strong> to <strong>${payslip.pay_period_end}</strong>.</p>
          <p>If you have any questions, please contact the HR department.</p>
          <br>
          <p>Best regards,<br><strong>EurosHub HR Team</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">This is an automated email. Please do not reply.</p>
        </div>
      `,
            attachments: [{ filename: path.basename(filePath), path: filePath }]
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
        const smtpConfig = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'hamzabadar.euroshub@gmail.com',
                pass: 'cajq tdba zjln iwrj'
            }
        };
        const transporter = nodemailer.createTransport(smtpConfig);
        await transporter.sendMail({
            from: '"EurosHub" <hamzabadar.euroshub@gmail.com>',
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
        const extensions = await localDb.employeeExtensions.find({});
        const defaults = {};
        extensions.forEach(ext => {
            if (ext.payroll_defaults) defaults[ext.employee_id] = ext.payroll_defaults;
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
    try {
        const { defaults } = req.body;
        for (const [empId, defs] of Object.entries(defaults)) {
            await localDb.employeeExtensions.update(
                { employee_id: empId },
                { $set: { employee_id: empId, payroll_defaults: defs } },
                { upsert: true }
            );
        }
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

app.get('/api/attendance/report', async (req, res) => {
    try {
        const { month, year } = req.query;
        const monthStr = month.toString().padStart(2, '0');
        const start = `${year}-${monthStr}-01`;
        const end = `${year}-${monthStr}-31`;

        const { data: attendance, error: aError } = await supabase.from('attendance').select('*').gte('date', start).lte('date', end);
        if (aError) throw aError;
        const { data: employees, error: eError } = await supabase.from('employees').select('*');
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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// PDF Generation Function
function generatePDF(data, filePath) {
    return new Promise((resolve, reject) => {
        // Load settings
        const settingsPath = path.join(__dirname, '../data/pdf_settings.json');
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
            if (fs.existsSync(settingsPath)) {
                const raw = fs.readFileSync(settingsPath, 'utf8');
                settings = { ...settings, ...JSON.parse(raw) };
            }
        } catch (e) { console.warn('Failed to load PDF settings:', e); }

        const printer = new PdfPrinter(fonts);

        // Load logo
        const logoPath = path.join(__dirname, 'assets', 'logo.png');
        let logoImage = null;
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            logoImage = `data:image/png;base64,${logoBuffer.toString('base64')}`;
            console.log('[PDF] Logo loaded successfully');
        } else {
            console.warn('[PDF] Logo not found at:', logoPath);
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
                            width: '50%',
                            stack: [
                                { text: 'EMPLOYEE INFORMATION', style: 'sectionHeader', margin: [0, 0, 0, 10] },
                                { text: [{ text: 'Name: ', bold: true, color: '#555' }, { text: data.employee.name, color: settings.textColor }], margin: [0, 0, 0, 5] },
                                { text: [{ text: 'Employee ID: ', bold: true, color: '#555' }, { text: data.employee.employee_id || data.employee.id, color: settings.textColor }], margin: [0, 0, 0, 5] },
                                { text: [{ text: 'Department: ', bold: true, color: '#555' }, { text: data.employee.department || 'N/A', color: settings.textColor }], margin: [0, 0, 0, 5] },
                                { text: [{ text: 'Designation: ', bold: true, color: '#555' }, { text: data.employee.job_title || 'N/A', color: settings.textColor }], margin: [0, 0, 0, 5] },
                                { text: [{ text: 'Joining Date: ', bold: true, color: '#555' }, { text: data.employee.joining_date || 'N/A', color: settings.textColor }] }
                            ]
                        },
                        {
                            width: '50%',
                            stack: [
                                { text: 'PAYMENT DETAILS', style: 'sectionHeader', margin: [0, 0, 0, 10] },
                                { text: [{ text: 'Pay Period: ', bold: true, color: '#555' }, { text: `${data.pay_period_start} to ${data.pay_period_end}`, color: settings.textColor }], margin: [0, 0, 0, 5] },
                                { text: [{ text: 'Issue Date: ', bold: true, color: '#555' }, { text: data.issue_date, color: settings.textColor }], margin: [0, 0, 0, 5] },
                                { text: [{ text: 'Payment Method: ', bold: true, color: '#555' }, { text: data.payment_method || 'Bank Transfer', color: settings.textColor }], margin: [0, 0, 0, 5] },
                                ...(data.employee.bank_name ? [{ text: [{ text: 'Bank: ', bold: true, color: '#555' }, { text: data.employee.bank_name, color: settings.textColor }], margin: [0, 0, 0, 5] }] : []),
                                ...(data.employee.account_number ? [{ text: [{ text: 'Account: ', bold: true, color: '#555' }, { text: data.employee.account_number, color: settings.textColor }], margin: [0, 0, 0, 5] }] : []),
                                { text: [{ text: 'Frequency: ', bold: true, color: '#555' }, { text: data.pay_frequency || 'Monthly', color: settings.textColor }] }
                            ]
                        }
                    ],
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
        const writeStream = fs.createWriteStream(filePath);
        pdfDoc.pipe(writeStream);
        pdfDoc.end();
        writeStream.on('finish', () => {
            console.log('[PDF] Generated successfully:', filePath);
            resolve();
        });
        writeStream.on('error', reject);
    });
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

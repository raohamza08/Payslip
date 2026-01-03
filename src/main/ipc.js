const { ipcMain, app, shell } = require('electron');
const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const PdfPrinter = require('pdfmake');
const nodemailer = require('nodemailer');

// Use standard PDF fonts to ensure it works without external assets
const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

// --- Auth Handlers ---

ipcMain.handle('auth:is-setup', async () => {
    const doc = await db.config.findOne({ key: 'admin_password_hash' });
    return !!doc;
});

ipcMain.handle('auth:setup', async (_, password) => {
    const existing = await db.config.findOne({ key: 'admin_password_hash' });
    if (existing) throw new Error("Already setup");

    const hash = await bcrypt.hash(password, 10);
    await db.config.insert({ key: 'admin_password_hash', value: hash });
    return true;
});

ipcMain.handle('auth:login', async (_, password) => {
    const doc = await db.config.findOne({ key: 'admin_password_hash' });
    if (!doc) return false;
    return await bcrypt.compare(password, doc.value);
});

// --- Employee Handlers ---

ipcMain.handle('employee:list', async () => {
    return await db.employees.find({}).sort({ name: 1 });
});

ipcMain.handle('employee:save', async (_, emp) => {
    if (emp.id) {
        await db.employees.update({ id: emp.id }, { $set: emp });
        return emp.id;
    } else {
        emp.id = uuidv4();
        emp.status = emp.status || 'Active';
        emp.created_at = new Date();
        await db.employees.insert(emp);
        return emp.id;
    }
});

ipcMain.handle('employee:delete', async (_, id) => {
    await db.employees.remove({ id: id }, { multi: false });
});

// --- Payslip Handlers ---

ipcMain.handle('payslip:generate', async (_, data) => {
    const payslipId = uuidv4();
    const pdfDir = path.join(app.getPath('documents'), 'Payslips');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const filename = `Payslip_${data.employee.name.replace(/\s+/g, '_')}_${data.issue_date}_${payslipId.substring(0, 6)}.pdf`;
    const filePath = path.join(pdfDir, filename);

    // Generate PDF
    await generatePDF(data, filePath);

    // Save to DB (NeDB stores JSON natively, so no stringify needed unless we want to keep structure flat)
    // Actually, we can store objects directly.
    const payslipRecord = {
        id: payslipId,
        employee_id: data.employee.id,
        pay_period_start: data.pay_period_start,
        pay_period_end: data.pay_period_end,
        issue_date: data.issue_date,
        pay_frequency: data.pay_frequency,
        earnings: data.earnings, // Store object directly
        deductions: data.deductions,
        gross_pay: data.gross_pay,
        total_deductions: data.total_deductions,
        net_pay: data.net_pay,
        net_pay_words: data.net_pay_words,
        payment_method: data.payment_method,
        transaction_ref: data.transaction_ref || data.transaction_reference,
        leaves: data.leaves || [],
        notes: data.notes,
        pdf_path: filePath,
        created_at: new Date()
    };

    await db.payslips.insert(payslipRecord);

    return { id: payslipId, filePath };
});

ipcMain.handle('payslip:list', async () => {
    // Join logic is manual in NoSQL (or lookup)
    // Get all payslips
    const payslips = await db.payslips.find({}).sort({ issue_date: -1 });

    // To match SQL join, we iterate and fill employee details
    // For performance, fetch all employees first or weak link
    // Given desktop app scale, fetching all emps is instant.
    const employees = await db.employees.find({});
    const empMap = new Map(employees.map(e => [e.id, e]));

    return payslips.map(p => ({
        ...p,
        employee_name: empMap.get(p.employee_id)?.name || 'Unknown',
        employee_email: empMap.get(p.employee_id)?.email || ''
    }));
});

ipcMain.handle('payslip:open', async (_, id) => {
    const doc = await db.payslips.findOne({ id: id });
    if (doc && doc.pdf_path) {
        shell.openPath(doc.pdf_path);
    }
});

// --- Email Handler ---

ipcMain.handle('config:get-smtp', async () => {
    const doc = await db.config.findOne({ key: 'smtp_config' });
    return doc ? doc.value : null;
});

ipcMain.handle('config:save-smtp', async (_, config) => {
    const doc = await db.config.findOne({ key: 'smtp_config' });
    if (doc) {
        await db.config.update({ key: 'smtp_config' }, { $set: { value: config } });
    } else {
        await db.config.insert({ key: 'smtp_config', value: config });
    }
});

ipcMain.handle('email:send', async (_, { payslipId, smtpConfig }) => {
    const payslip = await db.payslips.findOne({ id: payslipId });
    if (!payslip) throw new Error("Payslip not found");

    const emp = await db.employees.findOne({ id: payslip.employee_id });
    if (!emp || !emp.email) throw new Error("Employee has no email");

    const employee_email = emp.email;
    const employee_name = emp.name;

    const transporter = nodemailer.createTransport(smtpConfig);

    await transporter.sendMail({
        from: 'raohamzabadar@euroshub.com', // HARDCODED
        to: employee_email,
        subject: `Payslip for ${payslip.pay_period_start} to ${payslip.pay_period_end}`,
        text: `Dear ${employee_name},\n\nPlease find attached your payslip for the period ${payslip.pay_period_start} to ${payslip.pay_period_end}.\n\nBest regards,\nHR Team`,
        attachments: [
            {
                filename: path.basename(payslip.pdf_path),
                path: payslip.pdf_path
            }
        ]
    });

    await db.payslips.update({ id: payslipId }, { $set: { email_sent_at: new Date() } });
    return true;
});


// --- Helper: PDF Generation (Unchanged) ---
function generatePDF(data, filePath) {
    return new Promise((resolve, reject) => {
        const printer = new PdfPrinter(fonts);

        const docDefinition = {
            content: [
                { text: 'PAYSLIP', style: 'header', alignment: 'center' },
                { text: data.company_name || 'My Company', style: 'subheader', alignment: 'center' },
                { text: '\n' },
                {
                    columns: [
                        { text: [{ text: 'Employee Name: ', bold: true }, data.employee.name, '\n', { text: 'ID: ', bold: true }, data.employee.id] },
                        { text: [{ text: 'Date: ', bold: true }, data.issue_date, '\n', { text: 'Period: ', bold: true }, `${data.pay_period_start} - ${data.pay_period_end}`], alignment: 'right' }
                    ]
                },
                { text: '\n' },
                {
                    table: {
                        widths: ['*', 'auto', '*', 'auto'],
                        body: [
                            [{ text: 'Earnings', style: 'tableHeader' }, { text: 'Amount', style: 'tableHeader' }, { text: 'Deductions', style: 'tableHeader' }, { text: 'Amount', style: 'tableHeader' }],
                            ...mapEarningsDeductionsToRows(data.earnings, data.deductions),
                            [{ text: 'Total Earnings', bold: true }, data.gross_pay.toFixed(2), { text: 'Total Deductions', bold: true }, data.total_deductions.toFixed(2)]
                        ]
                    }
                },
                { text: '\n' },
                { text: [{ text: 'Net Pay: ', bold: true, fontSize: 14 }, { text: data.currency + ' ' + data.net_pay.toFixed(2), bold: true, fontSize: 14 }], alignment: 'right' },
                { text: `(${data.net_pay_words})`, alignment: 'right', italics: true },
                { text: '\n\n' },
                { text: 'System Generated Payslip', style: 'small', alignment: 'center', color: 'gray' }
            ],
            styles: {
                header: { fontSize: 18, bold: true },
                subheader: { fontSize: 14 },
                tableHeader: { bold: true, fillColor: '#eeeeee' },
                small: { fontSize: 8 }
            },
            defaultStyle: {
                font: 'Helvetica'
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const writeStream = fs.createWriteStream(filePath);
        pdfDoc.pipe(writeStream);
        pdfDoc.end();

        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
}

function mapEarningsDeductionsToRows(earnings, deductions) {
    const rows = [];
    const max = Math.max(earnings.length, deductions.length);
    for (let i = 0; i < max; i++) {
        const earn = earnings[i] || { name: '', amount: '' };
        const ded = deductions[i] || { name: '', amount: '' };
        rows.push([
            earn.name,
            typeof earn.amount === 'number' ? earn.amount.toFixed(2) : earn.amount,
            ded.name,
            typeof ded.amount === 'number' ? ded.amount.toFixed(2) : ded.amount
        ]);
    }
    return rows;
}

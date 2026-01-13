const fs = require('fs');
const path = require('path');
const supabase = require('./server/supabase');

async function migrate() {
    console.log('--- Starting Improved Migration ---');

    // Helper to read NeDB file
    const readDb = (filename) => {
        const filePath = path.join(__dirname, 'data', filename);
        if (!fs.existsSync(filePath)) return [];
        return fs.readFileSync(filePath, 'utf8')
            .split('\n')
            .filter(line => line.trim() && !line.includes('"$$deleted":true'))
            .map(line => JSON.parse(line));
    };

    // Helper to clean NeDB objects for Supabase
    const cleanObj = (obj) => {
        const clean = { ...obj };
        delete clean._id;
        delete clean.createdAt;
        delete clean.updatedAt;
        delete clean.updated_at;

        // Convert NeDB dates to ISO
        for (const key in clean) {
            if (clean[key] && typeof clean[key] === 'object' && clean[key].$$date) {
                clean[key] = new Date(clean[key].$$date).toISOString();
            }
        }
        return clean;
    };

    // 1. Employees
    console.log('Migrating Employees...');
    const baseEmployees = readDb('employees.db');
    const extensions = readDb('employee_extensions.db');

    const extMap = {};
    const payrollMap = {};
    extensions.forEach(ext => {
        if (ext.payroll_defaults) {
            payrollMap[ext.employee_id] = ext.payroll_defaults;
        } else {
            extMap[ext.employee_id] = ext;
        }
    });

    const finalEmployees = baseEmployees.map(emp => {
        const ext = extMap[emp.id] || {};
        return {
            id: emp.id,
            employee_id: emp.employee_id,
            name: emp.name,
            email: emp.email,
            job_title: emp.job_title,
            department: emp.department,
            employment_type: emp.employment_type,
            bank_name: emp.bank_name,
            account_number: emp.account_number,
            currency: emp.currency || 'PKR',
            status: emp.status || 'Active',
            monthly_salary: Number(ext.monthly_salary || emp.monthly_salary || 0),
            joining_date: (ext.joining_date && ext.joining_date.$$date) ? new Date(ext.joining_date.$$date).toISOString() : (ext.joining_date || emp.joining_date),
            father_name: ext.father_name,
            religion: ext.religion,
            cnic: ext.cnic,
            dob: (ext.dob && ext.dob.$$date) ? new Date(ext.dob.$$date).toISOString() : ext.dob,
            blood_group: ext.blood_group,
            gender: ext.gender,
            personal_email: ext.personal_email,
            contact_number: ext.contact_number,
            home_contact: ext.home_contact,
            present_address: ext.present_address,
            permanent_address: ext.permanent_address,
            office_number: ext.office_number,
            shift_start: ext.shift_start || null,
            shift_end: ext.shift_end || null
        };
    });

    if (finalEmployees.length > 0) {
        const { error: empError } = await supabase.from('employees').upsert(finalEmployees);
        if (empError) console.error('Employee Error:', empError.message);
        else console.log(`Injected ${finalEmployees.length} employees.`);
    }

    // 2. Payroll Defaults
    console.log('Migrating Payroll Defaults...');
    const payrollRows = Object.entries(payrollMap).map(([empId, defs]) => ({
        employee_id: empId,
        earnings: defs.earnings,
        deductions: defs.deductions
    }));
    if (payrollRows.length > 0) {
        const { error: payError } = await supabase.from('payroll_defaults').upsert(payrollRows);
        if (payError) console.error('Payroll Error:', payError.message);
        else console.log(`Injected ${payrollRows.length} payroll defaults.`);
    }

    // 3. Expenses
    console.log('Migrating Expenses...');
    const baseExpenses = readDb('expenses.db');
    const finalExpenses = baseExpenses.map(cleanObj);
    if (finalExpenses.length > 0) {
        const { error: exError } = await supabase.from('expenses').insert(finalExpenses);
        if (exError) console.error('Expense Error:', exError.message);
        else console.log(`Injected ${finalExpenses.length} expenses.`);
    }

    // 4. Attendance
    console.log('Migrating Attendance...');
    const baseAttendance = readDb('attendance.db');
    const finalAttendance = baseAttendance.map(cleanObj);
    if (finalAttendance.length > 0) {
        const { error: attError } = await supabase.from('attendance').upsert(finalAttendance);
        if (attError) console.error('Attendance Error:', attError.message);
        else console.log(`Injected ${finalAttendance.length} attendance records.`);
    }

    console.log('--- Migration Trace Complete ---');
}

migrate().catch(console.error);

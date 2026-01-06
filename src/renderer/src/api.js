const API_BASE = '/api';

let currentUserEmail = null;

const api = {
    setUser: (email) => { currentUserEmail = email; },

    // Auth
    isSetup: async () => {
        const res = await fetch(`${API_BASE}/auth/is-setup`);
        const data = await res.json();
        return data.isSetup;
    },
    setup: async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.success) currentUserEmail = email;
        return data.success;
    },
    signup: async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data.success;
    },
    login: async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.success) currentUserEmail = email;
        return data;
    },
    confirmAction: async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                console.warn('Password confirmation failed:', data.error || res.statusText);
                return false;
            }
            return data.success;
        } catch (error) {
            console.error('Password confirmation error:', error);
            return false;
        }
    },

    // Whitelist
    getWhitelist: async () => {
        const res = await fetch(`${API_BASE}/whitelist`, {
            headers: { 'x-user-email': currentUserEmail || '' }
        });
        return await res.json();
    },
    addToWhitelist: async (email) => {
        const res = await fetch(`${API_BASE}/whitelist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUserEmail || ''
            },
            body: JSON.stringify({ email })
        });
        return await res.json();
    },
    deleteFromWhitelist: async (id) => {
        const res = await fetch(`${API_BASE}/whitelist/${id}`, {
            method: 'DELETE',
            headers: { 'x-user-email': currentUserEmail || '' }
        });
        return await res.json();
    },

    // Employees
    getEmployees: async () => {
        const res = await fetch(`${API_BASE}/employees`);
        return await res.json();
    },
    saveEmployee: async (emp) => {
        const res = await fetch(`${API_BASE}/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUserEmail || ''
            },
            body: JSON.stringify(emp)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data.id;
    },
    deleteEmployee: async (id) => {
        const res = await fetch(`${API_BASE}/employees/${id}`, {
            method: 'DELETE',
            headers: { 'x-user-email': currentUserEmail || '' }
        });
        const data = await res.json();
        return data.success;
    },

    // Payslips
    generatePayslip: async (data, employee, silent = false) => {
        const payload = { ...data, employee };
        const res = await fetch(`${API_BASE}/payslip/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUserEmail || ''
            },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        if (result.url && !silent) window.open(result.url, '_blank');
        return result;
    },
    getPayslips: async () => {
        const res = await fetch(`${API_BASE}/payslips`);
        return await res.json();
    },
    openPayslip: async (id) => {
        const payslip = (await api.getPayslips()).find(p => p.id === id);
        if (payslip && payslip.pdf_path) {
            window.open(`${API_BASE}/payslips/${payslip.pdf_path}/download`, '_blank');
        }
    },

    // Config / Email
    getSmtpConfig: async () => {
        const res = await fetch(`${API_BASE}/config/smtp`);
        return await res.json();
    },
    saveSmtpConfig: async (config) => {
        const res = await fetch(`${API_BASE}/config/smtp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUserEmail || ''
            },
            body: JSON.stringify(config)
        });
        return await res.json();
    },
    sendCustomEmail: async (to, subject, html) => {
        const res = await fetch(`${API_BASE}/email/custom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': currentUserEmail || '' },
            body: JSON.stringify({ to, subject, html })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data.success;
    },
    getConfig: async () => {
        const res = await fetch(`${API_BASE}/config`);
        return await res.json();
    },
    saveConfig: async (config) => {
        const res = await fetch(`${API_BASE}/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUserEmail || ''
            },
            body: JSON.stringify(config)
        });
        return await res.json();
    },
    getPdfConfig: async () => {
        const res = await fetch(`${API_BASE}/config/pdf`);
        return await res.json();
    },
    savePdfConfig: async (config) => {
        const res = await fetch(`${API_BASE}/config/pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUserEmail || ''
            },
            body: JSON.stringify(config)
        });
        return await res.json();
    },
    sendPayslipEmail: async (payslipId) => {
        const res = await fetch(`${API_BASE}/email/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUserEmail || ''
            },
            body: JSON.stringify({ payslipId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data.success;
    },
    downloadBulkPayslips: async (payslipIds, filename = 'payslips.zip') => {
        const res = await fetch(`${API_BASE}/payslips/bulk-zip`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUserEmail || ''
            },
            body: JSON.stringify({ payslipIds })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to download ZIP');
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    // Payroll Defaults
    getPayrollDefaults: async () => {
        const res = await fetch(`${API_BASE}/payroll/defaults`);
        return await res.json();
    },
    savePayrollDefaults: async (defaults) => {
        const res = await fetch(`${API_BASE}/payroll/defaults`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': currentUserEmail || '' },
            body: JSON.stringify({ defaults })
        });
        return await res.json();
    },

    // Attendance
    getAttendance: async (date) => {
        const query = date ? `?date=${date}` : '';
        const res = await fetch(`${API_BASE}/attendance${query}`);
        return await res.json();
    },
    markAttendance: async (data) => {
        const res = await fetch(`${API_BASE}/attendance/mark`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUserEmail || ''
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    getAttendanceReport: async (month, year) => {
        const res = await fetch(`${API_BASE}/attendance/report?month=${month}&year=${year}`);
        return await res.json();
    },

    // Expenses
    getExpenses: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_BASE}/expenses?${query}`);
        return await res.json();
    },
    saveExpense: async (expense) => {
        const res = await fetch(`${API_BASE}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': currentUserEmail || '' },
            body: JSON.stringify(expense)
        });
        return await res.json();
    },
    updateExpense: async (id, expense) => {
        const res = await fetch(`${API_BASE}/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-user-email': currentUserEmail || '' },
            body: JSON.stringify(expense)
        });
        return await res.json();
    },
    deleteExpense: async (id) => {
        const res = await fetch(`${API_BASE}/expenses/${id}`, {
            method: 'DELETE',
            headers: { 'x-user-email': currentUserEmail || '' }
        });
        return await res.json();
    },

    // Increments
    getIncrements: async (employeeId) => {
        const res = await fetch(`${API_BASE}/employees/${employeeId}/increments`);
        return await res.json();
    },
    addIncrement: async (employeeId, increment) => {
        const res = await fetch(`${API_BASE}/employees/${employeeId}/increments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': currentUserEmail || '' },
            body: JSON.stringify(increment)
        });
        return await res.json();
    },

    // Admin
    getAdminLogs: async () => {
        const res = await fetch(`${API_BASE}/admin/logs`, {
            headers: { 'x-user-email': currentUserEmail || '' }
        });
        return await res.json();
    }
};

export default api;

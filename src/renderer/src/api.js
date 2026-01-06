const API_BASE = '/api';

let currentUserEmail = null;

const api = {
    setUser: (email) => { currentUserEmail = email; },

    // Integrated Fetch Helper
    fetchJson: async (url, options = {}) => {
        const headers = options.headers || {};
        if (currentUserEmail) {
            headers['x-user-email'] = currentUserEmail;
        }

        const res = await fetch(url, { ...options, headers });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || data.message || `Server Error (${res.status})`);
        }
        return data;
    },

    // Auth
    isSetup: async () => {
        const data = await api.fetchJson(`${API_BASE}/auth/is-setup`);
        return data.isSetup;
    },
    setup: async (email, password) => {
        const data = await api.fetchJson(`${API_BASE}/auth/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (data.success) currentUserEmail = email;
        return data.success;
    },
    signup: async (email, password) => {
        const data = await api.fetchJson(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return data.success;
    },
    login: async (email, password) => {
        const data = await api.fetchJson(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (data.success) currentUserEmail = email;
        return data;
    },
    confirmAction: async (email, password) => {
        try {
            const data = await api.fetchJson(`${API_BASE}/auth/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return data.success;
        } catch (error) {
            console.error('Password confirmation error:', error);
            return false;
        }
    },

    // Whitelist
    getWhitelist: async () => {
        return await api.fetchJson(`${API_BASE}/whitelist`);
    },
    addToWhitelist: async (email) => {
        return await api.fetchJson(`${API_BASE}/whitelist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
    },
    deleteFromWhitelist: async (id) => {
        return await api.fetchJson(`${API_BASE}/whitelist/${id}`, {
            method: 'DELETE'
        });
    },

    // Employees
    getEmployees: async () => {
        return await api.fetchJson(`${API_BASE}/employees`);
    },
    saveEmployee: async (emp) => {
        const data = await api.fetchJson(`${API_BASE}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emp)
        });
        return data.id;
    },
    deleteEmployee: async (id) => {
        const data = await api.fetchJson(`${API_BASE}/employees/${id}`, {
            method: 'DELETE'
        });
        return data.success;
    },

    // Payslips
    generatePayslip: async (data, employee, silent = false) => {
        const payload = { ...data, employee };
        const result = await api.fetchJson(`${API_BASE}/payslip/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (result.url && !silent) window.open(result.url, '_blank');
        return result;
    },
    getPayslips: async () => {
        return await api.fetchJson(`${API_BASE}/payslips`);
    },
    openPayslip: async (id) => {
        const payslips = await api.getPayslips();
        const payslip = Array.isArray(payslips) ? payslips.find(p => p.id === id) : null;
        if (payslip && payslip.pdf_path) {
            window.open(`${API_BASE}/payslips/${payslip.pdf_path}/download`, '_blank');
        }
    },

    // Config / Email
    getSmtpConfig: async () => {
        return await api.fetchJson(`${API_BASE}/config/smtp`);
    },
    saveSmtpConfig: async (config) => {
        return await api.fetchJson(`${API_BASE}/config/smtp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
    },
    sendCustomEmail: async (to, subject, html) => {
        const data = await api.fetchJson(`${API_BASE}/email/custom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html })
        });
        return data.success;
    },
    getConfig: async () => {
        return await api.fetchJson(`${API_BASE}/config`);
    },
    saveConfig: async (config) => {
        return await api.fetchJson(`${API_BASE}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
    },
    getPdfConfig: async () => {
        return await api.fetchJson(`${API_BASE}/config/pdf`);
    },
    savePdfConfig: async (config) => {
        return await api.fetchJson(`${API_BASE}/config/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
    },
    sendPayslipEmail: async (payslipId) => {
        const data = await api.fetchJson(`${API_BASE}/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payslipId })
        });
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
            throw new Error(error.error || error.message || 'Failed to download ZIP');
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
        return await api.fetchJson(`${API_BASE}/payroll/defaults`);
    },
    savePayrollDefaults: async (defaults) => {
        return await api.fetchJson(`${API_BASE}/payroll/defaults`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ defaults })
        });
    },

    // Attendance
    getAttendance: async (date) => {
        const query = date ? `?date=${date}` : '';
        return await api.fetchJson(`${API_BASE}/attendance${query}`);
    },
    markAttendance: async (data) => {
        return await api.fetchJson(`${API_BASE}/attendance/mark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },
    getAttendanceReport: async (month, year) => {
        return await api.fetchJson(`${API_BASE}/attendance/report?month=${month}&year=${year}`);
    },

    // Expenses
    getExpenses: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return await api.fetchJson(`${API_BASE}/expenses?${query}`);
    },
    saveExpense: async (expense) => {
        return await api.fetchJson(`${API_BASE}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        });
    },
    updateExpense: async (id, expense) => {
        return await api.fetchJson(`${API_BASE}/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        });
    },
    deleteExpense: async (id) => {
        return await api.fetchJson(`${API_BASE}/expenses/${id}`, {
            method: 'DELETE'
        });
    },

    // Increments
    getIncrements: async (employeeId) => {
        return await api.fetchJson(`${API_BASE}/employees/${employeeId}/increments`);
    },
    addIncrement: async (employeeId, increment) => {
        return await api.fetchJson(`${API_BASE}/employees/${employeeId}/increments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(increment)
        });
    },

    // Admin
    getAdminLogs: async () => {
        return await api.fetchJson(`${API_BASE}/admin/logs`);
    }
};

export default api;

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
    generatePayslip: async (data, employee) => {
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
        if (result.url) window.open(result.url, '_blank');
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

    // Admin
    getAdminLogs: async () => {
        const res = await fetch(`${API_BASE}/admin/logs`, {
            headers: { 'x-user-email': currentUserEmail || '' }
        });
        return await res.json();
    }
};

export default api;

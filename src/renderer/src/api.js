const API_BASE = '/api';

let currentUserEmail = null;

const api = {
    setUser: (email) => { currentUserEmail = email; },
    getUserEmail: () => currentUserEmail,

    // Integrated Fetch Helper
    fetchJson: async (url, options = {}) => {
        const headers = options.headers || {};
        if (currentUserEmail) {
            headers['x-user-email'] = currentUserEmail;
        }

        const res = await fetch(url, { ...options, headers });
        let data = {};
        try {
            data = await res.json();
        } catch (e) {
            // Success responses might not always be JSON
            if (res.ok) return { success: true };
        }

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
    signup: async (email, password, masterPassword = null) => {
        const data = await api.fetchJson(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, masterPassword })
        });
        return data;
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
    checkRole: async (email) => {
        return await api.fetchJson(`${API_BASE}/auth/check-role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
    },
    confirmAction: async (email, password) => {
        const data = await api.fetchJson(`${API_BASE}/auth/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return data.success;
    },
    changePassword: async (email, currentPassword, newPassword) => {
        const data = await api.fetchJson(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, currentPassword, newPassword })
        });
        return data.success;
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
        return await api.fetchJson(`${API_BASE}/employees/${id}`, {
            method: 'DELETE'
        });
    },

    // --- FINANCIALS & EXPENSES ---
    getExpenses: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return await api.fetchJson(`${API_BASE}/expenses?${params}`);
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

    // --- SALARY & INCREMENTS ---
    getIncrements: async (employeeId) => {
        return await api.fetchJson(`${API_BASE}/employees/${employeeId}/increments`);
    },
    addIncrement: async (employeeId, incrementData) => {
        return await api.fetchJson(`${API_BASE}/employees/${employeeId}/increments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(incrementData)
        });
    },

    // --- NEW MODULES APIs ---

    // 1. Employee Portal / Self-Service
    getPortalDashboard: async () => {
        return await api.fetchJson(`${API_BASE}/portal/dashboard`);
    },

    // 2. Leave Management
    getLeaves: async (employeeId = null) => {
        const query = employeeId ? `?employee_id=${employeeId}` : '';
        return await api.fetchJson(`${API_BASE}/leaves${query}`);
    },
    requestLeave: async (leaveData) => {
        return await api.fetchJson(`${API_BASE}/leaves/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leaveData)
        });
    },
    updateLeaveStatus: async (id, status, comment) => {
        return await api.fetchJson(`${API_BASE}/leaves/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, comment })
        });
    },

    // 3. Performance & KPIs
    getPerformance: async (employeeId) => {
        return await api.fetchJson(`${API_BASE}/performance?employee_id=${employeeId}`);
    },
    saveReview: async (reviewData) => {
        return await api.fetchJson(`${API_BASE}/performance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
    },

    // 4. Tickets (Issues/Complaints)
    getTickets: async (employeeId = null) => {
        const query = employeeId ? `?employee_id=${employeeId}` : '';
        return await api.fetchJson(`${API_BASE}/tickets${query}`);
    },
    createTicket: async (ticketData) => {
        return await api.fetchJson(`${API_BASE}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData)
        });
    },
    resolveTicket: async (id, notes) => {
        return await api.fetchJson(`${API_BASE}/tickets/${id}/resolve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes })
        });
    },

    // 5. Assets
    getAssets: async (employeeId = null) => {
        const query = employeeId ? `?assigned_to=${employeeId}` : '';
        return await api.fetchJson(`${API_BASE}/assets${query}`);
    },
    saveAsset: async (assetData) => {
        return await api.fetchJson(`${API_BASE}/assets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assetData)
        });
    },

    // 6. Warnings
    getWarnings: async (employeeId = null) => {
        const query = employeeId ? `?employee_id=${employeeId}` : '';
        return await api.fetchJson(`${API_BASE}/warnings${query}`);
    },
    issueWarning: async (warningData) => {
        return await api.fetchJson(`${API_BASE}/warnings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(warningData)
        });
    },
    submitWarningExplanation: async (id, explanation) => {
        return await api.fetchJson(`${API_BASE}/warnings/${id}/explanation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ explanation })
        });
    },

    // 7. Notifications
    getNotifications: async () => {
        return await api.fetchJson(`${API_BASE}/notifications`);
    },
    markNotificationRead: async (id) => {
        return await api.fetchJson(`${API_BASE}/notifications/${id}/read`, {
            method: 'PUT'
        });
    },

    // 7. Documents
    getDocuments: async (employeeId) => {
        return await api.fetchJson(`${API_BASE}/documents/${employeeId}`);
    },
    uploadDocument: async (employeeId, name, file) => {
        const formData = new FormData();
        formData.append('employee_id', employeeId);
        formData.append('name', name);
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/documents/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'x-user-email': api.userEmail || ''
            }
        });
        if (!response.ok) throw new Error(await response.text());
        return await response.json();
    },
    // 8. Holidays
    getHolidays: async () => {
        return await api.fetchJson(`${API_BASE}/holidays`);
    },
    saveHoliday: async (holiday) => {
        return await api.fetchJson(`${API_BASE}/holidays`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(holiday)
        });
    },

    // 9. Biometric
    syncBiometricLogs: async (logs, direction) => {
        return await api.fetchJson(`${API_BASE}/biometric/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs, direction })
        });
    },
    getSittingHours: async (employeeId, month, year) => {
        return await api.fetchJson(`${API_BASE}/attendance/sitting-hours?employee_id=${employeeId}&month=${month}&year=${year}`);
    },

    // Onboarding
    getAttendanceReport: async (month, year) => {
        return await api.fetchJson(`${API_BASE}/attendance/report?month=${month}&year=${year}`);
    },
    getOnboardingSubmissions: async () => {
        return await api.fetchJson(`${API_BASE}/onboarding/submissions`);
    },
    submitOnboarding: async (formData) => {
        return await api.fetchJson(`${API_BASE}/onboarding/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
    },

    // --- ADMIN & SYSTEM ---
    getAdminLogs: async () => {
        return await api.fetchJson(`${API_BASE}/admin/logs`);
    },
    getWhitelist: async () => {
        return await api.fetchJson(`${API_BASE}/whitelist`);
    },
    addToWhitelist: async (email, role = 'employee') => {
        return await api.fetchJson(`${API_BASE}/whitelist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role })
        });
    },
    deleteFromWhitelist: async (id) => {
        return await api.fetchJson(`${API_BASE}/whitelist/${id}`, {
            method: 'DELETE'
        });
    },

    // User Management (Super Admin)
    getUsers: async () => {
        return await api.fetchJson(`${API_BASE}/users`);
    },
    resetUserMasterPassword: async (email, newMasterPassword) => {
        return await api.fetchJson(`${API_BASE}/users/reset-master-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newMasterPassword })
        });
    },
    resetUserLoginPassword: async (email, newPassword) => {
        return await api.fetchJson(`${API_BASE}/users/reset-login-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword })
        });
    },
    updateUserPermissions: async (userId, permissions) => {
        return await api.fetchJson(`${API_BASE}/users/${userId}/permissions`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissions })
        });
    },
    updateUserRole: async (userId, role) => {
        return await api.fetchJson(`${API_BASE}/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
    },

    // Original Payslip Methods (Extended)
    getPayslips: async (employeeId = null) => {
        const query = employeeId ? `?employee_id=${employeeId}` : '';
        return await api.fetchJson(`${API_BASE}/payslips${query}`);
    },
    deletePayslip: async (id) => {
        return await api.fetchJson(`${API_BASE}/payslips/${id}`, {
            method: 'DELETE'
        });
    },
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
    openPayslip: (pdfPathOrId) => {
        if (!pdfPathOrId) return;
        // Check if it looks like a UUID or a filename
        // Filenames usually have .pdf or follow the Payslip_... pattern
        const url = `${API_BASE}/payslips/${pdfPathOrId}/download?inline=true`;
        window.open(url, '_blank');
    },
    previewPayslip: async (data, employee) => {
        const payload = { ...data, employee };
        const res = await fetch(`${API_BASE}/payslip/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Preview failed');
        const blob = await res.blob();
        return window.URL.createObjectURL(blob);
    },
    sendPayslipEmail: async (payslipId) => {
        const data = await api.fetchJson(`${API_BASE}/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payslipId })
        });
        return data.success;
    },
    sendCustomEmail: async (to, subject, html) => {
        return await api.fetchJson(`${API_BASE}/email/custom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html })
        });
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
    getPayrollDefaults: async () => {
        return await api.fetchJson(`${API_BASE}/payroll/defaults`);
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
    savePayrollDefaults: async (defaults) => {
        return await api.fetchJson(`${API_BASE}/payroll/defaults`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ defaults })
        });
    },
    // SMTP Config
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
    fetchCSVProxy: async (url) => {
        const res = await fetch(`${API_BASE}/proxy/csv?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || res.statusText);
        }
        return await res.text();
    },
    importBiometricLogs: async (logs) => {
        return await api.fetchJson(`${API_BASE}/biometric/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs })
        });
    },
    getBiometricLogs: async (date) => {
        const q = date ? `?date=${date}` : '';
        return await api.fetchJson(`${API_BASE}/biometric/all${q}`);
    },
    getMyBiometricLogs: async () => {
        return await api.fetchJson(`${API_BASE}/biometric/me`);
    },
    getMe: async () => {
        return await api.fetchJson(`${API_BASE}/auth/me`);
    }
};

export default api;

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
    // Auth
    isSetup: () => ipcRenderer.invoke('auth:is-setup'),
    setup: (password) => ipcRenderer.invoke('auth:setup', password),
    login: (password) => ipcRenderer.invoke('auth:login', password),

    // Employee
    getEmployees: () => ipcRenderer.invoke('employee:list'),
    saveEmployee: (emp) => ipcRenderer.invoke('employee:save', emp),
    deleteEmployee: (id) => ipcRenderer.invoke('employee:delete', id),

    // Payslip
    generatePayslip: (data) => ipcRenderer.invoke('payslip:generate', data),
    getPayslips: () => ipcRenderer.invoke('payslip:list'),
    openPayslip: (id) => ipcRenderer.invoke('payslip:open', id),

    // Email
    getSmtpConfig: () => ipcRenderer.invoke('config:get-smtp'),
    saveSmtpConfig: (config) => ipcRenderer.invoke('config:save-smtp', config),
    sendEmail: (data) => ipcRenderer.invoke('email:send', data)
});

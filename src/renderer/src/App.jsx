import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Setup from './components/Setup';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import PayslipGenerator from './components/PayslipGenerator';
import PayslipHistory from './components/PayslipHistory';
import Settings from './components/Settings';
import Attendance from './components/Attendance';
import AttendanceReport from './components/AttendanceReport';
import CompanyProfile from './components/CompanyProfile';
import Whitelist from './components/Whitelist';
import AdminLogs from './components/AdminLogs';
import PasswordConfirm from './components/PasswordConfirm';
import Expenses from './components/Expenses';
import PayrollGrid from './components/PayrollGrid';
import EmailComposer from './components/EmailComposer';
import api from './api';

export default function App() {
    const [auth, setAuth] = useState(false); // authorized
    const [user, setUser] = useState(null);
    const [needsSetup, setNeedsSetup] = useState(true);
    const [loading, setLoading] = useState(true);

    const [view, setView] = useState('dashboard');
    const [editingEmp, setEditingEmp] = useState(null);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [pendingView, setPendingView] = useState(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // Apply theme and color on boot
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedAccent = localStorage.getItem('accentColor') || '#0FB8AF';
        document.body.className = savedTheme;
        document.documentElement.style.setProperty('--accent', savedAccent);

        checkSetup();
    }, []);

    const checkSetup = async () => {
        try {
            const isSetup = await api.isSetup();
            setNeedsSetup(!isSetup);
        } catch (e) {
            console.error("Failed to check setup", e);
        }
        setLoading(false);
    };

    const handleNavClick = (id) => {
        if (id === 'attendance' || id === 'reports' || id === 'bulk') {
            setPendingView(id);
            setShowPasswordConfirm(true);
        } else {
            setView(id);
        }
        if (window.innerWidth <= 768) setSidebarOpen(false);
    };

    const NavItem = ({ id, label, icon }) => (
        <div className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => handleNavClick(id)}>
            <span style={{ marginRight: 10 }}>{icon}</span>
            {label}
        </div>
    );

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

    if (needsSetup) {
        return <Setup onSetupComplete={() => { setNeedsSetup(false); }} />;
    }

    if (!auth) {
        return <Login onLogin={(u) => {
            setUser(u);
            setAuth(true);
            api.setUser(u.email);
        }} />;
    }



    return (
        <div className="app-container">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <span style={{ fontSize: '24px' }}>☰</span>
            </button>

            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div style={{
                    textAlign: 'center',
                    padding: '20px 0 10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    marginBottom: '20px'
                }}>
                    <img
                        src="/logo.png"
                        alt="EurosHub Logo"
                        style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'contain',
                            marginBottom: '10px'
                        }}
                    />
                    <h2 style={{ margin: '0', fontSize: '20px', fontWeight: '600' }}>EurosHub</h2>
                </div>
                <NavItem id="dashboard" label="Dashboard" />
                <NavItem id="employees" label="Employees" />
                <NavItem id="attendance" label="Attendance" />
                <NavItem id="payroll" label="All Payslips" />
                <NavItem id="email" label="Compose Email" />
                <NavItem id="generate" label="Single Payslip" />
                <NavItem id="history" label="Payslip History" />
                <NavItem id="bulk" label="Bulk Operations" />
                <NavItem id="reports" label="Reports" />
                <NavItem id="expenses" label="Expenses" />
                <NavItem id="company" label="Company Profile" />
                {user?.role === 'super_admin' && (
                    <>
                        <NavItem id="whitelist" label="Whitelist" />
                        <NavItem id="logs" label="Activity Logs" />
                    </>
                )}
                <div className="spacer"></div>
                <NavItem id="settings" label="Settings" />
                <div className="nav-item" onClick={() => { setAuth(false); setUser(null); api.setUser(null); }} style={{ marginTop: 10, background: 'rgba(255,255,255,0.1)' }}>
                    <span style={{ marginRight: 10 }}>🚪</span> Logout
                </div>
            </div>

            <div className="main-content">
                {view === 'dashboard' && (
                    <div>
                        <h1>Dashboard</h1>
                        <div className="grid-2">
                            <div className="card" onClick={() => setView('generate')} style={{ cursor: 'pointer' }}>
                                <h3>Create New Payslip</h3>
                                <p>Generate PDF for this month</p>
                            </div>
                            <div className="card" onClick={() => setView('employees')} style={{ cursor: 'pointer' }}>
                                <h3>Manage Employees</h3>
                                <p>Add or Edit staff details</p>
                            </div>
                            <div className="card" onClick={() => handleNavClick('attendance')} style={{ cursor: 'pointer' }}>
                                <h3>Attendance</h3>
                                <p>Mark daily attendance and leaves</p>
                            </div>
                            <div className="card" onClick={() => handleNavClick('reports')} style={{ cursor: 'pointer' }}>
                                <h3>Reports</h3>
                                <p>Monthly payroll and attendance summaries</p>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'employees' && !editingEmp && (
                    <EmployeeList onEdit={(emp) => setEditingEmp(emp)} />
                )}

                {view === 'employees' && editingEmp && (
                    <EmployeeForm
                        employee={editingEmp.id ? editingEmp : null}
                        onSave={() => { setEditingEmp(null); }}
                        onCancel={() => setEditingEmp(null)}
                    />
                )}

                {view === 'attendance' && <Attendance />}

                {view === 'generate' && <PayslipGenerator onComplete={() => setView('history')} user={user} />}

                {view === 'payroll' && <PayrollGrid user={user} onNavigate={setView} />}

                {view === 'email' && <EmailComposer user={user} />}

                {view === 'history' && <PayslipHistory user={user} />}

                {view === 'bulk' && <PayslipHistory user={user} />}

                {view === 'reports' && <AttendanceReport />}

                {view === 'expenses' && <Expenses />}

                {view === 'company' && <CompanyProfile />}

                {view === 'whitelist' && user?.role === 'super_admin' && <Whitelist />}

                {view === 'logs' && user?.role === 'super_admin' && <AdminLogs />}

                {view === 'settings' && <Settings />}
            </div>

            {showPasswordConfirm && (
                <PasswordConfirm
                    email={user?.email}
                    onConfirm={() => {
                        setView(pendingView);
                        setShowPasswordConfirm(false);
                    }}
                    onCancel={() => setShowPasswordConfirm(false)}
                    title="Authorized Access"
                    message="Please enter master password to access this module."
                />
            )}
        </div>
    );
}

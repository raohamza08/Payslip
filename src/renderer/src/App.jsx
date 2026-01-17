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
import EmployeePortal from './components/EmployeePortal';
import LeaveManagement from './components/LeaveManagement';
import PerformanceReviews from './components/PerformanceReviews';
import AssetManagement from './components/AssetManagement';
import Discipline from './components/Discipline';
import MyPerformance from './components/MyPerformance';
import NotificationPanel from './components/NotificationPanel';
import UserManagement from './components/UserManagement';
import ToastManager, { showToast } from './components/ToastManager';
import api from './api';

export default function App() {
    const [auth, setAuth] = useState(false);
    const [user, setUser] = useState(null);
    const [needsSetup, setNeedsSetup] = useState(true);
    const [loading, setLoading] = useState(true);

    const [view, setView] = useState('dashboard');
    const [editingEmp, setEditingEmp] = useState(null);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [pendingView, setPendingView] = useState(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [pathname, setPathname] = useState(window.location.pathname.toLowerCase());

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedAccent = localStorage.getItem('accentColor') || '#0FB8AF';
        document.body.className = savedTheme;
        document.documentElement.style.setProperty('--accent', savedAccent);

        // Override default alert with professional toast
        window.alert = (message) => {
            const type = message && message.toLowerCase().includes('error') ? 'error' : 'info';
            showToast(message, type);
        };

        // Make toast globally available as window.toast
        window.toast = showToast;

        // Restore session if exists
        restoreSession();
        checkSetup();

        const handlePathChange = () => setPathname(window.location.pathname.toLowerCase());
        window.addEventListener('popstate', handlePathChange);
        const interval = setInterval(handlePathChange, 500);

        return () => {
            window.removeEventListener('popstate', handlePathChange);
            clearInterval(interval);
        };
    }, []);

    const restoreSession = async () => {
        try {
            const savedUser = localStorage.getItem('currentUser');
            const savedView = localStorage.getItem('currentView');

            if (savedUser) {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setAuth(true);
                api.setUser(userData.email);

                // Restore last view or default based on role
                if (savedView) {
                    setView(savedView);
                } else if (userData.role === 'employee') {
                    setView('portal');
                } else {
                    setView('dashboard');
                }

                // Refresh user data from server to get latest permissions
                try {
                    const freshUser = await api.getMe();
                    if (freshUser) {
                        const updated = { ...userData, ...freshUser };
                        setUser(updated);
                        localStorage.setItem('currentUser', JSON.stringify(updated));
                    }
                } catch (e) {
                    console.warn('Failed to refresh user session:', e);
                }
            }
        } catch (e) {
            console.error('Failed to restore session:', e);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentView');
        }
    };

    const checkSetup = async () => {
        try {
            const isSetup = await api.isSetup();
            setNeedsSetup(!isSetup);
        } catch (e) { console.error("Failed to check setup", e); }
        setLoading(false);
    };

    const handleNavClick = (id) => {
        const protectedViews = ['attendance', 'reports', 'bulk', 'admin-leaves', 'assets', 'warnings'];

        // If it's a protected view AND user is an admin, show PIN prompt.
        // If it's an employee with specific permission, we allow them through without PIN 
        // (as they don't have a Master Password/PIN configured).
        const needsPin = protectedViews.includes(id) && (user.role === 'admin' || user.role === 'super_admin');

        if (needsPin) {
            setPendingView(id);
            setShowPasswordConfirm(true);
        } else {
            setView(id);
            localStorage.setItem('currentView', id);
        }
        if (window.innerWidth <= 768) setSidebarOpen(false);
    };

    const NavItem = ({ id, label }) => (
        <div className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => handleNavClick(id)}>
            {label}
        </div>
    );

    if (loading) return <div className="loading-screen">Loading...</div>;

    const isLoginPath = pathname.includes('/login');
    const isSignupPath = pathname.includes('/signup');

    if (!auth || isLoginPath || isSignupPath) {
        if (needsSetup && !isLoginPath && !isSignupPath) {
            return <Setup onSetupComplete={() => setNeedsSetup(false)} />;
        }
        return <Login onLogin={(u) => {
            setUser(u);
            setAuth(true);
            setNeedsSetup(false);
            api.setUser(u.email);

            // Save session to localStorage
            localStorage.setItem('currentUser', JSON.stringify(u));

            const initialView = u.role === 'employee' ? 'portal' : 'dashboard';
            setView(initialView);
            localStorage.setItem('currentView', initialView);

            window.history.pushState({}, '', '/');
            setPathname('/');
        }} />;
    }

    const isEmployee = user.role === 'employee';
    const isSuperAdmin = user.role === 'super_admin';

    const hasPermission = (id) => {
        if (isSuperAdmin) return true;
        // Role 'admin' used to have default access, but we now check explicit permissions 
        // for both Admins and Employees to allow for the granular control requested.
        if (user.permissions && Array.isArray(user.permissions)) {
            return user.permissions.includes(id);
        }
        return false;
    };

    return (
        <div className="app-container">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <span style={{ fontSize: '24px' }}>☰</span>
            </button>

            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/logo.png" alt="Logo" style={{ width: '60px', marginBottom: '10px' }} />
                    <h2>EurosHub</h2>
                </div>

                <div className="nav-group">USER PORTAL</div>
                <NavItem id="portal" label="My Dashboard" />
                <NavItem id="my-leaves" label="My Leaves" />
                <NavItem id="my-performance" label="My Performance" />
                <NavItem id="my-payslips" label="My Payslips" />

                {(isSuperAdmin || user.role === 'admin' || (user.permissions && user.permissions.length > 0)) && (
                    <>
                        <div className="nav-group">ADMINISTRATION</div>
                        {!isEmployee && <NavItem id="dashboard" label="Analytics" />}
                        {hasPermission('employees') && <NavItem id="employees" label="Employees" />}
                        {hasPermission('payroll') && <NavItem id="payroll" label="Payroll Grid" />}
                        {hasPermission('payroll') && <NavItem id="single-payslip" label="Single Payslip" />}
                        {hasPermission('admin-leaves') && <NavItem id="admin-leaves" label="Leave Requests" />}
                        {hasPermission('assets') && <NavItem id="assets" label="Asset Management" />}

                        <div className="nav-group">OPERATIONS</div>
                        {hasPermission('attendance') && <NavItem id="attendance" label="Attendance" />}
                        {hasPermission('reports') && <NavItem id="reports" label="Reports & KPIs" />}
                        {hasPermission('expenses') && <NavItem id="expenses" label="Expenses" />}
                        {hasPermission('performance') && <NavItem id="performance" label="KPIs & Reviews" />}
                        {hasPermission('warnings') && <NavItem id="warnings" label="Discipline" />}
                        {hasPermission('email') && <NavItem id="email" label="Broadcast Emails" />}

                        {isSuperAdmin && (
                            <>
                                <div className="nav-group">SYSTEM CONFIG</div>
                                <NavItem id="user-management" label="User Management" />
                                <NavItem id="whitelist" label="Whitelist" />
                                <NavItem id="logs" label="Activity Logs" />
                            </>
                        )}
                    </>
                )}

                <div className="spacer"></div>
                <NavItem id="settings" label="Settings" />
                <div className="nav-item logout" onClick={() => {
                    setAuth(false);
                    setUser(null);
                    api.setUser(null);
                    // Clear session from localStorage
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('currentView');
                }}>
                    Logout
                </div>
            </div>

            <div className="main-content">
                {/* TOP BAR */}
                <div className="top-bar">
                    <h2 className="top-bar-title">
                        {view === 'portal' ? 'EurosHub Portal' : view.replace('-', ' ')}
                    </h2>
                    <div className="top-bar-actions">
                        <NotificationPanel />
                        <div className="user-profile">
                            <div className="user-info">
                                <div className="user-name">{user.name || user.email}</div>
                                <div className="user-role">{user.role.replace('_', ' ')}</div>
                            </div>
                            <div className="user-avatar">
                                {(user.name || user.email)[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="view-container">
                    {/* Common Views */}
                    {view === 'portal' && <EmployeePortal user={user} />}
                    {view === 'settings' && <Settings user={user} />}
                    {view === 'my-leaves' && <LeaveManagement user={user} />}
                    {view === 'my-performance' && <MyPerformance user={user} />}
                    {view === 'my-payslips' && <PayslipHistory user={user} />}

                    {/* Permission Managed Views (Admins or Privileged Employees) */}
                    {view === 'dashboard' && <AdminDashboard onNav={handleNavClick} />}
                    {view === 'employees' && hasPermission('employees') && (
                        !editingEmp ? <EmployeeList onEdit={setEditingEmp} /> :
                            <EmployeeForm employee={editingEmp.id ? editingEmp : null} onSave={() => setEditingEmp(null)} onCancel={() => setEditingEmp(null)} />
                    )}
                    {view === 'attendance' && hasPermission('attendance') && <Attendance />}
                    {view === 'payroll' && hasPermission('payroll') && <PayrollGrid user={user} onNavigate={setView} />}
                    {view === 'single-payslip' && hasPermission('payroll') && <PayslipGenerator user={user} onComplete={() => setView('history')} />}
                    {view === 'history' && (hasPermission('payroll') || true) && <PayslipHistory user={user} />}
                    {view === 'reports' && hasPermission('reports') && <AttendanceReport />}
                    {view === 'expenses' && hasPermission('expenses') && <Expenses />}
                    {view === 'performance' && hasPermission('performance') && <PerformanceReviews user={user} />}
                    {view === 'assets' && hasPermission('assets') && <AssetManagement />}
                    {view === 'warnings' && hasPermission('warnings') && <Discipline />}
                    {view === 'email' && hasPermission('email') && <EmailComposer />}
                    {view === 'admin-leaves' && hasPermission('admin-leaves') && <LeaveManagement user={user} />}

                    {/* Super Admin Only */}
                    {view === 'user-management' && (isSuperAdmin ? <UserManagement /> : <div className="p-20">Access Denied</div>)}
                    {view === 'whitelist' && (isSuperAdmin ? <Whitelist /> : <div className="p-20">Access Denied</div>)}
                    {view === 'logs' && (isSuperAdmin ? <AdminLogs /> : <div className="p-20">Access Denied</div>)}
                </div>
            </div>

            {showPasswordConfirm && (
                <PasswordConfirm
                    email={user?.email}
                    onConfirm={() => {
                        setView(pendingView);
                        localStorage.setItem('currentView', pendingView);
                        setShowPasswordConfirm(false);
                    }}
                    onCancel={() => setShowPasswordConfirm(false)}
                    title="Security Access"
                    message="Please enter Admin PIN to continue."
                />
            )}
            <ToastManager />
        </div>
    );
}

function AdminDashboard({ onNav }) {
    return (
        <div style={{ padding: '10px' }}>
            <div className="grid-3" style={{ marginTop: '20px', gap: '20px' }}>
                <div className="card shadow clickable" onClick={() => onNav('payroll')}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Run Payroll</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>Process salaries for current month</p>
                </div>
                <div className="card shadow clickable" onClick={() => onNav('admin-leaves')}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Pending Leaves</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>New requests waiting for approval</p>
                </div>
                <div className="card shadow clickable" onClick={() => onNav('attendance')}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Daily Attendance</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>View today's check-ins</p>
                </div>
            </div>
        </div>
    );
}

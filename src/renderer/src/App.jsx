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

    // Track expanded status for sidebar groups
    const [expanded, setExpanded] = useState({
        portal: false,
        admin: false,
        ops: false,
        system: false
    });

    const toggleGroup = (group) => setExpanded(prev => ({ ...prev, [group]: !prev[group] }));

    useEffect(() => {

        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedAccent = localStorage.getItem('accentColor') || '#0FB8AF';

        document.body.style.setProperty('--accent', savedAccent);
        document.body.style.setProperty('--accent-glow', `${savedAccent}66`);
        // Load Neon Atmosphere
        const neonColor = localStorage.getItem('neonColor') || '#0075FF';
        const neonIntensity = localStorage.getItem('neonIntensity') || '0.15';
        const neonSize = localStorage.getItem('neonSize') || '40';
        const neonX = localStorage.getItem('neonX') || '10';
        const neonY = localStorage.getItem('neonY') || '10';
        const neonShape = localStorage.getItem('neonShape') || 'circular';

        document.body.className = `${savedTheme} neon-${neonShape}`;
        document.body.style.setProperty('--neon-color', neonColor);
        document.body.style.setProperty('--neon-intensity', neonIntensity);
        document.body.style.setProperty('--neon-size', `${neonSize}%`);
        document.body.style.setProperty('--neon-position', `${neonX}% ${neonY}%`);

        // Override default alert with professional toast
        window.alert = (message) => {
            const type = message && message.toLowerCase().includes('error') ? 'error' : 'info';
            showToast(message, type);
        };

        window.toast = showToast;
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

                <div className="nav-group-header" onClick={() => toggleGroup('portal')}>
                    <span>USER PORTAL</span>
                    <span className={`chevron ${expanded.portal ? 'open' : ''}`}>▼</span>
                </div>
                {expanded.portal && (
                    <div className="nav-group-content">
                        <NavItem id="portal" label="My Dashboard" />
                        <NavItem id="my-leaves" label="My Leaves" />
                        <NavItem id="my-performance" label="My Performance" />
                        <NavItem id="my-payslips" label="My Payslips" />
                    </div>
                )}

                {(isSuperAdmin || user.role === 'admin' || (user.permissions && user.permissions.length > 0)) && (
                    <>
                        <div className="nav-group-header" onClick={() => toggleGroup('admin')}>
                            <span>ADMINISTRATION</span>
                            <span className={`chevron ${expanded.admin ? 'open' : ''}`}>▼</span>
                        </div>
                        {expanded.admin && (
                            <div className="nav-group-content">
                                {!isEmployee && <NavItem id="dashboard" label="Analytics" />}
                                {hasPermission('employees') && <NavItem id="employees" label="Employees" />}
                                {hasPermission('payroll') && <NavItem id="payroll" label="Payroll Grid" />}
                                {hasPermission('payroll') && <NavItem id="single-payslip" label="Single Payslip" />}
                                {hasPermission('admin-leaves') && <NavItem id="admin-leaves" label="Leave Requests" />}
                                {hasPermission('assets') && <NavItem id="assets" label="Asset Management" />}
                            </div>
                        )}

                        <div className="nav-group-header" onClick={() => toggleGroup('ops')}>
                            <span>OPERATIONS</span>
                            <span className={`chevron ${expanded.ops ? 'open' : ''}`}>▼</span>
                        </div>
                        {expanded.ops && (
                            <div className="nav-group-content">
                                {hasPermission('attendance') && <NavItem id="attendance" label="Attendance" />}
                                {hasPermission('reports') && <NavItem id="reports" label="Reports & KPIs" />}
                                {hasPermission('expenses') && <NavItem id="expenses" label="Expenses" />}
                                {hasPermission('performance') && <NavItem id="performance" label="KPIs & Reviews" />}
                                {hasPermission('warnings') && <NavItem id="warnings" label="Discipline" />}
                                {hasPermission('email') && <NavItem id="email" label="Broadcast Emails" />}
                            </div>
                        )}

                        {isSuperAdmin && (
                            <>
                                <div className="nav-group-header" onClick={() => toggleGroup('system')}>
                                    <span>SYSTEM CONFIG</span>
                                    <span className={`chevron ${expanded.system ? 'open' : ''}`}>▼</span>
                                </div>
                                {expanded.system && (
                                    <div className="nav-group-content">
                                        <NavItem id="user-management" label="User Management" />
                                        <NavItem id="whitelist" label="Whitelist" />
                                        <NavItem id="logs" label="Activity Logs" />
                                    </div>
                                )}
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
                        <NotificationPanel onNavigate={handleNavClick} />
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
        <div className="view-container">
            <div className="dash-grid">
                <div className="dash-card clickable" onClick={() => onNav('payroll')}>
                    <h3>Run Payroll</h3>
                    <p>Review financials and generate monthly payslips for the team.</p>
                </div>
                <div className="dash-card clickable" onClick={() => onNav('admin-leaves')}>
                    <h3>Leave Requests</h3>
                    <p>Manage employee absence requests and vacation approvals.</p>
                </div>
                <div className="dash-card clickable" onClick={() => onNav('attendance')}>
                    <h3>Live Attendance</h3>
                    <p>Monitor daily check-ins and track real-time sitting hours.</p>
                </div>
            </div>
        </div>
    );
}

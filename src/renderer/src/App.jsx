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
        checkSetup();

        const handlePathChange = () => setPathname(window.location.pathname.toLowerCase());
        window.addEventListener('popstate', handlePathChange);
        const interval = setInterval(handlePathChange, 500);

        return () => {
            window.removeEventListener('popstate', handlePathChange);
            clearInterval(interval);
        };
    }, []);

    const checkSetup = async () => {
        try {
            const isSetup = await api.isSetup();
            setNeedsSetup(!isSetup);
        } catch (e) { console.error("Failed to check setup", e); }
        setLoading(false);
    };

    const handleNavClick = (id) => {
        const protectedViews = ['attendance', 'reports', 'bulk', 'admin-leaves', 'assets', 'warnings'];
        if (protectedViews.includes(id)) {
            setPendingView(id);
            setShowPasswordConfirm(true);
        } else {
            setView(id);
        }
        if (window.innerWidth <= 768) setSidebarOpen(false);
    };

    const NavItem = ({ id, label, icon }) => (
        <div className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => handleNavClick(id)}>
            <span style={{ marginRight: 10 }}>{icon || '•'}</span>
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
            if (u.role !== 'super_admin') setView('portal');
            window.history.pushState({}, '', '/');
            setPathname('/');
        }} />;
    }

    const isEmployee = user.role !== 'super_admin';

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

                {isEmployee ? (
                    <>
                        <NavItem id="portal" label="My Portal" icon="🏠" />
                        <NavItem id="my-leaves" label="My Leaves" icon="📅" />
                        <NavItem id="my-performance" label="My Performance" icon="⭐" />
                        <NavItem id="my-payslips" label="My Payslips" icon="📜" />
                    </>
                ) : (
                    <>
                        <NavItem id="dashboard" label={user.role === 'super_admin' ? 'Super Admin' : 'HR Dashboard'} icon="📊" />
                        <div className="nav-group">PAYROLL & HR</div>
                        <NavItem id="employees" label="Employees" icon="👥" />
                        <NavItem id="payroll" label="Payroll Grid" icon="💰" />
                        <NavItem id="admin-leaves" label="Leave Requests" icon="📅" />
                        <NavItem id="assets" label="Asset Management" icon="💻" />

                        <div className="nav-group">OPERATIONS</div>
                        <NavItem id="attendance" label="Attendance" icon="🕒" />
                        <NavItem id="reports" label="Reports & KPIs" icon="📈" />
                        <NavItem id="expenses" label="Expenses" icon="💸" />
                        <NavItem id="performance" label="KPIs & Reviews" icon="⭐" />
                        <NavItem id="warnings" label="Discipline" icon="⚠️" />

                        {user.role === 'super_admin' && (
                            <>
                                <div className="nav-group">SYSTEM (Super Admin)</div>
                                <NavItem id="whitelist" label="Whitelist" icon="🔒" />
                                <NavItem id="logs" label="Activity Logs" icon="📋" />
                            </>
                        )}
                    </>
                )}

                <div className="spacer"></div>
                <NavItem id="settings" label="Settings" icon="⚙️" />
                <div className="nav-item logout" onClick={() => { setAuth(false); setUser(null); api.setUser(null); }}>
                    <span style={{ marginRight: 10 }}>🚪</span> Logout
                </div>
            </div>

            <div className="main-content">
                {/* TOP BAR */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '15px 25px', background: 'white', borderBottom: '1px solid #eee',
                    marginBottom: '10px'
                }}>
                    <h2 style={{ margin: 0, textTransform: 'capitalize' }}>
                        {view.replace('-', ' ')}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <NotificationPanel />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.name || user.email}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{user.role.replace('_', ' ')}</div>
                            </div>
                            <div style={{
                                width: '35px', height: '35px', borderRadius: '50%', background: 'var(--accent)',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold'
                            }}>
                                {(user.name || user.email)[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="view-container" style={{ padding: '10px 25px' }}>
                    {isEmployee ? (
                        <>
                            {view === 'portal' && <EmployeePortal user={user} />}
                            {view === 'my-leaves' && <LeaveManagement user={user} />}
                            {view === 'my-performance' && <MyPerformance user={user} />}
                            {view === 'my-payslips' && <PayslipHistory user={user} />}
                            {view === 'settings' && <Settings user={user} />}
                        </>
                    ) : (
                        <>
                            {view === 'dashboard' && <AdminDashboard onNav={handleNavClick} />}
                            {view === 'employees' && !editingEmp && <EmployeeList onEdit={setEditingEmp} />}
                            {view === 'employees' && editingEmp && <EmployeeForm employee={editingEmp.id ? editingEmp : null} onSave={() => setEditingEmp(null)} onCancel={() => setEditingEmp(null)} />}
                            {view === 'attendance' && <Attendance />}
                            {view === 'payroll' && <PayrollGrid user={user} onNavigate={setView} />}
                            {view === 'history' && <PayslipHistory user={user} />}
                            {view === 'reports' && <AttendanceReport />}
                            {view === 'expenses' && <Expenses />}
                            {view === 'performance' && <PerformanceReviews user={user} />}
                            {view === 'assets' && <AssetManagement />}
                            {view === 'warnings' && <Discipline />}

                            {view === 'whitelist' && (user.role === 'super_admin' ? <Whitelist /> : <div className="p-20">Access Denied</div>)}
                            {view === 'logs' && (user.role === 'super_admin' ? <AdminLogs /> : <div className="p-20">Access Denied</div>)}

                            {view === 'settings' && <Settings />}
                            {view === 'admin-leaves' && <LeaveManagement user={user} />}
                        </>
                    )}
                </div>
            </div>

            {showPasswordConfirm && (
                <PasswordConfirm
                    email={user?.email}
                    onConfirm={() => { setView(pendingView); setShowPasswordConfirm(false); }}
                    onCancel={() => setShowPasswordConfirm(false)}
                    title="Security Access"
                    message="Please enter Admin PIN to continue."
                />
            )}
        </div>
    );
}

function AdminDashboard({ onNav }) {
    return (
        <div style={{ padding: '10px' }}>
            <div className="grid-3" style={{ marginTop: '20px', gap: '20px' }}>
                <div className="card shadow clickable" onClick={() => onNav('payroll')}>
                    <h3 style={{ margin: '0 0 10px 0' }}>💰 Run Payroll</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>Process salaries for current month</p>
                </div>
                <div className="card shadow clickable" onClick={() => onNav('admin-leaves')}>
                    <h3 style={{ margin: '0 0 10px 0' }}>📅 Pending Leaves</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>New requests waiting for approval</p>
                </div>
                <div className="card shadow clickable" onClick={() => onNav('attendance')}>
                    <h3 style={{ margin: '0 0 10px 0' }}>🕒 Daily Attendance</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>View today's check-ins</p>
                </div>
            </div>
        </div>
    );
}

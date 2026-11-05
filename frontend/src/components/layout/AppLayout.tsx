import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { 
  CalendarCheck, 
  ClipboardList, 
  LayoutDashboard, 
  LogOut, 
  User, 
  Users 
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isHr = user?.role === 'HR_ADMIN';

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo & Navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  DX
                </div>
                <div>
                  <span className="font-semibold text-slate-900 tracking-tight text-base block leading-none">
                    WFH Attendance
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mt-1">
                    Dexa Group System
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center space-x-1">
                <NavLink to="/dashboard" className={navItemClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>

                {isHr ? (
                  <>
                    <NavLink to="/admin/employees" className={navItemClass}>
                      <Users className="w-4 h-4" />
                      <span>Data Karyawan</span>
                    </NavLink>
                    <NavLink to="/admin/attendances" className={navItemClass}>
                      <ClipboardList className="w-4 h-4" />
                      <span>Monitoring Absensi</span>
                    </NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/attendance/submit" className={navItemClass}>
                      <CalendarCheck className="w-4 h-4" />
                      <span>Absen WFH</span>
                    </NavLink>
                    <NavLink to="/attendance/history" className={navItemClass}>
                      <ClipboardList className="w-4 h-4" />
                      <span>Riwayat Absensi</span>
                    </NavLink>
                  </>
                )}
              </nav>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 text-right">
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-slate-900">
                    {user?.employee?.fullName || user?.email}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center justify-end space-x-1.5 mt-0.5">
                    {user?.employee?.department && (
                      <span className="text-slate-400">{user.employee.department} &bull;</span>
                    )}
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold tracking-wide uppercase ${
                        isHr
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/20'
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/20'
                      }`}
                    >
                      {isHr ? 'HR Admin' : 'Employee'}
                    </span>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                  <User className="w-4 h-4" />
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200" />

              <button
                onClick={handleLogout}
                title="Keluar dari sistem"
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-2 flex space-x-2 overflow-x-auto">
          <NavLink to="/dashboard" className={navItemClass}>
            <span>Dashboard</span>
          </NavLink>
          {isHr ? (
            <>
              <NavLink to="/admin/employees" className={navItemClass}>
                <span>Karyawan</span>
              </NavLink>
              <NavLink to="/admin/attendances" className={navItemClass}>
                <span>Monitoring</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/attendance/submit" className={navItemClass}>
                <span>Absen</span>
              </NavLink>
              <NavLink to="/attendance/history" className={navItemClass}>
                <span>Riwayat</span>
              </NavLink>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} WFH Attendance & Monitoring System &middot; Dexa Group</span>
          <span className="text-[11px] font-mono text-slate-400">Timezone: Asia/Jakarta (Server Authoritative)</span>
        </div>
      </footer>
    </div>
  );
};

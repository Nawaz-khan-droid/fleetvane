import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import ManagerLayout from './components/layout/ManagerLayout';

// Public Pages
import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/public/Signup';
import Privacy from './pages/public/Privacy';
import Terms from './pages/public/Terms';

// Manager Pages
import Dashboard from './pages/manager/Dashboard';
import Fleet from './pages/manager/Fleet';
import Shipments from './pages/manager/Shipments';
import Drivers from './pages/manager/Drivers';
import Settings from './pages/manager/Settings';

// Driver Pages
import DriverDashboard from './pages/driver/Dashboard';
import DriverRoute from './pages/driver/Route';
import DriverReport from './pages/driver/Report';

// Client Pages
import ClientDashboard from './pages/client/Dashboard';
import ClientTrack from './pages/client/Track';

// Shared Pages
import Profile from './pages/shared/Profile';

import './App.css';

// Protected Route Wrapper
const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">Loading FleetVane...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="fleetvane-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes (5 routes) */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/unauthorized" element={<div className="h-screen w-full flex items-center justify-center bg-slate-950 text-white">Unauthorized Access</div>} />

            {/* Manager Routes (6 routes) */}
            <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
              <Route path="/manager" element={<ManagerLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="fleet" element={<Fleet />} />
                <Route path="shipments" element={<Shipments />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Driver Routes (4 routes) */}
            <Route element={<ProtectedRoute allowedRoles={['DRIVER']} />}>
              <Route path="/driver" element={<DriverDashboard />} />
              <Route path="/driver/route" element={<DriverRoute />} />
              <Route path="/driver/report" element={<DriverReport />} />
              <Route path="/driver/profile" element={<Profile />} />
            </Route>

            {/* Client Routes (3 routes) */}
            <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/client/track" element={<ClientTrack />} />
              <Route path="/client/profile" element={<Profile />} />
            </Route>
            
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

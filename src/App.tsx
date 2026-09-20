import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BurialRecords from './pages/BurialRecords';
import PlotManagement from './pages/PlotManagement';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import MemorialPage from './pages/MemorialPage';
import Notifications from './pages/Notifications';
import CustomerHome from './pages/CustomerHome';
import CustomerAccount from './pages/CustomerAccount';
import VicinityMap from './pages/VicinityMap';
import { useAuth } from './contexts/AuthContext';

const AdminOnly = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  const { session, loading, isAdmin } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center font-semibold text-[#2F5D50] bg-[#F7F4EC]">Summoning records...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/memorial/:id" element={<AdminOnly><MemorialPage /></AdminOnly>} />
        
        <Route
          path="/*"
          element={
            session ? (
              <div className="flex min-h-screen bg-[#F7F4EC]">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Navbar user={session.user} />
                  <main className="p-8 overflow-y-auto w-full max-w-7xl mx-auto max-lg:p-6">
                    <Routes>
                      <Route path="/" element={isAdmin ? <Dashboard /> : <CustomerHome />} />
                      <Route path="/account" element={<CustomerAccount />} />
                      <Route path="/records" element={<AdminOnly><BurialRecords /></AdminOnly>} />
                      <Route path="/plots" element={<PlotManagement view="plots" />} />
                      <Route path="/vicinity-map" element={<VicinityMap />} />
                      <Route path="/reservations" element={<PlotManagement view="reservations" />} />
                      <Route path="/notifications" element={<AdminOnly><Notifications /></AdminOnly>} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </main>
                </div>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

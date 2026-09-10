import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BurialRecords from './pages/BurialRecords';
import PlotManagement from './pages/PlotManagement';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import MemorialPage from './pages/MemorialPage';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { session, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center font-semibold text-blue-600">Summoning records...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/" />} />
        <Route path="/memorial/:id" element={<MemorialPage />} />
        
        <Route
          path="/*"
          element={
            session ? (
              <div className="flex min-h-screen bg-white">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Navbar user={session.user} />
                  <main className="p-6 overflow-y-auto w-full max-w-7xl mx-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/records" element={<BurialRecords />} />
                      <Route path="/plots" element={<PlotManagement />} />
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

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Meetings from './pages/Meetings';
import MeetingDetail from './pages/MeetingDetail';
import WorkReports from './pages/WorkReports';
import CreateWorkReport from './pages/CreateWorkReport';
import EditWorkReport from './pages/EditWorkReport';
import WorkReportDetail from './pages/WorkReportDetail';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Sponsorships from './pages/Sponsorships';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import ActivityPoints from './pages/ActivityPoints';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    
                    <Route path="/work-reports" element={<WorkReports />} />
                    <Route path="/work-reports/create" element={<CreateWorkReport />} />
                    <Route path="/work-reports/:id" element={<WorkReportDetail />} />
                    <Route path="/work-reports/:id/edit" element={<EditWorkReport />} />
                    
                    <Route path="/meetings" element={<Meetings />} />
                    <Route path="/meetings/:id" element={<MeetingDetail />} />
                    
                    <Route path="/sponsorships" element={<Sponsorships />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/activity-points" element={<ActivityPoints />} />

                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute adminOnly>
                          <Users />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
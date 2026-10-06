import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import AdminLogin from "./pages/AdminLogin";
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
      <Route path="/staff/dashboard" element={<StaffDashboard />} />
      <Route path="/admin/login" element={<AdminLogin />} />
    </Routes>
  );
}

export default App;

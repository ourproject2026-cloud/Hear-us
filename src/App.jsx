import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ReportDetail from "./pages/ReportDetail";
import SubmitReport from "./pages/SubmitReport";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Signup from "./pages/Signup";
import AuthSuccess from "./pages/AuthSuccess";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface">
        <Navbar />

        <main className="max-w-7xl mx-auto px-6 py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Home />} />
            <Route path="/reports/:id" element={<ReportDetail />} />
            <Route path="/submit" element={<SubmitReport />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth-success" element={<AuthSuccess />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
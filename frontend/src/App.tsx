import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MemberProvider } from "./context/MemberContext";
import { LoginPage } from "./components/LoginPage";
import { TopBar } from "./components/TopBar";
import { Spinner } from "./components/ui/Spinner";
import { Toaster } from "./components/ui/Toast";
import { SummaryPage }        from "./pages/SummaryPage";
import { MembersPage }        from "./pages/MembersPage";
import { BazarPage }          from "./pages/BazarPage";
import { MealsPage }          from "./pages/MealsPage";
import { MyMealPage }         from "./pages/MyMealPage";
import { MyBazarPage }        from "./pages/MyBazarPage";
import { MealEnrollmentPage } from "./pages/MealEnrollmentPage";

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" className="text-red-500" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen">
      <TopBar />
      <Routes>
        <Route path="/"            element={<Navigate to="/summary" replace />} />
        <Route path="/summary"     element={<SummaryPage />} />
        <Route path="/members"     element={<MembersPage />} />
        <Route path="/bazar"       element={<BazarPage />} />
        <Route path="/meals"       element={<MealsPage />} />
        <Route path="/enrollment"  element={<MealEnrollmentPage />} />
        <Route path="/my-bazar"    element={<MyBazarPage />} />
        <Route path="/my-meal"     element={<MyMealPage />} />
        <Route path="*"            element={<Navigate to="/summary" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MemberProvider>
          <AppShell />
          <Toaster />
        </MemberProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

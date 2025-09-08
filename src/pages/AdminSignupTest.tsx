import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminSignupTest() {
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate to admin signup with the test token
    navigate("/admin/signup?token=adm-0C6D47EA-2025-09-08");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold mb-2">Redirecting to Admin Signup...</h1>
        <p className="text-muted-foreground">Testing with token: adm-0C6D47EA-2025-09-08</p>
      </div>
    </div>
  );
}
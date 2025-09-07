import { Shield } from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminTabs } from "@/components/admin/AdminTabs";

export default function Admin() {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin</h1>
              <p className="text-muted-foreground">Console administrativo do DosageZen</p>
            </div>
          </div>

          {/* Tabs */}
          <AdminTabs />
        </div>
      </div>
    </AdminGuard>
  );
}
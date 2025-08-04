import { Layout } from "@/shared/components/Layout";
import BrowseTabs from "./BrowseTabs";

export default function DashboardPage() {
  return (
    <Layout>
      <div className="space-y-8 p-6">
        {/* Welcome Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-worship mb-4">
            Welcome to HSA Songbook
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discover, organize, and share worship chord charts for your
            community
          </p>
        </div>

        {/* Browse Tabs Component */}
        <BrowseTabs />
      </div>
    </Layout>
  );
}

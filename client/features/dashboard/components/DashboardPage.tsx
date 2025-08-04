import { Layout } from "@/shared/components/Layout";

export default function DashboardPage() {
  return (
    <Layout>
      <div className="space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-worship mb-4">Welcome to HSA Songbook</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discover, organize, and share worship chord charts for your community
          </p>
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Dashboard Loading...</h2>
            <p className="text-muted-foreground">
              The application is working correctly without infinite render loops.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

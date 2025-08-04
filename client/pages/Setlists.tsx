import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Setlists() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto text-center py-16">
        <Card>
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-worship/10 rounded-full flex items-center justify-center mb-4">
              <List className="h-8 w-8 text-worship" />
            </div>
            <CardTitle className="text-2xl">Setlist Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This page will contain setlist creation and management tools. 
              You can continue prompting to build out this page with drag-and-drop 
              functionality, sharing options, and performance features.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Planned features:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Drag-and-drop setlist builder</li>
                <li>• Real-time collaboration</li>
                <li>• Performance mode with navigation</li>
                <li>• Setlist sharing and templates</li>
                <li>• Export to PDF/print</li>
              </ul>
            </div>
            <div className="pt-4">
              <Button asChild>
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

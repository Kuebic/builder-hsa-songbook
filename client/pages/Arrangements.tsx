import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Arrangements() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto text-center py-16">
        <Card>
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-worship/10 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-worship" />
            </div>
            <CardTitle className="text-2xl">Arrangements Library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This page will contain all song arrangements including different
              keys, capo positions, and instrumental arrangements. You can
              continue prompting to build out this page with arrangement
              comparison and editing tools.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Planned features:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multiple arrangements per song</li>
                <li>• Key and capo variations</li>
                <li>• Instrument-specific arrangements</li>
                <li>• Mashup builder</li>
                <li>• Community contributed arrangements</li>
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

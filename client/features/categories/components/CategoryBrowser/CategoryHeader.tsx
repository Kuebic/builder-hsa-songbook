import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SpiritualCategory } from "../../types/category.types";

export interface CategoryHeaderProps {
  category: SpiritualCategory;
  themeColors: {
    background: string;
    border: string;
    text: string;
  } | null;
  totalSongs?: number;
}

export function CategoryHeader({ category, themeColors, totalSongs }: CategoryHeaderProps) {
  const IconComponent = category.icon;
  
  return (
    <>
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/"><Home className="h-4 w-4" /></Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/songs">Songs</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Category Header */}
      <div className={`rounded-lg border p-6 ${themeColors?.background} ${themeColors?.border}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${themeColors?.text} bg-white/80`}>
              <IconComponent className="h-8 w-8" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${themeColors?.text}`}>{category.name}</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                {category.description}
              </p>
              {totalSongs !== undefined && (
                <p className="text-sm text-muted-foreground mt-2">
                  {totalSongs} {totalSongs === 1 ? 'song' : 'songs'} in this category
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/songs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Songs
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
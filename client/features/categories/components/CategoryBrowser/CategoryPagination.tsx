import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface CategoryPaginationProps {
  pagination: PaginationInfo | undefined;
}

export function CategoryPagination({ pagination }: CategoryPaginationProps) {
  const [searchParams] = useSearchParams();
  
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }
  
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    return `?${params.toString()}`;
  };
  
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination.hasPrevPage}
          asChild={pagination.hasPrevPage}
        >
          {pagination.hasPrevPage ? (
            <Link to={createPageUrl(pagination.page - 1)}>
              Previous
            </Link>
          ) : (
            <span>Previous</span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination.hasNextPage}
          asChild={pagination.hasNextPage}
        >
          {pagination.hasNextPage ? (
            <Link to={createPageUrl(pagination.page + 1)}>
              Next
            </Link>
          ) : (
            <span>Next</span>
          )}
        </Button>
      </div>
    </div>
  );
}
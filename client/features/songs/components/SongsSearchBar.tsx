import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SongsSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Search bar component for filtering songs
 */
export const SongsSearchBar = ({ 
  searchQuery, 
  onSearchChange,
  placeholder = "Search songs, artists, or themes..."
}: SongsSearchBarProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
        aria-label="Search songs"
      />
    </div>
  );
};

export default SongsSearchBar;
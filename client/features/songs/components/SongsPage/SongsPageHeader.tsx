export interface SongsPageHeaderProps {
  songCount: number;
}

export function SongsPageHeader({ songCount }: SongsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Songs Library</h1>
        <p className="text-muted-foreground mt-1">
          Discover and explore our collection of worship songs
        </p>
      </div>
      {songCount > 0 && (
        <div className="text-sm text-muted-foreground">
          {songCount} {songCount === 1 ? "song" : "songs"}
        </div>
      )}
    </div>
  );
}
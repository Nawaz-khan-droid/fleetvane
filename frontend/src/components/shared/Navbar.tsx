import { Bell as BellIcon, Search as SearchIcon, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center text-muted-foreground w-1/3">
        <SearchIcon className="h-4 w-4 mr-2" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="text-muted-foreground hover:text-foreground relative">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full"></span>
        </button>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
          <UserIcon className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}

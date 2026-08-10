import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Truck, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeProvider';

export default function Sidebar() {
  const { theme, setTheme } = useTheme();

  return (
    <aside className="w-64 border-r border-border h-screen flex flex-col bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-primary">FleetVane</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <NavLink 
          to="/manager" 
          end
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`
          }
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </NavLink>
        <NavLink 
          to="/manager/map" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`
          }
        >
          <Map className="h-5 w-5" />
          Map
        </NavLink>
        <NavLink 
          to="/manager/deliveries" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`
          }
        >
          <Truck className="h-5 w-5" />
          Deliveries
        </NavLink>
        <NavLink 
          to="/manager/drivers" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`
          }
        >
          <Users className="h-5 w-5" />
          Drivers
        </NavLink>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span>Theme</span>
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value as any)}
            className="bg-transparent border border-border rounded px-2 py-1"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </aside>
  );
}

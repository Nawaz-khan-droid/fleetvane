import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import ManagerLayout from './components/layout/ManagerLayout';
import Dashboard from './pages/manager/Dashboard';
import './App.css';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="fleetvane-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/manager" replace />} />
          
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<Dashboard />} />
            {/* Additional routes would go here */}
            <Route path="map" element={<div>Map View</div>} />
            <Route path="deliveries" element={<div>Deliveries View</div>} />
            <Route path="drivers" element={<div>Drivers View</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

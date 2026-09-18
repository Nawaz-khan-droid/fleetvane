import { create } from 'zustand';
import type { Shipment, Vehicle, DriverWithProfile } from '@/types';

interface AppState {
  shipments: Shipment[];
  vehicles: Vehicle[];
  drivers: DriverWithProfile[];
  activities: any[];
  setShipments: (shipments: Shipment[]) => void;
  addShipment: (shipment: Shipment) => void;
  updateShipment: (id: any, shipment: Shipment) => void;
  updateShipmentStatus: (id: string, status: any) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  updateVehicleLocation: (vehicleId: string, lat: number, lng: number, speed: number, heading: number) => void;
  setDrivers: (drivers: DriverWithProfile[]) => void;
  setActivities: (activities: any[]) => void;
  addActivity: (activity: any) => void;
}

export const useStore = create<AppState>((set) => ({
  shipments: [],
  vehicles: [],
  drivers: [],
  activities: [],
  setShipments: (shipments) => set({ shipments }),
  addShipment: (shipment) => set((state) => ({ shipments: [shipment, ...state.shipments] })),
  updateShipment: (id, shipment) => set((state) => ({
    shipments: state.shipments.map(s => s.id === id ? shipment : s)
  })),
  updateShipmentStatus: (id, status) => set((state) => ({
    shipments: state.shipments.map(s => s.id === id ? { ...s, status } : s)
  })),
  setVehicles: (vehicles) => set({ vehicles }),
  updateVehicleLocation: (vehicleId, lat, lng, speed, heading) => set((state) => ({
    vehicles: state.vehicles.map(v => v.id === vehicleId ? { ...v, lat, lng, speed, heading } : v)
  })),
  setDrivers: (drivers) => set({ drivers }),
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) => set((state) => ({ activities: [activity, ...state.activities] })),
}));

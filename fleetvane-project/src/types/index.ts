export type UserRole = 'CLIENT' | 'DRIVER' | 'MANAGER' | 'ADMIN';

export type ShipmentStatus = 'REQUESTED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export type VehicleType = 'VAN' | 'TRUCK' | 'HEAVY_HAULER';

export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';

export type ReportType = 'DELAY' | 'INCIDENT' | 'BREAKDOWN' | 'OTHER';

export interface UserPayload {
  userId: string;
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
  companyName?: string;
}

export interface Shipment {
  id: string;
  clientId: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  weight: number | null;
  eta: string | null;
  deliveredAt: string | null;
  createdAt: string;
  vehicleId: string | null;
  driverId: string | null;
  vehicle?: Vehicle | null;
  driver?: { id: string; name: string; email: string } | null;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: VehicleType;
  model: string;
  capacity: number;
  fuelType: string;
  status: VehicleStatus;
  lat: number;
  lng: number;
  heading: number;
  driverProfiles?: { userId: string; isAvailable: boolean; user: { id: string; name: string; email: string } }[];
}

export interface DriverWithProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  driverProfile: {
    id: string;
    licenseNumber: string;
    vehicleId: string | null;
    isAvailable: boolean;
    vehicle?: { id: string; plateNumber: string; type: string; model: string } | null;
  } | null;
}

export interface IncidentReport {
  id: string;
  type: ReportType;
  description: string;
  driverId: string;
  shipmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export interface RoutePoint {
  lat: number;
  lng: number;
}

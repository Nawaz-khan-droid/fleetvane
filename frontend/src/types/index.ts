export type UserRole = 'FLEET_MANAGER' | 'DELIVERY_DRIVER' | 'CLIENT';

export type DeliveryStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type TruckStatus = 'IDLE' | 'IN_TRANSIT' | 'OFFLINE' | 'DELAYED';

export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

export interface Truck {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  status: TruckStatus;
  lat: number;
  lng: number;
  heading: number;
  driverId?: string;
}

export interface Delivery {
  id: string;
  clientId: string;
  status: DeliveryStatus;
  origin: string;
  destination: string;
  weight: number | null;
  eta: string | null;
  deliveredAt: string | null;
  createdAt: string;
  truckId: string | null;
  driverId: string | null;
  truck?: Truck | null;
  driver?: User | null;
}

export interface Incident {
  id: string;
  status: IncidentStatus;
  description: string;
  driverId: string;
  deliveryId: string | null;
  createdAt: string;
}

export interface LocationHistory {
  id: string;
  truckId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

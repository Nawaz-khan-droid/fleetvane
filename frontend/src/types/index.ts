export type UserRole = 'CLIENT' | 'DRIVER' | 'MANAGER' | 'ADMIN';

/**
 * Mirrors the backend OrderStatus enum on DeliveryOrder.java.
 * Shipment.java still uses legacy statuses — kept as a union here
 * so both entity types are covered.
 */
export type ShipmentStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'EN_ROUTE_TO_PICKUP'
  | 'AT_PICKUP'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderStatus =
  | 'PENDING_PREPARATION'
  | 'READY_FOR_DISPATCH'
  | 'SCHEDULED_ASSIGNED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'DELAYED_RISK';

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
  companyId?: string | number;
}

export interface Company {
  id: number;
  name: string;
  type: string;
}

/** Mirrors Shipment.java (the legacy transactional entity). */
export interface Shipment {
  id: string;
  clientId: string;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  transportCompanyId?: string | number | null;
  transportCompanyName?: string | null;
  status: ShipmentStatus;
  originAddress: string;
  originLat: number | null;
  originLng: number | null;
  destinationAddress: string;
  destinationLat: number | null;
  destinationLng: number | null;
  weight: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  volumeM3?: number | null;
  eta: string | null;
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  vehicleId: string | null;
  driverId: string | null;
  vehicle?: Vehicle | null;
  driver?: { id: string; name: string; email: string } | null;
  qrToken?: string | null;
  description?: string | null;
  category?: string | null;
  podPhotoBase64?: string | null;
  podSignatureBase64?: string | null;
}

/**
 * Mirrors DeliveryOrder.java — the new plain-decimal optimisation entity.
 * Field names match the Java column definitions exactly.
 */
export interface DeliveryOrder {
  id: number;
  clientUsername: string;
  vehicleId: string | null;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  cargoWeightKg: number;
  cargoVolumeM3: number;
  readyByTime: string;
  deliveryDeadline: string;
  clientPriorityScore: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
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

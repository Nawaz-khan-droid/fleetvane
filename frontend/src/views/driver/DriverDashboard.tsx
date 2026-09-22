'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  MapPin,
  Navigation,
  Weight,
  Clock,
  FileText,
  Route,
  ArrowRight,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { normalizePageResponse } from '@/lib/utils';
import { useRouter } from '@/context/RouterContext';
import type { Shipment, Vehicle, DriverWithProfile, ShipmentStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    REQUESTED: 'Pending',
    ASSIGNED: 'Accepted',
    EN_ROUTE_TO_PICKUP: 'En Route',
    AT_PICKUP: 'At Pickup',
    IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled'
  };
  return map[status] || status;
}

// ── Distance/duration from REAL database coordinates (no geo guessing) ──
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadFactor = 1.25; // Driving route adjustment factor
  return Math.round(R * c * roadFactor);
}

function calculateDistance(
  oLat?: number | null, oLng?: number | null,
  dLat?: number | null, dLng?: number | null
): string {
  if (oLat == null || oLng == null || dLat == null || dLng == null) return '—';
  const km = haversineKm(oLat, oLng, dLat, dLng);
  return km > 0 ? `${km} km` : '—';
}

function calculateDuration(
  oLat?: number | null, oLng?: number | null,
  dLat?: number | null, dLng?: number | null,
  eta?: string | null
): string {
  if (eta) {
    const diffMs = new Date(eta).getTime() - Date.now();
    if (diffMs > 0) {
      const totalMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
  }
  if (oLat == null || oLng == null || dLat == null || dLng == null) return '—';
  const km = haversineKm(oLat, oLng, dLat, dLng);
  const avgSpeedKmH = 50; // Average commercial truck transit speed
  const totalMinutes = Math.round((km / avgSpeedKmH) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${Math.max(1, hours)}h ${mins > 0 ? `${mins}m` : ''}`.trim();
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const STEPS = ['ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'AT_PICKUP', 'IN_TRANSIT', 'DELIVERED'];
const STEP_LABELS = ['Accepted', 'En Route to Pickup', 'At Pickup', 'In Transit', 'Delivered'];

export default function DriverDashboard() {
  const { state: authState } = useAuth();
  const { navigate } = useRouter();

  const [driverProfile, setDriverProfile] = useState<DriverWithProfile | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch driver profile, vehicles, and shipments ──────
  useEffect(() => {
    if (!authState.token) return;
    (async () => {
      try {
        const headers = { Authorization: `Bearer ${authState.token}` };

        // Fetch driver profile
        const driversRes = await fetchWithAuth('/api/drivers', { headers });
        if (!driversRes.ok) throw new Error('Failed to fetch drivers');
        const rawDrivers = await driversRes.json();
        const driversData: DriverWithProfile[] = normalizePageResponse<DriverWithProfile>(rawDrivers).items;
        const myUserId = authState.user?.userId || (authState.user as any)?.id;
        const me = driversData.find((d: any) => d.id === myUserId || d.userId === myUserId || d.driverProfile?.userId === myUserId);
        setDriverProfile(me || null);

        // Fetch all vehicles and shipments
        const [vehiclesRes, shipmentsRes] = await Promise.all([
          fetchWithAuth('/api/vehicles', { headers }),
          fetchWithAuth('/api/shipments?size=50', { headers }),
        ]);

        if (!vehiclesRes.ok || !shipmentsRes.ok) {
          throw new Error('HTTP Error during fetch');
        }

        const rawVehicles = await vehiclesRes.json();
        const rawShipments = await shipmentsRes.json();

        const vPage = normalizePageResponse<Vehicle>(rawVehicles);
        const sPage = normalizePageResponse<Shipment>(rawShipments);

        const vehiclesData = vPage.items;
        const shipmentsData = sPage.items;

        // Find assignment: driver profile has vehicleId
        const assignedVehicleId = me?.driverProfile?.vehicleId;
        if (assignedVehicleId) {
          const assignedVehicle = vehiclesData.find((v) => v.id === assignedVehicleId);
          setVehicle(assignedVehicle || null);

          // Find active shipment for this driver
          const activeShipment = shipmentsData.find(
            (s) =>
              s.driverId === String(myUserId) &&
              (s.status === 'ASSIGNED' ||
               s.status === 'EN_ROUTE_TO_PICKUP' ||
               s.status === 'AT_PICKUP' ||
               s.status === 'DISPATCHED' ||
               s.status === 'IN_TRANSIT' ||
               s.status === 'ARRIVED')
          );
          setShipment(activeShipment || null);
        }
      } catch {
        toast.error('An error occurred');
      } finally {
        setLoading(false);
      }
    })();
  }, [authState.token, authState.user?.userId, (authState.user as any)?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const hasAssignment = vehicle && shipment;
  const greeting = getGreeting();
  const userName = authState.user?.name?.split(' ')[0] || 'Driver';

  const currentStepIndex = shipment ? STEPS.indexOf(shipment.status) : -1;

  const acceptShipment = async () => {
    if (!shipment) return;
    try {
      const res = await fetchWithAuth(`/api/shipments/${shipment.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'EN_ROUTE_TO_PICKUP' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || 'Failed to accept shipment');
      }
      const updated = await res.json();
      setShipment((prev) => prev ? { ...prev, status: updated.status as any } : prev);
      toast.success('Shipment accepted! Navigate to pickup location.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept shipment');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {greeting}, {userName}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {hasAssignment ? 'Here is your assignment for today' : 'No active assignments for now'}
        </p>
      </div>

      {!hasAssignment ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-16 px-6 shadow-sm"
        >
          <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-6">
            <Truck className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Assignment Today</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Check back later or contact your manager if you believe you should have an assignment.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Hero Assignment Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-medium">Today's Shipment</span>
              <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                #{String(shipment.id).substring(0, 8).toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <div className="flex-1 w-full text-center sm:text-left">
                <p className="text-xs text-white/70 font-medium mb-1">FROM</p>
                <p className="font-semibold text-lg line-clamp-2">{shipment.originAddress}</p>
              </div>
              <div className="hidden sm:flex shrink-0 items-center justify-center">
                <ArrowRight className="w-8 h-8 text-white/50" />
              </div>
              <div className="sm:hidden w-full flex justify-center py-2">
                <ArrowRight className="w-6 h-6 text-white/50 rotate-90" />
              </div>
              <div className="flex-1 w-full text-center sm:text-right">
                <p className="text-xs text-white/70 font-medium mb-1">TO</p>
                <p className="font-semibold text-lg line-clamp-2">{shipment.destinationAddress}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="bg-white/10 rounded-xl px-4 py-2 text-sm flex items-center gap-2">
                <Weight className="w-4 h-4 text-white/70" />
                <span className="font-medium">{shipment.weight ? `${shipment.weight} kg` : 'N/A'}</span>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-sm flex items-center gap-2">
                <Route className="w-4 h-4 text-white/70" />
                <span className="font-medium">
                  {calculateDistance(
                    shipment.originLat,
                    shipment.originLng,
                    shipment.destinationLat,
                    shipment.destinationLng,
                  )}
                </span>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/70" />
                <span className="font-medium">
                  {calculateDuration(
                    shipment.originLat,
                    shipment.originLng,
                    shipment.destinationLat,
                    shipment.destinationLng,
                    shipment.eta,
                  )}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Milestone Stepper Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm overflow-x-auto"
          >
            <div className="min-w-[500px]">
              <div className="relative flex justify-between items-center w-full">
                {/* Progress bar background */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
                
                {/* Progress bar fill */}
                <div 
                  className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full transition-all duration-500"
                  style={{ 
                    width: currentStepIndex >= 0 
                      ? `calc(${(Math.max(0, currentStepIndex) / (STEPS.length - 1)) * 100}% - 48px)` 
                      : '0%' 
                  }}
                />

                {STEPS.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : isCurrent 
                            ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 ring-4 ring-blue-50 dark:ring-blue-900/20' 
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-blue-600' : 'bg-transparent'}`} />
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${
                        isCurrent 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : isCompleted 
                            ? 'text-slate-700 dark:text-slate-300' 
                            : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {STEP_LABELS[index]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {/* Accept button when shipment is newly ASSIGNED */}
            {shipment?.status === 'ASSIGNED' && (
              <button
                onClick={acceptShipment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 py-3.5 text-sm inline-flex justify-center items-center gap-2 transition-colors shadow-lg"
              >
                <Check className="w-5 h-5" />
                Accept Delivery
              </button>
            )}
            <button
              onClick={() => navigate('/driver/route')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-3.5 text-sm inline-flex justify-center items-center gap-2 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              {shipment?.status === 'ASSIGNED' ? 'View Route' : 'Continue Route'}
            </button>
            <button
              onClick={() => navigate('/driver/report')}
              className="flex-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 font-semibold rounded-xl px-5 py-3.5 text-sm inline-flex justify-center items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Submit Report
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}

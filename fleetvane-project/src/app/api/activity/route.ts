import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

interface ActivityItem {
  id: string;
  type: 'SHIPMENT_CREATED' | 'VEHICLE_ASSIGNED' | 'DELIVERED' | 'REPORT_SUBMITTED' | 'DRIVER_CREATED' | 'STATUS_UPDATE';
  message: string;
  time: string;
}

function timeAgo(date: Date): string {
  if (!date || isNaN(date.getTime())) return 'Unknown time';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

export async function GET(req: NextRequest) {
  try {
    const activities: ActivityItem[] = [];

    // Aggregating from Spring Boot endpoints
    const [shipmentsRes, incidentsRes, driversRes] = await Promise.all([
      forwardToBackend(req, '/api/shipments'),
      forwardToBackend(req, '/api/incidents'),
      forwardToBackend(req, '/api/drivers')
    ]);

    const shipments = Array.isArray(shipmentsRes.data) ? shipmentsRes.data : [];
    const incidents = Array.isArray(incidentsRes.data) ? incidentsRes.data : [];
    const drivers = Array.isArray(driversRes.data) ? driversRes.data : [];

    // Map shipments
    shipments.slice(0, 5).forEach((s: any) => {
      if (s.status === 'DELIVERED') {
        activities.push({
          id: `ship-delivered-${s.id}`,
          type: 'DELIVERED',
          message: `Shipment delivered successfully in ${s.destination}`,
          time: s.deliveredAt ? timeAgo(new Date(s.deliveredAt)) : 'Unknown',
        });
      } else if (s.status === 'ASSIGNED' || s.status === 'IN_TRANSIT') {
        activities.push({
          id: `ship-assigned-${s.id}`,
          type: 'VEHICLE_ASSIGNED',
          message: `Vehicle assigned for delivery to ${s.destination}`,
          time: timeAgo(new Date(s.updatedAt || s.createdAt)),
        });
      } else {
        activities.push({
          id: `ship-created-${s.id}`,
          type: 'SHIPMENT_CREATED',
          message: `New shipment request to ${s.destination}`,
          time: timeAgo(new Date(s.createdAt)),
        });
      }
    });

    // Map incidents
    incidents.slice(0, 3).forEach((r: any) => {
      activities.push({
        id: `report-${r.id}`,
        type: 'REPORT_SUBMITTED',
        message: `A ${r.type?.toLowerCase() || 'incident'} report was submitted`,
        time: timeAgo(new Date(r.createdAt)),
      });
    });

    // Map drivers
    drivers.slice(0, 2).forEach((d: any) => {
      activities.push({
        id: `driver-${d.id}`,
        type: 'DRIVER_CREATED',
        message: `Driver updated/added in the system`,
        time: 'Recently',
      });
    });

    return NextResponse.json(activities.slice(0, 8));
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

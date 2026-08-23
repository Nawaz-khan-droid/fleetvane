import { Server } from 'socket.io';

const io = new Server({
  cors: { origin: '*' },
});

const PORT = 3004;

io.on('connection', (socket) => {
  console.log(`[Tracking] Client connected: ${socket.id}`);

  socket.on('subscribe-vehicle', (vehicleId: string) => {
    socket.join(`vehicle:${vehicleId}`);
    console.log(`[Tracking] Socket ${socket.id} subscribed to vehicle ${vehicleId}`);
  });

  socket.on('unsubscribe-vehicle', (vehicleId: string) => {
    socket.leave(`vehicle:${vehicleId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Tracking] Client disconnected: ${socket.id}`);
  });
});

io.listen(PORT, () => {
  console.log(`[Tracking] Socket.IO server running on port ${PORT}`);
});

// ─── Vehicle simulation loop ─────────────────────────────────
// Moves IN_USE vehicles along a predefined path every 2 seconds.
// In production, this would consume real GPS feed data.

interface SimVehicle {
  id: string;
  lat: number;
  lng: number;
  step: number;
  destination: { lat: number; lng: number };
}

// Mumbai to Delhi approximate route waypoints (simplified)
const ROUTE_WAYPOINTS = [
  { lat: 19.076, lng: 72.8777 },   // Mumbai
  { lat: 19.3, lng: 73.1 },
  { lat: 19.9, lng: 73.4 },
  { lat: 20.5, lng: 73.7 },       // Nashik area
  { lat: 21.1, lng: 74.0 },
  { lat: 21.7, lng: 75.0 },       // Indore approach
  { lat: 22.3, lng: 75.6 },
  { lat: 23.0, lng: 76.5 },       // Bhopal area
  { lat: 24.0, lng: 77.0 },
  { lat: 25.3, lng: 77.8 },       // Gwalior
  { lat: 26.5, lng: 78.0 },       // Agra
  { lat: 27.2, lng: 77.8 },
  { lat: 28.1, lng: 77.5 },       // Delhi approach
  { lat: 28.6139, lng: 77.209 },  // Delhi
];

const simVehicles: Map<string, SimVehicle> = new Map();
let simulationRunning = false;
let simInterval: ReturnType<typeof setInterval> | null = null;

// Initialize 2 simulated vehicles at different positions on the route
simVehicles.set('sim-1', {
  id: 'sim-1',
  lat: ROUTE_WAYPOINTS[3].lat,
  lng: ROUTE_WAYPOINTS[3].lng,
  step: 3,
  destination: ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1],
});

simVehicles.set('sim-2', {
  id: 'sim-2',
  lat: ROUTE_WAYPOINTS[7].lat,
  lng: ROUTE_WAYPOINTS[7].lng,
  step: 7,
  destination: ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1],
});

function interpolate(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function simulateStep() {
  simVehicles.forEach((vehicle) => {
    if (vehicle.step >= ROUTE_WAYPOINTS.length - 1) {
      // Reset to start
      vehicle.step = 0;
      vehicle.lat = ROUTE_WAYPOINTS[0].lat;
      vehicle.lng = ROUTE_WAYPOINTS[0].lng;
    }

    const from = ROUTE_WAYPOINTS[vehicle.step];
    const to = ROUTE_WAYPOINTS[vehicle.step + 1];

    // Move 5% closer to next waypoint each tick
    const progress = Math.min(0.05, Math.random() * 0.08);
    vehicle.lat = interpolate(vehicle.lat, to.lat, progress * 5);
    vehicle.lng = interpolate(vehicle.lng, to.lng, progress * 5);

    // Check if close enough to waypoint
    const dist = Math.sqrt(
      Math.pow(vehicle.lat - to.lat, 2) + Math.pow(vehicle.lng - to.lng, 2)
    );
    if (dist < 0.05) {
      vehicle.step++;
    }

    // Broadcast position to subscribers
    io.to(`vehicle:${vehicle.id}`).emit('vehicle-position', {
      vehicleId: vehicle.id,
      lat: vehicle.lat,
      lng: vehicle.lng,
      heading: Math.atan2(
        to.lng - from.lng,
        to.lat - from.lat
      ) * (180 / Math.PI),
      timestamp: Date.now(),
    });
  });

  // Also broadcast all vehicle positions to fleet channel
  const allPositions = Array.from(simVehicles.values()).map((v) => ({
    vehicleId: v.id,
    lat: v.lat,
    lng: v.lng,
    step: v.step,
  }));
  io.emit('fleet-positions', allPositions);
}

io.on('connection', (socket) => {
  socket.on('start-simulation', () => {
    if (!simulationRunning) {
      simulationRunning = true;
      simInterval = setInterval(simulateStep, 2000);
      console.log('[Tracking] Simulation started');
      io.emit('simulation-status', { running: true });
    }
  });

  socket.on('stop-simulation', () => {
    if (simulationRunning) {
      simulationRunning = false;
      if (simInterval) clearInterval(simInterval);
      simInterval = null;
      console.log('[Tracking] Simulation stopped');
      io.emit('simulation-status', { running: false });
    }
  });

  socket.on('get-simulation-status', (callback: (status: { running: boolean }) => void) => {
    callback({ running: simulationRunning });
  });

  // Send current positions on subscribe
  socket.on('subscribe-fleet', () => {
    socket.join('fleet');
    const allPositions = Array.from(simVehicles.values()).map((v) => ({
      vehicleId: v.id,
      lat: v.lat,
      lng: v.lng,
      step: v.step,
    }));
    socket.emit('fleet-positions', allPositions);
  });
});

console.log(`[Tracking] Service ready. Simulated vehicles: ${simVehicles.size}`);

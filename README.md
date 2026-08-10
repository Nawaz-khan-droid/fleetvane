# FleetVane Intelligent Fleet & Route Optimizer

A full-stack logistics and delivery optimization platform featuring AI-driven vehicle routing and live GPS tracking.

## Tech Stack
- **Backend**: Spring Boot 3, Spring Data JPA, Spring Security (JWT)
- **Database**: PostgreSQL (Supabase Cloud)
- **VRP Engine**: Timefold Solver
- **Frontend**: React 19, Vite, Tailwind CSS v4
- **Mapping**: Leaflet (OpenStreetMap/CartoDB) & Google Maps (Traffic) + OSRM (Routing)

## Project Structure
- `/backend`: Spring Boot REST API and Timefold VRP engine.
- `/frontend`: React SPA, Dashboard UI, and HTML5 Geolocation tracker.

## Setup Instructions

### Backend
1. Ensure Java 21+ and Maven are installed.
2. Provide your Supabase database credentials in `backend/src/main/resources/application.properties` (or via environment variables).
3. Run the backend: `mvn spring-boot:run`

### Frontend
1. Ensure Node.js 20+ is installed.
2. CD into the `frontend` directory.
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`

## Features
- **Manager Dashboard**: Monitor the entire fleet in real-time.
- **Hybrid Maps**: Switch seamlessly between OpenStreetMap (Leaflet) and Google Maps to view traffic data.
- **Route Optimization**: Uses Timefold Solver to solve the Vehicle Routing Problem (VRP) by minimizing Haversine distance between waypoints.
- **Live GPS**: Drivers broadcast their live coordinates via HTML5 Geolocation API, rendered on the Manager's map.
- **Incident Reporting**: Drivers can submit road delays or breakdowns which automatically log their exact GPS location.
- **Fuel Stations (POI)**: Integration with the Overpass API to query nearby fuel stations along the route.

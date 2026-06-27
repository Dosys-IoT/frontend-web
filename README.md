# Dosys Frontend Web

Next.js frontend for Dosys.

## Environment

Create `.env.local` from `.env.example` or `.env.local.example` and set:

- `NEXT_PUBLIC_REST_API_BASE_URL`
- `NEXT_PUBLIC_EDGE_API_BASE_URL`
- `NEXT_PUBLIC_DEFAULT_DEVICE_ID`

No MQTT credentials are stored in the frontend.

## IoT diagnostics

Open `/device-diagnostics` to view:

- device status
- latest temperature and humidity
- Edge health and MQTT status
- cached runtime config
- recent diagnostics events
- hardware commands

## Commands

```powershell
npm install
npm run dev
npm run build
```

/**
 * ============================================================================
 * MOCK DATA — FRONTEND-ONLY SCAFFOLDING
 * ============================================================================
 *
 * Every export here represents a feature that the UI requires but the backend
 * does not yet expose. When the corresponding endpoint ships, delete the
 * matching file and replace its usage with a real React Query.
 *
 * Backend gap list (queued for next sprint):
 *
 *   Alerts module (entirely new)
 *     - GET    /api/v1/alerts?status=&severity=&type=&assignee=
 *     - POST   /api/v1/alerts/{id}/snooze       body: { minutes }
 *     - POST   /api/v1/alerts/{id}/resolve
 *     - DELETE /api/v1/alerts                   (per current filter)
 *
 *   Adherence aggregates
 *     - GET /api/v1/medication/devices/{id}/adherence/summary?window=7d|30d
 *     - GET /api/v1/medication/devices/{id}/refill-forecast
 *
 *   Device telemetry (extend DeviceResponse)
 *     - Fields: batteryPct, wifiRssi, firmwareVersion,
 *               lastCalibrationAt, desiccantPct
 *     - GET  /api/v1/medication/devices/{id}/sensor-events
 *     - POST /api/v1/medication/devices/{id}/calibrate
 *     - POST /api/v1/medication/devices/{id}/calibrate/tare
 *     - GET  /api/v1/medication/devices/{id}/calibrate/measurement  (SSE/poll)
 *
 *   Container extensions
 *     - Fields: pillWeightMg, refillThreshold, status,
 *               clinicalNotes, compartmentState
 *     - POST /api/v1/medication/devices/{id}/containers/{n}/intake-confirm
 *     - POST /api/v1/medication/devices/{id}/containers/{n}/snooze
 *
 *   User preferences (new)
 *     - PUT /api/v1/access/me                     firstName, lastName
 *     - GET /api/v1/access/me/preferences
 *     - PUT /api/v1/access/me/preferences
 *
 *   Environment trends
 *     - GET /api/v1/medication/devices/{id}/environment/aggregate
 *           ?window=24h&buckets=12
 *
 * ============================================================================
 */

export * from "./medication-extras";
export * from "./device-telemetry";
export * from "./alerts";
export * from "./insights";
export * from "./preferences";

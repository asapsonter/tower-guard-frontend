# @tower-guard/hooks

Shared React hooks used by all 4 Tower Guard apps.

## Exports

- **Auth**: `AuthProvider`, `useAuth`, `useRoleGuard`, `safeStorage`
- **Theme**: `useTheme`
- **Live data**: `useSimulation` — WebSocket-backed alerts/sensors stream
- **Dispatch (Supabase realtime)**:
  - `useRealtimeAssignments`, `useRealtimeMessages` (NSCDC command)
  - `useResponderAssignments`, `useAssignmentMessages` (field app)
  - `createDispatchFromAlert`, `acceptAssignment`, `rejectAssignment`, `updateAssignmentStatus`, `sendDispatchMessage`, `reportLocation`
- **Bridge**: `useAlertDispatchBridge` — converts critical alerts into dispatch assignments
- **Simulation seeder**: `useDispatchSimulation`
- **UI helpers**: `useIsMobile`, `useToast`, `toast`

## Required peer deps in consumer

- `react@^18.3` and `react-dom@^18.3`
- `@tower-guard/data`, `@tower-guard/api-client`, `@tower-guard/supabase-client`, `@tower-guard/ui` (resolved via workspace)

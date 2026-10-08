/**
 * @tower-guard/hooks — shared React hooks for all 4 apps.
 */
export { AuthProvider, useAuth } from "./useAuth";
export type { AppRole, User } from "./useAuth";

export { useTheme } from "./useTheme";
export { useSimulation } from "./useSimulation";
export { useDispatchSimulation } from "./useDispatchSimulation";
export { useAlertDispatchBridge } from "./useAlertDispatchBridge";
export { useRoleGuard, type RoleGuardResult } from "./useRoleGuard";

// Flow monitor — singleton lives in @tower-guard/ui to avoid circular deps
// (LiveFlowMonitor consumes it). Re-exported here so consumers have a single
// import surface from @tower-guard/hooks.
export {
  flowMonitor,
  useFlowMonitor,
  type FlowEvent,
  type FlowEventSource,
  type FlowEventCategory,
  type FlowEventLevel,
} from "@tower-guard/ui";
export { useFlowMonitorSubscriptions } from "./useFlowMonitorSubscriptions";

// Note: useIsMobile and useToast live in @tower-guard/ui because they're
// tightly coupled to shadcn components and would create circular imports.

// Dispatch service — full export surface (functions + hooks + types)
export {
  createDispatchFromAlert,
  acceptAssignment,
  rejectAssignment,
  updateAssignmentStatus,
  sendDispatchMessage,
  reportLocation,
  useRealtimeAssignments,
  useRealtimeMessages,
  useResponderAssignments,
  useAssignmentMessages,
  type Incident,
  type DispatchAssignment,
  type ResponderMessage,
} from "./useDispatchService";

// safeStorage utility (used by useAuth)
export { safeStorage } from "./safeStorage";

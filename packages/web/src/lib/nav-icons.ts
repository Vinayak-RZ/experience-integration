import type { ComponentType, SVGProps } from "react";
import type { NavKey } from "@/lib/types";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Leaf,
  Map,
  MessageSquare,
  Settings,
  Users,
  Wrench,
} from "@/components/ui/icons";

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

/** Icon map for primary shell navigation. */
export const NAV_ICONS: Record<NavKey, IconComp> = {
  today: LayoutDashboard,
  energy: BarChart3,
  equipment: Activity,
  alarms: AlertTriangle,
  prescriptions: ClipboardList,
  plant_map: Map,
  reports: FileText,
  intensity: Leaf,
  analyst: MessageSquare,
  tools: Wrench,
  assignments: Users,
  evidence: ClipboardList,
  integrations: Settings,
  admin: Settings,
};

export { Factory } from "@/components/ui/icons";

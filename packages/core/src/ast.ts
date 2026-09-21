/**
 * Optical Physical Action Protocol (OPAP) - Abstract Action Tree (AAT) Grammar
 * Extended Industrial & Autonomous Robotics Node Registry (v1.1)
 * Copyright 2026 AHM Labs Ltd. Licensed under Apache-2.0.
 */

export enum OpapNodeType {
  // 1. Core Human Operational Nodes (0 - 6)
  TEXT = 0,
  INPUT_NUMBER = 1,
  SELECT = 2,
  CALC = 3,
  ALERT = 4,
  NAV = 5,
  SIGN_OFF = 6,

  // 2. Robotic Vision & Actuation Nodes (7 - 8)
  GAUGE_VISION = 7,
  ACTUATION = 8,

  // 3. Advanced Human Operations & Safety Interlocks (9 - 13)
  TIMER = 9,
  MULTI_CHECKLIST = 10,
  SCAN_VERIFY = 11,
  MEDIA_REF = 12,
  LOTO_LOCK = 13,

  // 4. Advanced Autonomous Robotics & Perception (14 - 19)
  FIDUCIAL_ALIGN = 14,
  THERMAL_CHECK = 15,
  ACOUSTIC_VIB = 16,
  LED_STATE = 17,
  TELEMETRY_LOG = 18,
  EMERGENCY_HALT = 19
}

// -------------------------------------------------------------
// Human Field Operation Node Definitions
// -------------------------------------------------------------

export type TextNode = {
  t: OpapNodeType.TEXT;
  v: string;
  s?: 'muted' | 'bold' | 'danger' | 'info' | 'code';
};

export type InputNumberNode = {
  t: OpapNodeType.INPUT_NUMBER;
  k: string;
  l: string;
  u?: string;
  min?: number;
  max?: number;
  d?: number;
  step?: number;
};

export type SelectNode = {
  t: OpapNodeType.SELECT;
  k: string;
  l: string;
  opt: string[];
  d?: number;
};

export type CalcNode = {
  t: OpapNodeType.CALC;
  k: string;
  l: string;
  f: string;
  u?: string;
  p?: number;
};

export type AlertNode = {
  t: OpapNodeType.ALERT;
  c: string;
  m: string;
  l?: 'warn' | 'crit' | 'ok';
};

export type NavNode = {
  t: OpapNodeType.NAV;
  l: string;
  j: number;
  variant?: 'primary' | 'secondary';
};

export type SignOffNode = {
  t: OpapNodeType.SIGN_OFF;
  l: string;
};

export type TimerNode = {
  t: OpapNodeType.TIMER;
  k: string;
  l: string;
  duration_s: number;
  lock_nav?: boolean;
  alert_msg?: string;
};

export type MultiChecklistNode = {
  t: OpapNodeType.MULTI_CHECKLIST;
  k: string;
  l: string;
  items: string[];
  mandatory?: boolean;
};

export type ScanVerifyNode = {
  t: OpapNodeType.SCAN_VERIFY;
  k: string;
  l: string;
  expected_match: string;
  symbology?: 'QR' | 'CODE128' | 'DATAMATRIX' | 'ANY';
  fail_msg?: string;
};

export type MediaRefNode = {
  t: OpapNodeType.MEDIA_REF;
  l: string;
  svg_path?: string;
  view_box?: string;
  caption?: string;
};

export type LotoLockNode = {
  t: OpapNodeType.LOTO_LOCK;
  padlock_id_key: string;
  tag_number_key: string;
  isolation_point: string;
  require_zero_energy_confirm?: boolean;
};

// -------------------------------------------------------------
// Autonomous Robotics & Edge Perception Node Definitions
// -------------------------------------------------------------

export type GaugeVisionNode = {
  t: OpapNodeType.GAUGE_VISION;
  k: string;
  l: string;
  u?: string;
  min: number;
  max: number;
  needle_angle_min: number;
  needle_angle_max: number;
  bbox?: [number, number, number, number];
};

export type ActuationNode = {
  t: OpapNodeType.ACTUATION;
  joint: string;
  action: 'ROTATE' | 'TRANSLATE' | 'GRIP' | 'RELEASE';
  value: number;
  unit: 'DEG' | 'MM' | 'PERCENT';
  max_torque_nm?: number;
  timeout_ms?: number;
  safety_assert?: string;
};

export type FiducialAlignNode = {
  t: OpapNodeType.FIDUCIAL_ALIGN;
  target_id: string;
  offset_xyz_mm: [number, number, number];
  rpy_deg: [number, number, number];
  tolerance_mm?: number;
};

export type ThermalCheckNode = {
  t: OpapNodeType.THERMAL_CHECK;
  target_zone: string;
  max_temp_c: number;
  min_temp_c?: number;
  on_exceed: 'HALT' | 'WARN' | 'LOG';
};

export type AcousticVibNode = {
  t: OpapNodeType.ACOUSTIC_VIB;
  target_hz: number;
  max_db: number;
  duration_s?: number;
  on_exceed: 'HALT' | 'WARN';
};

export type LedStateNode = {
  t: OpapNodeType.LED_STATE;
  indicator_name: string;
  expected_color: 'GREEN' | 'RED' | 'AMBER' | 'BLUE' | 'OFF';
  expected_mode: 'SOLID' | 'BLINKING' | 'FAST_BLINK';
  assert_match?: boolean;
};

export type TelemetryLogNode = {
  t: OpapNodeType.TELEMETRY_LOG;
  sensors: Array<'GAS_CH4' | 'GAS_H2S' | 'AMBIENT_TEMP' | 'HUMIDITY' | 'BATTERY'>;
  append_to_ort?: boolean;
};

export type EmergencyHaltNode = {
  t: OpapNodeType.EMERGENCY_HALT;
  condition: string;
  action: 'E_STOP' | 'DECOUPLE_END_EFFECTOR' | 'DISENGAGE_MOTORS';
  siren?: boolean;
};

// -------------------------------------------------------------
// Universal Node Union & Step / AAT Interfaces
// -------------------------------------------------------------

export type OpapNode =
  | TextNode
  | InputNumberNode
  | SelectNode
  | CalcNode
  | AlertNode
  | NavNode
  | SignOffNode
  | TimerNode
  | MultiChecklistNode
  | ScanVerifyNode
  | MediaRefNode
  | LotoLockNode
  | GaugeVisionNode
  | ActuationNode
  | FiducialAlignNode
  | ThermalCheckNode
  | AcousticVibNode
  | LedStateNode
  | TelemetryLogNode
  | EmergencyHaltNode;

export interface OpapStep {
  i: number;
  t: string;
  n: OpapNode[];
}

export interface OpapAAT {
  v: 1;
  t: string;
  d?: string;
  s: OpapStep[];
}

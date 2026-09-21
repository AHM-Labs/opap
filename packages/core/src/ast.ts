/**
 * Optical Physical Action Protocol (OPAP) - Abstract Action Tree (AAT) Grammar
 * Copyright 2026 AHM Labs Ltd. Licensed under Apache-2.0.
 */

export enum OpapNodeType {
  TEXT = 0,
  INPUT_NUMBER = 1,
  SELECT = 2,
  CALC = 3,
  ALERT = 4,
  NAV = 5,
  SIGN_OFF = 6,
  GAUGE_VISION = 7,
  ACTUATION = 8
}

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

export type GaugeVisionNode = {
  t: OpapNodeType.GAUGE_VISION;
  k: string;
  l: string;
  u?: string;
  min: number;
  max: number;
  needle_angle_min: number;
  needle_angle_max: number;
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

export type OpapNode =
  | TextNode
  | InputNumberNode
  | SelectNode
  | CalcNode
  | AlertNode
  | NavNode
  | SignOffNode
  | GaugeVisionNode
  | ActuationNode;

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

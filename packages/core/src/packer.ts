/**
 * Optical Physical Action Protocol (OPAP) - Binary Compactor & Packer
 * Strips dictionary keys into positional tuples -> CBOR -> Deflate -> Base64URL.
 * Supports all 20 Human and Autonomous Robotic Nodes (v1.1).
 * Copyright 2026 AHM Labs Ltd. Licensed under Apache-2.0.
 */

import { encode as cborEncode, decode as cborDecode } from 'cbor-x';
import { deflateSync, inflateSync } from 'fflate';
import { OpapNodeType, type OpapAAT, type OpapNode, type OpapStep } from './ast.js';

export function compactNode(node: OpapNode): any[] {
  switch (node.t) {
    // 0: TEXT
    case OpapNodeType.TEXT:
      return [OpapNodeType.TEXT, node.v, node.s || ''];

    // 1: INPUT_NUMBER
    case OpapNodeType.INPUT_NUMBER:
      return [
        OpapNodeType.INPUT_NUMBER,
        node.k,
        node.l,
        node.u || '',
        node.d ?? 0,
        node.min ?? 0,
        node.max ?? 0,
        node.step ?? 1
      ];

    // 2: SELECT
    case OpapNodeType.SELECT:
      return [OpapNodeType.SELECT, node.k, node.l, node.opt, node.d ?? 0];

    // 3: CALC
    case OpapNodeType.CALC:
      return [OpapNodeType.CALC, node.k, node.l, node.f, node.u || '', node.p ?? 2];

    // 4: ALERT
    case OpapNodeType.ALERT:
      return [OpapNodeType.ALERT, node.c, node.m, node.l || 'warn'];

    // 5: NAV
    case OpapNodeType.NAV:
      return [OpapNodeType.NAV, node.l, node.j, node.variant || 'primary'];

    // 6: SIGN_OFF
    case OpapNodeType.SIGN_OFF:
      return [OpapNodeType.SIGN_OFF, node.l];

    // 7: GAUGE_VISION
    case OpapNodeType.GAUGE_VISION:
      return [
        OpapNodeType.GAUGE_VISION,
        node.k,
        node.l,
        node.u || '',
        node.min,
        node.max,
        node.needle_angle_min,
        node.needle_angle_max,
        node.bbox || []
      ];

    // 8: ACTUATION
    case OpapNodeType.ACTUATION:
      return [
        OpapNodeType.ACTUATION,
        node.joint,
        node.action,
        node.value,
        node.unit,
        node.max_torque_nm ?? 0,
        node.timeout_ms ?? 5000,
        node.safety_assert || ''
      ];

    // 9: TIMER
    case OpapNodeType.TIMER:
      return [
        OpapNodeType.TIMER,
        node.k,
        node.l,
        node.duration_s,
        node.lock_nav ? 1 : 0,
        node.alert_msg || ''
      ];

    // 10: MULTI_CHECKLIST
    case OpapNodeType.MULTI_CHECKLIST:
      return [
        OpapNodeType.MULTI_CHECKLIST,
        node.k,
        node.l,
        node.items,
        node.mandatory ? 1 : 0
      ];

    // 11: SCAN_VERIFY
    case OpapNodeType.SCAN_VERIFY:
      return [
        OpapNodeType.SCAN_VERIFY,
        node.k,
        node.l,
        node.expected_match,
        node.symbology || 'ANY',
        node.fail_msg || ''
      ];

    // 12: MEDIA_REF
    case OpapNodeType.MEDIA_REF:
      return [
        OpapNodeType.MEDIA_REF,
        node.l,
        node.svg_path || '',
        node.view_box || '',
        node.caption || ''
      ];

    // 13: LOTO_LOCK
    case OpapNodeType.LOTO_LOCK:
      return [
        OpapNodeType.LOTO_LOCK,
        node.padlock_id_key,
        node.tag_number_key,
        node.isolation_point,
        node.require_zero_energy_confirm ? 1 : 0
      ];

    // 14: FIDUCIAL_ALIGN
    case OpapNodeType.FIDUCIAL_ALIGN:
      return [
        OpapNodeType.FIDUCIAL_ALIGN,
        node.target_id,
        node.offset_xyz_mm,
        node.rpy_deg,
        node.tolerance_mm ?? 1.0
      ];

    // 15: THERMAL_CHECK
    case OpapNodeType.THERMAL_CHECK:
      return [
        OpapNodeType.THERMAL_CHECK,
        node.target_zone,
        node.max_temp_c,
        node.min_temp_c ?? -50,
        node.on_exceed
      ];

    // 16: ACOUSTIC_VIB
    case OpapNodeType.ACOUSTIC_VIB:
      return [
        OpapNodeType.ACOUSTIC_VIB,
        node.target_hz,
        node.max_db,
        node.duration_s ?? 3,
        node.on_exceed
      ];

    // 17: LED_STATE
    case OpapNodeType.LED_STATE:
      return [
        OpapNodeType.LED_STATE,
        node.indicator_name,
        node.expected_color,
        node.expected_mode,
        node.assert_match ? 1 : 0
      ];

    // 18: TELEMETRY_LOG
    case OpapNodeType.TELEMETRY_LOG:
      return [
        OpapNodeType.TELEMETRY_LOG,
        node.sensors,
        node.append_to_ort ? 1 : 0
      ];

    // 19: EMERGENCY_HALT
    case OpapNodeType.EMERGENCY_HALT:
      return [
        OpapNodeType.EMERGENCY_HALT,
        node.condition,
        node.action,
        node.siren ? 1 : 0
      ];

    default:
      return [(node as any).t];
  }
}

export function uncompactNode(arr: any[]): OpapNode {
  const type = arr[0] as OpapNodeType;
  switch (type) {
    case OpapNodeType.TEXT:
      return { t: OpapNodeType.TEXT, v: arr[1], s: arr[2] || undefined };

    case OpapNodeType.INPUT_NUMBER:
      return {
        t: OpapNodeType.INPUT_NUMBER,
        k: arr[1],
        l: arr[2],
        u: arr[3] || undefined,
        d: arr[4],
        min: arr[5],
        max: arr[6],
        step: arr[7]
      };

    case OpapNodeType.SELECT:
      return { t: OpapNodeType.SELECT, k: arr[1], l: arr[2], opt: arr[3], d: arr[4] };

    case OpapNodeType.CALC:
      return {
        t: OpapNodeType.CALC,
        k: arr[1],
        l: arr[2],
        f: arr[3],
        u: arr[4] || undefined,
        p: arr[5]
      };

    case OpapNodeType.ALERT:
      return { t: OpapNodeType.ALERT, c: arr[1], m: arr[2], l: arr[3] || undefined };

    case OpapNodeType.NAV:
      return { t: OpapNodeType.NAV, l: arr[1], j: arr[2], variant: arr[3] || undefined };

    case OpapNodeType.SIGN_OFF:
      return { t: OpapNodeType.SIGN_OFF, l: arr[1] };

    case OpapNodeType.GAUGE_VISION:
      return {
        t: OpapNodeType.GAUGE_VISION,
        k: arr[1],
        l: arr[2],
        u: arr[3] || undefined,
        min: arr[4],
        max: arr[5],
        needle_angle_min: arr[6],
        needle_angle_max: arr[7],
        bbox: arr[8] && arr[8].length ? arr[8] : undefined
      };

    case OpapNodeType.ACTUATION:
      return {
        t: OpapNodeType.ACTUATION,
        joint: arr[1],
        action: arr[2],
        value: arr[3],
        unit: arr[4],
        max_torque_nm: arr[5] || undefined,
        timeout_ms: arr[6] || undefined,
        safety_assert: arr[7] || undefined
      };

    case OpapNodeType.TIMER:
      return {
        t: OpapNodeType.TIMER,
        k: arr[1],
        l: arr[2],
        duration_s: arr[3],
        lock_nav: Boolean(arr[4]),
        alert_msg: arr[5] || undefined
      };

    case OpapNodeType.MULTI_CHECKLIST:
      return {
        t: OpapNodeType.MULTI_CHECKLIST,
        k: arr[1],
        l: arr[2],
        items: arr[3] || [],
        mandatory: Boolean(arr[4])
      };

    case OpapNodeType.SCAN_VERIFY:
      return {
        t: OpapNodeType.SCAN_VERIFY,
        k: arr[1],
        l: arr[2],
        expected_match: arr[3],
        symbology: arr[4] || undefined,
        fail_msg: arr[5] || undefined
      };

    case OpapNodeType.MEDIA_REF:
      return {
        t: OpapNodeType.MEDIA_REF,
        l: arr[1],
        svg_path: arr[2] || undefined,
        view_box: arr[3] || undefined,
        caption: arr[4] || undefined
      };

    case OpapNodeType.LOTO_LOCK:
      return {
        t: OpapNodeType.LOTO_LOCK,
        padlock_id_key: arr[1],
        tag_number_key: arr[2],
        isolation_point: arr[3],
        require_zero_energy_confirm: Boolean(arr[4])
      };

    case OpapNodeType.FIDUCIAL_ALIGN:
      return {
        t: OpapNodeType.FIDUCIAL_ALIGN,
        target_id: arr[1],
        offset_xyz_mm: arr[2],
        rpy_deg: arr[3],
        tolerance_mm: arr[4]
      };

    case OpapNodeType.THERMAL_CHECK:
      return {
        t: OpapNodeType.THERMAL_CHECK,
        target_zone: arr[1],
        max_temp_c: arr[2],
        min_temp_c: arr[3],
        on_exceed: arr[4]
      };

    case OpapNodeType.ACOUSTIC_VIB:
      return {
        t: OpapNodeType.ACOUSTIC_VIB,
        target_hz: arr[1],
        max_db: arr[2],
        duration_s: arr[3],
        on_exceed: arr[4]
      };

    case OpapNodeType.LED_STATE:
      return {
        t: OpapNodeType.LED_STATE,
        indicator_name: arr[1],
        expected_color: arr[2],
        expected_mode: arr[3],
        assert_match: Boolean(arr[4])
      };

    case OpapNodeType.TELEMETRY_LOG:
      return {
        t: OpapNodeType.TELEMETRY_LOG,
        sensors: arr[1] || [],
        append_to_ort: Boolean(arr[2])
      };

    case OpapNodeType.EMERGENCY_HALT:
      return {
        t: OpapNodeType.EMERGENCY_HALT,
        condition: arr[1],
        action: arr[2],
        siren: Boolean(arr[3])
      };

    default:
      throw new Error(`Unsupported OPAP node type code: ${type}`);
  }
}

export function compactAat(ast: OpapAAT): any[] {
  const compactSteps = ast.s.map(s => [s.i, s.t, s.n.map(compactNode)]);
  return [ast.v, ast.t, ast.d || '', compactSteps];
}

export function uncompactAat(raw: any[]): OpapAAT {
  const [v, t, d, rawSteps] = raw;
  const steps: OpapStep[] = (rawSteps || []).map((s: any[]) => ({
    i: s[0],
    t: s[1],
    n: (s[2] || []).map(uncompactNode)
  }));

  return {
    v: v || 1,
    t: t || 'OPAP Action Protocol',
    d: d || undefined,
    s: steps
  };
}

export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Pack an OPAP AAT into a compressed URL-safe optical string.
 */
export function packOpap(ast: OpapAAT): string {
  const compacted = compactAat(ast);
  const cborBytes = cborEncode(compacted);
  const compressed = deflateSync(cborBytes, { level: 9 });
  return uint8ArrayToBase64Url(compressed);
}

/**
 * Unpack an OPAP string back into an in-memory AAT.
 */
export function unpackOpap(payload: string): OpapAAT {
  const cleanPayload = payload.replace(/^#/, '').trim();
  const compressed = base64UrlToUint8Array(cleanPayload);
  const cborBytes = inflateSync(compressed);
  const rawTuple = cborDecode(cborBytes);
  return uncompactAat(rawTuple);
}

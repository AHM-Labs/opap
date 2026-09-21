/**
 * Optical Physical Action Protocol (OPAP) - Binary Compactor & Packer
 * Strips dictionary keys into positional tuples -> CBOR -> Deflate -> Base64URL.
 * Copyright 2026 AHM Labs Ltd. Licensed under Apache-2.0.
 */

import { encode as cborEncode, decode as cborDecode } from 'cbor-x';
import { deflateSync, inflateSync } from 'fflate';
import { OpapNodeType, type OpapAAT, type OpapNode, type OpapStep } from './ast.js';

export function compactNode(node: OpapNode): any[] {
  switch (node.t) {
    case OpapNodeType.TEXT:
      return [OpapNodeType.TEXT, node.v, node.s || ''];

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

    case OpapNodeType.SELECT:
      return [OpapNodeType.SELECT, node.k, node.l, node.opt, node.d ?? 0];

    case OpapNodeType.CALC:
      return [OpapNodeType.CALC, node.k, node.l, node.f, node.u || '', node.p ?? 2];

    case OpapNodeType.ALERT:
      return [OpapNodeType.ALERT, node.c, node.m, node.l || 'warn'];

    case OpapNodeType.NAV:
      return [OpapNodeType.NAV, node.l, node.j, node.variant || 'primary'];

    case OpapNodeType.SIGN_OFF:
      return [OpapNodeType.SIGN_OFF, node.l];

    case OpapNodeType.GAUGE_VISION:
      return [
        OpapNodeType.GAUGE_VISION,
        node.k,
        node.l,
        node.u || '',
        node.min,
        node.max,
        node.needle_angle_min,
        node.needle_angle_max
      ];

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
        needle_angle_max: arr[7]
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

    default:
      throw new Error(`Unsupported OPAP node type: ${type}`);
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

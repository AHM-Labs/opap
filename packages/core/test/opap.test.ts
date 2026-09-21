import { describe, it, expect } from 'vitest';
import { 
  OpapNodeType, 
  type OpapAAT,
  packOpap, 
  unpackOpap, 
  OpapExpressionEvaluator,
  evaluateOpapState,
  encryptOpap,
  decryptOpap,
  isEncryptedOpap,
  generateOrt,
  verifyOrt
} from '../src/index.js';

describe('OPAP v1.1 Extended Protocol Test Suite (20 Nodes)', () => {
  const comprehensiveAat: OpapAAT = {
    v: 1,
    t: 'Autonomous Deep-Subsea Chiller Protocol',
    d: 'LOTO, Human Checks & Robotic Manipulation',
    s: [
      {
        i: 1,
        t: 'Step 1: Human LOTO & Part Cross-Check',
        n: [
          { t: OpapNodeType.TEXT, v: 'Perform Lockout Tagout sequence before panel entry', s: 'danger' },
          { t: OpapNodeType.LOTO_LOCK, padlock_id_key: 'loto_lock_id', tag_number_key: 'loto_tag_no', isolation_point: 'Breaker CB-402', require_zero_energy_confirm: true },
          { t: OpapNodeType.MULTI_CHECKLIST, k: 'ppe_checks', l: 'Mandatory PPE', items: ['Arc-Flash Shield', 'Insulated Gloves', 'H2S Detector'], mandatory: true },
          { t: OpapNodeType.SCAN_VERIFY, k: 'filter_scan', l: 'Scan Replacement Filter Barcode', expected_match: 'FLTR-SUB-900', symbology: 'CODE128', fail_msg: 'Wrong part filter barcode!' },
          { t: OpapNodeType.MEDIA_REF, l: 'Valve Manifold Diagram', svg_path: 'M10 10 H 90 V 90 H 10 Z', view_box: '0 0 100 100', caption: 'Close Valve V-2' },
          { t: OpapNodeType.TIMER, k: 'bleed_timer', l: 'Pressure Bleed Dwell', duration_s: 90, lock_nav: true, alert_msg: 'Line bleed in progress' },
          { t: OpapNodeType.NAV, l: 'Proceed to Measurements', j: 2 }
        ]
      },
      {
        i: 2,
        t: 'Step 2: Robotic Perception & Manipulation',
        n: [
          { t: OpapNodeType.FIDUCIAL_ALIGN, target_id: 'FID_VALVE_402', offset_xyz_mm: [120, -45, 300], rpy_deg: [0, 90, 180], tolerance_mm: 0.5 },
          { t: OpapNodeType.GAUGE_VISION, k: 'p', l: 'Suction Dial', u: 'PSI', min: 0, max: 300, needle_angle_min: 220, needle_angle_max: -40, bbox: [0.2, 0.3, 0.4, 0.4] },
          { t: OpapNodeType.THERMAL_CHECK, target_zone: 'COMPRESSOR_HEAD', max_temp_c: 85.0, min_temp_c: -20, on_exceed: 'HALT' },
          { t: OpapNodeType.ACOUSTIC_VIB, target_hz: 120, max_db: 78, duration_s: 3, on_exceed: 'WARN' },
          { t: OpapNodeType.LED_STATE, indicator_name: 'RUN_STATUS_LED', expected_color: 'GREEN', expected_mode: 'SOLID', assert_match: true },
          { t: OpapNodeType.INPUT_NUMBER, k: 't', l: 'Line Temp', u: '°F', d: 52, min: 30, max: 100 },
          { t: OpapNodeType.CALC, k: 'sat', l: 'Saturation Temp', f: 'round(0.245 * p + 11.5, 1)', u: '°F', p: 1 },
          { t: OpapNodeType.CALC, k: 'sh', l: 'Total Superheat', f: 'round(t - sat, 1)', u: '°F', p: 1 },
          { t: OpapNodeType.ALERT, c: 'sh < 8', m: 'CRITICAL: Liquid Floodback Risk', l: 'crit' },
          { t: OpapNodeType.ACTUATION, joint: 'ROBOTIC_WRIST_ROLL', action: 'ROTATE', value: 90, unit: 'DEG', max_torque_nm: 45, timeout_ms: 4000, safety_assert: 'sh >= 8' },
          { t: OpapNodeType.TELEMETRY_LOG, sensors: ['GAS_CH4', 'GAS_H2S', 'BATTERY'], append_to_ort: true },
          { t: OpapNodeType.EMERGENCY_HALT, condition: 'sh < 3', action: 'E_STOP', siren: true },
          { t: OpapNodeType.SIGN_OFF, l: 'Cryptographic Audit Sign-Off' }
        ]
      }
    ]
  };

  it('evaluates deterministic mathematical and logical expressions', () => {
    expect(OpapExpressionEvaluator.evaluate('10 + 5 * 2', {})).toBe(20);
    expect(OpapExpressionEvaluator.evaluate('(10 + 5) * 2', {})).toBe(30);
    expect(OpapExpressionEvaluator.evaluate('round(3.14159, 2)', {})).toBe(3.14);
    expect(OpapExpressionEvaluator.evaluate('p > 100 && t < 60', { p: 120, t: 55 })).toBe(true);
    expect(OpapExpressionEvaluator.evaluate('sh < 8 || p > 200', { sh: 6, p: 110 })).toBe(true);
  });

  it('packs and unpacks all 20 human and robotic node types losslessly', () => {
    const packed = packOpap(comprehensiveAat);
    expect(typeof packed).toBe('string');
    expect(packed.length).toBeGreaterThan(50);

    const unpacked = unpackOpap(packed);
    expect(unpacked.t).toBe(comprehensiveAat.t);
    expect(unpacked.s.length).toBe(2);
    expect(unpacked.s[0].n.length).toBe(7);
    expect(unpacked.s[1].n.length).toBe(13);

    // Deep node assertions on new human nodes
    const lotoNode = unpacked.s[0].n[1];
    expect(lotoNode.t).toBe(OpapNodeType.LOTO_LOCK);
    if (lotoNode.t === OpapNodeType.LOTO_LOCK) {
      expect(lotoNode.isolation_point).toBe('Breaker CB-402');
      expect(lotoNode.require_zero_energy_confirm).toBe(true);
    }

    const timerNode = unpacked.s[0].n[5];
    expect(timerNode.t).toBe(OpapNodeType.TIMER);
    if (timerNode.t === OpapNodeType.TIMER) {
      expect(timerNode.duration_s).toBe(90);
      expect(timerNode.lock_nav).toBe(true);
    }

    // Deep node assertions on new robotic nodes
    const fiducialNode = unpacked.s[1].n[0];
    expect(fiducialNode.t).toBe(OpapNodeType.FIDUCIAL_ALIGN);
    if (fiducialNode.t === OpapNodeType.FIDUCIAL_ALIGN) {
      expect(fiducialNode.target_id).toBe('FID_VALVE_402');
      expect(fiducialNode.offset_xyz_mm).toEqual([120, -45, 300]);
    }

    const thermalNode = unpacked.s[1].n[2];
    expect(thermalNode.t).toBe(OpapNodeType.THERMAL_CHECK);
    if (thermalNode.t === OpapNodeType.THERMAL_CHECK) {
      expect(thermalNode.max_temp_c).toBe(85.0);
      expect(thermalNode.on_exceed).toBe('HALT');
    }

    const eHaltNode = unpacked.s[1].n[11];
    expect(eHaltNode.t).toBe(OpapNodeType.EMERGENCY_HALT);
    if (eHaltNode.t === OpapNodeType.EMERGENCY_HALT) {
      expect(eHaltNode.action).toBe('E_STOP');
      expect(eHaltNode.siren).toBe(true);
    }
  });

  it('evaluates state derivations across steps with complex AAT', () => {
    const state = evaluateOpapState(comprehensiveAat, { p: 118, t: 52 });
    expect(state.sat).toBe(40.4);
    expect(state.sh).toBe(11.6);
  });

  it('encrypts and decrypts a comprehensive 20-node AAT with AES-256-GCM', async () => {
    const pin = '994821';
    const encrypted = await encryptOpap(comprehensiveAat, pin);

    expect(isEncryptedOpap(encrypted)).toBe(true);
    expect(encrypted.startsWith('enc:')).toBe(true);

    const decrypted = await decryptOpap(encrypted, pin);
    expect(decrypted.t).toBe(comprehensiveAat.t);
    expect(decrypted.s[1].n.length).toBe(13);

    await expect(decryptOpap(encrypted, '111111')).rejects.toThrow('Incorrect authorization PIN');
  });

  it('generates and verifies cryptographic Optical Return Tokens (ORT)', () => {
    const readings = {
      psi: 54.2,
      temp_c: 21.8,
      verified_by_camera: true
    };
    const ort = generateOrt('ASSET-GEN-900', readings, 'ROBOT-SPOT-01', 1711000000000);
    expect(ort.startsWith('ort:')).toBe(true);

    const verified = verifyOrt(ort);
    expect(verified.verified).toBe(true);
    expect(verified.data.version).toBe(1);
    expect(verified.data.asset).toBe('ASSET-GEN-900');
    expect(verified.data.op).toBe('ROBOT-SPOT-01');
    expect(verified.data.val).toEqual(readings);
    expect(verified.data.ts).toBe(1711000000000);
  });
});

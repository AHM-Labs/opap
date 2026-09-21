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
  isEncryptedOpap
} from '../src/index.js';

describe('OPAP v1.0 Reference Protocol Test Suite', () => {
  const sampleAat: OpapAAT = {
    v: 1,
    t: 'Sub-sea Chiller Protocol',
    d: 'Emergency Isolation',
    s: [
      {
        i: 1,
        t: 'Primary Containment',
        n: [
          { t: OpapNodeType.TEXT, v: 'Verify valve seals before manual override', s: 'bold' },
          { t: OpapNodeType.INPUT_NUMBER, k: 'p', l: 'Suction Pressure', u: 'PSI', d: 118, min: 50, max: 250 },
          { t: OpapNodeType.INPUT_NUMBER, k: 't', l: 'Line Temperature', u: '°F', d: 52, min: 30, max: 100 },
          { t: OpapNodeType.CALC, k: 'sat', l: 'Saturation Temp', f: 'round(0.245 * p + 11.5, 1)', u: '°F', p: 1 },
          { t: OpapNodeType.CALC, k: 'sh', l: 'Total Superheat', f: 'round(t - sat, 1)', u: '°F', p: 1 },
          { t: OpapNodeType.ALERT, c: 'sh < 8', m: 'CRITICAL: Liquid Floodback Risk', l: 'crit' },
          { t: OpapNodeType.ACTUATION, joint: 'VALVE_ISOLATION_ACTUATOR', action: 'ROTATE', value: 90, unit: 'DEG', max_torque_nm: 45, safety_assert: 'p < 150' },
          { t: OpapNodeType.SIGN_OFF, l: 'Audit Verification' }
        ]
      }
    ]
  };

  it('evaluates deterministic mathematical and logical expressions', () => {
    expect(OpapExpressionEvaluator.evaluate('10 + 5 * 2', {})).toBe(20);
    expect(OpapExpressionEvaluator.evaluate('(10 + 5) * 2', {})).toBe(30);
    expect(OpapExpressionEvaluator.evaluate('round(3.14159, 2)', {})).toBe(3.14);
    expect(OpapExpressionEvaluator.evaluate('p > 100 && t < 60', { p: 120, t: 55 })).toBe(true);
  });

  it('packs and unpacks an OPAP AAT losslessly', () => {
    const packed = packOpap(sampleAat);
    expect(typeof packed).toBe('string');
    expect(packed.length).toBeGreaterThan(20);

    const unpacked = unpackOpap(packed);
    expect(unpacked.t).toBe(sampleAat.t);
    expect(unpacked.s.length).toBe(sampleAat.s.length);
    expect(unpacked.s[0].n.length).toBe(sampleAat.s[0].n.length);
  });

  it('evaluates state derivations across steps', () => {
    const state = evaluateOpapState(sampleAat, { p: 118, t: 52 });
    expect(state.sat).toBe(40.4); // 0.245 * 118 + 11.5 = 40.41 -> 40.4
    expect(state.sh).toBe(11.6);  // 52 - 40.4 = 11.6
  });

  it('encrypts and decrypts with an authorization PIN using AES-256-GCM', async () => {
    const pin = '789123';
    const encrypted = await encryptOpap(sampleAat, pin);

    expect(isEncryptedOpap(encrypted)).toBe(true);
    expect(encrypted.startsWith('enc:')).toBe(true);

    const decrypted = await decryptOpap(encrypted, pin);
    expect(decrypted.t).toBe(sampleAat.t);

    await expect(decryptOpap(encrypted, '000000')).rejects.toThrow('Incorrect authorization PIN');
  });
});

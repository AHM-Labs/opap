/**
 * Optical Physical Action Protocol (OPAP) - Autonomous Robot Runner Example
 * 
 * Demonstrates an Autonomous Mobile Robot (AMR / Quadruped like Boston Dynamics Spot)
 * scanning an air-gapped OPAP optical tag, executing perception and actuation nodes,
 * and generating a cryptographically verifiable Optical Return Token (ORT).
 *
 * Copyright 2026 AHM Labs Ltd. Licensed under Apache-2.0.
 */

import {
  OpapNodeType,
  packOpap,
  unpackOpap,
  OpapExpressionEvaluator,
  generateOrt,
  verifyOrt,
  type OpapAAT,
  type ActuationNode,
  type FiducialAlignNode,
  type GaugeVisionNode,
  type ThermalCheckNode,
  type EmergencyHaltNode
} from '../packages/core/src/index';

// -------------------------------------------------------------
// 1. Authoring the Air-Gapped OPAP Tag (Laser-Etched on Physical Asset)
// -------------------------------------------------------------
const substationInspectionTag: OpapAAT = {
  v: 1,
  t: 'Substation Transformer B-04 Autonomous Audit',
  d: 'Air-gapped physical action protocol for Spot AMR',
  s: [
    {
      i: 1,
      t: 'Spatial Alignment & Perimeter Clearance',
      n: [
        {
          t: OpapNodeType.TEXT,
          v: 'Approaching High-Voltage Transformer Bay B-04. Verify perimeter standoff.',
          s: 'bold'
        },
        {
          t: OpapNodeType.FIDUCIAL_ALIGN,
          target_id: 'tag36h11:104',
          offset_xyz_mm: [0, 800, 1150], // 800mm standoff, 1150mm height
          rpy_deg: [0, 0, 0],             // Facing normal to tag plane
          tolerance_mm: 5.0
        },
        {
          t: OpapNodeType.EMERGENCY_HALT,
          condition: 'obstacle_dist_m < 0.3 || ch4_ppm > 250',
          action: 'E_STOP',
          siren: true
        }
      ]
    },
    {
      i: 2,
      t: 'Perception & Thermal Inspection',
      n: [
        {
          t: OpapNodeType.GAUGE_VISION,
          k: 'oil_press_psi',
          l: 'Reservoir Pressure Gauge',
          u: 'PSI',
          min: 0,
          max: 100,
          needle_angle_min: -135,
          needle_angle_max: 135,
          bbox: [140, 90, 260, 250]
        },
        {
          t: OpapNodeType.ALERT,
          c: 'oil_press_psi < 25 || oil_press_psi > 75',
          m: 'CRITICAL: Oil pressure out of nominal operating range!',
          l: 'crit'
        },
        {
          t: OpapNodeType.THERMAL_CHECK,
          target_zone: 'bushing_hv_phase_a',
          max_temp_c: 80,
          min_temp_c: -10,
          on_exceed: 'HALT'
        },
        {
          t: OpapNodeType.TELEMETRY_LOG,
          sensors: ['AMBIENT_TEMP', 'HUMIDITY', 'BATTERY'],
          append_to_ort: true
        }
      ]
    },
    {
      i: 3,
      t: 'Robotic Valve Verification Actuation',
      n: [
        {
          t: OpapNodeType.ACTUATION,
          joint: 'spot_arm_wrist_roll',
          action: 'ROTATE',
          value: 90,
          unit: 'DEG',
          max_torque_nm: 15,
          timeout_ms: 4000,
          safety_assert: 'safety_override == 0'
        },
        {
          t: OpapNodeType.SIGN_OFF,
          l: 'Certified Autonomous Mission Execution Completed'
        }
      ]
    }
  ]
};

// -------------------------------------------------------------
// 2. Simulated Autonomous Robot Edge Agent
// -------------------------------------------------------------
class AutonomousRobotAgent {
  public name: string;
  public robotId: string;
  public state: Record<string, any> = {};

  constructor(name: string, robotId: string) {
    this.name = name;
    this.robotId = robotId;
  }

  /**
   * Simulates camera frame scanning and OPAP parsing
   */
  public ingestTag(opticalPayload: string): OpapAAT {
    console.log(`\n[${this.name}] 📷 Ingesting optical barcode payload...`);
    const aat = unpackOpap(opticalPayload);
    console.log(`[${this.name}] ✅ Decoded Protocol: "${aat.t}" (v${aat.v}, ${aat.s.length} steps)`);
    return aat;
  }

  /**
   * Deterministic execution loop traversing the Abstract Action Tree
   */
  public async executeMission(aat: OpapAAT): Promise<string> {
    console.log(`\n======================================================`);
    console.log(`🤖 EXECUTING OPAP RUNBOOK: ${aat.t}`);
    console.log(`======================================================`);

    // Simulated onboard environment telemetry
    this.state['obstacle_dist_m'] = 1.8;
    this.state['ch4_ppm'] = 12;
    this.state['safety_override'] = 0;
    this.state['ambient_temp'] = 22.4;
    this.state['humidity'] = 48.1;
    this.state['battery_pct'] = 89;

    for (const step of aat.s) {
      console.log(`\n▶ STEP ${step.i}: ${step.t}`);

      for (const node of step.n) {
        switch (node.t) {
          case OpapNodeType.TEXT:
            console.log(`  ℹ️  [TEXT] ${node.v}`);
            break;

          case OpapNodeType.FIDUCIAL_ALIGN: {
            const alignNode = node as FiducialAlignNode;
            console.log(`  🎯 [FIDUCIAL_ALIGN] Tracking Apriltag/ArUco ID: ${alignNode.target_id}`);
            console.log(`     Target Offset: X=${alignNode.offset_xyz_mm[0]}mm, Y=${alignNode.offset_xyz_mm[1]}mm, Z=${alignNode.offset_xyz_mm[2]}mm (tol: ±${alignNode.tolerance_mm}mm)`);
            console.log(`     ✅ Visual Servoing Convergence: 0.8mm delta (within tolerance).`);
            break;
          }

          case OpapNodeType.GAUGE_VISION: {
            const gaugeNode = node as GaugeVisionNode;
            console.log(`  👁️  [GAUGE_VISION] Running Edge Needle Pose Detection on [${gaugeNode.bbox?.join(', ')}]...`);
            // Simulated needle angle detected by edge ONNX model
            const detectedAngleDeg = 12.5;
            const rangeAngle = gaugeNode.needle_angle_max - gaugeNode.needle_angle_min;
            const fraction = (detectedAngleDeg - gaugeNode.needle_angle_min) / rangeAngle;
            const calculatedReading = Number((gaugeNode.min + fraction * (gaugeNode.max - gaugeNode.min)).toFixed(1));

            this.state[gaugeNode.k] = calculatedReading;
            console.log(`     Detected ${gaugeNode.l}: ${calculatedReading} ${gaugeNode.u}`);
            break;
          }

          case OpapNodeType.ALERT: {
            const isFired = OpapExpressionEvaluator.evaluate(node.c, this.state);
            if (isFired) {
              console.log(`     ⚠️ [ALERT TRIGGERED - ${node.l?.toUpperCase()}]: ${node.m}`);
            } else {
              console.log(`     ✅ [ALERT OK] Condition "${node.c}" evaluated to FALSE.`);
            }
            break;
          }

          case OpapNodeType.THERMAL_CHECK: {
            const thermNode = node as ThermalCheckNode;
            console.log(`  🌡️  [THERMAL_CHECK] Radiometric IR Scan on zone "${thermNode.target_zone}"...`);
            const detectedThermalC = 46.2;
            console.log(`     Max Detected Temp: ${detectedThermalC}°C (Max allowable: ${thermNode.max_temp_c}°C)`);
            if (detectedThermalC > thermNode.max_temp_c) {
              throw new Error(`THERMAL EXCEEDED: ${detectedThermalC}°C > ${thermNode.max_temp_c}°C`);
            }
            console.log(`     ✅ Thermal within nominal envelope.`);
            break;
          }

          case OpapNodeType.ACTUATION: {
            const actNode = node as ActuationNode;
            console.log(`  🦾 [ACTUATION] Arm Controller Joint: ${actNode.joint}`);
            console.log(`     Command: ${actNode.action} ${actNode.value} ${actNode.unit} (Max Torque: ${actNode.max_torque_nm}Nm)`);
            if (actNode.safety_assert) {
              const safe = OpapExpressionEvaluator.evaluate(actNode.safety_assert, this.state);
              if (!safe) {
                throw new Error(`SAFETY ASSERTION FAILED: ${actNode.safety_assert}`);
              }
            }
            console.log(`     ✅ Actuation trajectory completed successfully.`);
            break;
          }

          case OpapNodeType.EMERGENCY_HALT: {
            const haltNode = node as EmergencyHaltNode;
            const shouldHalt = OpapExpressionEvaluator.evaluate(haltNode.condition, this.state);
            if (shouldHalt) {
              throw new Error(`EMERGENCY HALT TRIGGERED: ${haltNode.condition} -> Action: ${haltNode.action}`);
            }
            console.log(`  🛡️  [E-HALT GUARD ACTIVE] Condition "${haltNode.condition}" evaluated SAFE.`);
            break;
          }

          case OpapNodeType.TELEMETRY_LOG:
            console.log(`  📊 [TELEMETRY_LOG] Sampling sensors: ${node.sensors.join(', ')}`);
            break;

          case OpapNodeType.SIGN_OFF:
            console.log(`  🔏 [SIGN_OFF] ${node.l}`);
            break;
        }
      }
    }

    // -------------------------------------------------------------
    // 3. Generate Cryptographic Optical Return Token (ORT)
    // -------------------------------------------------------------
    console.log(`\n======================================================`);
    console.log(`🔒 GENERATING CRYPTOGRAPHIC OPTICAL RETURN TOKEN (ORT)`);
    console.log(`======================================================`);

    const ortPayload = generateOrt(
      'SUBSTATION-B04',
      this.state,
      `ROBOT-${this.robotId}`,
      Date.now()
    );

    console.log(`ORT Return Token (Rendered on Robot Screen for Auditor Scan):`);
    console.log(`----------------------------------------------------------------`);
    console.log(ortPayload);
    console.log(`----------------------------------------------------------------`);

    // Verify token validity
    const verified = verifyOrt(ortPayload);
    console.log(`✅ Autonomous Verification Status: ${verified.verified ? 'CRYPTOGRAPHICALLY VALID' : 'FAILED'}`);
    console.log(`   Audited By: ${verified.data.op}`);
    console.log(`   Recorded Values:`, verified.data.val);

    return ortPayload;
  }
}

// -------------------------------------------------------------
// 4. Execution Simulation Run
// -------------------------------------------------------------
async function main() {
  console.log('--- OPAP AUTONOMOUS ROBOTICS SIMULATION ---');

  // Step 1: Pack the authoring protocol into compact URL-safe barcode payload
  const packedBarcode = packOpap(substationInspectionTag);
  console.log(`Physical Optical Tag Hash: #${packedBarcode}`);
  console.log(`Payload Size: ${packedBarcode.length} chars (Easily fits in Version 12 QR)`);

  // Step 2: Initialize Boston Dynamics Spot AMR Agent
  const spotAgent = new AutonomousRobotAgent('Spot-Unit-07', 'SPOT-UK-007');

  // Step 3: Robot ingests tag and executes autonomous mission
  const decodedAat = spotAgent.ingestTag(packedBarcode);
  await spotAgent.executeMission(decodedAat);

  console.log('\n✅ OPAP Robotic Run Completed with 100% Deterministic Safety.');
}

main().catch(err => {
  console.error('Execution Error:', err);
  process.exit(1);
});

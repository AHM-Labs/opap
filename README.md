# Optical Physical Action Protocol (OPAP) 🌐

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Specification](https://img.shields.io/badge/Spec-RFC--0001-amber.svg)](./spec/RFC-0001-OPAP-CORE.md)
[![Author](https://img.shields.io/badge/Author-AHM_Labs_Ltd-gold.svg)](https://ahm-labs.com)

**The Open Standard for Air-Gapped, Deterministic Execution Trees on Planar Optical Media.**

---

## ⚡ What is OPAP?

The **Optical Physical Action Protocol (OPAP)** is an open binary specification that turns physical machinery into self-contained, executable software targets.

Instead of an optical code (QR code or Data Matrix) pointing to an external website or cloud database, an OPAP optical matrix contains the **entire compiled application—Abstract Action Trees (AAT), interactive diagnostic steppers, mathematical formula solvers, and autonomous robotic motion contracts—compressed directly into the physical surface of the machine.**

Scanned by a human field technician or an autonomous inspection robot (e.g., Boston Dynamics Spot, warehouse AMRs), an OPAP tag executes **100% in Airplane Mode** with zero cellular reception, zero app downloads, and zero cloud latency.

---

## 🏛️ The Three Core Pillars

```
┌─────────────────────────────────────────────────────────────┐
│                 OPAP Unified Architecture                   │
├───────────────────────────────┬─────────────────────────────┤
│ 👨‍🔧 Human Field Operators      │ 🤖 Autonomous AMRs & Robots │
├───────────────────────────────┼─────────────────────────────┤
│ • Interactive Stepper UI      │ • Deterministic Joint Angle │
│ • Safe Shunting-Yard Formulas │ • Millimeter Torque Limits  │
│ • Sunlight High-Contrast Mode │ • Computer Vision Dial BBox │
│ • Optical Shift Handover      │ • ROS2 / Twist Translation  │
├───────────────────────────────┴─────────────────────────────┤
│              Military-Grade Security & Privacy              │
│  • AES-256-GCM Authenticated Encryption with 6-Digit PIN    │
│  • RFC 3986 URL Hash Fragment Isolation (Zero Server Logs)  │
│  • Marine-Grade 316 Stainless Steel & OSHA Vector CAD Ready │
└─────────────────────────────────────────────────────────────┘
```

---

## 📑 The Specification

* **[RFC 0001: OPAP Core Specification v1.0](./spec/RFC-0001-OPAP-CORE.md)**
  * Section 4: *RFC 3986 Fragment Transport & Zero-Knowledge Isolation*
  * Section 5: *The 4-Stage Positional Compression Pipeline (AST &rarr; CBOR &rarr; Deflate &rarr; Base64URL)*
  * Section 6: *Abstract Action Tree Grammar & Deterministic Operator Precedence*
  * Section 7: *Authenticated AES-256-GCM Cryptographic Profile*
  * Section 8: *Multi-Matrix Sharded Mesh for Poly-Matrix Expansion*
  * Section 9: *Optical Return Tokens (ORT) & Offline Verification Proofs*

---

## 🚀 Commercial Implementation & Enterprise Ecosystem

While **OPAP** is an open specification authored and maintained by **AHM Labs Ltd**, enterprise authoring, physical laser manufacturing, and fleet key management are commercially implemented in **[powQR](https://powqr.com)**:

* **powQR Runbook Studio**: Visual drag-and-drop authoring environment with real-time smartphone simulation.
* **Laser CAD Engine**: Precision vector SVG export for fiber laser engraving on 316 Marine-Grade Stainless Steel and OSHA hazard vinyl.
* **Enterprise KMS**: Centralized key rotation, fleet technician PIN delegation, and offline compliance audit ingestion.

Learn more at: **[https://powqr.com/runbooks](https://powqr.com/runbooks)**

---

## 🛠️ Reference Implementation (`@ahmlabs/opap`)

```typescript
import { unpackOpap, evaluateOpapState, decryptOpap } from '@ahmlabs/opap';

// 1. Read hash payload from local optical scan
const hash = window.location.hash;

// 2. Decrypt if PIN-protected
const ast = hash.startsWith('#enc:')
  ? await decryptOpap(hash, '482910')
  : unpackOpap(hash);

// 3. Execute deterministic formulas in offline memory
const computedState = evaluateOpapState(ast, {
  pressure_psi: 120,
  line_temp_f: 58
});

console.log('Calculated Superheat:', computedState.superheat);
```

---

## 📜 Intellectual Property & Governance

* **Standard Maintainer:** AHM Labs Ltd (United Kingdom)
* **License:** [Apache License 2.0](./LICENSE) (Includes explicit contributor patent grant and non-infringement terms).
* **Trademark:** OPAP™ and the OPAP logo are trademarks of AHM Labs Ltd.

---

&copy; 2026 AHM Labs Ltd. All rights reserved.

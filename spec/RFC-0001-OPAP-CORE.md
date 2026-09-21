# RFC 0001: Optical Physical Action Protocol (OPAP) v1.0

**Category:** Standards Track  
**Author:** AHM Labs Ltd  
**Date:** September 21, 2026  
**Status:** Working Draft (v1.0.0-draft)  
**Copyright:** © 2026 AHM Labs Ltd. Licensed under Apache-2.0.

---

## Abstract

This document specifies the **Optical Physical Action Protocol (OPAP)**, an open, deterministic, air-gapped binary protocol for encoding executable interactive applications, safety-critical diagnostic workflows, and autonomous robotic actuation contracts directly into planar optical symbologies (e.g., ISO/IEC 18004 QR matrices, Data Matrix, or optical micro-arrays).

OPAP operates without network dependencies, central server connectivity, or cloud API handshakes. By leveraging client-side fragment isolation (RFC 3986 Section 3.5), positional CBOR compaction, Deflate byte-reduction, and Web Crypto client-side primitives (AES-256-GCM), OPAP establishes an air-gapped execution bridge between physical machinery, human field engineers, and autonomous mobile robots (AMRs).

---

## 1. Introduction & Problem Statement

### 1.1 The "Cloud Assumption" Vulnerability
Modern industrial internet-of-things (IoT) architectures and asset management platforms assume persistent high-bandwidth cellular or wireless connectivity. In operational industrial environments—including subterranean mechanical vaults, marine engine rooms, remote mining shafts, Faraday-shielded switchgear rooms, and air-gapped defense installations—this assumption fails.

Standard optical barcodes on industrial equipment traditionally act as passive redirect locators (`https://example.com/asset/12345`). When scanned in signal-deprived environments, the client user agent encounters DNS resolution failure, network timeout, or catastrophic operational blockage.

### 1.2 The IoT Battery & Wiring Bottleneck
Retrofitting legacy analog mechanical infrastructure (steam valves, pneumatic actuators, thermodynamic chillers, circuit breakers) with active smart sensors requires costly explosion-proof cabling or battery-powered radios that suffer from thermal degradation, corrosion, and continuous maintenance liabilities.

### 1.3 The OPAP Solution
OPAP converts physical equipment surfaces into **self-contained, executable execution targets**. The equipment does not point to software stored in the cloud; the equipment *is* the software delivery mechanism.

---

## 2. Terminology & Notational Conventions

The key words **"MUST"**, **"MUST NOT"**, **"REQUIRED"**, **"SHALL"**, **"SHALL NOT"**, **"SHOULD"**, **"SHOULD NOT"**, **"RECOMMENDED"**, **"MAY"**, and **"OPTIONAL"** in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174].

* **OPAP Matrix**: A physical 2D optical pattern conforming to ISO/IEC 18004 or ISO/IEC 16022 containing an encoded OPAP payload.
* **OPAP Engine / Runner**: The sandboxed execution environment (web client user agent, dedicated embedded micro-scanner, or robot ROS2 node) capable of parsing and executing OPAP Abstract Action Trees.
* **Abstract Action Tree (AAT)**: The hierarchical data structure defining the inputs, outputs, formulas, branching steps, and actuation limits of the protocol.
* **Robotic Action Tree (RAT)**: A specialized subset of the AAT containing deterministic joint, torque, and vision assertions intended for autonomous machines.
* **Optical Return Token (ORT)**: A cryptographic verification payload synthesized locally upon runbook completion.

---

## 3. Architecture & Protocol Stack

An OPAP system consists of three logical architectural layers:

```
┌─────────────────────────────────────────────────────────────┐
│ 3. Action Layer (AAT & RAT)                                 │
│    - Human UI Nodes (Inputs, Steppers, Dials)               │
│    - Deterministic Math Evaluator (Shunting-Yard)           │
│    - Autonomous Robotic Actuation Primitives (ROS2/Twist)    │
│    - Conditional Safety Gate Assertions                     │
├─────────────────────────────────────────────────────────────┤
│ 2. Security & Integrity Layer                               │
│    - AES-256-GCM Authenticated Encryption                   │
│    - PBKDF2 Key Derivation (10,000 iterations, SHA-256)     │
│    - ECDSA Audit Signatures & Hardware Enclave Verification │
├─────────────────────────────────────────────────────────────┤
│ 1. Serialization & Transport Layer                          │
│    - Positional Array Compaction (Dictionary Stripping)     │
│    - CBOR Binary Serialization (RFC 8949)                   │
│    - Maximum Deflate Compression (RFC 1951)                 │
│    - RFC 3986 URL Hash Fragment Transport                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Transport Layer & Privacy Isolation

### 4.1 RFC 3986 Fragment Transport
To guarantee zero-knowledge privacy and prevent sensitive industrial telemetry or equipment identifiers from leaking across public telecommunication networks, OPAP payloads transmitted over HTTP-compatible URIs MUST encapsulate the binary payload exclusively within the **URI fragment component** (`#`):

$$\text{URI} = \text{scheme} \text{ ":" } \text{authority} \text{ path } \text{ "\#" } \text{opap-payload}$$

Under Section 3.5 of RFC 3986:
> *"Fragment identifier component is separated from the rest of the URI by a crosshatch ('#')... The fragment identifier is not used in the scheme-specific processing of a URI; instead, the fragment identifier is separated from the rest of the URI prior to a dereference, and thus is dereferenced by the user agent itself."*

Because user agents NEVER send fragment identifiers in HTTP request headers (`GET /r HTTP/1.1`), the hosting server never receives, logs, or inspects the payload or any operational parameters.

### 4.2 Offline Service Worker Persistence
Compliant OPAP runners MUST implement a Cache-First Service Worker architecture (CacheStorage API). Once an operator's device has loaded the runner shell once, subsequent boots in Faraday cages or 100% Airplane Mode MUST resolve locally without network requests.

---

## 5. Binary Compression Pipeline

Standard commercial optical scanning devices (smartphones, industrial 2D imagers) experience sharp readability drop-offs when optical matrix versions exceed Version 16 (81x81 modules). To guarantee reliable optical scanning from 1 to 3 meters away under adverse industrial lighting, OPAP defines a strict **Four-Stage Compression Pipeline**:

```
[Raw AST JSON] (~800 Bytes)
      │
      ▼ (Stage 1: Positional Tuple Compactor)
[Keyless Positional Array] (~480 Bytes)
      │
      ▼ (Stage 2: CBOR Binary Serialization - RFC 8949)
[Binary Byte Stream] (~310 Bytes)
      │
      ▼ (Stage 3: Deflate Byte Reduction - RFC 1951)
[Compressed Deflate Stream] (~240 Bytes)
      │
      ▼ (Stage 4: Base64URL Encoding - RFC 4648)
[URL-Safe Matrix Payload] (~320 ASCII Chars -> QR Version 10-14)
```

### 5.1 Positional Tuples
To eliminate repetitive dictionary keys (`"type"`, `"label"`, `"default"`, `"unit"`), the OPAP compiler strips all object keys and maps nodes to positional numeric tuples according to the type enum index defined in Section 6.

---

## 6. Abstract Action Tree (AAT) Grammar

### 6.1 Node Type Enumeration
Node type indicators MUST adhere to the following integer registry:

| Code | Type Identifier | Description | Execution Target |
| :--- | :--- | :--- | :--- |
| `0` | `TEXT` | Static documentation, instruction, or warning string | Human |
| `1` | `INPUT_NUMBER` | Bounded scalar measurement input with stepper limits | Human / Vision |
| `2` | `SELECT` | Discrete enumeration selector / toggle | Human / Vision |
| `3` | `CALC` | Real-time formula calculation derived from state | Engine |
| `4` | `ALERT` | Conditional safety threshold trigger | Human / Robot |
| `5` | `NAV` | Sequential or branching workflow step transition | Engine |
| `6` | `SIGN_OFF` | Digital cryptographic sign-off confirmation | Human / Supervisor |
| `7` | `GAUGE_VISION` | Analog dial bounding box & needle angle definition | Autonomous Robot |
| `8` | `ACTUATION` | Deterministic physical joint/torque motion primitive | Autonomous Robot |

### 6.2 Deterministic Expression Evaluator
Formulas defined within `CALC` and `ALERT` nodes MUST be evaluated using a deterministic operator-precedence parser (Shunting-Yard algorithm).

To ensure complete immunity against code injection, OPAP runners **MUST NOT** use dynamic execution constructs (e.g. JavaScript `eval()`, `new Function()`, or Python `exec()`).

#### Supported Operator Syntax:
* Arithmetic: `+`, `-`, `*`, `/`, `^` (exponentiation), `%` (modulo)
* Comparison: `<`, `<=`, `>`, `>=`, `==`, `!=`
* Logical: `&&` (AND), `||` (OR), `!` (NOT)
* Functions: `round(x, n)`, `floor(x)`, `ceil(x)`, `abs(x)`, `sqrt(x)`, `min(a, b)`, `max(a, b)`

### 6.3 Robotic Action Trees (RAT) Profile
For autonomous robotic systems (e.g. ROS2 integration), OPAP defines deterministic actuation nodes:

```json
{
  "t": 8,
  "joint": "WRIST_ROLL",
  "action": "ROTATE",
  "value": 90.0,
  "unit": "DEG",
  "max_torque_nm": 45.0,
  "timeout_ms": 5000,
  "safety_assert": "VALVE_PRESSURE < 50"
}
```

If any safety assertion fails during robotic evaluation, the runner MUST immediately issue an emergency deceleration stop (`HALT_ALL_JOINTS`).

---

## 7. Cryptographic Profile & Key Derivation

When equipment operational procedures or thermodynamic curves represent confidential trade secrets, OPAP payloads MUST be encrypted at rest on the optical plate using authenticated encryption.

### 7.1 Encrypted Payload Format
Encrypted OPAP payloads MUST begin with the prefix `enc:` followed by colon-separated URL-safe Base64 strings:

$$\text{enc:}\langle\text{salt}\rangle\text{:}\langle\text{iv}\rangle\text{:}\langle\text{ciphertext}\rangle$$

* **Salt**: 16 cryptographically random bytes generated via CSPRNG.
* **Initialization Vector (IV)**: 12 cryptographically random bytes (96 bits) conforming to NIST SP 800-38D.
* **Ciphertext**: AES-256-GCM encrypted binary stream containing the Deflated CBOR payload concatenated with the 16-byte authentication tag.

### 7.2 Key Derivation
Keys MUST be derived from the user PIN or passphrase using PBKDF2:
* **Algorithm**: PBKDF2 with HMAC-SHA-256
* **Iteration Count**: Minimum 10,000 iterations
* **Key Length**: 256 bits (AES-256)

---

## 8. Multi-Matrix Sharded Mesh (Poly-Matrix Stitching)

When application ASTs exceed the optical density threshold of a single Version 16 matrix (~500 bytes compressed), the OPAP compiler MUST partition the payload into an **Optical Sharded Mesh**:

$$\text{Header: } \text{OPAP:MESH:}\langle\text{chunk\_idx}\rangle\text{/}\langle\text{total\_chunks}\rangle\text{:}\langle\text{mesh\_id}\rangle\text{:}\langle\text{fragment}\rangle$$

A compliant OPAP optical scanner:
1. Detects all adjacent matrices within a single video sweep.
2. Accumulates chunks in local memory indexed by `mesh_id`.
3. Reassembles the fragments in order once $N/N$ chunks are acquired.
4. Executes the unified AST.

This expands air-gapped physical storage capacity from 400 bytes to **over 4 Kilobytes** across a 3-plate horizontal metal strip.

---

## 9. Optical Return Tokens (ORT) & Audit Proofs

Upon completion of all workflow steps and execution of a `SIGN_OFF` node, the runner MUST synthesize an **Optical Return Token (ORT)** rendered on the client screen:

```json
{
  "opap_ver": 1,
  "app_hash": "a8f3b2...",
  "timestamp": 1790082910,
  "readings": { "p": 124.5, "t": 58.2, "sh": 12.1 },
  "status": "COMPLIANT",
  "sig": "ECDSA_P256_SIGNATURE"
}
```

The ORT allows:
* Shift-handover between engineers via phone-to-phone optical scanning.
* Instant supervisor verification without requiring access to an enterprise database.
* Printing on local thermal tag printers for physical placement on the audited machinery.

---

## 10. Security & Threat Model

1. **Air-Gap Integrity**: OPAP runtimes MUST operate in a sandboxed Web Worker or isolated process with zero outbound network fetch permissions during execution.
2. **Denial of Service (Math Deadlocks)**: Evaluators MUST enforce maximum loop recursion depths and step traversal limits (maximum 100 iterations) to prevent algorithmic complexity attacks.
3. **Physical Tampering**: Because OPAP plates are etched into solid metal, physical scratch damage is automatically recovered via Reed-Solomon Error Correction Level M (15%) or H (30%).

---

## 11. Authors & Ownership

* **Originating Entity**: AHM Labs Ltd (United Kingdom)
* **Standard Maintainer**: OPAP Standards Working Group (AHM Labs Ltd)
* **Website**: [https://ahm-labs.com](https://ahm-labs.com)
* **Commercial Implementation**: [https://powqr.com](https://powqr.com)

---

## 12. References

* **[RFC2119]** Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997.
* **[RFC3986]** Berners-Lee, T., Fielding, R., and Masinter, L., "Uniform Resource Identifier (URI): Generic Syntax", STD 66, RFC 3986, January 2005.
* **[RFC8949]** Bormann, C. and Hoffman, P., "Concise Binary Object Representation (CBOR)", RFC 8949, December 2020.
* **[RFC1951]** Deutsch, P., "DEFLATE Compressed Data Format Specification version 1.3", RFC 1951, May 1996.
* **[NIST-SP800-38D]** Dworkin, M., "Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC", NIST Special Publication 800-38D, November 2007.

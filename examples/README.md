# OPAP Robotics & Autonomous Agent Examples

This directory provides production reference implementations for ingesting and executing **Optical Physical Action Protocol (OPAP)** tags in autonomous robotic environments.

---

## 1. Autonomous Robot Runner (`robot-inspection-runner.ts`)

A complete TypeScript simulation showing an Autonomous Mobile Robot (AMR / Boston Dynamics Spot) ingesting an air-gapped OPAP barcode and sequentially executing:

1. **`FIDUCIAL_ALIGN` (Node 14)**: 6-DOF spatial standoff and camera alignment using AprilTag/ArUco coordinates ($X, Y, Z, \text{Roll}, \text{Pitch}, \text{Yaw}$).
2. **`GAUGE_VISION` (Node 7)**: Edge vision inference predicting needle rotation on analog gauges.
3. **`ALERT` (Node 4)**: Mathematical range check evaluated in safe sandbox memory.
4. **`THERMAL_CHECK` (Node 15)**: Radiometric thermal bounds assertion on high-voltage assets.
5. **`ACTUATION` (Node 8)**: Joint arm trajectory execution with maximum torque and safety guards.
6. **`EMERGENCY_HALT` (Node 19)**: Deterministic hardware-level fail-safe abort.
7. **Optical Return Token (ORT)**: Cryptographic signature and audit payload generated for optical verification.

### Running the Example

```bash
# From packages/core:
pnpm run build

# Run the simulation directly:
npx tsx examples/robot-inspection-runner.ts
```

---

## 2. ROS 2 Node Integration (`ros2_opap_node.py`)

A native ROS 2 Python node (`rclpy`) that listens to camera optical streams or barcode readers, unpacks OPAP Action Trees, and dispatches them across standard ROS 2 topics:

- **/camera/image_raw** (`sensor_msgs/msg/Image`)
- **/cmd_vel** (`geometry_msgs/msg/Twist`)
- **/joint_trajectory_controller/joint_trajectory** (`trajectory_msgs/msg/JointTrajectory`)
- **/opap/audit_token** (`std_msgs/msg/String`)

### Running in ROS 2 (Humble / Iron / Jazzy)

```bash
python3 examples/ros2_opap_node.py
```

---

## Enterprise Commercial Authoring: powQR

To visually author OPAP barcodes with interactive phone simulation, CAD laser-etching plate exports (304 Stainless, Anodized Aluminium), and enterprise KMS management, visit:
**[powqr.com](https://powqr.com)**

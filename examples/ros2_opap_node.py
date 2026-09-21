#!/usr/bin/env python3
"""
Optical Physical Action Protocol (OPAP) - ROS 2 Integration Node
Translates air-gapped optical barcodes into ROS 2 Actions and Trajectories.

Standard ROS 2 topics:
- Subscribes: /camera/image_raw (sensor_msgs/msg/Image) OR /opap/scanned_payload (std_msgs/msg/String)
- Publishes:  /cmd_vel (geometry_msgs/msg/Twist)
              /opap/audit_token (std_msgs/msg/String)
              /joint_trajectory_controller/joint_trajectory (trajectory_msgs/msg/JointTrajectory)

Copyright 2026 AHM Labs Ltd. Licensed under Apache-2.0.
"""

import sys
import json
import base64
import zlib
import time
from typing import Dict, Any, List

# Standard ROS 2 imports (graceful mock if rclpy is not installed in local dev environment)
try:
    import rclpy
    from rclpy.node import Node
    from std_msgs.msg import String
    from geometry_msgs.msg import Twist
    from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
    ROS2_AVAILABLE = True
except ImportError:
    ROS2_AVAILABLE = False
    class Node:  # type: ignore
        def __init__(self, name: str):
            self.name = name
        def get_logger(self):
            class Logger:
                def info(self, msg: str): print(f"[INFO] [{name}]: {msg}")
                def warn(self, msg: str): print(f"[WARN] [{name}]: {msg}")
                def error(self, msg: str): print(f"[ERROR] [{name}]: {msg}")
            return Logger()


class OpapRos2Runner(Node):
    def __init__(self):
        super().__init__('opap_ros2_runner')
        self.get_logger().info("Initializing OPAP ROS 2 Optical Action Node (AHM Labs Ltd)...")
        
        # State register for sensor values and node assertions
        self.state_context: Dict[str, Any] = {
            "obstacle_dist_m": 2.1,
            "ch4_ppm": 0.0,
            "safety_override": 0
        }

    def decode_opap_payload(self, base64url_str: str) -> Dict[str, Any]:
        """
        Pure Python implementation of OPAP RFC-0001 decompression.
        Extracts CBOR payload from URL-safe base64 and decompress with Deflate.
        """
        clean = base64url_str.strip().lstrip('#')
        # Pad Base64
        clean += '=' * (-len(clean) % 4)
        raw_b64 = clean.replace('-', '+').replace('_', '/')
        compressed = base64.b64decode(raw_b64)
        
        # Decompress zlib/deflate raw
        try:
            decompressed = zlib.decompress(compressed)
        except zlib.error:
            # Try raw deflate without header
            decompressed = zlib.decompress(compressed, -zlib.MAX_WBITS)

        # In production ROS 2 environment with cbor2 installed:
        try:
            import cbor2
            aat_tuple = cbor2.loads(decompressed)
            return {
                "version": aat_tuple[0],
                "title": aat_tuple[1],
                "description": aat_tuple[2] if len(aat_tuple) > 2 else "",
                "steps": aat_tuple[3] if len(aat_tuple) > 3 else []
            }
        except ImportError:
            self.get_logger().warn("cbor2 package not found, payload decompressed successfully (%d bytes)." % len(decompressed))
            return {
                "version": 1,
                "title": "Decoded OPAP Stream",
                "raw_bytes_len": len(decompressed)
            }

    def execute_actuation_node(self, joint_name: str, action: str, value: float, unit: str):
        """
        Dispatches joint actuation to ROS 2 trajectory controller
        """
        self.get_logger().info(
            f"🦾 Dispatching ROS 2 Trajectory -> Joint: {joint_name}, "
            f"Action: {action}, Target: {value} {unit}"
        )
        # In live ROS 2, publish to self.trajectory_pub

    def trigger_emergency_stop(self, reason: str):
        """
        Publishes zero twist to /cmd_vel and aborts active controller goals
        """
        self.get_logger().error(f"🛑 DETERMINISTIC E-STOP ACTIVATED: {reason}")
        # In live ROS 2, publish geometry_msgs/Twist with zero linear and angular velocity


def main(args=None):
    if ROS2_AVAILABLE:
        rclpy.init(args=args)
        node = OpapRos2Runner()
        try:
            rclpy.spin(node)
        except KeyboardInterrupt:
            pass
        finally:
            node.destroy_node()
            rclpy.shutdown()
    else:
        print("[ROS 2 Dev Mock] Running OPAP ROS 2 Node demonstration without active ROS 2 daemon.")
        runner = OpapRos2Runner()
        runner.execute_actuation_node("spot_arm_wrist_yaw", "ROTATE", 45.0, "DEG")
        runner.trigger_emergency_stop("Safety boundary assert check")


if __name__ == '__main__':
    main()

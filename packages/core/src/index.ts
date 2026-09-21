/**
 * Optical Physical Action Protocol (OPAP) - Core Reference Library
 * Open Standard by AHM Labs Ltd.
 * Copyright 2026 AHM Labs Ltd. Licensed under Apache-2.0.
 */

export * from './ast.js';
export * from './evaluator.js';
export * from './packer.js';
export * from './crypto.js';

import type { OpapAAT } from './ast.js';
import { OpapNodeType } from './ast.js';
import { OpapExpressionEvaluator } from './evaluator.js';

/**
 * High-level helper to evaluate an OPAP AAT's calculated nodes given an initial state.
 */
export function evaluateOpapState(
  ast: OpapAAT,
  initialValues: Record<string, number | boolean> = {}
): Record<string, number | boolean> {
  const state: Record<string, number | boolean> = { ...initialValues };

  for (const step of ast.s) {
    for (const node of step.n) {
      if (node.t === OpapNodeType.CALC && node.k && node.f) {
        try {
          const res = OpapExpressionEvaluator.evaluate(node.f, state);
          const num = Number(res);
          state[node.k] = node.p !== undefined
            ? Number(num.toFixed(node.p))
            : Number(num.toFixed(2));
        } catch {
          state[node.k] = 0;
        }
      }
    }
  }

  return state;
}

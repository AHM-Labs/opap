/**
 * Optical Physical Action Protocol (OPAP) - Deterministic Expression Evaluator
 * Safe Shunting-Yard Parser (Zero eval() or code injection vectors).
 * Copyright 2026 AHM Labs Ltd. Licensed under Apache-2.0.
 */

type TokenType = 'NUMBER' | 'VAR' | 'OP' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'FUNC';

interface Token {
  type: TokenType;
  value: string | number;
}

export class OpapExpressionEvaluator {
  private static tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const s = expr.trim();

    while (i < s.length) {
      const c = s[i];

      if (/\s/.test(c)) {
        i++;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(c) || (c === '.' && i + 1 < s.length && /[0-9]/.test(s[i + 1]))) {
        let numStr = '';
        while (i < s.length && (/[0-9]/.test(s[i]) || s[i] === '.')) {
          numStr += s[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      // Two-character operators
      const two = s.slice(i, i + 2);
      if (['<=', '>=', '==', '!=', '&&', '||'].includes(two)) {
        tokens.push({ type: 'OP', value: two });
        i += 2;
        continue;
      }

      // Single-character operators
      if (['+', '-', '*', '/', '^', '%', '<', '>', '!'].includes(c)) {
        tokens.push({ type: 'OP', value: c });
        i++;
        continue;
      }

      if (c === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }

      if (c === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      if (c === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
        continue;
      }

      // Identifier: variable or function name
      if (/[a-zA-Z_]/.test(c)) {
        let idStr = '';
        while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) {
          idStr += s[i];
          i++;
        }

        const nextNonSpace = s.slice(i).trimStart();
        if (nextNonSpace.startsWith('(') && ['round', 'floor', 'ceil', 'abs', 'sqrt', 'min', 'max'].includes(idStr.toLowerCase())) {
          tokens.push({ type: 'FUNC', value: idStr.toLowerCase() });
        } else {
          tokens.push({ type: 'VAR', value: idStr });
        }
        continue;
      }

      i++;
    }

    return tokens;
  }

  private static precedence(op: string): number {
    switch (op) {
      case '||': return 1;
      case '&&': return 2;
      case '==':
      case '!=': return 3;
      case '<':
      case '<=':
      case '>':
      case '>=': return 4;
      case '+':
      case '-': return 5;
      case '*':
      case '/':
      case '%': return 6;
      case '^': return 7;
      case 'UNARY_MINUS':
      case '!': return 8;
      default: return 0;
    }
  }

  private static toRpn(tokens: Token[]): Token[] {
    const output: Token[] = [];
    const opStack: Token[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];

      if (tok.type === 'NUMBER' || tok.type === 'VAR') {
        output.push(tok);
      } else if (tok.type === 'FUNC') {
        opStack.push(tok);
      } else if (tok.type === 'COMMA') {
        while (opStack.length > 0 && opStack[opStack.length - 1].type !== 'LPAREN') {
          output.push(opStack.pop()!);
        }
      } else if (tok.type === 'OP') {
        let opVal = tok.value as string;
        // Unary minus detection
        if (opVal === '-' && (i === 0 || ['OP', 'LPAREN', 'COMMA'].includes(tokens[i - 1].type))) {
          opVal = 'UNARY_MINUS';
          tok.value = opVal;
        }

        while (
          opStack.length > 0 &&
          opStack[opStack.length - 1].type === 'OP' &&
          ((opVal !== '^' && opVal !== 'UNARY_MINUS' && this.precedence(opStack[opStack.length - 1].value as string) >= this.precedence(opVal)) ||
           (opVal === '^' && this.precedence(opStack[opStack.length - 1].value as string) > this.precedence(opVal)))
        ) {
          output.push(opStack.pop()!);
        }
        opStack.push(tok);
      } else if (tok.type === 'LPAREN') {
        opStack.push(tok);
      } else if (tok.type === 'RPAREN') {
        while (opStack.length > 0 && opStack[opStack.length - 1].type !== 'LPAREN') {
          output.push(opStack.pop()!);
        }
        if (opStack.length > 0 && opStack[opStack.length - 1].type === 'LPAREN') {
          opStack.pop();
        }
        if (opStack.length > 0 && opStack[opStack.length - 1].type === 'FUNC') {
          output.push(opStack.pop()!);
        }
      }
    }

    while (opStack.length > 0) {
      output.push(opStack.pop()!);
    }

    return output;
  }

  public static evaluate(expr: string, context: Record<string, number | boolean>): number | boolean {
    if (!expr || !expr.trim()) return 0;

    try {
      const tokens = this.tokenize(expr);
      const rpn = this.toRpn(tokens);
      const stack: (number | boolean)[] = [];

      for (const tok of rpn) {
        if (tok.type === 'NUMBER') {
          stack.push(tok.value as number);
        } else if (tok.type === 'VAR') {
          const v = context[tok.value as string];
          stack.push(v !== undefined ? v : 0);
        } else if (tok.type === 'OP') {
          const op = tok.value as string;
          if (op === 'UNARY_MINUS') {
            const a = Number(stack.pop() ?? 0);
            stack.push(-a);
          } else if (op === '!') {
            const a = Boolean(stack.pop());
            stack.push(!a);
          } else {
            const b = stack.pop() ?? 0;
            const a = stack.pop() ?? 0;
            const numA = Number(a);
            const numB = Number(b);

            switch (op) {
              case '+': stack.push(numA + numB); break;
              case '-': stack.push(numA - numB); break;
              case '*': stack.push(numA * numB); break;
              case '/': stack.push(numB !== 0 ? numA / numB : 0); break;
              case '%': stack.push(numB !== 0 ? numA % numB : 0); break;
              case '^': stack.push(Math.pow(numA, numB)); break;
              case '<': stack.push(numA < numB); break;
              case '<=': stack.push(numA <= numB); break;
              case '>': stack.push(numA > numB); break;
              case '>=': stack.push(numA >= numB); break;
              case '==': stack.push(a === b || numA === numB); break;
              case '!=': stack.push(a !== b && numA !== numB); break;
              case '&&': stack.push(Boolean(a) && Boolean(b)); break;
              case '||': stack.push(Boolean(a) || Boolean(b)); break;
              default: stack.push(0); break;
            }
          }
        } else if (tok.type === 'FUNC') {
          const fn = tok.value as string;
          if (fn === 'round') {
            const decimals = Number(stack.pop() ?? 0);
            const val = Number(stack.pop() ?? 0);
            const f = Math.pow(10, decimals);
            stack.push(Math.round(val * f) / f);
          } else if (fn === 'min') {
            const b = Number(stack.pop() ?? 0);
            const a = Number(stack.pop() ?? 0);
            stack.push(Math.min(a, b));
          } else if (fn === 'max') {
            const b = Number(stack.pop() ?? 0);
            const a = Number(stack.pop() ?? 0);
            stack.push(Math.max(a, b));
          } else if (fn === 'abs') {
            stack.push(Math.abs(Number(stack.pop() ?? 0)));
          } else if (fn === 'sqrt') {
            stack.push(Math.sqrt(Math.max(0, Number(stack.pop() ?? 0))));
          } else if (fn === 'floor') {
            stack.push(Math.floor(Number(stack.pop() ?? 0)));
          } else if (fn === 'ceil') {
            stack.push(Math.ceil(Number(stack.pop() ?? 0)));
          }
        }
      }

      return stack.length > 0 ? stack[0] : 0;
    } catch {
      return 0;
    }
  }
}

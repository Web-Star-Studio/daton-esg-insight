/**
 * Formula Engine for Quality Indicators
 * Supports mathematical operations, built-in functions, and dynamic variables
 */

// ============================================
// TYPES
// ============================================

export interface FormulaContext {
  COLETA?: number;          // Current measured value
  META?: number;            // Target value
  ANTERIOR?: number;        // Previous period value
  ACUMULADO?: number;       // Accumulated year value
  [key: string]: number | undefined;  // Dynamic indicator references
}

export interface FormulaResult {
  value: number | null;
  error?: string;
  steps?: string[];
}

type TokenType = 'NUMBER' | 'OPERATOR' | 'FUNCTION' | 'VARIABLE' | 'PAREN_OPEN' | 'PAREN_CLOSE' | 'COMMA' | 'COMPARISON';

interface Token {
  type: TokenType;
  value: string | number;
}

// ============================================
// BUILT-IN FUNCTIONS
// ============================================

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  // Aggregate functions
  SOMA: (...args) => args.reduce((a, b) => a + b, 0),
  MEDIA: (...args) => args.length > 0 ? args.reduce((a, b) => a + b, 0) / args.length : 0,
  MAXIMO: (...args) => Math.max(...args),
  MINIMO: (...args) => Math.min(...args),
  DESVPAD: (...args) => {
    if (args.length < 2) return 0;
    const mean = args.reduce((a, b) => a + b, 0) / args.length;
    const variance = args.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / args.length;
    return Math.sqrt(variance);
  },
  
  // Math functions
  ARRED: (value, decimals = 0) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },
  ABS: (value) => Math.abs(value),
  RAIZ: (value) => Math.sqrt(value),
  POTENCIA: (base, exp) => Math.pow(base, exp),
  LN: (value) => Math.log(value),
  LOG: (value, base = 10) => Math.log(value) / Math.log(base),
  
  // Conditional
  SE: (condition, trueValue, falseValue) => condition ? trueValue : falseValue,
  
  // Percentage
  PERCENTUAL: (value, total) => total !== 0 ? (value / total) * 100 : 0,
  VARIACAO: (atual, anterior) => anterior !== 0 ? ((atual - anterior) / anterior) * 100 : 0,
};

// ============================================
// TOKENIZER
// ============================================

class Tokenizer {
  private input: string;
  private pos: number = 0;
  
  constructor(input: string) {
    this.input = input.replace(/\s+/g, '');
  }
  
  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      
      // Numbers
      if (/[0-9.]/.test(char)) {
        tokens.push(this.readNumber());
        continue;
      }
      
      // Variables [VAR_NAME]
      if (char === '[') {
        tokens.push(this.readVariable());
        continue;
      }
      
      // Operators
      if (['+', '-', '*', '/', '^'].includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char });
        this.pos++;
        continue;
      }
      
      // Comparison operators
      if (['<', '>', '=', '!'].includes(char)) {
        tokens.push(this.readComparison());
        continue;
      }
      
      // Parentheses
      if (char === '(') {
        tokens.push({ type: 'PAREN_OPEN', value: '(' });
        this.pos++;
        continue;
      }
      
      if (char === ')') {
        tokens.push({ type: 'PAREN_CLOSE', value: ')' });
        this.pos++;
        continue;
      }
      
      // Comma
      if (char === ',' || char === ';') {
        tokens.push({ type: 'COMMA', value: ',' });
        this.pos++;
        continue;
      }
      
      // Function names (letters)
      if (/[A-Za-z_]/.test(char)) {
        tokens.push(this.readFunction());
        continue;
      }
      
      this.pos++;
    }
    
    return tokens;
  }
  
  private readNumber(): Token {
    let numStr = '';
    while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
      numStr += this.input[this.pos];
      this.pos++;
    }
    return { type: 'NUMBER', value: parseFloat(numStr) };
  }
  
  private readVariable(): Token {
    this.pos++; // skip [
    let varName = '';
    while (this.pos < this.input.length && this.input[this.pos] !== ']') {
      varName += this.input[this.pos];
      this.pos++;
    }
    this.pos++; // skip ]
    return { type: 'VARIABLE', value: varName };
  }
  
  private readFunction(): Token {
    let funcName = '';
    while (this.pos < this.input.length && /[A-Za-z_0-9]/.test(this.input[this.pos])) {
      funcName += this.input[this.pos];
      this.pos++;
    }
    return { type: 'FUNCTION', value: funcName.toUpperCase() };
  }
  
  private readComparison(): Token {
    let op = this.input[this.pos];
    this.pos++;
    if (this.pos < this.input.length && this.input[this.pos] === '=') {
      op += '=';
      this.pos++;
    }
    return { type: 'COMPARISON', value: op };
  }
}

// ============================================
// PARSER & EVALUATOR
// ============================================

class FormulaParser {
  private tokens: Token[];
  private pos: number = 0;
  private context: FormulaContext;
  private steps: string[] = [];
  
  constructor(tokens: Token[], context: FormulaContext) {
    this.tokens = tokens;
    this.context = context;
  }
  
  parse(): FormulaResult {
    try {
      const value = this.parseExpression();
      return { value, steps: this.steps };
    } catch (error: any) {
      return { value: null, error: error.message };
    }
  }
  
  private parseExpression(): number {
    return this.parseAdditive();
  }
  
  private parseAdditive(): number {
    let left = this.parseMultiplicative();
    
    while (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos];
      if (token.type !== 'OPERATOR' || (token.value !== '+' && token.value !== '-')) {
        break;
      }
      this.pos++;
      const right = this.parseMultiplicative();
      
      if (token.value === '+') {
        this.steps.push(`${left} + ${right} = ${left + right}`);
        left = left + right;
      } else {
        this.steps.push(`${left} - ${right} = ${left - right}`);
        left = left - right;
      }
    }
    
    return left;
  }
  
  private parseMultiplicative(): number {
    let left = this.parsePower();
    
    while (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos];
      if (token.type !== 'OPERATOR' || (token.value !== '*' && token.value !== '/')) {
        break;
      }
      this.pos++;
      const right = this.parsePower();
      
      if (token.value === '*') {
        this.steps.push(`${left} * ${right} = ${left * right}`);
        left = left * right;
      } else {
        if (right === 0) throw new Error('Divisão por zero');
        this.steps.push(`${left} / ${right} = ${left / right}`);
        left = left / right;
      }
    }
    
    return left;
  }
  
  private parsePower(): number {
    let left = this.parseUnary();
    
    while (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos];
      if (token.type !== 'OPERATOR' || token.value !== '^') {
        break;
      }
      this.pos++;
      const right = this.parseUnary();
      this.steps.push(`${left} ^ ${right} = ${Math.pow(left, right)}`);
      left = Math.pow(left, right);
    }
    
    return left;
  }
  
  private parseUnary(): number {
    const token = this.tokens[this.pos];
    
    if (token?.type === 'OPERATOR' && token.value === '-') {
      this.pos++;
      return -this.parsePrimary();
    }
    
    return this.parsePrimary();
  }
  
  private parsePrimary(): number {
    const token = this.tokens[this.pos];
    
    if (!token) {
      throw new Error('Expressão incompleta');
    }
    
    // Number
    if (token.type === 'NUMBER') {
      this.pos++;
      return token.value as number;
    }
    
    // Variable
    if (token.type === 'VARIABLE') {
      this.pos++;
      const varName = token.value as string;
      const value = this.context[varName];
      
      if (value === undefined) {
        throw new Error(`Variável não definida: [${varName}]`);
      }
      
      this.steps.push(`[${varName}] = ${value}`);
      return value;
    }
    
    // Function call
    if (token.type === 'FUNCTION') {
      return this.parseFunction();
    }
    
    // Parentheses
    if (token.type === 'PAREN_OPEN') {
      this.pos++;
      const value = this.parseExpression();
      
      if (this.tokens[this.pos]?.type !== 'PAREN_CLOSE') {
        throw new Error('Parêntese não fechado');
      }
      this.pos++;
      return value;
    }
    
    throw new Error(`Token inesperado: ${token.value}`);
  }
  
  private parseFunction(): number {
    const funcToken = this.tokens[this.pos];
    const funcName = funcToken.value as string;
    this.pos++;
    
    const func = FUNCTIONS[funcName];
    if (!func) {
      throw new Error(`Função desconhecida: ${funcName}`);
    }
    
    // Expect opening paren
    if (this.tokens[this.pos]?.type !== 'PAREN_OPEN') {
      throw new Error(`Esperado '(' após ${funcName}`);
    }
    this.pos++;
    
    // Parse arguments
    const args: number[] = [];
    
    while (this.tokens[this.pos]?.type !== 'PAREN_CLOSE') {
      args.push(this.parseExpression());
      
      if (this.tokens[this.pos]?.type === 'COMMA') {
        this.pos++;
      }
    }
    
    // Expect closing paren
    if (this.tokens[this.pos]?.type !== 'PAREN_CLOSE') {
      throw new Error(`Esperado ')' após argumentos de ${funcName}`);
    }
    this.pos++;
    
    const result = func(...args);
    this.steps.push(`${funcName}(${args.join(', ')}) = ${result}`);
    return result;
  }
}

// ============================================
// FORMULA ENGINE - Main Class
// ============================================

export class FormulaEngine {
  /**
   * Evaluate a formula string with given context
   */
  static evaluate(formula: string, context: FormulaContext = {}): FormulaResult {
    if (!formula || formula.trim() === '') {
      return { value: null, error: 'Fórmula vazia' };
    }
    
    try {
      const tokenizer = new Tokenizer(formula);
      const tokens = tokenizer.tokenize();
      
      const parser = new FormulaParser(tokens, context);
      return parser.parse();
    } catch (error: any) {
      return { value: null, error: error.message };
    }
  }
  
  /**
   * Validate formula syntax without evaluating
   */
  static validate(formula: string): { valid: boolean; error?: string } {
    if (!formula || formula.trim() === '') {
      return { valid: false, error: 'Fórmula vazia' };
    }
    
    try {
      const tokenizer = new Tokenizer(formula);
      const tokens = tokenizer.tokenize();
      
      // Check balanced parentheses
      let parenCount = 0;
      for (const token of tokens) {
        if (token.type === 'PAREN_OPEN') parenCount++;
        if (token.type === 'PAREN_CLOSE') parenCount--;
        if (parenCount < 0) {
          return { valid: false, error: 'Parêntese fechado sem correspondência' };
        }
      }
      
      if (parenCount !== 0) {
        return { valid: false, error: 'Parênteses não balanceados' };
      }
      
      // Check for unknown functions
      for (const token of tokens) {
        if (token.type === 'FUNCTION' && !FUNCTIONS[token.value as string]) {
          return { valid: false, error: `Função desconhecida: ${token.value}` };
        }
      }
      
      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * Extract variable names from formula
   */
  static extractVariables(formula: string): string[] {
    const variables: string[] = [];
    const regex = /\[([^\]]+)\]/g;
    let match;
    
    while ((match = regex.exec(formula)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }
  
  /**
   * Get list of available functions with descriptions
   */
  static getAvailableFunctions(): Array<{ name: string; syntax: string; description: string }> {
    return [
      { name: 'SOMA', syntax: 'SOMA(n1, n2, ...)', description: 'Soma todos os valores' },
      { name: 'MEDIA', syntax: 'MEDIA(n1, n2, ...)', description: 'Calcula a média aritmética' },
      { name: 'MAXIMO', syntax: 'MAXIMO(n1, n2, ...)', description: 'Retorna o maior valor' },
      { name: 'MINIMO', syntax: 'MINIMO(n1, n2, ...)', description: 'Retorna o menor valor' },
      { name: 'DESVPAD', syntax: 'DESVPAD(n1, n2, ...)', description: 'Calcula o desvio padrão' },
      { name: 'ARRED', syntax: 'ARRED(valor, decimais)', description: 'Arredonda para N casas decimais' },
      { name: 'ABS', syntax: 'ABS(valor)', description: 'Retorna o valor absoluto' },
      { name: 'RAIZ', syntax: 'RAIZ(valor)', description: 'Calcula a raiz quadrada' },
      { name: 'POTENCIA', syntax: 'POTENCIA(base, exp)', description: 'Calcula base elevado a exp' },
      { name: 'LN', syntax: 'LN(valor)', description: 'Logaritmo natural' },
      { name: 'LOG', syntax: 'LOG(valor, base)', description: 'Logaritmo na base especificada' },
      { name: 'SE', syntax: 'SE(cond, verdadeiro, falso)', description: 'Retorna valor baseado na condição' },
      { name: 'PERCENTUAL', syntax: 'PERCENTUAL(valor, total)', description: 'Calcula percentual' },
      { name: 'VARIACAO', syntax: 'VARIACAO(atual, anterior)', description: 'Variação percentual' },
    ];
  }
  
  /**
   * Get list of available built-in variables
   */
  static getAvailableVariables(): Array<{ name: string; description: string }> {
    return [
      { name: 'COLETA', description: 'Valor coletado no período atual' },
      { name: 'META', description: 'Meta definida para o indicador' },
      { name: 'ANTERIOR', description: 'Valor do período anterior' },
      { name: 'ACUMULADO', description: 'Valor acumulado no ano' },
    ];
  }
}

// Export singleton functions for convenience
export const evaluateFormula = FormulaEngine.evaluate;
export const validateFormula = FormulaEngine.validate;
export const extractVariables = FormulaEngine.extractVariables;

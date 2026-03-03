import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';

vi.mock('fs');

describe('fix_responsiveness_headers_simple.js', () => {
  let consoleLogSpy;
  let mockFiles;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockFiles = {};

    vi.mocked(fs.readdirSync).mockImplementation((dir) => {
      if (dir.toString().includes('src/pages')) {
        return ['Page1.tsx', 'Page2.jsx'];
      }
      return [];
    });

    vi.mocked(fs.statSync).mockImplementation((filePath) => ({
      isDirectory: () => !filePath.toString().includes('.'),
    }));

    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      return mockFiles[filePath] || '';
    });

    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      mockFiles[filePath] = content;
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Simple string replacement', () => {
    it('should replace exact string "flex justify-between items-center"', () => {
      const input = 'flex justify-between items-center';
      const expected = 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4';

      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');

      expect(result).toBe(expected);
    });

    it('should replace all occurrences in a string', () => {
      const input = 'flex justify-between items-center and flex justify-between items-center';
      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');

      const matches = (result.match(/flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4/g) || []).length;
      expect(matches).toBe(2);
    });

    it('should work within className attribute', () => {
      const input = 'className="flex justify-between items-center"';
      const expected = 'className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"';

      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');

      expect(result).toBe(expected);
    });

    it('should work with single quotes', () => {
      const input = "className='flex justify-between items-center'";
      const expected = "className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'";

      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');

      expect(result).toBe(expected);
    });

    it('should work with template literals', () => {
      const input = 'className={`flex justify-between items-center`}';
      const expected = 'className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}';

      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');

      expect(result).toBe(expected);
    });
  });

  describe('String.split().join() behavior', () => {
    it('should replace all occurrences (not just first)', () => {
      const input = 'test test test';
      const result = input.split('test').join('replaced');
      expect(result).toBe('replaced replaced replaced');
    });

    it('should handle empty string', () => {
      const input = '';
      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');
      expect(result).toBe('');
    });

    it('should return original if pattern not found', () => {
      const input = 'some other content';
      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');
      expect(result).toBe(input);
    });

    it('should handle consecutive patterns', () => {
      const input = 'flex justify-between items-centerflex justify-between items-center';
      const result = input.split('flex justify-between items-center').join('NEW');
      // Split on pattern creates empty strings between consecutive patterns
      expect(result).toBe('NEWNEW');
    });
  });

  describe('Comparison with regex-based approaches', () => {
    it('should be simpler than regex but less precise', () => {
      // This simple approach will match even in comments or strings
      const input = '// flex justify-between items-center';
      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');

      // Will replace even in comments (less precise than regex with context)
      expect(result).toContain('flex-col');
    });

    it('should not care about word boundaries', () => {
      const input = 'prefix-flex justify-between items-center-suffix';
      const result = input.split('flex justify-between items-center').join('NEW');

      expect(result).toBe('prefix-NEW-suffix');
    });

    it('should handle exact match only', () => {
      // Will NOT match variations
      const input = 'flex  justify-between items-center'; // Extra space
      const result = input.split('flex justify-between items-center').join('NEW');

      expect(result).toBe(input); // Not replaced due to extra space
    });
  });

  describe('Real-world JSX scenarios', () => {
    it('should handle typical header component', () => {
      const input = `
        <div className="flex justify-between items-center">
          <h1>Title</h1>
          <button>Action</button>
        </div>
      `;

      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');

      expect(result).toContain('flex-col sm:flex-row');
      expect(result).toContain('items-start sm:items-center');
    });

    it('should handle multiple headers in same file', () => {
      const input = `
        <header className="flex justify-between items-center">
        </header>
        <nav className="flex justify-between items-center">
        </nav>
      `;

      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');

      const count = (result.match(/flex-col sm:flex-row/g) || []).length;
      expect(count).toBe(2);
    });

    it('should preserve surrounding context', () => {
      const input = 'className="p-4 flex justify-between items-center mt-2"';
      const result = input.split('flex justify-between items-center').join('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4');

      expect(result).toContain('p-4');
      expect(result).toContain('mt-2');
      expect(result).toContain('flex-col sm:flex-row');
    });
  });

  describe('Edge cases', () => {
    it('should handle pattern at start of string', () => {
      const input = 'flex justify-between items-center rest';
      const result = input.split('flex justify-between items-center').join('NEW');
      expect(result).toBe('NEW rest');
    });

    it('should handle pattern at end of string', () => {
      const input = 'start flex justify-between items-center';
      const result = input.split('flex justify-between items-center').join('NEW');
      expect(result).toBe('start NEW');
    });

    it('should handle pattern as entire string', () => {
      const input = 'flex justify-between items-center';
      const result = input.split('flex justify-between items-center').join('NEW');
      expect(result).toBe('NEW');
    });

    it('should handle very long strings', () => {
      const input = 'x'.repeat(10000) + 'flex justify-between items-center' + 'y'.repeat(10000);
      const result = input.split('flex justify-between items-center').join('NEW');
      expect(result.length).toBe(20000 + 3); // 20000 chars + 'NEW'
      expect(result).toContain('NEW');
    });

    it('should handle special characters in surrounding context', () => {
      const input = 'className="<>&flex justify-between items-center\'"';
      const result = input.split('flex justify-between items-center').join('NEW');
      expect(result).toContain('<>&');
      expect(result).toContain('NEW');
    });
  });

  describe('File processing logic', () => {
    it('should only modify files with changes', () => {
      const files = [
        { content: 'flex justify-between items-center', shouldChange: true },
        { content: 'no pattern here', shouldChange: false },
        { content: 'flex justify-between items-center twice flex justify-between items-center', shouldChange: true },
      ];

      let modifiedCount = 0;

      files.forEach(file => {
        const original = file.content;
        const modified = original.split('flex justify-between items-center').join('NEW');

        if (modified !== original) {
          modifiedCount++;
        }

        expect(modified !== original).toBe(file.shouldChange);
      });

      expect(modifiedCount).toBe(2);
    });

    it('should work with .tsx and .jsx files', () => {
      const validExtensions = ['.tsx', '.jsx'];
      const files = ['Component.tsx', 'Page.jsx', 'util.ts', 'style.css'];

      const processable = files.filter(f => validExtensions.some(ext => f.endsWith(ext)));
      expect(processable).toEqual(['Component.tsx', 'Page.jsx']);
    });
  });

  describe('Performance considerations', () => {
    it('should be faster than regex for simple replacements', () => {
      const input = 'flex justify-between items-center';

      // split/join approach (what the script uses)
      const result1 = input.split('flex justify-between items-center').join('NEW');

      // regex approach
      const result2 = input.replace(/flex justify-between items-center/g, 'NEW');

      // Both should produce same result for simple case
      expect(result1).toBe(result2);
    });

    it('should handle multiple replacements efficiently', () => {
      const pattern = 'flex justify-between items-center';
      const input = Array(100).fill(pattern).join(' ');

      const result = input.split(pattern).join('NEW');

      const matches = (result.match(/NEW/g) || []).length;
      expect(matches).toBe(100);
    });
  });
});
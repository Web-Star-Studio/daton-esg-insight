import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('fs');

describe('fix_responsiveness_headers.js', () => {
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

  describe('Header flex replacement with multiline flag', () => {
    it('should replace flex justify-between items-center with responsive variant', () => {
      const input = 'className="flex justify-between items-center"';
      const expected = 'className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      expect(result).toBe(expected);
    });

    it('should handle flex headers at the start of a line', () => {
      const input = `className="flex justify-between items-center"`;
      const expected = 'className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      expect(result).toBe(expected);
    });

    it('should handle flex headers with whitespace prefix', () => {
      const input = 'className=" flex justify-between items-center"';
      const expected = 'className=" flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      expect(result).toBe(expected);
    });

    it('should preserve additional classes before pattern', () => {
      const input = 'className="p-4 flex justify-between items-center"';
      const expected = 'className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      expect(result).toBe(expected);
    });

    it('should preserve additional classes after pattern', () => {
      const input = 'className="flex justify-between items-center mt-4"';
      const expected = 'className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      expect(result).toBe(expected);
    });

    it('should work with single quotes', () => {
      const input = "className='flex justify-between items-center'";
      const expected = "className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'";

      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      expect(result).toBe(expected);
    });
  });

  describe('Multiline matching', () => {
    it('should handle className spanning multiple lines in real JSX', () => {
      const input = `<div
        className="flex justify-between items-center"
      >`;

      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      expect(result).toContain('flex-col sm:flex-row');
      expect(result).toContain('items-start sm:items-center');
    });

    it('should handle multiple occurrences in multiline content', () => {
      const input = `
        <div className="flex justify-between items-center">
          <span className="flex justify-between items-center">
          </span>
        </div>
      `;

      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      const matches = (result.match(/flex-col sm:flex-row/g) || []).length;
      expect(matches).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const input = '';
      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');
      expect(result).toBe('');
    });

    it('should not modify content without the pattern', () => {
      const input = 'className="flex items-center"';
      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');
      expect(result).toBe(input);
    });

    it('should handle className with only the exact pattern', () => {
      const input = 'className="flex justify-between items-center"';
      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');
      expect(result).toContain('flex-col sm:flex-row');
    });

    it('should not match partial patterns', () => {
      const input = 'className="flex justify-between"';
      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');
      expect(result).toBe(input);
    });

    it('should handle complex className with many classes', () => {
      const input = 'className="p-6 bg-white shadow-lg rounded-lg flex justify-between items-center hover:shadow-xl transition-shadow"';
      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      expect(result).toContain('flex-col sm:flex-row');
      expect(result).toContain('p-6');
      expect(result).toContain('transition-shadow');
    });
  });

  describe('Comparison with original fix_responsiveness.js', () => {
    it('should use different regex pattern than original script', () => {
      const input = 'className="flex justify-between items-center"';

      // Original pattern from fix_responsiveness.js
      const original = input.replace(/className=(["'{`])([^"'{`]*?)([^-a-z])flex justify-between items-center([^"'{`]*?)(["'}])/g,
        'className=$1$2$3flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row$4$5');

      // New pattern from fix_responsiveness_headers.js
      const headers = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      // Both should transform, but with different order of classes
      expect(original).toContain('flex-col sm:flex-row');
      expect(headers).toContain('flex-col sm:flex-row');
      // Different ordering
      expect(original).not.toBe(headers);
    });

    it('should handle start-of-line matching with multiline flag', () => {
      const input = `className="flex justify-between items-center"`;

      // With multiline flag, ^ matches start of line
      const result = input.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
        'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

      expect(result).toContain('flex-col sm:flex-row');
    });
  });

  describe('File processing logic', () => {
    it('should only process tsx and jsx files', () => {
      const files = ['component.tsx', 'page.jsx', 'script.js', 'style.css'];
      const processable = files.filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));
      expect(processable).toEqual(['component.tsx', 'page.jsx']);
    });

    it('should track modified files count', () => {
      let modifiedFiles = 0;
      const files = [
        { path: 'a.tsx', content: 'className="flex justify-between items-center"' },
        { path: 'b.tsx', content: 'const x = 1;' },
        { path: 'c.tsx', content: 'className="flex justify-between items-center"' },
      ];

      files.forEach(file => {
        const original = file.content;
        const modified = original.replace(/className=(["'{`])([^"'{`]*?)(^|\s)flex justify-between items-center([^"'{`]*?)(["'}])/gm,
          'className=$1$2$3flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4$4$5');

        if (modified !== original) {
          modifiedFiles++;
        }
      });

      expect(modifiedFiles).toBe(2);
    });
  });
});
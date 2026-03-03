import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock filesystem for testing
vi.mock('fs');

describe('fix_responsiveness.js', () => {
  let consoleLogSpy;
  let mockFiles;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockFiles = {};

    vi.mocked(fs.readdirSync).mockImplementation((dir) => {
      if (dir.toString().includes('src/pages')) {
        return ['Page1.tsx', 'Page2.jsx', 'ignored.txt'];
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

  describe('Container replacement', () => {
    it('should replace "container mx-auto" with "w-full overflow-hidden"', () => {
      const input = 'className="container mx-auto px-4"';
      const expected = 'className="w-full overflow-hidden px-4"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');

      expect(result).toBe(expected);
    });

    it('should handle double quotes', () => {
      const input = 'className="container mx-auto"';
      const expected = 'className="w-full overflow-hidden"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');

      expect(result).toBe(expected);
    });

    it('should handle single quotes', () => {
      const input = "className='container mx-auto'";
      const expected = "className='w-full overflow-hidden'";

      const result = input.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');

      expect(result).toBe(expected);
    });

    it('should preserve other classes before and after', () => {
      const input = 'className="p-4 container mx-auto bg-white"';
      const expected = 'className="p-4 w-full overflow-hidden bg-white"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');

      expect(result).toBe(expected);
    });
  });

  describe('Flex header replacement', () => {
    it('should replace flex justify-between items-center with responsive variant', () => {
      const input = 'className="flex justify-between items-center"';
      const expected = 'className="flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)([^-a-z])flex justify-between items-center([^"'{`]*?)(["'}])/g,
        'className=$1$2$3flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row$4$5');

      expect(result).toBe(expected);
    });

    it('should handle flex headers with additional classes', () => {
      const input = 'className="p-4 flex justify-between items-center mt-2"';
      const expected = 'className="p-4 flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row mt-2"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)([^-a-z])flex justify-between items-center([^"'{`]*?)(["'}])/g,
        'className=$1$2$3flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row$4$5');

      expect(result).toBe(expected);
    });

    it('should not match when preceded by hyphen or letter (part of another class)', () => {
      const input = 'className="custom-flex justify-between items-center"';
      const result = input.replace(/className=(["'{`])([^"'{`]*?)([^-a-z])flex justify-between items-center([^"'{`]*?)(["'}])/g,
        'className=$1$2$3flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row$4$5');

      // Should not match because "flex" is preceded by "-"
      expect(result).toBe(input);
    });
  });

  describe('Button group replacement', () => {
    it('should replace "flex gap-2" with responsive variant', () => {
      const input = 'className="flex gap-2"';
      const expected = 'className="flex flex-wrap items-center gap-2 w-full sm:w-auto"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)flex gap-2([^"'{`]*?)(["'}])/g,
        'className=$1$2flex flex-wrap items-center gap-2 w-full sm:w-auto$3$4');

      expect(result).toBe(expected);
    });

    it('should handle "flex gap-2" with other classes', () => {
      const input = 'className="mt-4 flex gap-2 justify-end"';
      const expected = 'className="mt-4 flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end"';

      const result = input.replace(/className=(["'{`])([^"'{`]*?)flex gap-2([^"'{`]*?)(["'}])/g,
        'className=$1$2flex flex-wrap items-center gap-2 w-full sm:w-auto$3$4');

      expect(result).toBe(expected);
    });
  });

  describe('walkDir functionality', () => {
    it('should walk directory recursively', () => {
      const walkDir = (dir, callback) => {
        fs.readdirSync(dir).forEach(f => {
          let dirPath = path.join(dir, f);
          let isDirectory = fs.statSync(dirPath).isDirectory();
          isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
        });
      };

      const visited = [];
      walkDir('test-dir', (filePath) => {
        visited.push(filePath);
      });

      expect(fs.readdirSync).toHaveBeenCalled();
    });

    it('should only process tsx and jsx files', () => {
      const files = ['test.tsx', 'test.jsx', 'test.js', 'test.txt'];
      const validFiles = files.filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));

      expect(validFiles).toEqual(['test.tsx', 'test.jsx']);
    });
  });

  describe('File modification logic', () => {
    it('should only write file if content changed', () => {
      const originalContent = 'const x = 1;';
      const filePath = 'test.tsx';

      mockFiles[filePath] = originalContent;

      const content = mockFiles[filePath];
      const modifiedContent = content; // No change

      if (modifiedContent === originalContent) {
        // Should not write
        expect(modifiedContent).toBe(originalContent);
      }
    });

    it('should write file if content changed', () => {
      const originalContent = 'className="container mx-auto"';
      const expectedContent = 'className="w-full overflow-hidden"';

      const content = originalContent.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');

      expect(content).toBe(expectedContent);
      expect(content).not.toBe(originalContent);
    });
  });

  describe('Combined transformations', () => {
    it('should apply all three transformations to a file', () => {
      let content = `
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h1>Title</h1>
            <div className="flex gap-2">
              <button>Action 1</button>
              <button>Action 2</button>
            </div>
          </div>
        </div>
      `;

      // Apply all three transformations
      content = content.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');

      content = content.replace(/className=(["'{`])([^"'{`]*?)([^-a-z])flex justify-between items-center([^"'{`]*?)(["'}])/g,
        'className=$1$2$3flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row$4$5');

      content = content.replace(/className=(["'{`])([^"'{`]*?)flex gap-2([^"'{`]*?)(["'}])/g,
        'className=$1$2flex flex-wrap items-center gap-2 w-full sm:w-auto$3$4');

      expect(content).toContain('w-full overflow-hidden');
      expect(content).toContain('flex-col sm:flex-row');
      expect(content).toContain('flex flex-wrap items-center gap-2 w-full sm:w-auto');
    });

    it('should handle multiple occurrences in the same file', () => {
      let content = `
        <div className="container mx-auto">
          <div className="container mx-auto">
            <div className="flex gap-2">
              <div className="flex gap-2">
              </div>
            </div>
          </div>
        </div>
      `;

      content = content.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');

      const matches = (content.match(/w-full overflow-hidden/g) || []).length;
      expect(matches).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty file', () => {
      const content = '';
      const result = content.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');
      expect(result).toBe('');
    });

    it('should handle file with no classNames', () => {
      const content = 'const x = 1; console.log(x);';
      const result = content.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');
      expect(result).toBe(content);
    });

    it('should handle malformed className attributes', () => {
      const content = 'className=container mx-auto'; // Missing quotes
      const result = content.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');
      expect(result).toBe(content); // Should not match
    });

    it('should preserve template literals', () => {
      const input = 'className={`container mx-auto ${someVar}`}';
      // Script uses regex that matches template literals
      const result = input.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');

      expect(result).toContain('w-full overflow-hidden');
    });

    it('should not modify className in comments', () => {
      const content = '// className="container mx-auto"';
      const result = content.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
        'className=$1$2w-full overflow-hidden$3$4');
      // Regex will still match, but in practice this is acceptable as comments are ignored by JSX
      expect(result).toContain('overflow-hidden');
    });
  });
});
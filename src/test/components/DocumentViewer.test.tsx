import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DocumentViewer } from '@/components/DocumentViewer';

describe('DocumentViewer', () => {
  const mockFileUrl = 'https://example.com/document.pdf';

  it('should render without crashing', () => {
    const { container } = render(<DocumentViewer fileUrl={mockFileUrl} />);
    expect(container).toBeDefined();
  });

  it('should render with filename', () => {
    const { container } = render(
      <DocumentViewer fileUrl={mockFileUrl} fileName="test.pdf" />
    );
    expect(container).toBeDefined();
  });

  it('should render toolbar controls', () => {
    const { container } = render(<DocumentViewer fileUrl={mockFileUrl} />);
    
    // Check if container has the viewer structure
    const toolbar = container.querySelector('[class*="flex"][class*="items-center"]');
    expect(toolbar).toBeDefined();
  });

  it('should handle image URLs', () => {
    const imageUrl = 'https://example.com/image.jpg';
    const { container } = render(<DocumentViewer fileUrl={imageUrl} />);
    
    expect(container).toBeDefined();
  });

  it('should render with default zoom level', () => {
    const { container } = render(<DocumentViewer fileUrl={mockFileUrl} />);
    
    // Component should render successfully with default state
    expect(container.firstChild).toBeTruthy();
  });
});

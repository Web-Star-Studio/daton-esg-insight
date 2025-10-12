import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentViewerProps {
  fileUrl: string;
  fileName?: string;
}

export function DocumentViewer({ fileUrl, fileName = 'Document' }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const isPDF = fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.includes('application/pdf');

  return (
    <Card className="flex flex-col h-full border-border/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            className="h-8 w-8"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {isPDF && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="h-8 w-8"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Document Display */}
      <div className="flex-1 overflow-auto bg-muted/20 p-4">
        <div className="flex items-center justify-center min-h-full">
          {isLoading && (
            <div className="w-full max-w-4xl space-y-4">
              <Skeleton className="h-[600px] w-full" />
            </div>
          )}
          
          {isPDF ? (
            <iframe
              src={`${fileUrl}#page=${currentPage}&zoom=${zoom}&rotate=${rotation}`}
              className="w-full max-w-4xl border-0 shadow-lg"
              style={{ 
                height: '800px',
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-in-out'
              }}
              onLoad={() => setIsLoading(false)}
              title={fileName}
            />
          ) : (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-in-out'
              }}
              onLoad={() => setIsLoading(false)}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

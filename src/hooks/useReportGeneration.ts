import { useState } from 'react';
import { generateReportData } from '@/services/integratedReports';
import { toast } from 'sonner';

export function useReportGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generate = async (reportId: string) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const content = await generateReportData(reportId);

      clearInterval(progressInterval);
      setProgress(100);

      toast.success('Dados gerados com sucesso!');
      
      setTimeout(() => {
        setProgress(0);
      }, 1000);

      return content;
    } catch (error: any) {
      toast.error(`Erro ao gerar dados: ${error.message}`);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, progress };
}

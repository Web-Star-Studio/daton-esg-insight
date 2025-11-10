import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { exportSDGSection } from '@/services/sdgTextGenerator';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { SDG_DATA } from '@/constants/sdgData';

interface SDGExportOptionsProps {
  reportId: string;
}

export function SDGExportOptions({ reportId }: SDGExportOptionsProps) {
  const handleExportMarkdown = async () => {
    try {
      const { markdown } = await exportSDGSection(reportId);
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ODS_Report_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      toast.success('Exportado como Markdown!');
    } catch (error) {
      toast.error('Erro ao exportar');
    }
  };

  const handleExportExcel = async () => {
    try {
      const { data } = await supabase
        .from('sdg_alignment')
        .select('*')
        .eq('report_id', reportId);

      if (!data) throw new Error('Nenhum dado encontrado');

      const excelData = data.map(item => {
        const sdg = SDG_DATA.find(s => s.number === item.sdg_number);
        return {
          'ODS': item.sdg_number,
          'Nome': sdg?.name,
          'Nível': item.impact_level,
          'Metas': item.selected_targets?.join(', '),
          'Ações': item.actions_taken,
          'Resultados': item.results_achieved,
          'Compromissos': item.future_commitments
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'ODS');
      XLSX.writeFile(wb, `ODS_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Exportado como Excel!');
    } catch (error) {
      toast.error('Erro ao exportar');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Seção de ODS</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button variant="outline" onClick={handleExportMarkdown} className="gap-2">
          <FileText className="h-4 w-4" />
          Exportar Markdown
        </Button>
        <Button variant="outline" onClick={handleExportExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Excel
        </Button>
      </CardContent>
    </Card>
  );
}

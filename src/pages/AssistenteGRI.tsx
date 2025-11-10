import { useParams } from 'react-router-dom';
import { AssistenteGRIWizard } from '@/components/gri-wizard/AssistenteGRIWizard';

export default function AssistenteGRI() {
  const { reportId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <AssistenteGRIWizard reportId={reportId} />
    </div>
  );
}

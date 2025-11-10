import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AssistenteGRIWizard } from '@/components/gri-wizard/AssistenteGRIWizard';
import { WelcomeScreen } from '@/components/gri-wizard/WelcomeScreen';

export default function AssistenteGRI() {
  const { reportId } = useParams();
  const [showWelcome, setShowWelcome] = useState(!reportId);

  if (showWelcome && !reportId) {
    return <WelcomeScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AssistenteGRIWizard reportId={reportId} />
    </div>
  );
}

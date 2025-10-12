import { AlertsObservationsSection } from './AlertsObservationsSection';

interface LicenseObservationsTabProps {
  licenseId: string;
  activeAlertsCount: number;
}

export function LicenseObservationsTab({ licenseId, activeAlertsCount }: LicenseObservationsTabProps) {
  return (
    <AlertsObservationsSection 
      licenseId={licenseId}
      activeAlertsCount={activeAlertsCount}
    />
  );
}

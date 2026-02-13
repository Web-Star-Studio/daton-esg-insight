import { TreeLoadingScreen } from "@/components/TreeLoadingScreen";

interface EnhancedLoadingProps {
  message?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "spinner" | "pulse";
}

export const EnhancedLoading = (_props: EnhancedLoadingProps) => {
  return <TreeLoadingScreen />;
};

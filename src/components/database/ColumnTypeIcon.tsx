import { Hash, Type, Calendar, Code, ToggleLeft, Key } from 'lucide-react';

interface ColumnTypeIconProps {
  type: string;
  className?: string;
}

export function ColumnTypeIcon({ type, className = "h-4 w-4" }: ColumnTypeIconProps) {
  const iconProps = { className };
  
  switch (type.toUpperCase()) {
    case 'UUID':
      return <Key {...iconProps} />;
    case 'TEXT':
    case 'STRING':
      return <Type {...iconProps} />;
    case 'NUMBER':
      return <Hash {...iconProps} />;
    case 'BOOLEAN':
      return <ToggleLeft {...iconProps} />;
    case 'JSON':
      return <Code {...iconProps} />;
    case 'DATE':
    case 'TIMESTAMP':
      return <Calendar {...iconProps} />;
    default:
      return <Type {...iconProps} />;
  }
}

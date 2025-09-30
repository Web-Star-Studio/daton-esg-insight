import { useState, useCallback } from 'react';

export interface NavSection {
  id: string;
  title: string;
  icon: any;
}

export function useDocumentationNav(sections: NavSection[]) {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    activeSection,
    scrollToSection,
  };
}

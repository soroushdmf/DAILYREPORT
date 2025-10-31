import React from 'react';
import { XIcon } from './icons';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  sections: Section[];
  activeSection: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sections, activeSection, isOpen, setIsOpen }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // offset for the sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 lg:justify-center">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Daily Report</h1>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100">
          <XIcon />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {sections.map(section => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={(e) => handleLinkClick(e, section.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              activeSection === section.id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            {section.icon}
            <span className="flex-1">{section.title}</span>
          </a>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
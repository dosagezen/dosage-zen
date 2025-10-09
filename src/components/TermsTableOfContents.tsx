import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Section {
  id: string;
  title: string;
  level: number;
}

interface TermsTableOfContentsProps {
  content: string;
}

export const TermsTableOfContents = ({ content }: TermsTableOfContentsProps) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    // Extrair seções do markdown
    const lines = content.split('\n');
    const extractedSections: Section[] = [];
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2];
        const id = `section-${index}`;
        extractedSections.push({ id, title, level });
      }
    });
    
    setSections(extractedSections);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Card className="p-4 sticky top-4">
      <h3 className="font-semibold text-sm mb-3 text-foreground">Sumário</h3>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                section.level === 2 ? 'font-medium' : 'pl-4 font-normal'
              } ${
                activeSection === section.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </ScrollArea>
    </Card>
  );
};

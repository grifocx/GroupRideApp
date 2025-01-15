import { useEffect, useState } from "react";

interface Section {
  id: string;
  label: string;
}

const sections: Section[] = [
  { id: "search-section", label: "Search" },
  { id: "map-calendar-section", label: "Map & Calendar" },
  { id: "rides-section", label: "Available Rides" },
];

export function ScrollIndicator() {
  const [activeSection, setActiveSection] = useState<string>("search-section");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-50% 0px -50% 0px", // Consider element in view when it's in the middle
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-2">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => {
            document.getElementById(section.id)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          className={`w-3 h-3 rounded-full transition-all duration-200 ${
            activeSection === section.id
              ? "bg-primary scale-125"
              : "bg-muted hover:bg-muted-foreground"
          }`}
          aria-label={`Scroll to ${section.label}`}
        />
      ))}
    </div>
  );
}

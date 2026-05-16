import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { PageHeroBanner } from "@/components/layout";
import AnimatedStat from "./AnimatedStat";

export type HomeTab = "forms" | "trash";

type Props = {
  activeTab: HomeTab;
  totalForms: number;
  activeForms: number;
  deletedForms: number;
  totalResponses: number;
  onTabChange: (tab: HomeTab) => void;
};

export default function HomeHero({
  activeTab,
  totalForms,
  activeForms,
  deletedForms,
  totalResponses,
  onTabChange,
}: Props) {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-text", {
        opacity: 0,
        y: 20,
        duration: 0.55,
        ease: "power3.out",
      });
      gsap.from(".stat-card", {
        opacity: 0,
        x: 20,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.2,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const tabs: Array<{ key: HomeTab; label: string; count: number }> = [
    { key: "forms", label: "Forms", count: totalForms },
    { key: "trash", label: "Temporary Delete", count: deletedForms },
  ];

  return (
    <PageHeroBanner contentClassName="pt-8 sm:pt-12">
      <div ref={heroRef} className="relative">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-10 pb-6 sm:pb-8">
          <div className="hero-text">
            <p className="text-primary-300 text-sm font-bold mb-1">
              Welcome back
            </p>
            <h1 className="text-[1.75rem] sm:text-[2rem] font-bold text-white leading-tight">
              My Forms
            </h1>
            <p className="text-white text-sm mt-1.5">
              Build, share, and analyze forms with ease.
            </p>
          </div>

          <div className="stat-card flex items-stretch bg-white/10 border border-white/15 rounded-xl backdrop-blur-sm divide-x divide-white/10 w-full sm:w-auto shrink-0">
            <AnimatedStat value={totalForms} label="Total Forms" />
            <AnimatedStat value={activeForms} label="Active" />
            <AnimatedStat value={totalResponses} label="Responses" />
          </div>
        </div>

        <div className="flex -mx-4 sm:-mx-8 px-4 sm:px-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "border-white text-white"
                  : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-white/10 text-white/50"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </PageHeroBanner>
  );
}

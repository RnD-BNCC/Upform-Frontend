import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { PageHeroBanner } from "@/components/layout";
import AnimatedStat from "./AnimatedStat";

type Props = {
  totalForms: number;
  activeForms: number;
  totalResponses: number;
};

export default function HomeHero({
  totalForms,
  activeForms,
  totalResponses,
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

  return (
    <PageHeroBanner contentClassName="py-8 sm:py-12">
      <div ref={heroRef} className="relative">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-10">
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
      </div>
    </PageHeroBanner>
  );
}


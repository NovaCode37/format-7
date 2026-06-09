import RunningBanner from "@/components/RunningBanner";
import CategoryCards from "@/components/CategoryCards";
import HowItWorks from "@/components/HowItWorks";
import TestimonialsWall from "@/components/TestimonialsWall";
import FinalCTA from "@/components/FinalCTA";

export default function HomePage() {
  return (
    <>
      <RunningBanner />
      <CategoryCards />
      <HowItWorks />
      <TestimonialsWall />
      <FinalCTA />
    </>
  );
}

import { useEffect, useRef } from "react";
import { recommendations } from "../data/recommendations";
import RecommendationCard from "./RecommendationCard";

export default function Recommendations() {
  const scrollRef = useRef(null);

  const CARD_WIDTH = 260;
  const GAP = 24; // gap-6
  const SLIDE_BY = CARD_WIDTH + GAP;

  useEffect(() => {
    const interval = setInterval(() => {
      if (!scrollRef.current) return;

      const el = scrollRef.current;

      el.scrollBy({
        left: SLIDE_BY,
        behavior: "smooth",
      });

      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - SLIDE_BY) {
        setTimeout(() => {
          el.scrollTo({ left: 0, behavior: "smooth" });
        }, 500);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    /* OUTER MASK */
    <div className="overflow-hidden">
      {/* ACTUAL SCROLL CONTAINER */}
      <div
        ref={scrollRef}
        className="
          flex gap-6
          overflow-x-scroll scroll-smooth
          max-w-[544px]   /* exactly 2 cards */
          mx-auto
          no-scrollbar
        "
      >
        {recommendations.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

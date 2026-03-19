"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type Props = {
  text: string;
  className?: string;
  staggerMs?: number;
  durationSec?: number;
};

export default function ReactBitsSplitText({
  text,
  className,
  staggerMs = 40,
  durationSec = 0.8,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const letters = Array.from(text);

  useGSAP(
    () => {
      if (!rootRef.current) {
        return;
      }

      gsap.fromTo(
        rootRef.current.querySelectorAll(".rb-letter"),
        { opacity: 0, y: 32, rotateX: -80 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: durationSec,
          ease: "power3.out",
          stagger: staggerMs / 1000,
        },
      );
    },
    { scope: rootRef, dependencies: [text, staggerMs, durationSec] },
  );

  return (
    <div ref={rootRef} className={className} aria-label={text}>
      {letters.map((char, index) => (
        <span key={`${char}-${index}`} className="rb-letter inline-block whitespace-pre">
          {char}
        </span>
      ))}
    </div>
  );
}

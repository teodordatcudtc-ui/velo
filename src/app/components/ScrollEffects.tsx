"use client";

import { useEffect } from "react";

export default function ScrollEffects() {
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    const handleScroll = () => {
      if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );
    document
      .querySelectorAll(".step-card, .feat-card, .testimonial-card, .pricing-card")
      .forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return null;
}

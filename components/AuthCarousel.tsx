'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const slides = [
  {
    id: 1,
    title: 'Eyes on the ground, wherever you are',
    description: 'Errands, property checks, construction supervision, background intel, legal counsel and agency filings in one app.',
    image: '/assets/images/onboarding/onboard1.jpg',
  },
  {
    id: 2,
    title: 'Trusted & Vetted Professionals',
    description: 'Accredited managers and verified experts ensure secure handling of documents',
    image: '/assets/images/onboarding/onboard2.jpg',
  },
  {
    id: 3,
    title: 'Ready to Get Started?',
    description: 'Everything you need, right where you need it.',
    image: '/assets/images/onboarding/onboard3.jpg',
  }
];

export default function AuthCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-lg flex flex-col items-center">
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-(--bg-secondary) rounded-[32px] overflow-hidden shadow-xl mb-12 transition-opacity duration-1000">
        <Image
          src={slides[currentSlide].image}
          alt={slides[currentSlide].title}
          fill
          sizes="(max-width: 1024px) 0vw, 512px"
          className="object-cover transition-transform duration-[5000ms] scale-105 hover:scale-100"
          priority
        />
        {/* Subtle overlay matching design */}
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-center text-center w-full mb-8 min-h-[100px] transition-opacity duration-500">
        <h2 className="text-3xl font-bold text-[var(--text-heading)] mb-4 px-4 leading-tight transition-colors">
          {slides[currentSlide].title}
        </h2>
        <p className="text-[16px] text-[var(--text-body)] leading-relaxed px-6 transition-colors">
          {slides[currentSlide].description}
        </p>
      </div>

      {/* Pagination Dots */}
      <div className="flex gap-2 items-center mt-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === index
              ? 'w-6 bg-[#10A74F]'
              : 'w-2 bg-(--border-color) hover:bg-var(--text-muted)'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

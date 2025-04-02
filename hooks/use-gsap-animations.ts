import { useEffect, useRef } from 'react';
import gsap from 'gsap';

type AnimationTarget = string | Element | Element[] | NodeList;

interface GSAPAnimationOptions {
  fromVars?: gsap.TweenVars;
  toVars?: gsap.TweenVars;
  staggerAmount?: number;
  delay?: number;
  duration?: number;
}

// This hook provides reusable GSAP animations for components
export function useGSAPAnimations() {
  const timeline = useRef<gsap.core.Timeline | null>(null);

  // Reset and create a new timeline
  const createTimeline = () => {
    if (timeline.current) {
      timeline.current.kill();
    }
    timeline.current = gsap.timeline();
    return timeline.current;
  };

  // Fade in animation with Y offset
  const fadeInUp = (
    target: AnimationTarget,
    options: GSAPAnimationOptions = {}
  ) => {
    const tl = timeline.current || createTimeline();
    const {
      fromVars = { opacity: 0, y: 20 },
      toVars = { opacity: 1, y: 0 },
      staggerAmount = 0.05,
      delay = 0,
      duration = 0.5
    } = options;

    tl.fromTo(
      target,
      { ...fromVars },
      { ...toVars, duration, stagger: staggerAmount, ease: "power2.out" },
      delay
    );

    return tl;
  };

  // Staggered reveal animation for lists and tables
  const staggeredReveal = (
    target: AnimationTarget,
    options: GSAPAnimationOptions = {}
  ) => {
    const tl = timeline.current || createTimeline();
    const {
      fromVars = { opacity: 0, y: 10 },
      toVars = { opacity: 1, y: 0 },
      staggerAmount = 0.03,
      delay = 0,
      duration = 0.4
    } = options;

    tl.fromTo(
      target,
      { ...fromVars },
      { ...toVars, duration, stagger: staggerAmount, ease: "power1.out" },
      delay
    );

    return tl;
  };

  // Scale in animation for cards and panels
  const scaleIn = (
    target: AnimationTarget,
    options: GSAPAnimationOptions = {}
  ) => {
    const tl = timeline.current || createTimeline();
    const {
      fromVars = { opacity: 0, scale: 0.95 },
      toVars = { opacity: 1, scale: 1 },
      staggerAmount = 0.05,
      delay = 0,
      duration = 0.5
    } = options;

    tl.fromTo(
      target,
      { ...fromVars },
      { ...toVars, duration, stagger: staggerAmount, ease: "back.out(1.2)" },
      delay
    );

    return tl;
  };

  // Number counter animation
  const animateNumber = (
    target: Element,
    startValue: number,
    endValue: number,
    duration = 1.5
  ) => {
    const tl = timeline.current || createTimeline();

    tl.to(target, {
      innerText: endValue,
      duration,
      snap: { innerText: 1 },
      ease: "power2.out"
    });

    return tl;
  };

  // Clean up animation timeline on unmount
  useEffect(() => {
    return () => {
      if (timeline.current) {
        timeline.current.kill();
        timeline.current = null;
      }
    };
  }, []);

  return {
    timeline,
    createTimeline,
    fadeInUp,
    staggeredReveal,
    scaleIn,
    animateNumber
  };
}

"use client";

import React, { useRef, useEffect } from 'react';
import AppSkeleton from '@/components/app-skeleton';
import Navbar from '@/components/navbar';
import { Card } from '@/components/ui/card';
import GlobalErrorBoundary from '@/components/global-error-boundary';
import { useGSAPAnimations } from '@/hooks/use-gsap-animations';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TerminalAnimation } from '@/components/about/terminal-animation';

// Register the ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutPage() {
  const { fadeInUp, staggeredReveal, scaleIn } = useGSAPAnimations();

  // Refs for animated elements
  const headerRef = useRef(null);
  const descriptionRef = useRef(null);
  const featuresRef = useRef(null);
  const featureItemsRef = useRef<HTMLDivElement[]>([]);
  const teamRef = useRef(null);
  const teamItemsRef = useRef<HTMLDivElement[]>([]);
  const visionRef = useRef(null);
  const metricsRef = useRef<HTMLDivElement[]>([]);
  const terminalRef = useRef(null);

  // Animation setup after mount
  useEffect(() => {
    // Header animation
    fadeInUp(headerRef.current);

    // Description animation
    fadeInUp(descriptionRef.current, { delay: 0.2 });

    // Features section animation
    fadeInUp(featuresRef.current, { delay: 0.3 });
    staggeredReveal(featureItemsRef.current);

    // Team section animation
    scaleIn(teamRef.current, { delay: 0.1 });

    // Terminal section animation
    gsap.from(terminalRef.current, {
      scrollTrigger: {
        trigger: terminalRef.current,
        start: "top 75%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: "power3.out"
    });

    // Scroll trigger animations for metrics
    gsap.from(metricsRef.current, {
      scrollTrigger: {
        trigger: metricsRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out"
    });

    // Vision animation with scroll trigger
    gsap.from(visionRef.current, {
      scrollTrigger: {
        trigger: visionRef.current,
        start: "top 70%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: "back.out(1.7)"
    });

    // Team items animation with scroll trigger
    gsap.from(teamItemsRef.current, {
      scrollTrigger: {
        trigger: teamItemsRef.current[0],
        start: "top 80%",
        toggleActions: "play none none none"
      },
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: "power3.out"
    });
  }, [fadeInUp, staggeredReveal, scaleIn]);

  // Features data
  const features = [
    {
      title: "Multi-Chain Integration",
      description: "Connect to multiple blockchains simultaneously with real-time data monitoring and seamless switching.",
      icon: "🔄"
    },
    {
      title: "Advanced DEX Aggregation",
      description: "Find the best prices across multiple DEXs with smart routing to minimize slippage and maximize returns.",
      icon: "💹"
    },
    {
      title: "Terminal-Style Interface",
      description: "Professional trading environment designed for power users with command-line efficiency.",
      icon: "💻"
    },
    {
      title: "Real-Time Analytics",
      description: "Monitor blockchain health, gas prices, transaction volumes, and market indicators in real-time.",
      icon: "📊"
    },
    {
      title: "Security Focused",
      description: "Built with security-first principles, featuring network security ratings and smart contract audits.",
      icon: "🔒"
    },
    {
      title: "Custom Alerts",
      description: "Set price alerts, gas notifications, and transaction confirmations customized to your needs.",
      icon: "🔔"
    }
  ];

  // Team members data
  const teamMembers = [
    {
      name: "Sarah Chen",
      role: "Lead Protocol Engineer",
      description: "Expert in cross-chain infrastructure with 6+ years experience in DeFi protocols."
    },
    {
      name: "Marcus Williams",
      role: "Front-End Architect",
      description: "Specializing in React and Web3 interfaces with a focus on professional trading experiences."
    },
    {
      name: "Eliana Rodriguez",
      role: "Security Researcher",
      description: "Former blockchain security auditor ensuring all smart contract interactions remain secure."
    },
    {
      name: "Raj Patel",
      role: "Data Science Lead",
      description: "Building real-time analytics systems to provide traders with actionable market insights."
    }
  ];

  // Metrics data
  const metrics = [
    { value: "12+", label: "Blockchains Supported" },
    { value: "200K+", label: "Trades Executed" },
    { value: "$45M+", label: "Trading Volume" },
    { value: "10K+", label: "Active Users" }
  ];

  return (
    <GlobalErrorBoundary componentName="About Page">
      <div className="min-h-screen bg-black">
        <Navbar />
        <AppSkeleton>
          <div className="container py-6 mt-16">
            {/* Header */}
            <div className="mb-12 text-center" ref={headerRef}>
              <h1 className="text-4xl md:text-5xl font-bold font-mono uppercase tracking-wider mb-4">D-UNIX DEX</h1>
              <p className="text-xl text-white/70 md:w-3/4 mx-auto">
                A multi-chain decentralized exchange protocol built for professional traders
              </p>
            </div>

            {/* Description */}
            <div
              className="mb-16 px-4 py-6 bg-white/5 border border-white/10 rounded-md"
              ref={descriptionRef}
            >
              <p className="text-lg leading-relaxed">
                D-UNIX is a terminal-inspired decentralized exchange that focuses on providing advanced
                traders with professional-grade tools across multiple blockchains. Our vision is to create
                a unified trading experience that combines the security of decentralized finance with the
                efficiency and feature set of professional trading terminals.
              </p>
            </div>

            {/* Terminal Animation */}
            <div className="mb-20" ref={terminalRef}>
              <h2 className="text-3xl font-bold mb-8 font-mono border-b border-white/10 pb-2">SYSTEM TERMINAL</h2>
              <TerminalAnimation />
            </div>

            {/* Features */}
            <div className="mb-20" ref={featuresRef}>
              <h2 className="text-3xl font-bold mb-8 font-mono border-b border-white/10 pb-2">CORE FEATURES</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <Card
                    key={feature.title}
                    className="p-6 bg-gradient-to-br from-black to-gray-900 border border-white/10 hover:border-white/20 transition-all duration-300"
                    ref={el => featureItemsRef.current[index] = el as HTMLDivElement}
                  >
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-2 font-mono">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="mb-20 py-10 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {metrics.map((metric, index) => (
                  <div
                    key={metric.label}
                    className="p-4"
                    ref={el => metricsRef.current[index] = el as HTMLDivElement}
                  >
                    <p className="text-3xl md:text-4xl font-bold text-white mb-2">{metric.value}</p>
                    <p className="text-sm text-white/60">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vision */}
            <div
              className="mb-20 p-8 bg-black border border-green-500/20 rounded-md"
              ref={visionRef}
            >
              <h2 className="text-3xl font-bold mb-6 font-mono text-green-500">OUR VISION</h2>
              <div className="text-lg leading-relaxed">
                <p className="mb-4">
                  We're building the future of decentralized trading infrastructure, where professional
                  traders can access all major blockchain ecosystems through a single, unified interface.
                </p>
                <p>
                  D-UNIX aims to be the Bloomberg Terminal of DeFi - providing institutional-grade tools,
                  security, and performance while maintaining the core ethos of decentralization and self-custody.
                </p>
              </div>
            </div>

            {/* Team */}
            <div className="mb-20" ref={teamRef}>
              <h2 className="text-3xl font-bold mb-8 font-mono border-b border-white/10 pb-2">TEAM</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamMembers.map((member, index) => (
                  <Card
                    key={member.name}
                    className="p-6 bg-black border border-white/10"
                    ref={el => teamItemsRef.current[index] = el as HTMLDivElement}
                  >
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-green-500 mb-3 text-sm">{member.role}</p>
                    <p className="text-gray-400">{member.description}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Terminal Footer */}
            <div className="border border-white/10 p-4 rounded-md bg-black font-mono">
              <div className="text-green-500 text-sm">
                <p>> D-UNIX VERSION: 1.3.5</p>
                <p>> STATUS: OPERATIONAL</p>
                <p>> READY FOR INSTRUCTIONS</p>
              </div>
            </div>
          </div>
        </AppSkeleton>
      </div>
    </GlobalErrorBoundary>
  );
}

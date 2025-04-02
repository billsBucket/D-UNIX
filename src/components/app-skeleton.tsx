"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';

interface AppSkeletonProps {
  children: React.ReactNode;
}

// Create a custom blinking cursor component
const BlinkingCursor = () => {
  return (
    <span
      className="inline-block text-white"
      style={{
        animation: "blink 1s step-start infinite",
        opacity: 0.9,
        marginLeft: '2px',
        fontWeight: 'bold',
        textShadow: '0 0 5px rgba(255, 255, 255, 0.5)'
      }}
    >
      _
    </span>
  );
};

// Loading indicator animation
const LoadingIndicator = () => {
  return (
    <div className="loading-indicator">
      <div className="loading-indicator-inner"></div>
    </div>
  );
};

export default function AppSkeleton({ children }: AppSkeletonProps) {
  // Client-side only state to prevent hydration errors
  const [mounted, setMounted] = useState(false);
  const [bootMessages, setBootMessages] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [bootPhase, setBootPhase] = useState<'initial' | 'centered-loading' | 'app-loaded' | 'terminal-boot'>('initial');
  const [loadingMessage, setLoadingMessage] = useState("Connecting to blockchain nodes...");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use useMemo to prevent recreating the arrays on every render
  const systemBootSequence = useMemo(() => [
    '> INITIALIZING SYSTEM KERNEL v2.3.7...',
    '> LOADING SYSTEM MODULES: CORE/16 OK',
    '> ESTABLISHING SECURE CONNECTION TO NETWORK...',
    '> PREPARING MEMORY ALLOCATOR: 64MB RESERVED',
    '> MOUNTING VIRTUAL FILESYSTEM...',
    '> VERIFYING SYSTEM INTEGRITY: HASH VALID',
    '> LOADING NETWORK INTERFACES: ETH0/1 UP',
    '> ESTABLISHING SECURE CONNECTION TO MAINNET: CONNECTED',
    '> RUNNING SYSTEM DIAGNOSTICS: ALL CHECKS PASSED',
    '> SYSTEM TIME SYNC: UTC 10:12:37 PM',
    '> ALL SYSTEMS OPERATIONAL AND SECURE',
    '> STARTING D-UNIX v1.3.5 SERVICES...',
  ], []);

  const dexBootSequence = useMemo(() => [
    '> D-UNIX SYSTEM STARTING',
    '',
    '> loading token registry from api.0x.org...',
    '> scanning liquidity sources: uniswap, curve, balancer...',
    '> initializing route optimizer v2.1.4...',
    '> establishing secure websocket connections...',
    '> gas price monitor activated...',
    '> loading smart contract interfaces...',
    '> verifying cryptographic modules...',
    '> connecting to mainnet nodes...',
    '> initializing cross-chain bridges...',
    '> loading user preference module...',
    '> initializing permit2 signature validator...',
    '> DEX interface ready',
    '> awaiting user input...',
    '> status: operational',
    '> security protocols active',
    '> transaction monitoring initialized',
    '> ready for instructions',
  ], []);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [bootMessages, currentMessage]);

  // Set mounted state after initial render to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to start terminal boot sequence in the background
  const startTerminalBoot = () => {
    let currentIndex = 0;
    let charIndex = 0;
    let timeout: NodeJS.Timeout;
    const currentSequence = [...systemBootSequence, ...dexBootSequence];

    const typeNextMessage = () => {
      if (currentIndex < currentSequence.length) {
        const message = currentSequence[currentIndex];

        if (charIndex < message.length) {
          setCurrentMessage(prevMsg => prevMsg + message[charIndex]);
          charIndex++;

          // Vary the typing speed for more authenticity
          const baseSpeed = Math.random() * 10 + 5;
          // Slow down for special characters
          const typingSpeed = message[charIndex - 1]?.match(/[.:/>]/i) ? baseSpeed * 2 : baseSpeed;
          timeout = setTimeout(typeNextMessage, typingSpeed);
        } else {
          setBootMessages(prev => [...prev, message]);
          setCurrentMessage('');
          charIndex = 0;
          currentIndex++;

          // After all boot messages are complete
          if (currentIndex === currentSequence.length) {
            setShowCursor(false);
          }

          // Add random variance to message display timing for authenticity
          const messageDelay = currentIndex % 3 === 0 ? 200 :
                             currentIndex % 2 === 0 ? 120 : 80;

          timeout = setTimeout(typeNextMessage, messageDelay);
        }
      }
    };

    // Start typing with a short delay
    timeout = setTimeout(typeNextMessage, 300);

    // Cleanup
    return () => clearTimeout(timeout);
  };

  // Handles the centered loading screen sequence
  useEffect(() => {
    if (!mounted) return;

    // Start with centered loading screen
    setBootPhase('centered-loading');

    // Check if we're on the analytics page or other special pages where we want to skip the terminal
    const isAnalyticsPage = typeof window !== 'undefined' &&
                           (window.location.pathname.includes('/analytics') ||
                            window.location.pathname.includes('/health') ||
                            window.location.pathname.includes('/alerts') ||
                            window.location.pathname.includes('/network-status') ||
                            window.location.pathname.includes('/network-health') ||
                            window.location.pathname.includes('/about'));

    // Speed up the loading for analytics pages
    const loadingSpeed = isAnalyticsPage ? 30 : 120;

    // Simulate loading progress
    const loadingInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const next = prev + Math.floor(Math.random() * 5) + (isAnalyticsPage ? 8 : 1);

        // Update loading messages based on progress
        if (next > 30 && next < 40) {
          setLoadingMessage("Initializing protocol...");
        } else if (next > 60 && next < 70) {
          setLoadingMessage("Loading blockchain data...");
        } else if (next > 85) {
          setLoadingMessage("Preparing interface...");
        }

        // When loading reaches 100%, show the main app interface
        if (next >= 100) {
          clearInterval(loadingInterval);
          setTimeout(() => {
            setBootPhase('app-loaded');

            // Only start terminal boot for main page or DEX
            if (!isAnalyticsPage) {
              setTimeout(() => {
                setBootPhase('terminal-boot');
                startTerminalBoot();
              }, 500);
            }
          }, 200);
          return 100;
        }

        return next;
      });
    }, loadingSpeed);

    return () => clearInterval(loadingInterval);
  }, [mounted]);

  // Don't render anything during server-side rendering to prevent hydration mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Centered loading screen */}
      {bootPhase === 'centered-loading' && (
        <div className="loading-screen">
          <div className="loading-container">
            <h2 className="text-2xl mb-8">D-UNIX</h2>

            <div className="mb-6">
              <LoadingIndicator />
            </div>

            <div className="text-sm tracking-wide mb-4">
              {loadingMessage}
            </div>

            <div className="loading-progress-bar">
              <div
                className="loading-progress-fill"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>

            <div className="loading-system-text">
              SYSTEM LOADING
              <span className="ml-8 text-white">■</span>
            </div>
          </div>
        </div>
      )}

      {/* Terminal background with boot messages - only visible after app is loaded */}
      {bootPhase === 'terminal-boot' && (
        <div className="terminal-bg">
          {/* Scanlines effect for authentic terminal look */}
          <div className="terminal-scanlines"></div>

          <div className="space-y-0.5 text-white/70 relative z-10">
            {bootMessages.map((msg, index) => {
              // Handle empty lines
              if (msg === '') {
                return <div key={index} className="h-2"></div>;
              }

              // Special styling for the DEX starting header
              if (msg === '> D-UNIX SYSTEM STARTING') {
                return (
                  <div key={index} className="whitespace-nowrap terminal-message text-white/90 font-bold">
                    {msg}
                  </div>
                );
              }

              // Apply different styling to system boot vs dex boot messages
              const isSystemBoot = index < systemBootSequence.length;
              return (
                <div
                  key={index}
                  className={`whitespace-nowrap terminal-message ${isSystemBoot ? 'system-boot-message' : 'dex-boot-message'}`}
                >
                  {msg}
                </div>
              );
            })}
            {currentMessage && (
              <div
                className={`whitespace-nowrap terminal-message ${bootMessages.length < systemBootSequence.length ? 'system-boot-message' : 'dex-boot-message'}`}
              >
                {currentMessage}
                {showCursor && <BlinkingCursor />}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Main content - only visible after loading is complete */}
      <div
        className={`relative transition-all duration-500 ${bootPhase === 'app-loaded' || bootPhase === 'terminal-boot' ? 'opacity-100 z-10' : 'opacity-0'}`}
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import gsap from 'gsap';

export function TerminalAnimation() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const commandOutputRef = useRef<HTMLDivElement>(null);

  // Terminal typing animation
  useEffect(() => {
    if (!commandOutputRef.current) return;

    const commands = [
      { command: 'initialize system', output: 'System initialized. D-UNIX core loaded.' },
      { command: 'connect blockchain', output: 'Connected to Ethereum mainnet. Node status: active.' },
      { command: 'load price feed', output: 'Price oracle feed active. Market data streaming...' },
      { command: 'check system integrity', output: 'System integrity check: PASSED\nAll security protocols active.' },
      { command: 'display stats', output: 'D-UNIX Statistics:\n- Version: 1.3.5\n- Connected networks: 12\n- Active nodes: 187\n- System uptime: 99.98%' },
      { command: 'help', output: 'D-UNIX CLI Help:\n- swap <token> <token> <amount>\n- bridge <amount> <chain>\n- analyze <pair>\n- alerts set <condition>' }
    ];

    // Clear terminal
    commandOutputRef.current.innerHTML = '';

    // Type each command and output
    const typeCommand = (index = 0) => {
      if (index >= commands.length) return;

      const commandEl = document.createElement('div');
      commandEl.className = 'terminal-command';
      commandEl.innerHTML = `<span class="text-blue-400">dunix@system</span><span class="text-gray-400">:</span><span class="text-purple-400">~$</span> `;
      commandOutputRef.current?.appendChild(commandEl);

      const cmdText = commands[index].command;
      const outputText = commands[index].output;
      let charIndex = 0;

      // Type the command character by character
      const typeCommandInterval = setInterval(() => {
        if (charIndex < cmdText.length) {
          commandEl.innerHTML += cmdText[charIndex];
          charIndex++;
        } else {
          clearInterval(typeCommandInterval);

          // Add a small delay before showing output
          setTimeout(() => {
            const outputEl = document.createElement('div');
            outputEl.className = 'terminal-output text-green-400 mb-4';
            outputEl.innerText = outputText;

            // Add output with initial opacity 0
            outputEl.style.opacity = '0';
            commandOutputRef.current?.appendChild(outputEl);

            // Fade in the output
            gsap.to(outputEl, {
              opacity: 1,
              duration: 0.4,
              onComplete: () => {
                // Once output is shown, start the next command after a delay
                setTimeout(() => typeCommand(index + 1), 800);
              }
            });
          }, 300);
        }
      }, 50 + Math.random() * 30);
    };

    // Start typing with initial delay
    setTimeout(() => typeCommand(), 600);

    // Blinking cursor animation
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.innerHTML = '█';
    commandOutputRef.current.appendChild(cursor);

    gsap.to(cursor, {
      opacity: 0,
      repeat: -1,
      yoyo: true,
      duration: 0.7
    });

    return () => {
      // Clean up any timers or animations
    };
  }, []);

  return (
    <Card className="relative overflow-hidden bg-black border border-green-500/20 rounded-md">
      {/* Terminal interface */}
      <div
        ref={terminalRef}
        className="relative z-10 p-6 h-[400px] overflow-auto bg-black"
      >
        {/* Terminal header */}
        <div className="flex items-center mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <div className="flex-1 text-center text-xs text-white/50">D-UNIX TERMINAL</div>
        </div>

        {/* Terminal content */}
        <div
          ref={commandOutputRef}
          className="font-mono text-sm leading-loose"
        >
          {/* Command and output will be added dynamically */}
        </div>
      </div>
    </Card>
  );
}

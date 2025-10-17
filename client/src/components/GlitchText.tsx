import { useEffect, useState } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
  trigger?: boolean;
}

export function GlitchText({ text, className = "", trigger = true }: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsGlitching(true);
      const timer = setTimeout(() => setIsGlitching(false), 300);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className={`relative ${className}`}>
      <span 
        className={`relative inline-block ${isGlitching ? "animate-glitch" : ""}`}
        style={{
          textShadow: isGlitching 
            ? "2px 0 #00ffff, -2px 0 #ff00ff" 
            : "none"
        }}
      >
        {text}
      </span>
    </div>
  );
}

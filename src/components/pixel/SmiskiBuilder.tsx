"use client";

/**
 * Animated pixel-art Smiski typing on a laptop.
 * Big round blob head peeking over an open laptop, little arms on the sides.
 */
export function SmiskiBuilder() {
  return (
    <div className="flex items-center justify-center">
      <svg
        width="144"
        height="144"
        viewBox="2 0 28 22"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: "pixelated" }}
      >
        {/* === SMISKI HEAD — big round blob === */}
        <g>
          {/* Gentle head bob while "typing" */}
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-0.4; 0,0; 0,-0.2; 0,0"
            dur="1.8s"
            repeatCount="indefinite"
          />

          {/* Head shape — circle */}
          <rect x="13" y="0" width="6" height="1" fill="#c8d484" />
          <rect x="12" y="1" width="8" height="1" fill="#d2de8e" />
          <rect x="11" y="2" width="10" height="1" fill="#d8e296" />
          <rect x="10" y="3" width="12" height="1" fill="#dde8a0" />
          <rect x="10" y="4" width="12" height="1" fill="#e2ecaa" />
          <rect x="10" y="5" width="12" height="1" fill="#e5efb0" />
          <rect x="10" y="6" width="12" height="1" fill="#e5efb0" />
          <rect x="10" y="7" width="12" height="1" fill="#e2ecaa" />
          <rect x="10" y="8" width="12" height="1" fill="#dde8a0" />
          <rect x="11" y="9" width="10" height="1" fill="#d8e296" />
          <rect x="12" y="10" width="8" height="1" fill="#d2de8e" />
          <rect x="13" y="11" width="6" height="1" fill="#c8d484" />

          {/* Highlight / shine on head (top-left) */}
          <rect x="13" y="2" width="2" height="1" fill="#eef5c0" opacity="0.7" />
          <rect x="12" y="3" width="2" height="1" fill="#eef5c0" opacity="0.5" />
          <rect x="11" y="4" width="1" height="1" fill="#eef5c0" opacity="0.3" />

          {/* Eyes — two dots */}
          <rect x="13" y="7" width="1" height="1" fill="#3a3a3a" />
          <rect x="18" y="7" width="1" height="1" fill="#3a3a3a" />

          {/* Blush — soft pink on cheeks */}
          <rect x="11" y="8" width="2" height="1" fill="#f5c4b8" opacity="0.45" />
          <rect x="19" y="8" width="2" height="1" fill="#f5c4b8" opacity="0.45" />

          {/* Mouth — tiny neutral line */}
          <rect x="15" y="9" width="2" height="1" fill="#a8b86c" />
        </g>

        {/* === LAPTOP === */}
        {/* Screen back (facing viewer) — starts right under head */}
        <rect x="9" y="11" width="14" height="1" fill="#4a6b50" />
        <rect x="9" y="12" width="14" height="1" fill="#6B8F71" />
        <rect x="9" y="13" width="14" height="1" fill="#6B8F71" />
        <rect x="9" y="14" width="14" height="1" fill="#6B8F71" />
        <rect x="9" y="15" width="14" height="1" fill="#6B8F71" />
        <rect x="9" y="16" width="14" height="1" fill="#4a6b50" />

        {/* Small logo on laptop back */}
        <rect x="15" y="13" width="2" height="2" fill="#7da882" opacity="0.6" />

        {/* Laptop base / keyboard */}
        <rect x="8" y="17" width="16" height="1" fill="#606060" />
        <rect x="8" y="18" width="16" height="1" fill="#8D8D8D" />
        <rect x="8" y="19" width="16" height="1" fill="#7a7a7a" />
        <rect x="8" y="20" width="16" height="1" fill="#606060" />

        {/* Keyboard detail lines */}
        <rect x="9" y="18" width="3" height="1" fill="#9a9a9a" opacity="0.5" />
        <rect x="13" y="18" width="3" height="1" fill="#9a9a9a" opacity="0.5" />
        <rect x="17" y="18" width="3" height="1" fill="#9a9a9a" opacity="0.5" />
        <rect x="10" y="19" width="5" height="1" fill="#9a9a9a" opacity="0.4" />
        <rect x="16" y="19" width="4" height="1" fill="#9a9a9a" opacity="0.4" />

        {/* === ARMS on sides of laptop === */}
        {/* Left arm */}
        <rect x="7" y="12" width="2" height="1" fill="#dde8a0" />
        <rect x="7" y="13" width="2" height="1" fill="#d2de8e" />
        <rect x="8" y="14" width="1" height="1" fill="#c8d484" />

        {/* Right arm */}
        <rect x="23" y="12" width="2" height="1" fill="#dde8a0" />
        <rect x="23" y="13" width="2" height="1" fill="#d2de8e" />
        <rect x="23" y="14" width="1" height="1" fill="#c8d484" />

        {/* === TYPING INDICATORS — little dots that blink === */}
        <rect x="12" y="10" width="1" height="1" fill="#A8D8EA" opacity="0.8">
          <animate
            attributeName="opacity"
            values="0;0.8;0"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="16" y="10" width="1" height="1" fill="#C5D86D" opacity="0.8">
          <animate
            attributeName="opacity"
            values="0;0.8;0"
            dur="0.8s"
            begin="0.25s"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="20" y="10" width="1" height="1" fill="#F4845F" opacity="0.8">
          <animate
            attributeName="opacity"
            values="0;0.8;0"
            dur="0.8s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        </rect>

        {/* === SPARKLES === */}
        <g opacity="0.7">
          <animate
            attributeName="opacity"
            values="0;0.7;0"
            dur="2s"
            repeatCount="indefinite"
          />
          <rect x="4" y="4" width="1" height="3" fill="#C5D86D" />
          <rect x="3" y="5" width="3" height="1" fill="#C5D86D" />
        </g>

        <g opacity="0.7">
          <animate
            attributeName="opacity"
            values="0;0.7;0"
            dur="2.4s"
            begin="0.8s"
            repeatCount="indefinite"
          />
          <rect x="27" y="3" width="1" height="3" fill="#A8D8EA" />
          <rect x="26" y="4" width="3" height="1" fill="#A8D8EA" />
        </g>

        <rect x="4" y="14" width="1" height="1" fill="#F4845F" opacity="0.6">
          <animate
            attributeName="opacity"
            values="0.6;0;0.6"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="27" y="15" width="1" height="1" fill="#C5D86D" opacity="0.6">
          <animate
            attributeName="opacity"
            values="0;0.6;0"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
    </div>
  );
}

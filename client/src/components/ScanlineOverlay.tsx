export function ScanlineOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg opacity-[0.03]">
      <div 
        className="absolute inset-0 animate-scanline"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 4px)"
        }}
      />
    </div>
  );
}

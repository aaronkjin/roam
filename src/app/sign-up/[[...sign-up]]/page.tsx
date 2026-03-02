import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-milk flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative pixel grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#3D5A80 1px, transparent 1px), linear-gradient(90deg, #3D5A80 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Decorative corner blocks */}
      <div className="absolute top-6 left-6 w-4 h-4 bg-jam border-[2px] border-night" />
      <div className="absolute top-6 left-12 w-4 h-4 bg-grass border-[2px] border-night" />
      <div className="absolute top-12 left-6 w-4 h-4 bg-mist border-[2px] border-night" />

      <div className="absolute bottom-6 right-6 w-4 h-4 bg-grass border-[2px] border-night" />
      <div className="absolute bottom-6 right-12 w-4 h-4 bg-jam border-[2px] border-night" />
      <div className="absolute bottom-12 right-6 w-4 h-4 bg-sky border-[2px] border-night" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-grass border-[3px] border-night pixel-shadow flex items-center justify-center">
              <span className="font-[family-name:var(--font-press-start)] text-white text-xs">
                R
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-press-start)] text-night text-xl tracking-wider">
              ROAM
            </h1>
          </div>
          <p className="font-[family-name:var(--font-silkscreen)] text-rock text-sm uppercase tracking-wider">
            Travel Planning for Adventurers
          </p>
        </div>

        {/* Clerk sign-up component */}
        <SignUp
          appearance={{
            elements: {
              footerAction: "justify-center",
            },
          }}
        />

        {/* Footer tagline */}
        <p className="mt-8 text-[10px] font-[family-name:var(--font-silkscreen)] text-rock/50 uppercase tracking-widest">
          Collect inspo &bull; Generate itineraries &bull; Explore
        </p>
      </div>
    </div>
  );
}

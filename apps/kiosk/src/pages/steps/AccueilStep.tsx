import type { StepProps } from "../../types/kiosk";

export function AccueilStep({ resolved, dispatch }: StepProps) {
  return (
    <div
      className="fixed inset-0 cursor-pointer select-none"
      onClick={() => dispatch({ type: "SET_STEP", step: "order_type" })}
    >
      {resolved.welcomeVideoUrl ? (
        <video
          src={resolved.welcomeVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : resolved.welcomeImageUrl ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${resolved.welcomeImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: resolved.backgroundColor }} />
      )}

      {resolved.logoUrl && (
        <div className="absolute top-12 inset-x-0 flex justify-center pointer-events-none">
          <img
            src={resolved.logoUrl}
            alt={resolved.tenantName}
            className="h-28 object-contain drop-shadow-lg"
          />
        </div>
      )}

      <div className="absolute bottom-20 inset-x-0 flex justify-center pointer-events-none">
        <div
          className="px-16 py-6 text-2xl font-bold rounded-2xl animate-pulse shadow-2xl"
          style={{ backgroundColor: resolved.primaryColor, color: "#000000" }}
        >
          Appuyez pour commander
        </div>
      </div>
    </div>
  );
}

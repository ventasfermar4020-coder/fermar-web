import Image from "next/image";

type FloatingLogo = {
  src: string;
  alt: string;
  position: string;
  size: string;
  anim: string;
  mobile: boolean; // show on small screens
};

const LOGOS: FloatingLogo[] = [
  // Left side
  { src: "/logos/barbie_clean.png", alt: "Barbie", position: "left-[2%] top-[14%]", size: "w-12 md:w-16", anim: "animate-float-a", mobile: true },
  { src: "/logos/hot_wheels_clean.png", alt: "Hot Wheels", position: "left-[12%] bottom-[8%]", size: "w-14 md:w-20", anim: "animate-float-b", mobile: false },
  { src: "/logos/marvel_clean.png", alt: "Marvel", position: "left-[20%] top-[6%]", size: "w-12 md:w-16", anim: "animate-float-c", mobile: false },
  { src: "/logos/playmobil_clean.png", alt: "Playmobil", position: "left-[1%] bottom-[20%]", size: "w-12 md:w-16", anim: "animate-float-b", mobile: true },
  // Right side
  { src: "/logos/fisher_price_clean.png", alt: "Fisher-Price", position: "right-[2%] top-[12%]", size: "w-14 md:w-20", anim: "animate-float-c", mobile: true },
  { src: "/logos/matchbox_clean.png", alt: "Matchbox", position: "right-[14%] bottom-[6%]", size: "w-12 md:w-16", anim: "animate-float-a", mobile: false },
  { src: "/logos/play_doh_clean.png", alt: "Play-Doh", position: "right-[20%] top-[8%]", size: "w-12 md:w-16", anim: "animate-float-b", mobile: false },
  { src: "/logos/majito_clean.png", alt: "Majito", position: "right-[1%] bottom-[18%]", size: "w-12 md:w-16", anim: "animate-float-a", mobile: true },
];

export default function FloatingLogos() {
  return (
    <div className="relative mb-6 h-[160px] md:h-[220px] overflow-hidden">
      {/* Floating brand logos */}
      {LOGOS.map((logo) => (
        <div
          key={logo.src}
          className={`absolute z-0 pointer-events-none select-none opacity-75 ${logo.position} ${logo.size} ${logo.anim} ${
            logo.mobile ? "" : "hidden md:block"
          }`}
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={80}
            height={80}
            className="w-full h-auto object-contain"
          />
        </div>
      ))}

      {/* Centered fermar logo */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Image
          src="/fermar-logo.png"
          alt="Fermar"
          width={300}
          height={70}
          className="object-contain rounded-2xl"
          priority
        />
      </div>
    </div>
  );
}

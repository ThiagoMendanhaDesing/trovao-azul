
import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

export default function Logo({
  size = 40,
  className = "",
}: LogoProps) {
  return (
    <Image
      src="/logo-trovao-azul.svg"
      alt="Trovão Azul"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

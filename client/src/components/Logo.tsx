import logoImage from "@assets/foodyflow_no_written_1758723439658.png";

interface LogoProps {
  className?: string;
  surface?: "background" | "card";
}

export default function Logo({ className = "h-12 w-auto", surface = "card" }: LogoProps) {
  return (
    <img
      src={logoImage}
      alt="FoodyFlow logo"
      className={className}
      data-testid="img-logo"
    />
  );
}
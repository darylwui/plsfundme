interface SingpassIconProps {
  className?: string;
}

export function SingpassIcon({ className }: SingpassIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Singpass"
      role="img"
      className={className}
    >
      <rect width="24" height="24" rx="5" fill="#C8102E" />
      <circle cx="12" cy="9" r="2.75" fill="white" />
      <path d="M12 13.5C8.4 13.5 5.5 16 5.5 19H18.5C18.5 16 15.6 13.5 12 13.5Z" fill="white" />
    </svg>
  );
}

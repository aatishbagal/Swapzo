import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold md:text-2xl">
      <Image
        src="/assets/Swapzo-logo_V1.png" // Use public path
        alt="SwapZo Logo"
        width={32}
        height={32}
        className="h-8 w-8"
        priority 
      />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">SwapZo</span>
    </Link>
  );
}

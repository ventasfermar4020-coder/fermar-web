"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthNavLinks() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (session?.user) {
    return (
      <>
        <Link
          href="/account/orders"
          className="text-[#676767] text-sm font-medium tracking-[0.5em] hover:text-[#212B36] transition-colors cursor-pointer"
        >
          MIS PEDIDOS
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-[#676767] text-sm font-medium tracking-[0.5em] hover:text-[#EC2A2A] transition-colors cursor-pointer"
        >
          SALIR
        </button>
      </>
    );
  }

  return (
    <Link
      href="/login"
      className="text-[#676767] text-sm font-medium tracking-[0.5em] hover:text-[#212B36] transition-colors cursor-pointer"
    >
      MI CUENTA
    </Link>
  );
}

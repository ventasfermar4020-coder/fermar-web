"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { navButtonClass, navButtonDangerClass } from "./navButton";

export default function AuthNavLinks() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (session?.user) {
    return (
      <>
        <Link href="/account/orders" className={navButtonClass}>
          MIS PEDIDOS
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={navButtonDangerClass}
        >
          SALIR
        </button>
      </>
    );
  }

  return (
    <Link href="/login" className={navButtonClass}>
      MI CUENTA
    </Link>
  );
}

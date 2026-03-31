import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { database } from "@/src/db";
import { users, orders } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existing] = await database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo electrónico" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const [user] = await database
      .insert(users)
      .values({ name, email, phone, passwordHash })
      .returning();

    // Auto-link existing guest orders to this new account
    await database
      .update(orders)
      .set({ userId: user.id })
      .where(eq(orders.contactEmail, email));

    return NextResponse.json({
      message: "Cuenta creada exitosamente",
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}

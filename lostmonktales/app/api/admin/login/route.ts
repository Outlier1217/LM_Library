
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/admin-auth";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (
      !email ||
      !password ||
      email.length > 254 ||
      password.length > 1024
    ) {
      return NextResponse.json(
        { error: "Enter a valid email and password." },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (
      !admin ||
      !admin.isActive ||
      !(await bcrypt.compare(password, admin.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await createAdminSession(admin.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login failed:", error);

    return NextResponse.json(
      { error: "Unable to log in right now. Check server configuration." },
      { status: 500 }
    );
  }
}

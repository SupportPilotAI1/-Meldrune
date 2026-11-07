"use server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
export async function register(form: FormData) {
 const name=String(form.get("name")||"").trim(), business=String(form.get("business")||"").trim();
 const email=String(form.get("email")||"").toLowerCase().trim(), password=String(form.get("password")||"");
 if(!name||!business||!email||password.length<8) throw new Error("Please complete all fields. Password must be at least 8 characters.");
 const user=await db.user.create({data:{name,email,passwordHash:await hash(password,12),workspace:{create:{name:business}}}});
 await signIn("credentials",{email,password,redirectTo:"/app"});
 redirect("/app");
}

"use server";
import { auth } from "@/lib/auth";import { db } from "@/lib/db";import { revalidatePath } from "next/cache";
export async function saveSetup(form:FormData){const s=await auth();if(!s?.user?.id)throw new Error("Unauthorized");
await db.workspace.update({where:{ownerId:s.user.id},data:{name:String(form.get("name")||"").trim(),tone:String(form.get("tone")||"Friendly, clear, and helpful").trim()}});revalidatePath("/app");}

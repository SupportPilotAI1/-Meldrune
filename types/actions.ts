"use server";
import { auth } from "@/lib/auth";import { db } from "@/lib/db";import { revalidatePath } from "next/cache";
export async function addFAQ(form:FormData){const s=await auth();if(!s?.user?.id)throw new Error("Unauthorized");const w=await db.workspace.findUnique({where:{ownerId:s.user.id}});
if(!w)throw new Error("Workspace missing");await db.fAQ.create({data:{workspaceId:w.id,question:String(form.get("question")||"").trim(),answer:String(form.get("answer")||"").trim()}});revalidatePath("/app/knowledge");}
export async function deleteFAQ(form:FormData){const s=await auth();if(!s?.user?.id)throw new Error("Unauthorized");const w=await db.workspace.findUnique({where:{ownerId:s.user.id}});await db.fAQ.deleteMany({where:{id:String(form.get("id")),workspaceId:w!.id}});revalidatePath("/app/knowledge");}

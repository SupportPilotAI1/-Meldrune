"use server";
import { auth } from "@/lib/auth";import { db } from "@/lib/db";import { revalidatePath } from "next/cache";import { redirect } from "next/navigation";
import { decryptToken } from "@/lib/meta-crypto";
import { sendMetaMessage, withinReplyWindow } from "@/lib/meta-graph";
async function workspace(){const s=await auth();if(!s?.user?.id)throw new Error("Unauthorized");const w=await db.workspace.findUnique({where:{ownerId:s.user.id}});if(!w)throw new Error("Workspace missing");return w;}
export async function createConversation(form:FormData){const w=await workspace();const c=await db.conversation.create({data:{workspaceId:w.id,customer:String(form.get("customer")),subject:String(form.get("subject")),channel:String(form.get("channel")||"Website"),messages:{create:{role:"customer",body:String(form.get("message"))}}}});redirect(`/app/inbox/${c.id}`);}
export async function sendReply(form:FormData){const w=await workspace();const id=String(form.get("id")),body=String(form.get("body")||"").trim();const c=await db.conversation.findFirst({where:{id,workspaceId:w.id},include:{channelRel:true}});if(!c||!body)throw new Error("Conversation not found or reply empty");
 // Meta DM thread: send the reply out to Instagram / Facebook too, then
 // record it. Meta only allows replies within 24 hours of the customer's
 // last message, so check the window first.
 if(c.channelId&&c.channelRel){
  const lastInbound=await db.message.findFirst({where:{conversationId:id,role:"customer"},orderBy:{createdAt:"desc"}});
  if(!withinReplyWindow(lastInbound?.createdAt))throw new Error("Meta only allows replies within 24 hours of the customer's last message. This reply window has closed — the customer needs to message again first.");
  if(!c.channelRel.accessTokenEnc)throw new Error("This channel has no saved login. Reconnect it in Setup → Channels.");
  const recipientId=c.externalSenderId||c.externalThreadId;
  if(!recipientId)throw new Error("This thread has no customer to reply to. Reconnect the channel in Setup → Channels.");
  let externalId: string|undefined;
  try{
   externalId=await sendMetaMessage({platform:c.channelRel.platform as "instagram"|"facebook",senderId:c.channelRel.externalAccountId,accessToken:decryptToken(c.channelRel.accessTokenEnc),recipientId,text:body});
  }catch(err){throw new Error(err instanceof Error?err.message:"Could not send to Meta. Your reply was not saved — check the channel connection and try again.");}
  await db.message.create({data:{conversationId:id,role:"agent",body,externalMessageId:externalId}});
 }else{
  await db.message.create({data:{conversationId:id,role:"agent",body}});
 }
 await db.conversation.update({where:{id},data:{status:"open"}});revalidatePath(`/app/inbox/${id}`);}
export async function closeConversation(form:FormData){const w=await workspace();await db.conversation.updateMany({where:{id:String(form.get("id")),workspaceId:w.id},data:{status:"closed"}});revalidatePath("/app/inbox");}

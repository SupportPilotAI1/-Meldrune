import { auth } from "@/lib/auth";import { db } from "@/lib/db";import { saveSetup } from "./actions";
export default async function Setup(){const s=await auth();const w=await db.workspace.findUnique({where:{ownerId:s!.user.id}});
return <><h1>Business setup</h1><div className="panel"><form action={saveSetup}><label>Business name</label><input name="name" defaultValue={w?.name}/><label>AI response tone</label><textarea name="tone" defaultValue={w?.tone}/><button className="btn">Save settings</button></form></div></>}

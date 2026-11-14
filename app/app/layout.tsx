import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { trialInfo } from "@/lib/trial";
export default async function AppLayout({children}:{children:React.ReactNode}){
 const session=await auth();if(!session?.user?.id)redirect("/login");
 const w=await db.workspace.findUnique({where:{ownerId:session.user.id}});
 const trial=w?trialInfo(w):null;
 return <><nav><Link className="brand" href="/app">MELDRUNE</Link><div><Link href="/app/inbox">Inbox</Link><Link href="/app/knowledge">Knowledge</Link><Link href="/app/setup">Setup</Link><Link href="/app/setup/channels">Channels</Link></div></nav>{trial&&<div className="trial-banner">{trial.label}{trial.expired?" — upgrade coming soon. Your workspace and conversations are safe.":""}</div>}<main className="shell">{children}</main></>;
}

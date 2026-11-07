import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function AppLayout({children}:{children:React.ReactNode}){
 const session=await auth();if(!session?.user?.id)redirect("/login");
 return <><nav><Link className="brand" href="/app">MELDRUNE</Link><div><Link href="/app/inbox">Inbox</Link><Link href="/app/knowledge">Knowledge</Link><Link href="/app/setup">Setup</Link></div></nav><main className="shell">{children}</main></>;
}

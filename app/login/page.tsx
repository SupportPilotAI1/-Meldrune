import { signIn } from "@/lib/auth";
import Link from "next/link";
export default function Login(){async function login(form:FormData){"use server";await signIn("credentials",{email:form.get("email"),password:form.get("password"),redirectTo:"/app"});}
return <main className="shell"><div className="panel"><h1>Log in to Meldrune</h1><form action={login}><label>Email</label><input name="email" type="email" required/><label>Password</label><input name="password" type="password" required/><button className="btn">Log in</button></form><p>New here? <Link href="/register">Create a workspace</Link></p></div></main>}

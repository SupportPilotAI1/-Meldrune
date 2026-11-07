import "./globals.css";
export const metadata = { title: "Meldrune", description: "The conversation operating system for small businesses" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
 return <html lang="en"><body>{children}</body></html>;
}

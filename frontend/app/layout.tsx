import "./globals.css";
import Navbar from "./components/Navbar";
import Providers from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Settlement Switch - Cross-Chain Bridge</title>
        <meta name="description" content="Cheapest and fastest cross-chain stablecoin transfers" />
      </head>
      <body className="antialiased">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}

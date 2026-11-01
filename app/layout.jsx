import "@fontsource-variable/dm-sans";
import "@fontsource-variable/fraunces";
import "./globals.css";

export const metadata = {
  title: "Fee Follow-up Board",
  description: "A clear view of pending student fees and follow-up outcomes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

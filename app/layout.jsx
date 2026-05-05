import "./globals.css";

export const metadata = {
  title: "AI & ML Quiz Platform",
  description: "Run quizzes and store results with name and email",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

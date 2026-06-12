import "./globals.css";

export const metadata = {
  title: "QuizPlatform — AI-Powered Assessment System",
  description: "Create, manage, and take quizzes with an elegant modern interface. Upload question papers from PDF/Word files.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#f0f2f5] antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Press_Start_2P, Silkscreen, Roboto_Mono, Space_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { neobrutalism } from "@clerk/themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-silkscreen",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Roam - Travel Planning for Adventurers",
  description: "Collect inspo, generate itineraries, and plan your next adventure with AI.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: neobrutalism,
        variables: {
          borderRadius: "0px",
          colorPrimary: "#F4845F",
          colorDanger: "#E74C3C",
          colorSuccess: "#C5D86D",
          colorWarning: "#F4845F",
          colorNeutral: "#3D5A80",
          colorBackground: "#F7F7F7",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#3D5A80",
          colorText: "#3D5A80",
          colorTextOnPrimaryBackground: "#FFFFFF",
          colorTextSecondary: "#8D8D8D",
          fontFamily: "'Roboto Mono', monospace",
          fontFamilyButtons: "'Silkscreen', monospace",
          fontSize: "14px",
          spacingUnit: "16px",
        },
        elements: {
          rootBox: "w-full max-w-md",
          card: "border-[3px] border-[#3D5A80] shadow-[4px_4px_0px_#3D5A80] bg-white rounded-none",
          headerTitle: "font-['Press_Start_2P'] text-[#3D5A80] text-sm uppercase tracking-wider",
          headerSubtitle: "font-['Silkscreen'] text-[#8D8D8D] text-xs",
          socialButtonsBlockButton: "border-[3px] border-[#3D5A80] shadow-[2px_2px_0px_#3D5A80] rounded-none font-['Silkscreen'] uppercase text-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#3D5A80] transition-all",
          socialButtonsBlockButtonText: "font-['Silkscreen'] text-xs",
          formButtonPrimary: "border-[3px] border-[#3D5A80] shadow-[4px_4px_0px_#3D5A80] rounded-none bg-[#F4845F] font-['Silkscreen'] uppercase text-xs tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#3D5A80] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all",
          formFieldInput: "border-[3px] border-[#3D5A80] shadow-[2px_2px_0px_#3D5A80] rounded-none font-['Roboto_Mono'] text-sm focus:shadow-[4px_4px_0px_#F4845F] focus:border-[#F4845F]",
          formFieldLabel: "font-['Silkscreen'] text-[#3D5A80] text-xs uppercase",
          footerActionLink: "text-[#F4845F] font-['Silkscreen'] text-xs hover:text-[#3D5A80]",
          footerActionText: "font-['Roboto_Mono'] text-[#8D8D8D] text-xs",
          dividerLine: "bg-[#3D5A80]",
          dividerText: "font-['Silkscreen'] text-[#8D8D8D] text-xs uppercase",
          formFieldAction: "font-['Silkscreen'] text-[#F4845F] text-xs",
          identityPreview: "border-[2px] border-[#3D5A80] rounded-none",
          identityPreviewEditButton: "font-['Silkscreen'] text-xs text-[#F4845F]",
          avatarBox: "border-[2px] border-[#3D5A80] rounded-none",
          badge: "border-[2px] border-[#3D5A80] rounded-none font-['Silkscreen'] text-[9px] uppercase",
          alternativeMethodsBlockButton: "border-[2px] border-[#3D5A80] rounded-none font-['Silkscreen'] text-xs",
          otpCodeFieldInput: "border-[3px] border-[#3D5A80] rounded-none shadow-[2px_2px_0px_#3D5A80] font-['Roboto_Mono']",
          userButtonPopoverCard: "border-[3px] border-[#3D5A80] shadow-[4px_4px_0px_#3D5A80] rounded-none",
          userButtonPopoverActionButton: "font-['Silkscreen'] text-xs rounded-none",
          userButtonPopoverActionButtonText: "font-['Silkscreen'] text-xs",
          userButtonPopoverFooter: "hidden",
          footer: "hidden",
          footerAction: "hidden",
          footerPages: "hidden",
          userPreviewMainIdentifier: "font-['Silkscreen'] text-xs",
          userPreviewSecondaryIdentifier: "font-['Roboto_Mono'] text-[10px]",
        },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
    >
      <html lang="en">
        <body
          className={`${pressStart.variable} ${silkscreen.variable} ${robotoMono.variable} ${spaceMono.variable} antialiased`}
        >
          <TooltipProvider>{children}</TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

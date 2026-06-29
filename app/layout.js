'use client';

import "./globals.css";
import { useEffect, useState } from "react";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import FirebaseAnalytics from './components/FirebaseAnalytics';

// 内联脚本：在 HTML 解析阶段同步读取 theme，避免 hydration 不匹配和闪烁
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('author-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
    var v = localStorage.getItem('author-visual');
    if (v) document.documentElement.setAttribute('data-visual', v);
    var wf = localStorage.getItem('author-writing-font-family');
    if (wf && wf.length < 240 && !/[;{}]/.test(wf)) {
      document.documentElement.style.setProperty('--font-writing', wf);
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <title>Author - AI-Assisted Writing Platform</title>
        <meta name="description" content="AI-assisted writing tool for novelists. Write with more freedom." />
        <link
          rel="stylesheet"
          href="/katex/katex.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <FirebaseAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

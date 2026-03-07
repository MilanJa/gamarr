import type { FC, Child } from "hono/jsx";

interface LayoutProps {
  title?: string;
  currentPath: string;
  children: Child;
}

export const Layout: FC<LayoutProps> = ({ title, currentPath, children }) => {
  const navItems = [
    { href: "/", label: "Upcoming", icon: "🎮" },
    { href: "/wishlist", label: "Wishlist", icon: "⭐" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} — Gamarr` : "Gamarr"}</title>
        <link rel="stylesheet" href="/public/style.css" />
      </head>
      <body>
        <header class="top-bar">
          <a href="/" class="logo">Gamarr</a>
          <nav>
            {navItems.map((item) => (
              <a
                href={item.href}
                class={`nav-link ${currentPath === item.href ? "active" : ""}`}
              >
                <span class="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
        </header>
        <main class="container">{children}</main>
      </body>
    </html>
  );
};

import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { CartDrawer } from "@/components/cart-drawer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CatalogProvider } from "@/lib/catalog-context";
import { listPublicProducts } from "@/lib/catalog.functions";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  beforeLoad: async () => listPublicProducts(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "J.I.S — Jordaan Infinite Sports" },
      {
        name: "description",
        content:
          "Authentic replicas from Jordaan Infinite Sports in Bloemfontein. Football leagues, retro jerseys and jackets, tracksuits, Formula 1, NFL, MLB, rugby, boots and South African teams.",
      },
      { name: "theme-color", content: "#f3f0e8" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/brand/icon-180.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Outfit:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: RootShell,
});

function RootShell() {
  const catalog = Route.useRouteContext();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('jis-theme');if(t!=='dark'&&t!=='light')t='light';document.documentElement.dataset.theme=t;}catch(e){}})();",
          }}
        />
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <CatalogProvider initial={catalog.products} version={catalog.version}>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex-1">
                <Outlet />
              </div>
              <SiteFooter />
            </div>
            <CartDrawer />
          </CatalogProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

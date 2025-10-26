import { Music } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold gradient-text">
                Stem Splitter
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI-powered audio stem separation. Isolate vocals, drums, bass, guitar, and piano from any audio track with professional quality.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/upload" className="hover:text-primary transition-colors">
                  Upload Audio
                </a>
              </li>
              <li>
                <a href="/history" className="hover:text-primary transition-colors">
                  My History
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Features
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} Stem Splitter. Powered by Gaudiolab API. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}






import { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Settings - Stem Splitter',
  description: 'Manage your account settings',
};

export default function SettingsPage() {
  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Settings
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              This feature is coming soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                We're working on bringing you comprehensive settings to customize your experience.
              </p>
              <p className="text-sm text-muted-foreground">
                Features will include:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Account security settings</li>
                <li>• Privacy preferences</li>
                <li>• Email notifications</li>
                <li>• Default upload settings</li>
                <li>• API key management</li>
                <li>• Delete account</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import { Metadata } from 'next';
import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Profile - Stem Splitter',
  description: 'Manage your profile information',
};

export default function ProfilePage() {
  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            User Profile
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your profile information
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              This feature is coming soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                We&apos;re working on bringing you a comprehensive profile management system.
              </p>
              <p className="text-sm text-muted-foreground">
                Features will include:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Update username and email</li>
                <li>• Change password</li>
                <li>• Upload profile picture</li>
                <li>• View account statistics</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


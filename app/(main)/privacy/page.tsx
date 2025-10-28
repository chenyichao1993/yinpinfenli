import { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - Stem Splitter',
  description: 'Privacy policy for Stem Splitter audio separation service',
};

export default function PrivacyPolicyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to Stem Splitter. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we handle your personal data when you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">
              We collect and process the following types of information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Account Information:</strong> Email address, username, and password (encrypted)</li>
              <li><strong>Audio Files:</strong> The audio files you upload for stem separation</li>
              <li><strong>Usage Data:</strong> Information about how you use our service, including separation history</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To provide and maintain our audio separation service</li>
              <li>To process your audio files and generate separated stems</li>
              <li>To manage your account and provide customer support</li>
              <li>To improve our service and develop new features</li>
              <li>To communicate with you about service updates and announcements</li>
              <li>To ensure the security and integrity of our service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="text-muted-foreground mb-4">
              We take data security seriously:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>All uploaded audio files are stored securely in encrypted cloud storage</li>
              <li>Your password is encrypted using industry-standard hashing algorithms</li>
              <li>We use secure HTTPS connections for all data transmission</li>
              <li>Access to your data is strictly controlled and limited to authorized personnel</li>
              <li>We implement regular security audits and updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground mb-4">
              We retain your data as follows:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Account Data:</strong> Retained until you delete your account</li>
              <li><strong>Audio Files:</strong> Stored indefinitely unless you delete them</li>
              <li><strong>Separation Results:</strong> Stored indefinitely for your access in history</li>
              <li><strong>Usage Logs:</strong> Retained for up to 12 months for analytics and security purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              We use the following third-party services to operate Stem Splitter:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Supabase:</strong> For authentication, database, and file storage</li>
              <li><strong>AI Processing Service:</strong> For audio stem separation (files are processed securely and not stored by the service)</li>
              <li><strong>Hosting Provider:</strong> For website hosting and delivery</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              These services have their own privacy policies and we ensure they meet our security standards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct your personal information</li>
              <li><strong>Deletion:</strong> Delete your account and associated data</li>
              <li><strong>Download:</strong> Export your separated audio files</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us at <a href="mailto:motionjoy93@gmail.com" className="text-primary hover:underline">motionjoy93@gmail.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground mb-4">
              We use essential cookies to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences</li>
              <li>Ensure the security of our service</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not use third-party tracking or advertising cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground mb-4">
              Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal data, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground mb-4">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this privacy policy or our data practices, please contact us:
            </p>
            <ul className="list-none text-muted-foreground space-y-2">
              <li><strong>Email:</strong> <a href="mailto:motionjoy93@gmail.com" className="text-primary hover:underline">motionjoy93@gmail.com</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}


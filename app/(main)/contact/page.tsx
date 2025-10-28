import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us - Stem Splitter',
  description: 'Get in touch with the Stem Splitter team',
};

export default function ContactPage() {
  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Email Card */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Email Us</CardTitle>
              <CardDescription>
                Send us an email and we'll respond as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:motionjoy93@gmail.com"
                className="text-primary hover:underline font-medium"
              >
                motionjoy93@gmail.com
              </a>
            </CardContent>
          </Card>

          {/* Response Time Card */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Response Time</CardTitle>
              <CardDescription>
                We typically respond within 24-48 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monday - Friday: 9:00 AM - 6:00 PM (UTC)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form Section */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you shortly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Tell us more about your question or feedback..."
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  const email = 'motionjoy93@gmail.com';
                  const subject = (document.getElementById('subject') as HTMLInputElement)?.value || 'Contact from Stem Splitter';
                  const message = (document.getElementById('message') as HTMLTextAreaElement)?.value || '';
                  const name = (document.getElementById('name') as HTMLInputElement)?.value || '';
                  const userEmail = (document.getElementById('email') as HTMLInputElement)?.value || '';
                  
                  const body = `Name: ${name}%0D%0AEmail: ${userEmail}%0D%0A%0D%0A${message}`;
                  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`;
                }}
              >
                Send Message
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            For urgent issues, please include "[URGENT]" in your email subject line.
          </p>
        </div>
      </div>
    </div>
  );
}


import Link from 'next/link';
import { Music, Mic, Drum, Guitar, Piano, Waves, Zap, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/Footer';

export default function LandingPage() {
  const features = [
    {
      icon: Mic,
      title: 'Vocal Isolation',
      description: 'Extract clean vocals from any track with studio-quality results',
    },
    {
      icon: Drum,
      title: 'Drum Extraction',
      description: 'Isolate drum tracks with perfect rhythm preservation',
    },
    {
      icon: Guitar,
      title: 'Guitar Separation',
      description: 'Separate electric guitar parts with clarity and precision',
    },
    {
      icon: Piano,
      title: 'Piano Extraction',
      description: 'Extract acoustic piano tracks while maintaining tonal quality',
    },
    {
      icon: Waves,
      title: 'Bass Isolation',
      description: 'Get clean bass lines separated from the rest of the mix',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process your tracks in minutes, not hours',
    },
  ];

  const stats = [
    { value: '5', label: 'Instrument Types' },
    { value: '20min', label: 'Max Duration' },
    { value: '1GB', label: 'Max File Size' },
    { value: 'HD', label: 'Quality Output' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">
              Stem Splitter
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm">
            <Zap className="mr-2 h-4 w-4 text-primary" />
            <span className="text-primary font-medium">AI-Powered Audio Separation</span>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Split Your Music Into
            <span className="gradient-text"> Individual Stems</span>
          </h1>
          
          <p className="mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Professional-grade audio stem separation powered by advanced AI. Extract vocals, drums, bass, guitar, and piano from any audio track in minutes.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Separating Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4 w-full max-w-3xl">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border/40 bg-secondary/20">
        <div className="container py-20 md:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 sm:text-4xl">
                Powerful Features
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to separate and work with individual instrument tracks
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="glass-effect border-border/50 hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/40">
        <div className="container py-20 md:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 sm:text-4xl">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to get your separated stems
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Upload Your Track',
                  description: 'Upload any audio file up to 1GB and 20 minutes long. We support MP3, WAV, FLAC, and more.',
                },
                {
                  step: '02',
                  title: 'AI Processing',
                  description: 'Our advanced AI analyzes and separates your audio into individual instrument stems.',
                },
                {
                  step: '03',
                  title: 'Download & Use',
                  description: 'Preview and download your separated tracks in MP3 or WAV format.',
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="text-6xl font-bold text-primary/10 mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40 bg-primary/5">
        <div className="container py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Shield className="mx-auto h-12 w-12 text-primary mb-6" />
            <h2 className="text-3xl font-bold mb-4 sm:text-4xl">
              Ready to Split Your Tracks?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of musicians, producers, and audio enthusiasts using Stem Splitter
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Get Started for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}








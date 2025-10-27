'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Mic, Drum, Guitar, Piano, Waves, Zap, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/Footer';
import { FileUploader } from '@/components/FileUploader';

export default function LandingPage() {
  const router = useRouter();
  const [showUploader, setShowUploader] = useState(false);

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleStartClick = () => {
    setShowUploader(true);
  };

  const handleUploadSuccess = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };
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
      <section className="container py-10 md:py-16 overflow-hidden">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          
          {/* AI Badge - 粒子爆炸效果 */}
          <AnimatePresence>
            {!showUploader && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  filter: 'blur(10px)',
                  transition: { duration: 0.5, ease: [0.6, 0.01, 0.05, 0.95] }
                }}
                className="mb-8 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm"
              >
                <Zap className="mr-2 h-4 w-4 text-primary" />
                <span className="text-primary font-medium">AI-Powered Audio Separation</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Title - 模糊向上滑动 */}
          <motion.h1
            initial={{ y: 0 }}
            animate={{
              y: showUploader ? -80 : 0,
            }}
            transition={{ duration: 0.7, ease: [0.6, 0.01, 0.05, 0.95] }}
            className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl leading-tight sm:leading-tight md:leading-tight"
            style={{ lineHeight: '1.3' }}
          >
            Split Your Music Into
            <span className="gradient-text"> Individual Stems</span>
          </motion.h1>
          
          {/* Description - 粒子螺旋飞散 */}
          <AnimatePresence>
            {!showUploader && (
              <motion.p
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  rotate: 360,
                  filter: 'blur(10px)',
                  transition: { duration: 0.6, ease: [0.6, 0.01, 0.05, 0.95] }
                }}
                className="mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
              >
                Professional-grade audio stem separation powered by advanced AI. Extract vocals, drums, bass, guitar, and piano from any audio track in minutes.
              </motion.p>
            )}
          </AnimatePresence>
          
          {/* Buttons - 爆炸效果 */}
          <AnimatePresence>
            {!showUploader && (
              <motion.div
                exit={{
                  opacity: 0,
                  scale: 0,
                  filter: 'blur(15px)',
                  transition: { duration: 0.5, ease: [0.6, 0.01, 0.05, 0.95] }
                }}
                className="flex flex-col gap-4 sm:flex-row"
              >
                <Button size="lg" className="gap-2" onClick={handleStartClick}>
                  Start Separating Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href="#features">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Section - 从中心展开 */}
          <AnimatePresence>
            {showUploader && (
              <motion.div
                initial={{ opacity: 0, scale: 0, filter: 'blur(20px)' }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  filter: 'blur(0px)',
                  transition: { 
                    duration: 0.7,
                    delay: 0.3,
                    ease: [0.6, 0.01, 0.05, 0.95]
                  }
                }}
                className="w-full max-w-4xl mt-8"
              >
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle>Upload Audio File</CardTitle>
                    <CardDescription>
                      Supported formats: MP3, WAV, FLAC, M4A, MP4 • Max 1GB • Max 20 minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUploader onUploadSuccess={handleUploadSuccess} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <motion.div
            initial={{ marginTop: 80 }}
            animate={{ marginTop: showUploader ? 48 : 80 }}
            transition={{ duration: 0.7, ease: [0.6, 0.01, 0.05, 0.95] }}
            className="grid grid-cols-2 gap-8 md:grid-cols-4 w-full max-w-3xl"
          >
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
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border/40 bg-secondary/20">
        <div className="container py-10 md:py-16">
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
        <div className="container py-10 md:py-16">
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
        <div className="container py-10 md:py-16">
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








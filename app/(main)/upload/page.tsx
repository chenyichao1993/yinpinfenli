'use client';

import { useRouter } from 'next/navigation';
import { FileUploader } from '@/components/FileUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();

  const handleUploadSuccess = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm mb-6">
            <Zap className="mr-2 h-4 w-4 text-primary" />
            <span className="text-primary font-medium">Upload Your Audio</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">
            Separate Your Audio <span className="gradient-text">Into Stems</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your audio file and select which instrument stems you want to extract. Our AI will handle the rest.
          </p>
        </div>

        {/* Upload Card */}
        <Card className="glass-effect mb-8">
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

        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'High Quality',
              description: 'Professional-grade separation powered by advanced AI',
            },
            {
              title: 'Fast Processing',
              description: 'Get your separated stems in just a few minutes',
            },
            {
              title: 'Multiple Formats',
              description: 'Download your stems in MP3 or WAV format',
            },
          ].map((item, index) => (
            <div key={index} className="flex gap-3 p-4 rounded-lg bg-secondary/50">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}






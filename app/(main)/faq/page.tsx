import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ - Stem Splitter',
  description: 'Frequently asked questions about Stem Splitter audio separation service',
};

export default function FAQPage() {
  const faqs = [
    {
      question: 'What is Stem Splitter?',
      answer: 'Stem Splitter is an AI-powered audio separation tool that allows you to isolate individual instrument tracks (stems) from your music files. You can separate vocals, drums, bass, guitar, and piano with professional quality.',
    },
    {
      question: 'What audio formats are supported?',
      answer: 'We support the most common audio formats including MP3, WAV, FLAC, M4A, and MP4. Your files can be up to 1GB in size and up to 20 minutes in duration.',
    },
    {
      question: 'How long does the separation process take?',
      answer: 'The processing time depends on the length of your audio file. Typically, a 3-4 minute song takes about 2-5 minutes to process. You can monitor the progress in real-time on the job status page.',
    },
    {
      question: 'What quality are the separated stems?',
      answer: 'We provide high-quality output in both MP3 and WAV formats. The separation uses advanced AI models to ensure professional-grade results with minimal artifacts.',
    },
    {
      question: 'Can I download the separated tracks?',
      answer: 'Yes! Once the separation is complete, you can preview each stem online and download them individually in either MP3 or WAV format.',
    },
    {
      question: 'Is my uploaded audio stored permanently?',
      answer: 'Your uploaded audio files and separated stems are stored securely in our system. You can access your history at any time to re-download your previous separations.',
    },
    {
      question: 'Do I need to create an account?',
      answer: 'Yes, you need to create a free account to use Stem Splitter. This allows us to save your separation history and provide a better user experience.',
    },
    {
      question: 'How accurate is the separation?',
      answer: 'Our AI-powered separation technology achieves professional-grade accuracy. However, the quality can vary depending on the complexity of the original mix and the instruments present in the track.',
    },
    {
      question: 'Can I separate more than 5 instrument types?',
      answer: 'Currently, we support separation of 5 main instrument types: vocals, drums, bass, electric guitar, and acoustic piano. We may add more separation types in the future based on user feedback.',
    },
    {
      question: 'What happens if the separation fails?',
      answer: 'If a separation job fails, you can check the error message on the job status page. Common issues include unsupported file formats or files exceeding size/duration limits. You can contact our support team if you need assistance.',
    },
  ];

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about Stem Splitter
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </div>
  );
}


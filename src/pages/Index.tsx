import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, Phone, Heart, Map, ArrowRight, CheckCircle } from 'lucide-react';

export default function Index() {
  const features = [
    { icon: Activity, title: 'Real-time Monitoring', description: 'Advanced AI sensors detect falls instantly' },
    { icon: Phone, title: 'Emergency Response', description: '30-second countdown with auto-alert system' },
    { icon: Heart, title: 'Health Profiles', description: 'Store medical info for emergency responders' },
    { icon: Map, title: 'Live Location', description: 'GPS tracking during emergencies' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/50 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">SafeFall AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Link to="/register" className="btn-gradient px-4 py-2 text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
              <CheckCircle className="h-4 w-4" />
              Healthcare-Grade Protection
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-foreground md:text-7xl">
              Fall Detection &{' '}
              <span className="gradient-text">Emergency Response</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
              Protecting elderly patients and loved ones with AI-powered fall detection, 
              instant emergency alerts, and real-time location tracking.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register" className="btn-gradient flex items-center gap-2 px-8 py-4 text-lg">
                Start Protection <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="glass-card px-8 py-4 text-lg font-medium text-foreground hover:border-primary/50">
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 SafeFall AI. Healthcare-grade protection for those who matter most.
        </div>
      </footer>
    </div>
  );
}

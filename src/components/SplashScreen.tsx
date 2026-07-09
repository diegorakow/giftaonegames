import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const duration = 3000;
    const interval = 50;
    const step = (interval / duration) * 100;
    let currentProgress = 0;

    const timer = setInterval(() => {
      currentProgress = Math.min(currentProgress + step, 100);
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(timer);
        complete();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [complete]);

  const handleSkip = () => {
    complete();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      >
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <motion.div
            animate={{ 
              boxShadow: [
                '0 0 30px hsl(150 100% 50% / 0.1)',
                '0 0 60px hsl(150 100% 50% / 0.3)',
                '0 0 30px hsl(150 100% 50% / 0.1)',
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
          >
            <Gamepad2 className="w-12 h-12 text-primary" />
          </motion.div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-gradient">
            GIFTZONE
          </h1>

          {/* Loading bar */}
          <div className="w-48 h-0.5 bg-muted rounded-full overflow-hidden mt-4">
            <motion.div
              className="h-full bg-primary/60 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-muted-foreground/50 text-xs tracking-widest uppercase">
            Carregando
          </p>
        </motion.div>

        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={handleSkip}
          className="absolute bottom-8 right-8 md:top-8 md:bottom-auto text-muted-foreground/40 hover:text-muted-foreground text-sm transition-colors flex items-center gap-1.5"
        >
          Pular
          <span className="text-xs">→</span>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

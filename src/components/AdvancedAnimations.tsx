import React, { useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useScroll } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

// =============== COMPONENTES ANIMADOS BASE ===============

// Card com entrada animada e hover effects
export function AnimatedCard({ 
  children, 
  delay = 0, 
  className = "",
  onClick 
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 20,
        scale: 0.95
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1
      }}
      transition={{ 
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
      onClick={onClick}
    >
      <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200">
        {children}
      </Card>
    </motion.div>
  );
}

// Badge animado com pulso
export function AnimatedBadge({ 
  children, 
  variant = "default",
  pulse = false,
  glow = false
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  pulse?: boolean;
  glow?: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20 
      }}
      className={`inline-block ${glow ? 'filter drop-shadow-sm' : ''}`}
    >
      <Badge 
        variant={variant}
        className={`
          ${pulse ? 'animate-pulse' : ''} 
          ${glow ? 'shadow-lg' : ''}
          transition-all duration-200
        `}
      >
        {children}
      </Badge>
    </motion.div>
  );
}

// Progress bar animado
export function AnimatedProgress({ 
  value, 
  max = 100,
  showValue = true,
  color = "primary",
  animationDuration = 1.5
}: {
  value: number;
  max?: number;
  showValue?: boolean;
  color?: string;
  animationDuration?: number;
}) {
  const percentage = (value / max) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        {showValue && (
          <motion.span 
            className="text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: animationDuration }}
          >
            {value.toFixed(1)}%
          </motion.span>
        )}
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full bg-${color} rounded-full relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: animationDuration,
            ease: "easeOut"
          }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 1.5,
              delay: animationDuration,
              ease: "linear"
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

// =============== COMPONENTES COMPLEXOS ===============

// KPI Card com animações avançadas
export function AnimatedKPICard({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon: Icon,
  delay = 0,
  onClick
}: {
  title: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue?: number;
  icon: React.ComponentType<any>;
  delay?: number;
  onClick?: () => void;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Zap;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <AnimatedCard delay={delay} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <motion.div
          initial={{ rotate: 0, scale: 1 }}
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="text-2xl font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            delay: delay + 0.2,
            type: "spring",
            stiffness: 100
          }}
        >
          <CountingNumber value={value} duration={1.5} />
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        </motion.div>
        
        {trendValue !== undefined && (
          <motion.div 
            className={`flex items-center text-xs ${trendColor} mt-1`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.4 }}
          >
            <TrendIcon className="mr-1 h-3 w-3" />
            {trendValue > 0 ? '+' : ''}{trendValue.toFixed(1)}% vs período anterior
          </motion.div>
        )}
      </CardContent>
    </AnimatedCard>
  );
}

// Número que conta animadamente
function CountingNumber({ 
  value, 
  duration = 2,
  decimals = 1 
}: {
  value: number;
  duration?: number;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(value * easeOutCubic);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{displayValue.toFixed(decimals)}</span>;
}

// =============== LAYOUTS ANIMADOS ===============

// Grid com stagger animation
export function AnimatedGrid({ 
  children,
  staggerDelay = 0.1,
  className = ""
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`grid gap-6 ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Lista com animações sequenciais
export function AnimatedList({
  items,
  renderItem,
  staggerDelay = 0.1
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className="space-y-2"
    >
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item.id || index}
            variants={{
              hidden: { 
                opacity: 0, 
                x: -20,
                scale: 0.95
              },
              visible: { 
                opacity: 1, 
                x: 0,
                scale: 1
              }
            }}
            exit={{
              opacity: 0,
              x: 20,
              scale: 0.95,
              transition: { duration: 0.2 }
            }}
            whileHover={{ 
              x: 4,
              transition: { duration: 0.2 }
            }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

// =============== MICROANIMAÇÕES ===============

// Button com animação de loading
export function AnimatedButton({
  children,
  isLoading = false,
  variant = "default",
  onClick,
  className = ""
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: any;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        variant={variant}
        onClick={onClick}
        disabled={isLoading}
        className={`relative overflow-hidden ${className}`}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
              Processando...
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}

// Tooltip animado
export function AnimatedTooltip({
  children,
  content,
  side = "top"
}: {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <motion.div
      className="relative inline-block"
      onHoverStart={() => setIsVisible(true)}
      onHoverEnd={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              y: side === "top" ? 10 : side === "bottom" ? -10 : 0,
              x: side === "left" ? 10 : side === "right" ? -10 : 0
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0,
              x: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8 
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className={`
              absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg
              ${side === "top" ? "bottom-full mb-1" : ""}
              ${side === "bottom" ? "top-full mt-1" : ""}
              ${side === "left" ? "right-full mr-1" : ""}
              ${side === "right" ? "left-full ml-1" : ""}
            `}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============== EFEITOS ESPECIAIS ===============

// Particle effect para celebrações
export function ParticleEffect({ 
  trigger = false,
  particleCount = 50,
  colors = ["#3B82F6", "#10B981", "#F59E0B"]
}: {
  trigger?: boolean;
  particleCount?: number;
  colors?: string[];
}) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    velocity: { x: number; y: number };
  }>>([]);

  React.useEffect(() => {
    if (!trigger) return;

    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2,
      velocity: {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10
      }
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 3000);

    return () => clearTimeout(timer);
  }, [trigger, particleCount, colors]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            initial={{
              x: particle.x,
              y: particle.y,
              scale: 0,
              opacity: 1
            }}
            animate={{
              x: particle.x + particle.velocity.x * 100,
              y: particle.y + particle.velocity.y * 100,
              scale: 1,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3,
              ease: "easeOut"
            }}
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Loading skeleton animado
export function AnimatedSkeleton({ 
  className = "",
  lines = 3 
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-muted rounded animate-pulse"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2
          }}
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

export default {
  AnimatedCard,
  AnimatedBadge,
  AnimatedProgress,
  AnimatedKPICard,
  AnimatedGrid,
  AnimatedList,
  AnimatedButton,
  AnimatedTooltip,
  ParticleEffect,
  AnimatedSkeleton
};
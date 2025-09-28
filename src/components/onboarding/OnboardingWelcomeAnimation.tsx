import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Target, BarChart, Shield, Users } from "lucide-react";

export function OnboardingWelcomeAnimation() {
  const icons = [
    { Icon: BarChart, delay: 0.2, color: "text-green-500" },
    { Icon: Shield, delay: 0.4, color: "text-blue-500" },
    { Icon: Users, delay: 0.6, color: "text-purple-500" },
    { Icon: Target, delay: 0.8, color: "text-orange-500" }
  ];

  return (
    <div className="relative flex items-center justify-center p-8">
      {/* Central Sparkle */}
      <motion.div
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
          <Sparkles className="w-8 h-8 text-primary-foreground animate-pulse" />
        </div>
      </motion.div>

      {/* Orbiting Icons */}
      {icons.map(({ Icon, delay, color }, index) => (
        <motion.div
          key={index}
          initial={{ 
            opacity: 0,
            x: 0,
            y: 0,
            scale: 0
          }}
          animate={{ 
            opacity: 1,
            x: Math.cos((index * Math.PI) / 2) * 60,
            y: Math.sin((index * Math.PI) / 2) * 60,
            scale: 1
          }}
          transition={{ 
            duration: 0.8, 
            delay,
            ease: "easeOut"
          }}
          className="absolute"
        >
          <div className="w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full border border-border/50 flex items-center justify-center shadow-md">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </motion.div>
      ))}

      {/* Animated Arrows */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="absolute -right-8 top-1/2 transform -translate-y-1/2"
      >
        <ArrowRight className="w-6 h-6 text-primary animate-pulse" />
      </motion.div>

      {/* Connecting Lines Animation */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
        {icons.map((_, index) => {
          const angle = (index * Math.PI) / 2;
          const x1 = 100;
          const y1 = 100;
          const x2 = 100 + Math.cos(angle) * 40;
          const y2 = 100 + Math.sin(angle) * 40;
          
          return (
            <motion.line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border/30"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
            />
          );
        })}
      </svg>
    </div>
  );
}
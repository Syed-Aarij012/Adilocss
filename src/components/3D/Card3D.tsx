import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export const Card3D = ({ 
  children, 
  className = '', 
  glowColor = 'accent',
  intensity = 1 
}: Card3DProps) => {
  return (
    <div className={`group relative ${className}`}>
      {/* Static glow effect */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-br from-accent/20 to-primary/20 transform scale-110" />
      
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent/5 to-primary/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <Card className="relative border-border group-hover:border-accent/50 transition-all duration-300 backdrop-blur-sm bg-card shadow-md group-hover:shadow-xl group-hover:shadow-accent/10">
        {children}
      </Card>
    </div>
  );
};

export const InteractiveCard = ({ 
  children, 
  className = '',
  hoverScale = 1.05 
}: {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
}) => {
  return (
    <div
      className={`group relative transition-all duration-500 hover:scale-105 ${className}`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform group-hover:scale-110" />
      <Card className="relative border-border group-hover:border-accent/50 transition-all duration-500 backdrop-blur-sm bg-card shadow-lg group-hover:shadow-2xl group-hover:shadow-accent/25">
        {children}
      </Card>
    </div>
  );
};
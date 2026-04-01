'use client';

import { ReactNode } from 'react';

interface StaggeredListProps {
  children: ReactNode[];
}

export default function StaggeredList({ children }: StaggeredListProps) {
  return (
    <div>
      {children.map((child, i) => (
        <div
          key={i}
          className="animate-stagger-in"
          style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

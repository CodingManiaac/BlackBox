import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  routeKey: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, routeKey }) => {
  const [renderChildren, setRenderChildren] = useState(children);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    setAnimate(false);
    const timer1 = setTimeout(() => {
      setRenderChildren(children);
      setAnimate(true);
    }, 80); // Quick delay to reset transition states

    return () => {
      clearTimeout(timer1);
    };
  }, [routeKey, children]);

  return (
    <div 
      className={animate ? 'medx-fade-in medx-slide-in' : ''} 
      style={{
        opacity: animate ? 1 : 0,
        transition: 'opacity 150ms var(--transition-ease)'
      }}
    >
      {renderChildren}
    </div>
  );
};
export default PageTransition;

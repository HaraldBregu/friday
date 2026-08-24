import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { duration, ease, fadeVariants, pageVariants } from './motion';

interface PageTransitionProps {
	readonly children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps): React.JSX.Element {
	const location = useLocation();
	const prefersReducedMotion = useReducedMotion();

	// Key on the top-level segment so sub-route changes (e.g. /settings/*) don't trigger a transition
	const topKey = location.pathname.split('/')[1] ?? 'root';
	const variants =
		topKey === 'home' || topKey === 'settings' || topKey === 'terminal'
			? fadeVariants
			: pageVariants;

	if (prefersReducedMotion) {
		return <div className="h-full">{children}</div>;
	}

	return (
		<motion.div
			key={topKey}
			variants={variants}
			initial="initial"
			animate="animate"
			transition={{ duration: duration.normal, ease: ease.out }}
			className="h-full"
		>
			{children}
		</motion.div>
	);
}

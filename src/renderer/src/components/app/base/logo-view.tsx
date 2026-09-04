import React from 'react';
import icon from '@resources/icons/icon.png';

export function LogoView({
	className = 'size-20 rounded-2xl',
}: {
	readonly className?: string;
}): React.JSX.Element {
	return <img src={icon} alt="Kucedr logo" className={`object-contain ${className}`} />;
}

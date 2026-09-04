import React from 'react';
import mark from '@resources/icons/kucedra-mark.svg';

export function LogoView({
	className = 'size-20 rounded-2xl',
}: {
	readonly className?: string;
}): React.JSX.Element {
	return (
		<span
			className={`inline-grid shrink-0 place-items-center overflow-hidden bg-black ${className}`}
		>
			<img src={mark} alt="Kucedr logo" className="size-[80%] object-contain invert" />
		</span>
	);
}

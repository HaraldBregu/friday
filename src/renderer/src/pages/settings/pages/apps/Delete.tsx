import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Extension } from '../../../../../../shared/extension_types';

interface DeleteProps {
	readonly extension: Extension;
	readonly disabled: boolean;
	readonly onDeleted: (extensionId: string) => void;
	readonly onError: (message: string) => void;
}

export default function Delete({
	extension,
	disabled,
	onDeleted,
	onError,
}: DeleteProps): React.JSX.Element {
	const { t } = useTranslation();
	const [deleting, setDeleting] = useState(false);

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			className="mr-3 flex-none text-muted-foreground hover:text-destructive"
			aria-label={t('settings.extensions.deleteAction', { name: extension.title })}
			title={t('settings.extensions.deleteAction', { name: extension.title })}
			disabled={disabled || deleting}
			onClick={() => {
				setDeleting(true);
				onError('');
				void window.extensions
					.delete(extension.id)
					.then((deleted) => {
						if (deleted) onDeleted(extension.id);
					})
					.catch((error: unknown) => {
						onError(
							error instanceof Error && error.message.trim().length > 0
								? error.message
								: t('settings.extensions.deleteError')
						);
					})
					.finally(() => setDeleting(false));
			}}
		>
			<Trash2 className="size-3" />
		</Button>
	);
}

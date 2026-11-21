import { Component } from 'react';
import { createRoot } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import {
	createHashRouter,
	Navigate,
	RouterProvider,
	useParams,
} from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AppLayout } from '@/components/layout';
import { Button, Notice } from '@/components/ui';
import { PromptProvider } from '@/context/prompt-context';
import { ToastProvider } from '@/context/toast-context';
import { Rules } from '@/pages/rules';
import { RuleEditor } from '@/pages/rule-edit';
import { Settings } from '@/pages/settings';
import './styles/admin.css';

apiFetch.use( apiFetch.createNonceMiddleware( syzeppsAdmin.nonce ) );

class ErrorBoundary extends Component {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		if ( this.state.failed ) {
			return (
				<div className="sp-fatal">
					<Notice>
						{ __(
							'The shipping workspace could not load. Reload the page to try again.',
							'syzenlabs-per-product-shipping'
						) }
					</Notice>
					<Button onClick={ () => window.location.reload() }>
						{ __(
							'Reload workspace',
							'syzenlabs-per-product-shipping'
						) }
					</Button>
				</div>
			);
		}
		return this.props.children;
	}
}
function EditorRoute() {
	const { productId } = useParams();
	return (
		<RuleEditor
			key={ productId || 'new' }
			productId={ productId ? Number( productId ) : null }
		/>
	);
}
function WorkspaceError() {
	return (
		<div className="sp-fatal">
			<Notice>
				{ __(
					'The workspace could not load. Reload the page to try again.',
					'syzenlabs-per-product-shipping'
				) }
			</Notice>
			<Button onClick={ () => window.location.reload() }>
				{ __(
					'Reload workspace',
					'syzenlabs-per-product-shipping'
				) }
			</Button>
		</div>
	);
}
const root = document.getElementById( 'syzepps-dashboard-wrap' );
if ( root ) {
	const router = createHashRouter( [
		{
			element: <AppLayout />,
			errorElement: <WorkspaceError />,
			children: [
				{ index: true, element: <Navigate to="/rules" replace /> },
				{ path: 'overview', element: <Navigate to="/rules" replace /> },
				{ path: 'rules', element: <Rules /> },
				{ path: 'rule-add', element: <EditorRoute /> },
				{ path: 'rule-edit/:productId', element: <EditorRoute /> },
				{ path: 'settings', element: <Settings /> },
				{ path: '*', element: <Navigate to="/rules" replace /> },
			],
		},
	] );
	createRoot( root ).render(
		<ErrorBoundary>
			<MotionConfig reducedMotion="user">
				<PromptProvider>
					<ToastProvider>
						<RouterProvider router={ router } />
					</ToastProvider>
				</PromptProvider>
			</MotionConfig>
		</ErrorBoundary>
	);
}

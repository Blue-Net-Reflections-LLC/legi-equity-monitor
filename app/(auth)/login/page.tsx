'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { googleAuthenticate, signOutNoRedirectAction } from '../actions';
import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import { ADMIN_ROLES } from '@/app/constants/user-roles';
import { useEffect } from 'react';

export default function LoginPage() {
	const { data: session } = useSession();
	const isUnauthorizedUser = session?.user && !ADMIN_ROLES.includes(session.user.role || 'user');
	const searchParams = useSearchParams();

	const doRedirect = (val: string) => {
		if (val.startsWith('/admin') && isUnauthorizedUser) {
			sessionStorage?.removeItem('redirect');
			redirect('/login');
		} else {
			redirect(val);
		}
	}

	useEffect(() => {
		if (searchParams.get('redirect')) {
			sessionStorage.setItem('redirect', searchParams.get('redirect') || '/');
		}

		if (session?.user?.role) {
			let redirectUrl

			if (!isUnauthorizedUser && !sessionStorage.getItem('redirect')) {
				redirectUrl = '/admin';
			} else {
				redirectUrl = sessionStorage.getItem('redirect') || '/';
			}
			doRedirect(redirectUrl);
		}
	}, [session, isUnauthorizedUser, searchParams]);

	const handleGoogleSignIn = async () => {
		await googleAuthenticate({});
	};

	const handleSignOut = async () => {
		await signOutNoRedirectAction();
	}

	const getMessage = () => {
		if (session?.user) {
			if (isUnauthorizedUser) {
				return `Access denied. Your current role (${session.user.role || 'user'}) does not have sufficient permissions.`;
			}
			return `You are currently signed in as ${session.user.email}`;
		}
		return 'Sign in to access the legislative analysis dashboard';
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<Card className="w-full max-w-md bg-background shadow-lg">
					<CardHeader>
						<h1 className="text-2xl font-bold text-center mb-2">Welcome to LegiEquity</h1>
						<div className={isUnauthorizedUser ? 
							"p-3 mb-4 text-sm border rounded-md text-red-500 dark:text-red-400 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10" : 
							"text-sm text-muted-foreground text-center"
						}>
							{getMessage()}
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<Button 
							onClick={isUnauthorizedUser ? handleSignOut : handleGoogleSignIn} 
							className="w-full flex items-center justify-center gap-2 bg-background hover:bg-muted text-foreground border border-border"
						>
							<Image 
								src="/images/google.svg" 
								alt="Google" 
								width={20} 
								height={20}
							/>
							{session ? 'Sign in with different account' : 'Sign in with Google'}
						</Button>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}


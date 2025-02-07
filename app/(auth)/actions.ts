'use server';

import { signIn, signOut } from './auth';

export async function googleAuthenticate({ prompt = false, callbackUrl = '/admin' }: { prompt?: boolean; callbackUrl?: string }) {
  const promptObject = prompt ? { prompt: "login" } : undefined;
  await signIn('google', {
    callbackUrl: callbackUrl,
    redirect: true
  }, promptObject);
}

export async function signOutAction(redirect: boolean = true) {
  await signOut({
    redirectTo: '/',
    redirect
  });
}

export async function signOutNoRedirectAction() {
  await signOut({
      redirect: false
  });
  await googleAuthenticate({ prompt: true });
}


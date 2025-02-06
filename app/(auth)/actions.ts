'use server';

import { signIn, signOut } from './auth';

export async function googleAuthenticate(prompt: boolean = false) {
  const promptObject = prompt ? { prompt: "login" } : undefined;
  await signIn('google', {
    callbackUrl: '/admin',
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
  await googleAuthenticate(true);
}


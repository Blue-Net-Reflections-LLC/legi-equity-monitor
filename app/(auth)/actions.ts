'use server';

import { signIn, signOut } from './auth';

export async function googleAuthenticate() {
  await signIn('google', {
    callbackUrl: '/admin',
    redirect: true
  }, { prompt: "login" });
}

export async function signOutAction(redirect: boolean = true) {
  await signOut({
    redirectTo: '/',
    redirect: redirect
  });
}

export async function signOutNoRedirectAction() {
  await signOut({
      redirect: false
  });
  await googleAuthenticate();
}


'use client';

import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Twitter, FacebookIcon, Instagram, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">VoterAI</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              A collaboration between VoterAI and Bluenetreflection
            </p>
            <div className="flex items-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Mail className="w-4 h-4" />
              <a href="mailto:info@voterai.chat" className="hover:text-zinc-800 dark:hover:text-zinc-300">
                info@voterai.chat
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Navigation</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300">
                Home
              </Link>
              <Link href="/about" className="block text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300">
                About Us
              </Link>
              <Link href="/blog" className="block text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300">
                Impact Blog
              </Link>
              <Link href="/contact" className="block text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300">
                Contact
              </Link>
              <Link href="/terms" className="block text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300">
                Terms & Conditions
              </Link>
            </div>
          </div>

          {/* Social Media & Theme */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Follow Us</h3>
              <div className="flex space-x-4">
                <a 
                  href="https://twitter.com/voterai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-400 dark:hover:text-blue-400 transition-colors"
                  aria-label="Follow us on Twitter"
                >
                  <Twitter className="w-5 h-5 fill-current" />
                </a>
                <a 
                  href="https://facebook.com/voterai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-600 transition-colors"
                  aria-label="Follow us on Facebook"
                >
                  <FacebookIcon className="w-5 h-5 fill-current" />
                </a>
                <a 
                  href="https://instagram.com/voterai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-pink-500 dark:hover:text-pink-500 transition-colors"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5 fill-current" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Appearance</h3>
              <ThemeToggle variant="labeled" />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-center text-zinc-500 dark:text-zinc-400">
            © 2025 VoterAI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ExternalLink, Info } from 'lucide-react';

export function Header() {
    const pathname = usePathname();

    return (
        <>
            {/* Header matching Streamlit style */}
            <div className="bg-gradient-to-b from-blue-50 to-blue-100 px-8 py-5 pb-4">
                <h1 className="text-2xl font-semibold text-gray-900 text-center">AI Compliance Tool</h1>
            </div>

            {/* Navigation bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-0">
                <div className="flex justify-center">
                    <div className="flex items-center space-x-1">
                        <Link
                            href="/"
                            className={`nav-tab ${pathname === '/' ? 'active' : ''}`}
                        >
                            <Search size={16} />
                            Compliance Check
                        </Link>
                        <a
                            href="https://uk-ai-policy-tracker-next.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nav-tab"
                        >
                            <ExternalLink size={16} />
                            Policy Tracker
                        </a>
                        <Link
                            href="/about"
                            className={`nav-tab ${pathname.startsWith('/about') ? 'active' : ''}`}
                        >
                            <Info size={16} />
                            About
                        </Link>
                    </div>
                </div>
            </div>

            {/* Spacing after header */}
            <div className="h-8"></div>
        </>
    );
}

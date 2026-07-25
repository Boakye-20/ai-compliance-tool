"use client";

import { useEffect, useState } from 'react';
import { RadioTower, ExternalLink, RefreshCw } from 'lucide-react';

const TRACKER_URL = 'https://www.aipolicytracker.uk/';

interface PolicyUpdate {
    id: string;
    title: string;
    framework?: string;
    date: string;
    url?: string;
}

interface SyncState {
    available: boolean;
    updatedThisWeek?: number;
    updates?: PolicyUpdate[];
}

export function PolicySyncBanner() {
    const [state, setState] = useState<SyncState | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/policy-sync');
            setState(await res.json());
        } catch {
            setState({ available: false });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const count = state?.updatedThisWeek || 0;
    const live = state?.available;

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg border border-blue-200">
                        <RadioTower className={`w-5 h-5 ${live ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">Live Regulatory Sync</h3>
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                    live ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                                {loading ? 'Checking…' : live ? 'Connected' : 'Not connected'}
                            </span>
                        </div>
                        {live ? (
                            <p className="text-sm text-gray-700 mt-1">
                                {count > 0 ? (
                                    <>
                                        <strong>{count} framework update{count === 1 ? '' : 's'} this week</strong> — re-run your
                                        stored payload to verify alignment.
                                    </>
                                ) : (
                                    'No regulatory changes in the last 7 days. Your alignment reflects the latest guidance.'
                                )}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-600 mt-1">
                                Syncs with the UK AI Policy Tracker to flag when new guidance affects your stored audits.
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={load} className="p-2 text-gray-400 hover:text-gray-700" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <a
                        href={TRACKER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-sm flex items-center gap-1"
                    >
                        Open Tracker <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>

            {live && state?.updates && state.updates.length > 0 && (
                <ul className="mt-3 pl-14 space-y-1">
                    {state.updates.slice(0, 3).map((u) => (
                        <li key={u.id} className="text-xs text-gray-600 flex items-center gap-2">
                            <span className="text-gray-400">{u.date}</span>
                            {u.framework && (
                                <span className="bg-white border border-gray-200 rounded px-1.5 py-0.5">{u.framework}</span>
                            )}
                            <span>{u.title}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

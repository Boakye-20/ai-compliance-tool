import { NextResponse } from 'next/server';

// Live regulatory sync. Consumes the UK AI Policy Tracker's published updates feed
// (added to the tracker build in Phase 4). Until that feed is live this route
// returns { available: false } so the UI shows an honest "not yet connected" state
// rather than fabricated updates.

export const revalidate = 3600; // cache for an hour

const FEED_URL = process.env.POLICY_TRACKER_FEED_URL || 'https://www.aipolicytracker.uk/updates.json';

interface PolicyUpdate {
    id: string;
    title: string;
    framework?: string;
    date: string;
    url?: string;
}

export async function GET() {
    try {
        const res = await fetch(FEED_URL);
        if (!res.ok) {
            return NextResponse.json({ available: false, feedUrl: FEED_URL });
        }
        const data = (await res.json()) as { updates?: PolicyUpdate[] } | PolicyUpdate[];
        const updates = Array.isArray(data) ? data : data.updates || [];

        // Count updates within the last 7 days for the banner headline.
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = updates.filter((u) => {
            const t = Date.parse(u.date);
            return !Number.isNaN(t) && t >= weekAgo;
        });

        return NextResponse.json({
            available: true,
            updatedThisWeek: recent.length,
            updates: updates.slice(0, 10),
            feedUrl: FEED_URL,
        });
    } catch {
        return NextResponse.json({ available: false, feedUrl: FEED_URL });
    }
}

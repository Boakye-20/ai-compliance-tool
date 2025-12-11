import { AnalysisJob } from './types';

// In-memory store (ephemeral across serverless invocations). For production, swap to durable storage.
const store = new Map<string, AnalysisJob>();

export function saveJob(job: AnalysisJob): void {
    store.set(job.id, job);
}

export function getJob(id: string): AnalysisJob | undefined {
    return store.get(id);
}

export function deleteJob(id: string): boolean {
    return store.delete(id);
}

"use client";

import { useEffect, useState } from 'react';
import { KeyRound, Plus, Copy, Check, Download, Github, Loader2, Trash2 } from 'lucide-react';
import { AuditHistory } from '@/components/AuditHistory';

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    created_at: string;
}

const WORKFLOW_YML = `# .github/workflows/compliance-audit.yml
name: AI Compliance Audit
on:
  push:
    paths:
      - 'model/**'
      - 'docs/dpia/**'
      - '.github/workflows/compliance-audit.yml'
  workflow_dispatch:

jobs:
  compliance-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - name: Install extraction client
        run: pip install -r cli/requirements.txt
      - name: Extract metadata & submit for scoring
        id: audit
        env:
          COMPLIANCE_API_KEY: \${{ secrets.COMPLIANCE_API_KEY }}
          COMPLIANCE_API_URL: \${{ vars.COMPLIANCE_API_URL }}
        run: |
          python cli/compliance_extract.py docs/dpia/system-dpia.pdf \\
            --api-url "$COMPLIANCE_API_URL" \\
            --api-key "$COMPLIANCE_API_KEY" \\
            --output score.json
      - name: Enforce alignment threshold (kill switch)
        run: |
          SCORE=$(jq '.analysis.synthesis.uk_alignment_score' score.json)
          THRESHOLD=70
          echo "UK Alignment Score: $SCORE (threshold $THRESHOLD)"
          if [ "$SCORE" -lt "$THRESHOLD" ]; then
            echo "::error::Compliance score $SCORE is below threshold $THRESHOLD — blocking deployment."
            exit 1
          fi
`;

export function IntegrationsTab() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [keyName, setKeyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [backendReady, setBackendReady] = useState(true);
    const [copiedYml, setCopiedYml] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);

    const loadKeys = async () => {
        try {
            const res = await fetch('/api/keys');
            if (res.status === 404 || res.status === 501) {
                setBackendReady(false);
                return;
            }
            const data = await res.json();
            setKeys(data.keys || []);
            setBackendReady(true);
        } catch {
            setBackendReady(false);
        }
    };

    useEffect(() => {
        loadKeys();
    }, []);

    const generateKey = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: keyName || 'CI/CD key' }),
            });
            if (!res.ok) {
                setBackendReady(false);
                return;
            }
            const data = await res.json();
            if (data.key) setNewKey(data.key); // full key shown once
            setKeyName('');
            loadKeys();
        } catch {
            setBackendReady(false);
        } finally {
            setLoading(false);
        }
    };

    const revokeKey = async (id: string) => {
        if (!confirm('Revoke this API key? CI/CD pipelines using it will stop working.')) return;
        try {
            await fetch(`/api/keys?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            loadKeys();
        } catch {
            /* ignore */
        }
    };

    const copy = async (text: string, which: 'yml' | 'key') => {
        try {
            await navigator.clipboard.writeText(text);
            if (which === 'yml') { setCopiedYml(true); setTimeout(() => setCopiedYml(false), 1500); }
            else { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 1500); }
        } catch { /* clipboard unavailable */ }
    };

    const downloadYml = () => {
        const blob = new Blob([WORKFLOW_YML], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compliance-audit.yml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Audit history (only renders when persistence is provisioned) */}
            <AuditHistory />

            {/* API Keys */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-1">
                    <KeyRound className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    Generate keys so your CI/CD pipelines and the local extraction client can submit audits automatically.
                </p>

                {!backendReady ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                        API key management activates once the persistence backend (Phase 3: Postgres) is provisioned.
                        The CI/CD workflow below is ready to use now.
                    </div>
                ) : (
                    <>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                placeholder="Key name (e.g. production-ci)"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <button onClick={generateKey} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Generate Key
                            </button>
                        </div>

                        {newKey && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <p className="text-xs text-green-800 mb-1 font-medium">
                                    Copy this key now — it will not be shown again.
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-white border border-green-200 rounded px-2 py-1.5 font-mono break-all">
                                        {newKey}
                                    </code>
                                    <button onClick={() => copy(newKey, 'key')} className="text-green-700 hover:text-green-900">
                                        {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {keys.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-3">No API keys yet.</p>
                            ) : (
                                keys.map((k) => (
                                    <div key={k.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">{k.name}</span>
                                            <span className="text-xs text-gray-400 ml-2 font-mono">{k.prefix}…</span>
                                        </div>
                                        <button onClick={() => revokeKey(k.id)} className="text-gray-400 hover:text-red-600" title="Revoke">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* CI/CD Workflow */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Github className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">CI/CD Gatekeeper</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => copy(WORKFLOW_YML, 'yml')} className="btn-secondary text-sm flex items-center gap-1">
                            {copiedYml ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />} Copy
                        </button>
                        <button onClick={downloadYml} className="btn-secondary text-sm flex items-center gap-1">
                            <Download className="w-4 h-4" /> Download
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    Drop this into your repo at <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">.github/workflows/compliance-audit.yml</code>.
                    It extracts metadata locally, submits it for scoring, and blocks deployment if alignment drops below your threshold.
                </p>
                <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto max-h-96">{WORKFLOW_YML}</pre>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';

export type AssetStatus = 'In Review' | 'Approved' | 'Needs Tweaks';
export type AssetType = 'Reel / TikTok' | 'YouTube Short' | 'Graphic / Thumbnail' | 'Project / Raw';
export type LinkSource = 'Google Drive' | 'iCloud' | 'Canva' | 'CapCut' | 'Other Link';

export interface CloudAsset {
  id: string;
  title: string;
  type: AssetType;
  source: LinkSource;
  url: string;
  creator: string;
  dateAdded: string;
  status: AssetStatus;
  notes?: string;
  reviewFeedback?: string;
}

const STORAGE_KEY = 'rta_staff_portal_cloud_assets_v1';

const INITIAL_ASSETS: CloudAsset[] = [
  {
    id: 'cld-1',
    title: 'Race Weekend Driver Spotlight — Final Cut',
    type: 'Reel / TikTok',
    source: 'CapCut',
    url: 'https://www.capcut.com',
    creator: 'Brooke',
    dateAdded: '27/11/2026',
    status: 'In Review',
    notes: '9:16 1080x1920 exported; ready for final check before posting.',
  },
  {
    id: 'cld-2',
    title: 'Academy Standings Carousel Template',
    type: 'Graphic / Thumbnail',
    source: 'Canva',
    url: 'https://www.canva.com',
    creator: 'Brooke',
    dateAdded: '25/11/2026',
    status: 'Approved',
    notes: 'Uses #fa3425 accent bar and Inter Bold.',
  },
];

function formatDateUK(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function detectLinkSource(rawUrl: string): LinkSource {
  const lower = rawUrl.toLowerCase();
  if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) return 'Google Drive';
  if (lower.includes('icloud.com')) return 'iCloud';
  if (lower.includes('canva.com')) return 'Canva';
  if (lower.includes('capcut.com')) return 'CapCut';
  return 'Other Link';
}

function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const UploadAssetsView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [assets, setAssets] = useState<CloudAsset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CloudAsset[]) : INITIAL_ASSETS;
    } catch {
      return INITIAL_ASSETS;
    }
  });

  const [filterStatus, setFilterStatus] = useState<'All' | AssetStatus>('All');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AssetType>('Reel / TikTok');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState<LinkSource>('Google Drive');
  const [sourceManuallyPicked, setSourceManuallyPicked] = useState(false);
  const [creator, setCreator] = useState('Brooke');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    } catch {
      // Ignore storage quota errors
    }
  }, [assets]);

  const handleUrlChange = (nextUrl: string) => {
    setUrl(nextUrl);
    if (!sourceManuallyPicked && nextUrl.trim()) {
      setSource(detectLinkSource(nextUrl));
    }
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeUrl(url);
    if (!title.trim() || !cleanUrl) return;

    const entry: CloudAsset = {
      id: `cld-${Date.now()}`,
      title: title.trim(),
      type,
      source,
      url: cleanUrl,
      creator: creator.trim() || 'Team Member',
      dateAdded: formatDateUK(),
      status: 'In Review',
      notes: notes.trim() || undefined,
    };

    setAssets((prev) => [entry, ...prev]);
    setTitle('');
    setUrl('');
    setNotes('');
    setSource('Google Drive');
    setSourceManuallyPicked(false);
    setShowAddForm(false);
  };

  const updateStatus = (id: string, status: AssetStatus) => {
    let feedback: string | undefined;
    if (status === 'Needs Tweaks') {
      const input = window.prompt('Add tweak notes for the creator:');
      if (input === null) return;
      feedback = input.trim() || 'Revisions requested.';
    }

    setAssets((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status, reviewFeedback: status === 'Needs Tweaks' ? feedback : undefined }
          : item
      )
    );
  };

  const filteredAssets =
    filterStatus === 'All' ? assets : assets.filter((item) => item.status === filterStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: '#000201',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          )}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#fa3425',
            }}
          >
            Content Creation
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Upload &amp; Assets</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#A3A3A3' }}>
              Share Google Drive, iCloud, Canva, CapCut &amp; editing links for review
            </p>
          </div>
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            style={{
              backgroundColor: '#fa3425',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showAddForm ? 'Close' : '+ Add Asset Link'}
          </button>
        </div>
      </div>

      {/* Add Cloud Link Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddAsset}
          style={{
            backgroundColor: '#F8F9FA',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <input
            type="text"
            placeholder="Asset / edit title (e.g. Pre-Season Reel v1)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              fontSize: '13px',
            }}
          />

          <input
            type="text"
            placeholder="Paste Google Drive, iCloud, Canva, CapCut, or editor link..."
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            required
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              fontSize: '13px',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value as LinkSource);
                setSourceManuallyPicked(true);
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="Google Drive">Google Drive</option>
              <option value="iCloud">iCloud</option>
              <option value="Canva">Canva</option>
              <option value="CapCut">CapCut</option>
              <option value="Other Link">Other Link</option>
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value as AssetType)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="Reel / TikTok">Reel / TikTok</option>
              <option value="YouTube Short">YouTube Short</option>
              <option value="Graphic / Thumbnail">Graphic / Thumbnail</option>
              <option value="Project / Raw">Project / Raw</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Creator name"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              fontSize: '13px',
            }}
          />

          <textarea
            placeholder="Notes (aspect ratio, access permissions, audio, or caption ideas)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          />

          <button
            type="submit"
            style={{
              backgroundColor: '#000201',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '11px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save Asset Link
          </button>
        </form>
      )}

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['All', 'In Review', 'Approved', 'Needs Tweaks'] as const).map((status) => {
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: isActive ? '1px solid #000201' : '1px solid #E5E7EB',
                backgroundColor: isActive ? '#000201' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#000201',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {status}
            </button>
          );
        })}
      </div>

      {/* Asset List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredAssets.map((asset) => {
          const statusColor =
            asset.status === 'Approved'
              ? '#034eaf'
              : asset.status === 'Needs Tweaks'
              ? '#fa3425'
              : '#696969';

          return (
            <div
              key={asset.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#034eaf',
                      textTransform: 'uppercase',
                    }}
                  >
                    {asset.source} • {asset.type}
                  </span>
                  <h3
                    style={{
                      margin: '2px 0 0',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#000201',
                    }}
                  >
                    {asset.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#696969', marginTop: '2px' }}>
                    By {asset.creator} • {asset.dateAdded}
                  </div>
                </div>

                <span
                  style={{
                    backgroundColor: statusColor,
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {asset.status}
                </span>
              </div>

              {asset.notes && (
                <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{asset.notes}</p>
              )}

              {asset.reviewFeedback && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    borderLeft: '3px solid #fa3425',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#991B1B',
                  }}
                >
                  <strong>Tweaks requested:</strong> {asset.reviewFeedback}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #034eaf',
                    color: '#034eaf',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Open in {asset.source} ↗
                </a>
                <button
                  onClick={() => updateStatus(asset.id, 'Approved')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#034eaf',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(asset.id, 'Needs Tweaks')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #fa3425',
                    backgroundColor: '#FFFFFF',
                    color: '#fa3425',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Request Tweaks
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

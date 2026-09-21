/**
 * Wise Simple Studio — AI Video & Story Animation Studio
 * 100% Client-Side Pure Studio Application
 */

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_ENDPOINT = 'https://api.groq.com/openai/v1/models';

const KNOWN_GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Recommended)', active: true },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Ultra-Fast)', active: true },
  { id: 'llama-3.2-3b-preview', label: 'Llama 3.2 3B Preview', active: true },
  { id: 'llama-3.2-1b-preview', label: 'Llama 3.2 1B Preview', active: true },
  { id: 'qwen-2.5-32b', label: 'Qwen 2.5 32B', active: true },
  { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill Llama 70B', active: true },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Deprecated)', active: false },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B (Deprecated)', active: false },
  { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B (Sunset)', active: false },
  { id: 'llama3-70b-8192', label: 'Llama 3 70B 8192 (Sunset)', active: false },
  { id: 'llama3-8b-8192', label: 'Llama 3 8B 8192 (Sunset)', active: false }
];

const DEFAULT_GROQ_MODELS = KNOWN_GROQ_MODELS.map(m => m.id);

async function loadGroqModels() {
  const key = S.apiKey || localStorage.getItem('groq-key');
  if (!key) {
    S.accessibleModelIds = new Set(KNOWN_GROQ_MODELS.filter(m => m.active).map(m => m.id));
    render();
    return;
  }

  try {
    const res = await fetch(GROQ_MODELS_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      // Key may be invalid or unauthorized; default to active known models
      S.accessibleModelIds = new Set(KNOWN_GROQ_MODELS.filter(m => m.active).map(m => m.id));
      render();
      return;
    }

    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      // Keep only text chat models that are active on this key
      const liveAccessibleIds = new Set(
        data.data
          .filter(m => m.active !== false && !m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('guard'))
          .map(m => m.id)
      );

      // Add any newly discovered live models from Groq to our catalog if not already present
      data.data.forEach(m => {
        if (!m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('guard')) {
          if (!KNOWN_GROQ_MODELS.some(km => km.id === m.id)) {
            KNOWN_GROQ_MODELS.unshift({ id: m.id, label: m.id, active: m.active !== false });
          }
        }
      });

      S.accessibleModelIds = liveAccessibleIds;

      // If current active model is disabled or not accessible on this key, switch to best accessible model
      if (!S.accessibleModelIds.has(S.activeModel)) {
        S.activeModel = S.accessibleModelIds.has('llama-3.3-70b-versatile')
          ? 'llama-3.3-70b-versatile'
          : (Array.from(S.accessibleModelIds)[0] || 'llama-3.3-70b-versatile');
        localStorage.setItem('active-model', S.activeModel);
      }
    }
  } catch (err) {
    console.warn('Could not query Groq models:', err);
    S.accessibleModelIds = new Set(KNOWN_GROQ_MODELS.filter(m => m.active).map(m => m.id));
  }

  render();
}

function renderModelSelect() {
  const accessibleSet = S.accessibleModelIds || new Set(
    KNOWN_GROQ_MODELS.filter(m => m.active).map(m => m.id)
  );

  const supportedModels = KNOWN_GROQ_MODELS.filter(m => accessibleSet.has(m.id));
  const disabledModels = KNOWN_GROQ_MODELS.filter(m => !accessibleSet.has(m.id));

  return `
    <select class="select-field" title="Active Model (Supported: ${supportedModels.length}, Disabled: ${disabledModels.length})" onchange="S.activeModel=this.value;localStorage.setItem('active-model', this.value)">
      <optgroup label="✓ Supported & Accessible Models">
        ${supportedModels.map(m => `
          <option value="${m.id}" ${m.id === S.activeModel ? 'selected' : ''}>
            ${m.label || m.id}
          </option>
        `).join('')}
      </optgroup>
      ${disabledModels.length ? `
        <optgroup label="⊘ Disabled / Unsupported Models">
          ${disabledModels.map(m => `
            <option value="${m.id}" disabled style="color:var(--text-muted);opacity:0.5">
              ${m.label || m.id} (Disabled)
            </option>
          `).join('')}
        </optgroup>
      ` : ''}
    </select>
  `;
}

const IMAGE_MODELS = [
  {
    id: 'flux',
    label: 'Flux.1 Schnell (Black Forest Labs - Free)',
    shortLabel: 'Flux.1 Schnell',
    badge: 'Free / Quality',
    desc: 'State-of-the-art open visual flow model. Exceptional character detail, prompt following & photorealism.',
    engine: 'pollinations',
    param: 'flux'
  },
  {
    id: 'turbo',
    label: 'SDXL Turbo (Stability AI - Free / Instant)',
    shortLabel: 'SDXL Turbo',
    badge: 'Free / 1-sec',
    desc: 'Ultra-fast 1-step diffusion model. Generates characters and storyboards in ~1 second.',
    engine: 'pollinations',
    param: 'turbo'
  },
  {
    id: 'flux-3d',
    label: 'Flux 3D Disney/Pixar (Free)',
    shortLabel: 'Flux 3D Pixar',
    badge: 'Free / 3D Animation',
    desc: 'Optimized for 3D CGI animation, Pixar/Disney character models, and vibrant cartoon sets.',
    engine: 'pollinations',
    param: 'flux-3d'
  },
  {
    id: 'flux-realism',
    label: 'Flux Realism (Free)',
    shortLabel: 'Flux Realism',
    badge: 'Free / Photoreal',
    desc: 'Cinematic live action, photorealistic skin textures, dramatic shadows, and natural bokeh.',
    engine: 'pollinations',
    param: 'flux-realism'
  },
  {
    id: 'flux-anime',
    label: 'Flux Anime & Ghibli (Free)',
    shortLabel: 'Flux Anime',
    badge: 'Free / Anime',
    desc: 'Hand-drawn anime aesthetic, Studio Ghibli style landscapes, and manga concept art.',
    engine: 'pollinations',
    param: 'flux-anime'
  },
  {
    id: 'sana',
    label: 'SANA 16K (NVIDIA - Free)',
    shortLabel: 'SANA (NVIDIA)',
    badge: 'Free / NVIDIA',
    desc: 'High-resolution linear-attention synthesis designed by NVIDIA.',
    engine: 'pollinations',
    param: 'sana'
  },
  {
    id: 'google-imagen',
    label: 'Google Imagen 3 (Google AI Studio)',
    shortLabel: 'Google Imagen 3',
    badge: 'Google AI / Key',
    desc: 'Google DeepMind flagship image model (Uses your Google Gemini API Key from Setup).',
    engine: 'google',
    param: 'imagen-3.0-generate-002'
  }
];

function setImageModel(modelId) {
  S.activeImageModel = modelId;
  localStorage.setItem('active-image-model', modelId);
  const found = IMAGE_MODELS.find(m => m.id === modelId);
  if (found) {
    studioLog(`🎨 Switched visual image model to: ${found.label}`);
  }
  render();
}

function renderImageModelSelect(compact = false) {
  return `
    <div style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span style="font-size:11px;font-weight:600;color:var(--text-muted);display:inline-flex;align-items:center;gap:4px">
        <i class="ti ti-photo" style="color:var(--brand)"></i> Visual:
      </span>
      <select class="select-field" title="Visual Image Model for Characters & Storyboards" onchange="setImageModel(this.value)" style="font-size:12px;padding:${compact ? '4px 8px' : '5px 10px'};background:var(--surface-2);border-color:var(--border-strong)">
        <optgroup label="✨ Popular & Free Models (No Key Needed)">
          ${IMAGE_MODELS.filter(m => m.engine === 'pollinations').map(m => `
            <option value="${m.id}" ${m.id === S.activeImageModel ? 'selected' : ''}>
              ${compact ? m.shortLabel : m.label}
            </option>
          `).join('')}
        </optgroup>
        <optgroup label="⚡ Google Visual Models (Requires Google Key)">
          ${IMAGE_MODELS.filter(m => m.engine === 'google').map(m => `
            <option value="${m.id}" ${m.id === S.activeImageModel ? 'selected' : ''}>
              ${compact ? m.shortLabel : m.label} ${!S.googleApiKey ? '(Key Needed)' : '✓'}
            </option>
          `).join('')}
        </optgroup>
      </select>
    </div>
  `;
}

const STUDIO_STYLES = {
  kids3d: {
    label: '3D Kids Animation (Pixar/Disney)',
    icon: 'ti-sparkles',
    desc: 'Vibrant, colorful, expressive characters, whimsical lighting, joyful humor'
  },
  cinematic: {
    label: 'Cinematic Live Action',
    icon: 'ti-movie',
    desc: 'Photorealistic, 35mm film look, dramatic lighting and natural depth of field'
  },
  anime: {
    label: 'Storybook & Anime',
    icon: 'ti-palette',
    desc: 'Hand-drawn anime aesthetic, painterly backgrounds, warm emotions'
  },
  cyberpunk: {
    label: 'Sci-Fi / Cyberpunk',
    icon: 'ti-cpu',
    desc: 'Futuristic, neon-lit, volumetric smoke, high-tech environments'
  },
  claymation: {
    label: 'Claymation & Stop Motion',
    icon: 'ti-ball-tennis',
    desc: 'Textured, tactile, handcrafted character models and whimsical sets'
  },
  vintage: {
    label: 'Vintage 1960s Film',
    icon: 'ti-camera',
    desc: 'Warm grain, technicolor hues, nostalgic retro cinema tone'
  }
};

const STUDIO_DURATIONS = [
  { value: '15s',  label: '15 sec', scenes: 1 },
  { value: '30s',  label: '30 sec', scenes: 2 },
  { value: '60s',  label: '1 min',  scenes: 4 },
  { value: '90s',  label: '90 sec', scenes: 6 },
  { value: '120s', label: '2 min',  scenes: 8 },
  { value: '420s', label: '7 min (Kids Epic)', scenes: 12 }
];

// ── State Management ──────────────────────────────────────────────────
const S = {
  apiKey: localStorage.getItem('groq-key') || '',
  googleApiKey: localStorage.getItem('google-key') || '',
  googleClientId: localStorage.getItem('gdrive-client-id') || '',
  googleDriveConnected: !!localStorage.getItem('gdrive-access-token'),
  googleDriveFolderId: localStorage.getItem('gdrive-folder-id') || '1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY',
  googleDriveFolderUrl: localStorage.getItem('gdrive-folder-url') || 'https://drive.google.com/drive/folders/1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY?usp=sharing',
  availableModels: [...DEFAULT_GROQ_MODELS],
  activeModel: localStorage.getItem('active-model') || 'llama-3.3-70b-versatile',
  activeImageModel: localStorage.getItem('active-image-model') || 'flux',
  modelsLoading: false,
  showSetup: false,

  // Studio Workflow Pipeline
  studioStep: 0,
  studioTopic: '',
  studioStyle: 'kids3d',
  studioDuration: '420s',
  studioAspect: '16:9',
  studioNumScenes: 12,
  studioScript: null,
  studioPrompts: [],
  studioCharacters: [],
  archivedCharacters: [],
  studioClips: [],
  studioLoading: false,
  charPromptInput: '',
  charNameInput: '',
  charRoleInput: '',
  selectedScriptChar: '',
  studioProgress: '',
  studioError: '',
  studioLogs: [],

  // Quality Validation Alert
  qualityAlert: null,

  // Interactive Story Player
  studioPlayerActive: true,
  studioPlayerCurrentScene: 0,
  studioPlayerPlaying: false,
  studioPlayerAudioMuted: false,

  // Modals
  historyModal: { open: false, filter: 'all' },
  clipCutModal: { open: false, clipIndex: null },
  exportProgressModal: { open: false, progress: 0, currentScene: 0, totalScenes: 0, statusText: '' },
  lightbox: { open: false, url: '', title: '' }
};

// Storage Helpers
const sg = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const ss = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function studioLog(msg) {
  const ts = new Date().toLocaleTimeString();
  S.studioLogs.unshift({ ts, msg });
  if (S.studioLogs.length > 50) S.studioLogs.pop();
  console.log(`[${ts}] ${msg}`);
}

function resolveAssetUrl(rel) {
  if (!rel) return '';
  if (rel.startsWith('http://') || rel.startsWith('https://') || rel.startsWith('data:')) return rel;
  return rel.replace(/^\/+/, '');
}

function renderMarkdown(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// ── Image Quality Validation Gate ─────────────────────────────────────
function testLowQualityRejection() {
  S.qualityAlert = {
    title: 'Low Quality Image Rejected',
    filename: 'blurry_sample_150x150.jpg',
    reason: 'Resolution is too low (150x150px). Minimum required character image resolution is 512x512px (file size 8.4 KB < 15 KB). Low-quality images adversely degrade video rendering. Please upload a crisp, high-resolution portrait.'
  };
  studioLog('❌ REJECTED low-quality image "blurry_sample_150x150.jpg": Resolution too low (150x150px < 512x512px)');
  render();
}

function validateCharacterImage(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ valid: false, reason: `File "${file.name}" is not a valid image format.` });
      return;
    }
    // File size check: minimum 15 KB
    if (file.size < 15 * 1024) {
      resolve({
        valid: false,
        reason: `Image file "${file.name}" is too small (${(file.size / 1024).toFixed(1)} KB). Low quality, pixelated images adversely degrade video rendering. Minimum required file size is 15 KB (recommended > 50 KB).`
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const minDim = 512;

        if (w < minDim || h < minDim) {
          resolve({
            valid: false,
            dataUrl,
            width: w,
            height: h,
            reason: `Resolution is too low (${w}x${h}px). Minimum required character image resolution is ${minDim}x${minDim}px. Low-quality images adversely affect story video rendering. Please upload a crisp, high-resolution portrait.`
          });
          return;
        }

        const ratio = w / h;
        if (ratio > 3.0 || ratio < 0.33) {
          resolve({
            valid: false,
            dataUrl,
            width: w,
            height: h,
            reason: `Extreme aspect ratio (${w}x${h}px, ratio ${ratio.toFixed(2)}:1). Please provide a standard portrait or character image.`
          });
          return;
        }

        resolve({ valid: true, dataUrl, width: w, height: h });
      };
      img.onerror = () => resolve({ valid: false, reason: `Could not decode image "${file.name}".` });
      img.src = dataUrl;
    };
    reader.onerror = () => resolve({ valid: false, reason: 'Failed to read file.' });
    reader.readAsDataURL(file);
  });
}

// ── Google Drive & Project History Manager ────────────────────────────
function getProjectHistory() {
  return sg('wise-studio-history') || [];
}

function getProjectContentFingerprint() {
  return JSON.stringify({
    topic: (S.studioTopic || '').trim(),
    style: S.studioStyle || '',
    duration: S.studioDuration || '',
    aspect: S.studioAspect || '',
    scriptTitle: S.studioScript?.title || '',
    scenes: (S.studioScript?.scenes || []).map(sc => ({
      idx: sc.sceneIndex,
      char: sc.assignedCharacterId,
      dialogue: sc.dialogue,
      narration: sc.narration
    })),
    prompts: (S.studioPrompts || []).map(p => p.prompt || p.visualPrompt || ''),
    characters: (S.studioCharacters || []).map(c => ({ id: c.id, name: c.name, url: c.url })),
    clips: (S.studioClips || []).map(c => ({ id: c.id, status: c.status, imageUrl: c.imageUrl, videoUrl: c.videoUrl, cuts: c.cuts }))
  });
}

async function saveCurrentProjectToHistory() {
  const history = getProjectHistory();
  const title = (S.studioTopic || 'Untitled Project').trim() || 'Untitled Project';
  const currentFingerprint = getProjectContentFingerprint();
  const driveToken = localStorage.getItem('gdrive-access-token');

  // Check if project has already been saved with identical content
  const latestEntry = history[0];
  const isDuplicate = latestEntry && (latestEntry.fingerprint === currentFingerprint || (
    latestEntry.title === title &&
    JSON.stringify(latestEntry.data?.studioScript) === JSON.stringify(S.studioScript) &&
    JSON.stringify(latestEntry.data?.studioPrompts) === JSON.stringify(S.studioPrompts) &&
    (latestEntry.data?.studioClips?.length || 0) === (S.studioClips?.length || 0) &&
    (latestEntry.data?.studioCharacters?.length || 0) === (S.studioCharacters?.length || 0)
  ));

  if (isDuplicate) {
    // If user connected Google Drive after saving locally, sync it now
    if (driveToken && latestEntry.source !== 'drive') {
      studioLog(`Syncing already saved project "${title}" to Google Drive folder...`);
      await saveProjectToGoogleDrive(latestEntry);
      return;
    }

    studioLog(`ℹ️ Project "${title}" is already saved. No changes made.`);
    S.historyNotice = {
      type: 'info',
      msg: `Project "${title}" is already saved — no changes detected.`
    };
    render();
    setTimeout(() => {
      if (S.historyNotice?.type === 'info') {
        S.historyNotice = null;
        render();
      }
    }, 4000);
    return;
  }

  const id = 'proj_' + Date.now();
  const previewThumb = S.studioClips?.[0]?.imageUrl || S.studioCharacters?.[0]?.url || '';

  const projectEntry = {
    id,
    title,
    fingerprint: currentFingerprint,
    style: S.studioStyle,
    duration: S.studioDuration,
    aspect: S.studioAspect,
    numScenes: S.studioScript?.scenes?.length || S.studioClips?.length || 0,
    timestamp: new Date().toISOString(),
    formattedDate: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
    previewThumb,
    source: driveToken ? 'drive' : 'local',
    data: {
      studioStep: S.studioStep,
      studioTopic: S.studioTopic,
      studioStyle: S.studioStyle,
      studioDuration: S.studioDuration,
      studioAspect: S.studioAspect,
      studioScript: S.studioScript,
      studioPrompts: S.studioPrompts,
      studioCharacters: S.studioCharacters,
      archivedCharacters: S.archivedCharacters || [],
      studioClips: S.studioClips
    }
  };

  history.unshift(projectEntry);
  if (history.length > 30) history.pop();
  ss('wise-studio-history', history);
  studioLog(`Project "${title}" saved to local history!`);

  if (!driveToken) {
    S.historyNotice = {
      type: 'info',
      msg: `Project "${title}" saved to browser cache. (Google Drive is disconnected)`
    };
    render();

    const targetUrl = 'https://drive.google.com/drive/folders/' + (S.googleDriveFolderId || '1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY');
    const wantConnect = confirm(
      `Project "${title}" has been saved in your local browser history.\n\n` +
      `⚠️ GOOGLE DRIVE IS CURRENTLY DISCONNECTED\n` +
      `To upload this project into your Google Drive folder:\n${targetUrl}\n\n` +
      `Would you like to connect Google Drive now to save it directly to Drive?`
    );
    if (wantConnect) {
      connectGoogleDrive();
    }
    return;
  }

  S.historyNotice = {
    type: 'success',
    msg: `✓ Project "${title}" saved! Uploading to Google Drive...`
  };
  render();

  await saveProjectToGoogleDrive(projectEntry);
}

async function syncProjectToDrive(id) {
  const history = getProjectHistory();
  const entry = history.find(p => p.id === id);
  if (!entry) return;

  const token = localStorage.getItem('gdrive-access-token');
  if (!token) {
    connectGoogleDrive();
    return;
  }

  studioLog(`Syncing "${entry.title}" to Google Drive...`);
  await saveProjectToGoogleDrive(entry);
}

function loadProjectFromHistory(id) {
  const history = getProjectHistory();
  const entry = history.find(p => p.id === id);
  if (!entry || !entry.data) {
    alert('Project data not found.');
    return;
  }
  Object.assign(S, entry.data);
  normalizeStudioCharacters();
  saveStudioState();
  S.historyModal.open = false;
  studioLog(`Loaded project "${entry.title}" from history.`);
  render();
}

async function deleteProjectFromHistory(id) {
  const history = getProjectHistory();
  const entry = history.find(p => p.id === id);
  if (!entry) return;
  const title = entry.title || 'Untitled Project';

  // If project is already in Archive, Step 1 is already complete -> prompt for permanent delete
  if (entry.archived) {
    const confirmDelete = confirm(
      `[Permanent Deletion]\n\n` +
      `Are you sure you want to PERMANENTLY DELETE archived project "${title}"?\n\n` +
      `⚠️ Warning: This action cannot be undone.\n\n` +
      `• Click OK to permanently delete.\n` +
      `• Click Cancel to keep it.`
    );
    if (!confirmDelete) return;

    if (entry.source === 'drive') {
      await deleteProjectFromGoogleDrive(entry);
    }
    const updated = history.filter(p => p.id !== id);
    ss('wise-studio-history', updated);
    studioLog(`✓ Project "${title}" permanently deleted.`);
    render();
    return;
  }

  // Step 1: Offer to archive first
  const wantArchive = confirm(
    `[Step 1 of 2: Archive Option]\n\n` +
    `Would you like to ARCHIVE "${title}" instead of deleting it?\n\n` +
    `• Click OK to safely Archive.\n` +
    `• Click Cancel to skip archiving and proceed to deletion.`
  );

  if (wantArchive) {
    entry.archived = true;
    entry.archivedAt = new Date().toISOString();
    if (entry.source === 'drive') {
      await archiveProjectOnGoogleDrive(entry);
    }
    const idx = history.findIndex(p => p.id === id);
    if (idx !== -1) history[idx] = entry;
    ss('wise-studio-history', history);
    studioLog(`✓ Project "${title}" archived successfully.`);
    render();
    return;
  }

  // Step 2: User chose not to archive -> confirm permanent deletion
  const confirmDelete = confirm(
    `[Step 2 of 2: Permanent Deletion]\n\n` +
    `Are you sure you want to PERMANENTLY DELETE "${title}"?\n\n` +
    `⚠️ Warning: This action cannot be undone.\n\n` +
    `• Click OK to permanently delete.\n` +
    `• Click Cancel to abort and keep the project.`
  );

  if (confirmDelete) {
    if (entry.source === 'drive') {
      await deleteProjectFromGoogleDrive(entry);
    }
    const updated = history.filter(p => p.id !== id);
    ss('wise-studio-history', updated);
    studioLog(`✓ Project "${title}" permanently deleted.`);
    render();
  } else {
    studioLog(`Deletion cancelled for "${title}".`);
  }
}

async function restoreProjectFromHistory(id) {
  const history = getProjectHistory();
  const entry = history.find(p => p.id === id);
  if (!entry) return;
  entry.archived = false;
  delete entry.archivedAt;
  if (entry.source === 'drive') {
    await restoreProjectOnGoogleDrive(entry);
  }
  const idx = history.findIndex(p => p.id === id);
  if (idx !== -1) history[idx] = entry;
  ss('wise-studio-history', history);
  studioLog(`✓ Project "${entry.title}" restored to active.`);
  render();
}

let gdriveTokenClient = null;


function extractDriveFolderId(input) {
  if (!input) return '';
  const str = String(input).trim();
  const match = str.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idMatch = str.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(str)) return str;
  return str;
}

function setTargetDriveFolder(value) {
  const cleanVal = (value || '').trim();
  const folderId = extractDriveFolderId(cleanVal) || '1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY';
  S.googleDriveFolderId = folderId;
  S.googleDriveFolderUrl = cleanVal.startsWith('http') ? cleanVal : ('https://drive.google.com/drive/folders/' + folderId);
  localStorage.setItem('gdrive-folder-id', folderId);
  localStorage.setItem('gdrive-folder-url', S.googleDriveFolderUrl);
  studioLog('Updated Google Drive target folder: ' + folderId);
  render();
}

function buildProjectSummaryText(projectEntry) {
  const data = projectEntry.data || {};
  const script = data.studioScript || {};
  const scenes = script.scenes || [];
  const chars = data.studioCharacters || [];
  const prompts = data.studioPrompts || [];

  const lines = [
    '======================================================================',
    ' WISE SIMPLE STUDIO — AI STORY & ANIMATION PROJECT',
    '======================================================================',
    `Title:        ${projectEntry.title || 'Untitled'}`,
    `Created/Saved:${projectEntry.formattedDate || new Date().toLocaleString()}`,
    `Concept/Topic:${data.studioTopic || 'N/A'}`,
    `Visual Style: ${projectEntry.style || 'kids3d'}`,
    `Duration:     ${projectEntry.duration || '420s'}`,
    `Aspect Ratio: ${projectEntry.aspect || '16:9'}`,
    `Total Scenes: ${projectEntry.numScenes || scenes.length}`,
    '',
    '----------------------------------------------------------------------',
    'STORY LOGLINE & PREMISE',
    '----------------------------------------------------------------------',
    script.logline || 'N/A',
    '',
    '----------------------------------------------------------------------',
    'CHARACTERS & CAST',
    '----------------------------------------------------------------------',
    chars.length ? chars.map((c, i) => `${i+1}. ${c.name || 'Character'} (${c.role || 'Role'}): ${c.description || 'N/A'} | Voice: ${c.voice || 'Default'}`).join('\n') : 'No characters defined.',
    '',
    '----------------------------------------------------------------------',
    'SCENE BY SCENE BREAKDOWN',
    '----------------------------------------------------------------------'
  ];

  scenes.forEach((sc, i) => {
    lines.push(`[Scene ${sc.scene || (i+1)}: ${sc.title || 'Scene ' + (i+1)} (${sc.duration || 30}s)]`);
    lines.push(`Setting:    ${sc.setting || ''}`);
    lines.push(`Action:     ${sc.visualAction || ''}`);
    lines.push(`Narration:  ${sc.narration || ''}`);
    lines.push(`Music Mood: ${sc.musicMood || ''}`);
    const p = prompts.find(pr => pr.scene === (sc.scene || (i+1)));
    if (p) {
      lines.push(`Visual Prompt: ${p.prompt}`);
    }
    lines.push('');
  });

  lines.push('======================================================================');
  lines.push('Wise Simple Studio — Autonomous Generative Animation Studio');
  lines.push('======================================================================');
  return lines.join('\n');
}

function connectGoogleDrive() {
  const clientId = S.googleClientId || localStorage.getItem('gdrive-client-id');
  if (!clientId) {
    const inputId = prompt(
      'To connect Google Drive, enter your Google Cloud OAuth 2.0 Web Client ID:\n\n' +
      '(Create this in Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client ID)',
      ''
    );
    if (!inputId) return;
    S.googleClientId = inputId.trim();
    localStorage.setItem('gdrive-client-id', S.googleClientId);
  }

  if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
    alert('Google Identity Services library is loading. Please check your internet connection and try again in a moment.');
    return;
  }

  gdriveTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: S.googleClientId,
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
    callback: async (res) => {
      if (res && res.access_token) {
        localStorage.setItem('gdrive-access-token', res.access_token);
        S.googleDriveConnected = true;
        studioLog('✓ Google Drive connected successfully!');
        // Automatically save current project to connected drive
        saveCurrentProjectToHistory();
        render();
      } else if (res && res.error) {
        console.error('Google OAuth error:', res);
        alert('Google Drive connection failed: ' + (res.error_description || res.error));
      }
    }
  });

  gdriveTokenClient.requestAccessToken({ prompt: 'consent' });
}

function disconnectGoogleDrive() {
  localStorage.removeItem('gdrive-access-token');
  S.googleDriveConnected = false;
  studioLog('Google Drive disconnected.');
  render();
}

async function syncAllLocalProjectsToDrive() {
  const token = localStorage.getItem('gdrive-access-token');
  if (!token) {
    connectGoogleDrive();
    return;
  }
  const history = getProjectHistory();
  const unsynced = history.filter(p => p.source !== 'drive');
  if (!unsynced.length) {
    alert('All projects are already synced to Google Drive!');
    return;
  }
  studioLog(`Syncing ${unsynced.length} local projects to Google Drive...`);
  for (const proj of unsynced) {
    await saveProjectToGoogleDrive(proj);
  }
  studioLog(`✓ All ${unsynced.length} projects synced to Google Drive!`);
  render();
}

async function getOrCreateDriveFolder(token, folderName, parentId = null) {
  const cleanName = folderName.trim() || 'Untitled';
  const escapedName = cleanName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  // 1. If resolving root studio folder, check configured target folder ID (1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY) first
  if (!parentId && (folderName === 'My Animation Studio' || folderName === 'Studio Root')) {
    const configuredTarget = S.googleDriveFolderId || localStorage.getItem('gdrive-folder-id') || '1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY';
    const folderId = extractDriveFolderId(configuredTarget);
    if (folderId) {
      try {
        const verifyRes = await fetch('https://www.googleapis.com/drive/v3/files/' + folderId + '?fields=id,name,webViewLink,trashed', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (verifyRes.ok) {
          const folderData = await verifyRes.json();
          if (!folderData.trashed) {
            return {
              id: folderData.id,
              name: folderData.name || cleanName,
              webViewLink: folderData.webViewLink || ('https://drive.google.com/drive/folders/' + folderData.id)
            };
          }
        } else {
          const errBody = await verifyRes.text().catch(() => '');
          console.warn(`Target folder ${folderId} verify HTTP ${verifyRes.status}:`, errBody);
          if (verifyRes.status === 401) {
            localStorage.removeItem('gdrive-access-token');
            S.googleDriveConnected = false;
            throw new Error('Google Drive session expired. Please reconnect Google Drive.');
          }
        }
      } catch (err) {
        if (err.message && err.message.includes('expired')) throw err;
        console.warn('Could not verify configured folder ID, falling back to name search:', err);
      }
    }
  }

  // 2. Query for existing folder under parentId or in Drive
  let query = "mimeType = 'application/vnd.google-apps.folder' and name = '" + escapedName + "' and trashed = false";
  if (parentId) {
    query += " and '" + parentId + "' in parents";
  }

  const searchUrl = 'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(query) + '&fields=files(id,name,webViewLink)&spaces=drive';
  const searchRes = await fetch(searchUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!searchRes.ok) {
    if (searchRes.status === 401) {
      localStorage.removeItem('gdrive-access-token');
      S.googleDriveConnected = false;
      throw new Error('Google Drive authorization expired. Please reconnect Google Drive.');
    }
    const errText = await searchRes.text().catch(() => '');
    throw new Error('Failed searching Google Drive for folder "' + cleanName + '": ' + errText);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const existing = searchData.files[0];
    return {
      id: existing.id,
      name: existing.name,
      webViewLink: existing.webViewLink || ('https://drive.google.com/drive/folders/' + existing.id)
    };
  }

  // 3. Folder does not exist, create it in root or under parentId
  studioLog('📁 Creating folder "' + cleanName + '" on Google Drive...');
  const folderMetadata = {
    name: cleanName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : ['root']
  };

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(folderMetadata)
  });

  if (!createRes.ok) {
    if (createRes.status === 401) {
      localStorage.removeItem('gdrive-access-token');
      S.googleDriveConnected = false;
      throw new Error('Google Drive authorization expired. Please reconnect Google Drive.');
    }
    const errText = await createRes.text().catch(() => '');
    throw new Error('Failed to create Google Drive folder "' + cleanName + '": ' + errText);
  }

  const newFolder = await createRes.json();
  return {
    id: newFolder.id,
    name: newFolder.name,
    webViewLink: newFolder.webViewLink || ('https://drive.google.com/drive/folders/' + newFolder.id)
  };
}

async function archiveProjectOnGoogleDrive(projectEntry) {
  const token = localStorage.getItem('gdrive-access-token');
  if (!token) return;
  try {
    studioLog(`Archiving project "${projectEntry.title}" on Google Drive...`);
    const studioFolder = await getOrCreateDriveFolder(token, 'My Animation Studio');
    const archiveFolder = await getOrCreateDriveFolder(token, 'Archive', studioFolder.id);
    const targetId = projectEntry.driveFolderId || projectEntry.driveFileId;
    if (!targetId) return;

    const moveUrl = 'https://www.googleapis.com/drive/v3/files/' + targetId + '?addParents=' + archiveFolder.id + '&removeParents=' + studioFolder.id + '&fields=id,parents';
    const moveRes = await fetch(moveUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (moveRes.ok) {
      projectEntry.archivedFolderId = archiveFolderId;
      studioLog(`✓ Moved to Google Drive: My Animation Studio / Archive / ${projectEntry.title}`);
    }
  } catch (err) {
    console.error('Google Drive archive error:', err);
  }
}

async function restoreProjectOnGoogleDrive(projectEntry) {
  const token = localStorage.getItem('gdrive-access-token');
  if (!token) return;
  try {
    studioLog(`Restoring project "${projectEntry.title}" on Google Drive...`);
    const studioFolder = await getOrCreateDriveFolder(token, 'My Animation Studio');
    const archiveFolder = await getOrCreateDriveFolder(token, 'Archive', studioFolder.id);
    const targetId = projectEntry.driveFolderId || projectEntry.driveFileId;
    if (!targetId) return;

    const moveUrl = 'https://www.googleapis.com/drive/v3/files/' + targetId + '?addParents=' + studioFolder.id + '&removeParents=' + archiveFolder.id + '&fields=id,parents';
    await fetch(moveUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    delete projectEntry.archivedFolderId;
    studioLog(`✓ Restored on Google Drive: My Animation Studio / ${projectEntry.title}`);
  } catch (err) {
    console.error('Google Drive restore error:', err);
  }
}

async function deleteProjectFromGoogleDrive(projectEntry) {
  const token = localStorage.getItem('gdrive-access-token');
  if (!token) return;
  try {
    const targetId = projectEntry.driveFolderId || projectEntry.driveFileId;
    if (!targetId) return;
    studioLog(`Deleting "${projectEntry.title}" from Google Drive...`);
    await fetch('https://www.googleapis.com/drive/v3/files/' + targetId, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    studioLog(`✓ Deleted from Google Drive: ${projectEntry.title}`);
  } catch (err) {
    console.error('Google Drive delete error:', err);
  }
}

async function saveProjectToGoogleDrive(projectEntry) {
  const token = localStorage.getItem('gdrive-access-token');
  if (!token) {
    studioLog('ℹ️ Google Drive is not connected. Connect in "History & Drive" to enable cloud backup.');
    return;
  }

  try {
    const rawTitle = (projectEntry.title || 'Untitled Project').trim() || 'Untitled Project';
    const projectTitle = rawTitle.replace(/[\\/]/g, ' - ');
    studioLog('Syncing project package to Google Drive under "My Animation Studio / ' + projectTitle + '"...');

    // 1. Ensure root studio folder 'My Animation Studio' exists (targets 1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY)
    const studioFolder = await getOrCreateDriveFolder(token, 'My Animation Studio');
    S.googleDriveStudioFolderId = studioFolder.id;
    S.googleDriveStudioFolderUrl = studioFolder.webViewLink;

    // 2. Ensure project-specific subfolder exists within studio folder
    const projectFolder = await getOrCreateDriveFolder(token, projectTitle, studioFolder.id);

    // 3. Upload project JSON file inside the project folder
    const filename = `wise_studio_${projectTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    const metadata = {
      name: filename,
      mimeType: 'application/json',
      description: `Wise Simple Studio AI Story & Video Project - ${projectTitle}`,
      parents: [projectFolder.id]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(projectEntry, null, 2)], { type: 'application/json' }));

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form
    });

    if (res.ok) {
      const driveFile = await res.json();
      projectEntry.source = 'drive';
      projectEntry.driveFileId = driveFile.id;
      projectEntry.driveFileUrl = driveFile.webViewLink || ('https://drive.google.com/file/d/' + driveFile.id + '/view');
      projectEntry.driveFolderId = projectFolder.id;
      projectEntry.driveFolderUrl = projectFolder.webViewLink || ('https://drive.google.com/drive/folders/' + projectFolder.id);
      projectEntry.driveStudioFolderId = studioFolder.id;
      projectEntry.driveStudioFolderUrl = studioFolder.webViewLink || ('https://drive.google.com/drive/folders/' + studioFolder.id);

      S.lastSavedDriveFolderUrl = projectEntry.driveFolderUrl;

      // 4. Upload human-readable PROJECT_SUMMARY.txt for easy viewing in Google Drive
      try {
        const summaryText = buildProjectSummaryText(projectEntry);
        const summaryMeta = {
          name: 'PROJECT_SUMMARY.txt',
          mimeType: 'text/plain',
          description: `Project story and prompt breakdown for ${projectTitle}`,
          parents: [projectFolder.id]
        };
        const summaryForm = new FormData();
        summaryForm.append('metadata', new Blob([JSON.stringify(summaryMeta)], { type: 'application/json' }));
        summaryForm.append('file', new Blob([summaryText], { type: 'text/plain' }));
        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: summaryForm
        });
      } catch (sumErr) {
        console.warn('Could not upload PROJECT_SUMMARY.txt:', sumErr);
      }

      // 5. Upload character portrait images if present
      const chars = projectEntry.data?.studioCharacters || [];
      for (const char of chars) {
        if (char.url && char.url.startsWith('data:image')) {
          try {
            const mimeMatch = char.url.match(/^data:([^;]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
            const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
            const base64Data = char.url.split(',')[1];
            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
            const imgBlob = new Blob([bytes], { type: mimeType });

            const charMeta = {
              name: `Character_${(char.name || 'portrait').replace(/[^a-z0-9]/gi, '_')}.${ext}`,
              mimeType: mimeType,
              description: `${char.name} character portrait for ${projectTitle}`,
              parents: [projectFolder.id]
            };
            const charForm = new FormData();
            charForm.append('metadata', new Blob([JSON.stringify(charMeta)], { type: 'application/json' }));
            charForm.append('file', imgBlob);
            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: charForm
            });
          } catch (charErr) {
            console.warn('Could not upload character portrait image:', charErr);
          }
        }
      }

      const history = getProjectHistory();
      const idx = history.findIndex(p => p.id === projectEntry.id);
      if (idx !== -1) {
        history[idx] = projectEntry;
        ss('wise-studio-history', history);
      }

      studioLog(`✓ Project saved to Google Drive: My Animation Studio / ${projectTitle}`);
      S.historyNotice = {
        type: 'success',
        msg: `✓ Project saved to Google Drive: "${projectTitle}" <a href="${projectEntry.driveFolderUrl}" target="_blank" style="color:#fff;text-decoration:underline;margin-left:6px;font-weight:700">Open in Drive ↗</a>`
      };
      render();
    } else {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP ${res.status}`;
      studioLog(`⚠️ Google Drive upload error: ${errMsg}`);
      alert(`Google Drive upload error: ${errMsg}\n\nPlease check your Google Cloud Console OAuth setup or re-connect.`);
      if (res.status === 401) {
        localStorage.removeItem('gdrive-access-token');
        S.googleDriveConnected = false;
        studioLog('⚠️ Google Drive session expired. Please reconnect.');
        render();
      }
    }
  } catch (err) {
    console.error('Google Drive upload error:', err);
    studioLog(`⚠️ Google Drive error: ${err.message || err}`);
    alert(`Google Drive upload error: ${err.message || err}`);
    render();
  }
}

// ── Studio Persistence ────────────────────────────────────────────────
function normalizeStudioCharacters() {
  if (!Array.isArray(S.studioCharacters)) {
    S.studioCharacters = [];
    return;
  }
  S.studioCharacters.forEach((c, idx) => {
    if (!c.id) {
      const desc = (c.description || '').toLowerCase();
      if (desc.includes('toby')) c.id = 'char_toby';
      else if (desc.includes('harry')) c.id = 'char_harry';
      else c.id = 'char_' + (idx + 1) + '_' + Math.random().toString(36).substring(2, 6);
    }
    if (!c.name) {
      const extracted = c.description ? c.description.split(':')[0].trim().replace(/^[^a-zA-Z0-9]+/, '') : '';
      c.name = extracted || `Character ${idx + 1}`;
    }
  });
}

function saveStudioState() {
  try {
    const state = {
      version: '2.3',
      studioStep: S.studioStep,
      studioTopic: S.studioTopic,
      studioStyle: S.studioStyle,
      studioDuration: S.studioDuration,
      studioAspect: S.studioAspect,
      studioScript: S.studioScript,
      studioPrompts: S.studioPrompts,
      studioCharacters: S.studioCharacters,
      studioClips: S.studioClips
    };
    ss('wise-studio-state', state);
  } catch (_) {}
}

function restoreStudioState() {
  try {
    const saved = sg('wise-studio-state');
    if (saved && saved.version === '2.3' && saved.studioScript && Array.isArray(saved.studioScript.scenes)) {
      const charUrls = new Set((saved.studioCharacters || []).map(c => c.url));
      // Check if clips incorrectly have character portraits instead of distinct scene visuals
      const hasDuplicateSheets = Array.isArray(saved.studioClips) && saved.studioClips.length > 1 && saved.studioClips.every(c => !c.imageUrl || charUrls.has(c.imageUrl));
      if (!hasDuplicateSheets) {
        Object.assign(S, saved);
        normalizeStudioCharacters();
        return true;
      }
    }
  } catch (_) {}
  return false;
}

// ── Sample Story Loader (7-Minute Kids Epic) ──────────────────────────
async function loadSampleEpic() {
  try {
    S.studioLoading = true;
    S.studioProgress = 'Loading 7-Minute Kids Epic Story...';
    render();
    const res = await fetch('epic_state.json');
    if (!res.ok) throw new Error('Could not load epic_state.json');
    const data = await res.json();
    Object.assign(S, data);
    S.studioStep = 0; // Default selected tab is Concept
    normalizeStudioCharacters();
    saveStudioState();
    studioLog('Loaded 7-Minute Kids Epic: 12 scenes, character art, and ready clips!');
  } catch (e) {
    S.studioError = e.message;
  }
  S.studioLoading = false;
  S.studioProgress = '';
  render();
}

// ── Project Import & Export ───────────────────────────────────────────
function exportStudioJSON() {
  const data = {
    studioStep: S.studioStep,
    studioTopic: S.studioTopic,
    studioStyle: S.studioStyle,
    studioDuration: S.studioDuration,
    studioAspect: S.studioAspect,
    studioScript: S.studioScript,
    studioPrompts: S.studioPrompts,
    studioCharacters: S.studioCharacters,
    studioClips: S.studioClips
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wise_studio_${(S.studioTopic || 'project').substring(0, 24).replace(/[^a-z0-9]/gi, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  studioLog('Project JSON exported!');
}

function importStudioJSON(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.studioScript) {
        Object.assign(S, data);
        normalizeStudioCharacters();
        saveStudioState();
        studioLog(`Successfully imported project: ${S.studioTopic || 'Custom Story'}`);
        render();
      } else {
        alert('Invalid Studio Project JSON file.');
      }
    } catch (err) {
      alert('Failed to parse JSON file: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function exportStudioScript() {
  if (!S.studioScript) return;
  const scenes = (S.studioScript.scenes || []).map(sc =>
    `SCENE ${sc.sceneNum || ''}: ${sc.title || ''} (${sc.duration || 0}s)\n` +
    `Environment: ${sc.environment || ''}\n` +
    `Mood: ${sc.mood || ''} | Camera: ${sc.camera || ''}\n` +
    `Sound Cue: ${sc.soundEffect || 'none'}\n` +
    `Narration: "${sc.narration || ''}"\n` +
    (sc.dialogue ? `Dialogue: "${sc.dialogue}"\n` : '')
  ).join('\n---\n\n');

  const text = `TITLE: ${S.studioTopic}\nSTYLE: ${STUDIO_STYLES[S.studioStyle]?.label || S.studioStyle}\nDURATION: ${S.studioDuration}\n\nCHARACTERS:\n${S.studioScript.mainCharacter || ''}\n\nNARRATOR INTRODUCTION & MORAL:\n${S.studioScript.narrator || ''}\n\n=== SCENE BY SCENE SCRIPT ===\n\n${scenes}`;

  navigator.clipboard.writeText(text).then(() => {
    studioLog('Full script copied to clipboard!');
    S.studioProgress = 'Full script copied to clipboard!';
    render();
    setTimeout(() => { S.studioProgress = ''; render(); }, 3000);
  }).catch(() => {
    prompt('Copy your full script:', text);
  });
}

function exportStudioPrompts() {
  const lines = (S.studioPrompts || []).map((p, i) =>
    `=== SCENE ${i+1}: ${p.title} ===\nDuration: ${p.duration}s | Camera: ${p.cameraMove}\n\nPROMPT:\n${p.veoPrompt}\n\nNEGATIVE:\n${p.negativePrompt || 'none'}\n`
  ).join('\n---\n\n');

  const fullText = `AI VIDEO STUDIO — CINEMATIC PROMPTS\nTopic: ${S.studioTopic}\nStyle: ${STUDIO_STYLES[S.studioStyle]?.label || S.studioStyle}\nDuration: ${S.studioDuration}\nAspect: ${S.studioAspect}\n\n${S.studioScript?.mainCharacter && S.studioScript.mainCharacter !== 'none' ? 'CHARACTER: ' + S.studioScript.mainCharacter + '\n\n' : ''}${lines}`;

  navigator.clipboard.writeText(fullText).then(() => {
    studioLog('All prompts copied to clipboard!');
    S.studioProgress = 'Prompts copied to clipboard!';
    render();
    setTimeout(() => { S.studioProgress = ''; render(); }, 3000);
  }).catch(() => {
    prompt('Copy your prompts:', fullText);
  });
}

// ── Groq API Client ───────────────────────────────────────────────────
async function callGroq(prompt, maxTokens = 3000) {
  if (!S.apiKey) throw new Error('API key missing. Please configure your Groq API key.');
  if (!S.activeModel) S.activeModel = 'llama-3.3-70b-versatile';

  const requestBody = {
    model: S.activeModel,
    max_tokens: maxTokens,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: 'system', content: 'You are an AI screenwriter and video director. You must always return a strictly valid standard JSON object. Never use ellipses (...), never omit array items, and never use markdown code fences.' },
      { role: 'user', content: prompt }
    ]
  };

  let res = await fetch(GROQ_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${S.apiKey}` },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok && res.status === 400) {
    delete requestBody.response_format;
    res = await fetch(GROQ_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${S.apiKey}` },
      body: JSON.stringify(requestBody)
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error HTTP ${res.status}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(clean);
}

// ── Step 0 -> Step 1: Script Generation ───────────────────────────────
async function generateStudioScript() {
  if (!S.apiKey) { S.showSetup = true; render(); return; }
  if (!S.studioTopic.trim()) { S.studioError = 'Enter a story concept first.'; render(); return; }

  const numScenes = STUDIO_DURATIONS.find(d => d.value === S.studioDuration)?.scenes || 4;
  S.studioNumScenes = numScenes;
  S.studioLoading = true;
  S.studioError = '';
  S.studioProgress = 'Generating rich scene-by-scene script with Groq...';
  studioLog('Starting script generation...');
  render();

  const styleInfo = STUDIO_STYLES[S.studioStyle] || STUDIO_STYLES.kids3d;
  const isKids = S.studioStyle === 'kids3d' || S.studioStyle === 'anime' || S.studioDuration === '420s' || S.studioTopic.toLowerCase().includes('kids');

  const prompt = `You are a world-class children's storyteller, animation director, and screenwriter specializing in Pixar and Disney-quality animated videos.
Create a detailed, extremely engaging, and captivating scene-by-scene script.

STORY CONCEPT: "${S.studioTopic.trim()}"
VISUAL STYLE: ${styleInfo.label} — ${styleInfo.desc}
TARGET DURATION: ${S.studioDuration === '420s' ? '7 minutes full episodic special' : S.studioDuration.replace('s',' seconds')}
NUMBER OF SCENES: exactly ${numScenes}
ASPECT RATIO: ${S.studioAspect}
${isKids ? 'TARGET AUDIENCE: 5 to 8 years old kids. Tone must be lively, funny, colorful, full of laughter and wonder. Include comical physical gags, entertaining sound effect cues [BOING!], [ZOOM!], [CRUNCH!], [SNORE!], enthusiastic narrator voice, relatable character dialogue, suspenseful twists, and an empowering moral lesson (being clever, disciplined, humble and kind).' : ''}

For EACH scene, provide:
- "sceneNum": scene number (1 to ${numScenes})
- "title": short snappy descriptive title (e.g. "The Overconfident Nap", "Toby's Secret Plan")
- "description": 2-3 sentences describing what happens visually in the animated world
- "environment": specific setting/location details (vibrant rolling green hills, golden carrot patches, finish line arch)
- "mood": emotional tone (e.g. "playful", "tense", "hilarious", "triumphant")
- "lighting": specific lighting setup (e.g. "bright cheerful morning sunlight", "sparkling golden hour rays")
- "camera": camera movement and lens (e.g. "wide sweeping crane shot", "close-up tracking shot")
- "narration": 1-2 cheerful, lively spoken sentences for the voiceover narrator suitable for children aged 5-8
- "dialogue": snappy, funny character spoken line with speaker name (e.g. "Hare: 'Eat my dust, slowpoke!'")
- "soundEffect": comical sound cue like "[ZOOM!]", "[BOING!]", "[CRUNCH CRUNCH!]", "[WHEEL SPIN!]"
- "characters": array of character names appearing in this scene
- "duration": approximate seconds for this scene (total summing up to target duration)

Also provide:
- "mainCharacter": a detailed physical description of the primary characters (e.g. "Toby: a determined little green tortoise with a polished jade shell and friendly amber eyes; Harry: a lanky brown hare with tall floppy ears and a proud smirk")
- "narrator": 2-3 sentence inspiring introduction and moral takeaway for the overall video

Return ONLY valid JSON:
{
  "mainCharacter": "detailed character descriptions",
  "narrator": "overall narration and moral",
  "scenes": [
    {
      "sceneNum": 1,
      "title": "Scene Title",
      "description": "Visual action",
      "environment": "Setting details",
      "mood": "Tone",
      "lighting": "Lighting",
      "camera": "Camera move",
      "narration": "Narrator voice line",
      "dialogue": "Character spoken line",
      "soundEffect": "[SFX]",
      "characters": ["Character 1", "Character 2"],
      "duration": 35
    }
  ]
}`;

  try {
    const result = await callGroq(prompt, 3200);
    (result.scenes || []).forEach(sc => {
      sc.assignedCharacterId = null;
    });
    S.studioScript = result;
    S.studioStep = 1;
    saveStudioState();
    studioLog(`Script generated: ${(result.scenes || []).length} scenes`);
  } catch (e) {
    S.studioError = e.message;
    studioLog('Script generation failed: ' + e.message);
  }
  S.studioLoading = false;
  S.studioProgress = '';
  render();
}

// ── Step 1 -> Step 2: Prompt Expansion ────────────────────────────────
function generateFallbackPrompts(script) {
  const rawScenes = Array.isArray(script) ? script : (script?.scenes || script?.script?.scenes || []);
  const styleInfo = STUDIO_STYLES[S.studioStyle] || STUDIO_STYLES.kids3d;
  const styleDesc = styleInfo.promptDesc || styleInfo.desc || styleInfo.label;
  const mainChar = (typeof script?.mainCharacter === 'string' && script.mainCharacter !== 'none') ? script.mainCharacter : '';

  return rawScenes.map((s, idx) => {
    const sceneNum = s.sceneNum || (idx + 1);
    const title = s.title || `Scene ${sceneNum}`;
    const camera = s.camera || 'Cinematic tracking shot, 35mm lens, smooth fluid motion';
    const lighting = s.lighting || 'Warm volumetric golden lighting, soft cinematic shadows, ambient occlusion';
    const env = s.environment || 'Detailed vibrant cinematic background, rich textures';
    const action = s.visualAction || s.description || s.narration || '';
    const chars = Array.isArray(s.characters) ? s.characters.join(', ') : (s.characters || mainChar || '');

    const veoPrompt = `${styleDesc}, ${title}. ${action}. ${chars ? 'Characters: ' + chars + '. ' : ''}Setting: ${env}. Lighting: ${lighting}. Camera: ${camera}, smooth cinematic movement, ultra-detailed 8k render, Unreal Engine 5 aesthetic, photorealistic textures, Disney Pixar animation feature film quality.`;

    const negativePrompt = 'blurry, distorted, grainy, low resolution, ugly, duplicate, mutilated, watermark, bad anatomy, out of frame, text artifacts';
    const cameraMove = s.camera || 'Smooth cinematic push-in';

    return {
      sceneNum,
      title,
      veoPrompt,
      negativePrompt,
      cameraMove,
      duration: s.duration || 30
    };
  });
}

function extractPromptsFromResult(result) {
  if (!result) return null;
  if (Array.isArray(result) && result.length) return result;
  if (Array.isArray(result.prompts) && result.prompts.length) return result.prompts;
  if (Array.isArray(result.scenes) && result.scenes.length) return result.scenes;
  if (Array.isArray(result.videoPrompts) && result.videoPrompts.length) return result.videoPrompts;
  if (Array.isArray(result.data) && result.data.length) return result.data;
  for (const val of Object.values(result)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') return val;
  }
  return null;
}

async function expandStudioPrompts() {
  const rawScenes = Array.isArray(S.studioScript)
    ? S.studioScript
    : (S.studioScript?.scenes || S.studioScript?.script?.scenes || []);

  if (!rawScenes.length) {
    S.studioError = 'Please generate or add scenes to your script first.';
    render();
    return;
  }

  // Ensure script is properly shaped
  if (!S.studioScript.scenes) {
    S.studioScript = {
      mainCharacter: S.studioScript?.mainCharacter || '',
      narrator: S.studioScript?.narrator || '',
      scenes: rawScenes
    };
  }

  S.studioLoading = true;
  S.studioError = '';
  S.studioProgress = 'Expanding scenes into cinematic prompts...';
  studioLog('Expanding scenes into prompts...');
  render();

  const fallback = generateFallbackPrompts(S.studioScript);

  // If no Groq API key is configured, immediately use high-quality local generator
  if (!S.apiKey) {
    S.studioPrompts = fallback;
    S.studioStep = 2;
    S.studioLoading = false;
    S.studioProgress = '';
    saveStudioState();
    studioLog(`✓ Expanded ${S.studioPrompts.length} cinematic prompts using built-in engine.`);
    render();
    return;
  }

  const styleInfo = STUDIO_STYLES[S.studioStyle] || STUDIO_STYLES.kids3d;
  const mainChar = S.studioScript.mainCharacter || 'none';

  const prompt = `You are a cinematic AI video prompt engineer specializing in Google Veo 2 and state of the art video generators.
Convert each scene into a production-ready video generation prompt.

STYLE: ${styleInfo.label} — ${styleInfo.desc}
ASPECT RATIO: ${S.studioAspect}
MAIN CHARACTER: ${mainChar}

SCENES:
${JSON.stringify(rawScenes.map(s => ({
  sceneNum: s.sceneNum,
  title: s.title,
  description: s.description || s.visualAction,
  environment: s.environment,
  mood: s.mood,
  lighting: s.lighting,
  camera: s.camera,
  characters: s.characters,
  duration: s.duration
})))}

For EACH scene, provide:
- "sceneNum": scene number
- "title": scene title
- "veoPrompt": detailed cinematic prompt (focus on lighting, motion, camera angle, character expressions, style consistency)
- "negativePrompt": negative prompt to prevent artifacts
- "cameraMove": short camera direction (e.g. "Slow pan right", "Orbit tracking shot", "Static push-in")
- "duration": seconds

Return ONLY valid JSON:
{
  "prompts": [
    {
      "sceneNum": 1,
      "title": "Title",
      "veoPrompt": "Cinematic prompt...",
      "negativePrompt": "blurry, low quality, distorted",
      "cameraMove": "Camera motion",
      "duration": 35
    }
  ]
}`;

  try {
    let result = null;
    try {
      result = await callGroq(prompt, 4096);
    } catch (callErr) {
      // If primary model failed (e.g. rate limit 429), try ultra-fast instant model as fallback
      if (S.activeModel !== 'llama-3.1-8b-instant') {
        studioLog(`Primary model busy, retrying with Llama 3.1 8B Instant...`);
        const prevModel = S.activeModel;
        S.activeModel = 'llama-3.1-8b-instant';
        try {
          result = await callGroq(prompt, 4096);
        } finally {
          S.activeModel = prevModel;
        }
      } else {
        throw callErr;
      }
    }

    const extracted = extractPromptsFromResult(result);
    if (extracted && extracted.length) {
      S.studioPrompts = extracted.map((p, idx) => ({
        sceneNum: p.sceneNum || (idx + 1),
        title: p.title || rawScenes[idx]?.title || `Scene ${idx + 1}`,
        veoPrompt: p.veoPrompt || p.prompt || fallback[idx]?.veoPrompt || '',
        negativePrompt: p.negativePrompt || 'blurry, low quality, distorted',
        cameraMove: p.cameraMove || p.camera || 'Cinematic camera move',
        duration: p.duration || rawScenes[idx]?.duration || 30
      }));
    } else {
      console.warn('Groq returned unrecognized format, using fallback prompts');
      S.studioPrompts = fallback;
    }

    S.studioStep = 2;
    saveStudioState();
    studioLog(`✓ Expanded ${S.studioPrompts.length} cinematic prompts.`);
  } catch (e) {
    console.warn('Groq prompt expansion error, using fallback prompts:', e);
    S.studioPrompts = fallback;
    S.studioStep = 2;
    saveStudioState();
    studioLog(`✓ Expanded ${S.studioPrompts.length} cinematic prompts (used built-in engine).`);
  }

  S.studioLoading = false;
  S.studioProgress = '';
  render();
}

// ── Step 3: Character Studio & Mandatory Scene Assignment ─────────────

function getUnassignedScenes() {
  const scenes = S.studioScript?.scenes || [];
  const charIds = new Set((S.studioCharacters || []).map(c => c.id));
  return scenes.filter((sc) => !sc.assignedCharacterId || !charIds.has(sc.assignedCharacterId));
}

function assignCharacterToScene(sceneIdx, charId) {
  if (!S.studioScript?.scenes?.[sceneIdx]) return;
  S.studioScript.scenes[sceneIdx].assignedCharacterId = charId || null;

  const char = (S.studioCharacters || []).find(c => c.id === charId);
  if (char && S.studioClips?.[sceneIdx]) {
    S.studioClips[sceneIdx].characterId = char.id;
    S.studioClips[sceneIdx].characterName = char.name;
    S.studioClips[sceneIdx].characterUrl = char.url;
    if (!S.studioClips[sceneIdx].imageUrl) {
      S.studioClips[sceneIdx].imageUrl = char.url;
    }
  }

  saveStudioState();
  studioLog(`Scene ${sceneIdx + 1} assigned to ${char ? char.name : 'None'}`);
  render();
}

function assignCharacterToAllScenes(charId) {
  if (!S.studioScript?.scenes?.length) return;
  const char = (S.studioCharacters || []).find(c => c.id === charId);
  S.studioScript.scenes.forEach((sc, idx) => {
    sc.assignedCharacterId = charId || null;
    if (char && S.studioClips?.[idx]) {
      S.studioClips[idx].characterId = char.id;
      S.studioClips[idx].characterName = char.name;
      S.studioClips[idx].characterUrl = char.url;
      if (!S.studioClips[idx].imageUrl) {
        S.studioClips[idx].imageUrl = char.url;
      }
    }
  });
  saveStudioState();
  studioLog(`Assigned "${char ? char.name : 'None'}" to all ${S.studioScript.scenes.length} scenes!`);
  render();
}

function autoMatchScriptCharacters() {
  if (!S.studioScript?.scenes?.length || !S.studioCharacters?.length) return;
  let matchedCount = 0;

  if (S.studioCharacters.length === 1) {
    assignCharacterToAllScenes(S.studioCharacters[0].id);
    return;
  }

  S.studioScript.scenes.forEach((sc, idx) => {
    if (sc.assignedCharacterId) return;
    const sceneText = `${sc.title || ''} ${sc.description || ''} ${sc.narration || ''} ${sc.dialogue || ''} ${(sc.characters || []).join(' ')}`.toLowerCase();
    for (const ch of S.studioCharacters) {
      const chName = (ch.name || '').toLowerCase();
      const firstName = chName.split(' ')[0];
      if ((firstName.length > 2 && sceneText.includes(firstName)) || (chName.length > 2 && sceneText.includes(chName))) {
        sc.assignedCharacterId = ch.id;
        if (S.studioClips?.[idx]) {
          S.studioClips[idx].characterId = ch.id;
          S.studioClips[idx].characterName = ch.name;
          S.studioClips[idx].characterUrl = ch.url;
        }
        matchedCount++;
        break;
      }
    }
  });

  saveStudioState();
  studioLog(`Auto-matched ${matchedCount} scene(s) to characters.`);
  render();
}

function deleteStudioCharacter(charId) {
  const char = (S.studioCharacters || []).find(c => c.id === charId);
  const charName = char?.name || 'this character';

  // Step 1: Offer to archive
  const wantArchive = confirm(
    `[Step 1 of 2: Archive Option]\n\n` +
    `Would you like to ARCHIVE character "${charName}" instead of deleting it?\n\n` +
    `• Click OK to safely Archive.\n` +
    `• Click Cancel to skip archiving and proceed to deletion.`
  );

  if (wantArchive) {
    if (!Array.isArray(S.archivedCharacters)) S.archivedCharacters = [];
    const archivedChar = { ...char, archivedAt: new Date().toISOString() };
    S.archivedCharacters.push(archivedChar);
    S.studioCharacters = (S.studioCharacters || []).filter(c => c.id !== charId);
    (S.studioScript?.scenes || []).forEach(sc => {
      if (sc.assignedCharacterId === charId) {
        sc.assignedCharacterId = null;
      }
    });
    saveStudioState();
    studioLog(`✓ Character "${charName}" archived.`);
    render();
    return;
  }

  // Step 2: Confirm permanent deletion
  const confirmDelete = confirm(
    `[Step 2 of 2: Permanent Deletion]\n\n` +
    `Are you sure you want to PERMANENTLY DELETE character "${charName}"?\n\n` +
    `⚠️ Warning: This action cannot be undone.\n\n` +
    `• Click OK to permanently delete.\n` +
    `• Click Cancel to abort.`
  );

  if (confirmDelete) {
    S.studioCharacters = (S.studioCharacters || []).filter(c => c.id !== charId);
    (S.studioScript?.scenes || []).forEach(sc => {
      if (sc.assignedCharacterId === charId) {
        sc.assignedCharacterId = null;
      }
    });
    saveStudioState();
    studioLog(`✓ Character "${charName}" permanently deleted.`);
    render();
  } else {
    studioLog(`Deletion cancelled for character "${charName}".`);
  }
}

function restoreStudioCharacter(charId) {
  const char = (S.archivedCharacters || []).find(c => c.id === charId);
  if (!char) return;
  if (!Array.isArray(S.studioCharacters)) S.studioCharacters = [];
  const restored = { ...char };
  delete restored.archivedAt;
  S.studioCharacters.push(restored);
  S.archivedCharacters = (S.archivedCharacters || []).filter(c => c.id !== charId);
  saveStudioState();
  studioLog(`✓ Character "${char.name || 'Character'}" restored.`);
  render();
}

function deleteArchivedCharacter(charId) {
  const char = (S.archivedCharacters || []).find(c => c.id === charId);
  const charName = char?.name || 'this character';
  if (!confirm(`Are you sure you want to PERMANENTLY delete archived character "${charName}"?\n\n⚠️ This cannot be undone.`)) return;
  S.archivedCharacters = (S.archivedCharacters || []).filter(c => c.id !== charId);
  saveStudioState();
  studioLog(`✓ Archived character "${charName}" permanently deleted.`);
  render();
}

async function handleCharacterUpload(event) {
  const files = event.target?.files;
  if (!files || !files.length) return;

  const fileList = Array.from(files);
  let accepted = 0;
  S.qualityAlert = null;

  for (const file of fileList) {
    const check = await validateCharacterImage(file);
    if (!check.valid) {
      S.qualityAlert = {
        title: 'Low Quality Image Rejected',
        filename: file.name,
        reason: check.reason
      };
      studioLog(`❌ REJECTED low-quality image "${file.name}": ${check.reason}`);
      continue;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
    const charName = prompt(`Enter Character Name for "${file.name}" (${check.width}x${check.height}px HD):`, baseName) || baseName;
    const charId = 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    if (!S.studioCharacters) S.studioCharacters = [];
    S.studioCharacters.push({
      id: charId,
      name: charName,
      url: check.dataUrl,
      description: `Uploaded character: ${charName} (${check.width}x${check.height}px HD)`
    });
    accepted++;
    studioLog(`✓ Accepted high-quality character image "${charName}" (${check.width}x${check.height}px)`);
  }

  if (accepted > 0) {
    autoMatchScriptCharacters();
    saveStudioState();
  }
  if (event.target) event.target.value = '';
  render();
}

function handleCharacterDrop(event) {
  event.preventDefault();
  event.currentTarget.style.borderColor = '';
  const dt = event.dataTransfer;
  if (dt && dt.files && dt.files.length) {
    handleCharacterUpload({ target: { files: dt.files } });
  }
}


// ── AI Character Creation & Prompt Generation Studio ────────────────
function detectStoryCharacters() {
  const list = [];
  const seen = new Set();

  function addChar(name, desc) {
    if (!name) return;
    const cleanName = name.trim().replace(/^[^a-zA-Z0-9]+/, '').replace(/[:\-].*$/, '').trim();
    if (!cleanName || cleanName.length < 2) return;
    const key = cleanName.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      list.push({ name: cleanName, description: (desc || '').trim() });
    }
  }

  // 1. Check S.studioScript.mainCharacter
  if (S.studioScript?.mainCharacter && S.studioScript.mainCharacter !== 'none') {
    const raw = S.studioScript.mainCharacter;
    const parts = raw.split(/[;\n]/);
    parts.forEach(p => {
      if (p.includes(':')) {
        const [n, ...rest] = p.split(':');
        addChar(n, rest.join(':'));
      } else {
        addChar(p, raw);
      }
    });
  }

  // 2. Check scenes[].characters
  const scenes = S.studioScript?.scenes || [];
  scenes.forEach(sc => {
    if (Array.isArray(sc.characters)) {
      sc.characters.forEach(c => addChar(c, `Appears in ${sc.title || 'story'}`));
    } else if (typeof sc.characters === 'string') {
      sc.characters.split(/[,;\n]/).forEach(c => addChar(c, `Appears in ${sc.title || 'story'}`));
    }
  });

  // 3. Check existing studioCharacters
  (S.studioCharacters || []).forEach(c => {
    addChar(c.name, c.description);
  });

  return list;
}

function generateSampleCharacterPrompt(charName = '', charDesc = '') {
  const name = (charName || S.charNameInput || 'Hero Character').trim();
  const desc = (charDesc || S.charRoleInput || (S.studioScript?.mainCharacter || S.studioTopic || 'animated protagonist')).trim();
  const styleInfo = STUDIO_STYLES[S.studioStyle] || STUDIO_STYLES.kids3d;
  const styleLabel = styleInfo.label;
  const styleDesc = styleInfo.desc || '';

  const scenes = S.studioScript?.scenes || [];
  const envContext = scenes[0]?.environment || 'vibrant cinematic world';

  let prompt = `Character portrait of ${name}, ${desc}. ${styleLabel} aesthetic (${styleDesc}), 3D Disney Pixar animated feature film concept art, expressive friendly face, charming eyes with vibrant specular highlights, detailed clothing and textures, soft studio rim lighting, volumetric soft shadows, 8k render, octane render, clean studio background, centered character portrait.`;

  if (S.studioStyle === 'anime') {
    prompt = `Character portrait concept art of ${name}, ${desc}. Studio Ghibli and Makoto Shinkai inspired high quality anime art style, vibrant colors, expressive eyes, hand-drawn anime aesthetic, detailed hair, clean studio lighting, 8k masterpiece.`;
  } else if (S.studioStyle === 'clay') {
    prompt = `Character portrait model of ${name}, ${desc}. Stop-motion claymation and plasticine style, Aardman Wallace and Gromit aesthetic, tactile clay textures with subtle fingerprint impressions, warm studio lighting, 8k macro photography render.`;
  } else if (S.studioStyle === 'storybook') {
    prompt = `Classic storybook watercolor illustration of ${name}, ${desc}. Beatrix Potter and vintage fairytale book illustration, soft pencil outlines, delicate watercolor washes, warm paper texture, whimsical, charming, high resolution.`;
  } else if (S.studioStyle === 'retro') {
    prompt = `Retro 1930s rubber hose cartoon character illustration of ${name}, ${desc}. Vintage classic animation style, Cuphead and early Fleischer studio aesthetic, bold ink lines, monochrome or vintage Technicolor, film grain, charming vintage cartoon.`;
  }

  return prompt;
}

function handleSelectScriptChar(name) {
  S.selectedScriptChar = name;
  if (name === '__new__') {
    S.charNameInput = '';
    S.charRoleInput = '';
    S.charPromptInput = '';
    render();
    return;
  }
  const chars = detectStoryCharacters();
  const found = chars.find(c => c.name === name);
  if (found) {
    S.charNameInput = found.name;
    S.charRoleInput = found.description;
    S.charPromptInput = generateSampleCharacterPrompt(found.name, found.description);
    render();
  }
}

function handleGenerateSamplePrompt() {
  const name = S.charNameInput.trim() || 'Hero Character';
  const role = S.charRoleInput.trim() || '';
  S.charPromptInput = generateSampleCharacterPrompt(name, role);
  render();
}

function appendPromptModifier(mod) {
  const current = S.charPromptInput || '';
  if (!current.includes(mod)) {
    S.charPromptInput = current ? `${current.trim()}, ${mod}` : mod;
    render();
  }
}

function editCharacterPrompt(id) {
  const char = (S.studioCharacters || []).find(c => c.id === id);
  if (char) {
    S.charNameInput = char.name;
    S.charRoleInput = char.description || '';
    S.charPromptInput = char.prompt || generateSampleCharacterPrompt(char.name, char.description);
    render();
    window.scrollTo({ top: 180, behavior: 'smooth' });
  }
}

function generateLocalCharacterAvatar(name, role) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 768, 768);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#3b82f6');
    grad.addColorStop(1, '#10b981');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 768, 768);

    ctx.beginPath();
    ctx.arc(384, 384, 250, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#34d399';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(384, 310, 110, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(340, 300, 14, 0, Math.PI * 2);
    ctx.arc(428, 300, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(384, 335, 36, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(384, 560, 180, 120, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, 384, 690);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '20px sans-serif';
    ctx.fillText((role || 'Character Portrait').substring(0, 45), 384, 730);

    return canvas.toDataURL('image/png');
  } catch (e) {
    return '';
  }
}

async function generateCharacterFromPrompt(customPrompt, customName, customDesc) {
  const name = (customName || S.charNameInput || 'Character').trim();
  const desc = (customDesc || S.charRoleInput || '').trim();
  const prompt = (customPrompt || S.charPromptInput || generateSampleCharacterPrompt(name, desc)).trim();

  const currentImgModel = (typeof IMAGE_MODELS !== 'undefined' ? IMAGE_MODELS.find(m => m.id === S.activeImageModel) : null) || { label: 'Flux.1 Schnell', shortLabel: 'Flux.1', engine: 'pollinations', param: 'flux' };
  S.studioLoading = true;
  S.studioError = '';
  S.studioProgress = `Generating portrait for "${name}" with ${currentImgModel.shortLabel || currentImgModel.label}...`;
  studioLog(`🎨 Generating character portrait for "${name}" using ${currentImgModel.label}...`);
  render();

  try {
    let finalUrl = '';
    const cleanPrompt = prompt.replace(/[\r\n]+/g, ' ').trim();
    const encodedPrompt = encodeURIComponent(cleanPrompt.substring(0, 350));
    const seed = Math.floor(Math.random() * 900000) + 100000;

    // 1. If Google Imagen 3 selected and key available
    if (S.activeImageModel === 'google-imagen' && S.googleApiKey) {
      try {
        const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${S.googleApiKey}`;
        const res = await fetch(imagenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: cleanPrompt }],
            parameters: { sampleCount: 1, aspectRatio: '1:1' }
          })
        });
        if (res.ok) {
          const imgData = await res.json();
          const b64 = imgData.predictions?.[0]?.bytesBase64Encoded;
          if (b64) {
            finalUrl = `data:image/png;base64,${b64}`;
            studioLog(`✓ Generated "${name}" portrait via Google Imagen 3!`);
          }
        }
      } catch (e) {
        console.warn('Google Imagen 3 API attempt failed, falling back to free visual model:', e);
      }
    }

    // 2. Visual Model via Pollinations AI
    if (!finalUrl) {
      const modelParam = currentImgModel.engine === 'pollinations' ? currentImgModel.param : 'flux';
      finalUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true&seed=${seed}&model=${modelParam}`;
    }

    // 3. Attempt quick preload to base64 Data URL (max 4s timeout, falls back to direct URL)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const imgRes = await fetch(finalUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (imgRes && imgRes.ok) {
        const blob = await imgRes.blob();
        if (blob && blob.size > 1000) {
          finalUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch (fetchErr) {
      // In browser, finalUrl renders smoothly via <img> tag directly
    }

    // 4. Fallback if empty
    if (!finalUrl) {
      finalUrl = generateLocalCharacterAvatar(name, desc);
    }

    const charId = 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    if (!S.studioCharacters) S.studioCharacters = [];

    const existingIdx = S.studioCharacters.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    const charObj = {
      id: existingIdx !== -1 ? S.studioCharacters[existingIdx].id : charId,
      name: name,
      url: finalUrl,
      description: desc || prompt.substring(0, 120),
      prompt: prompt
    };

    if (existingIdx !== -1) {
      S.studioCharacters[existingIdx] = charObj;
      studioLog(`Updated portrait for character "${name}".`);
    } else {
      S.studioCharacters.push(charObj);
      studioLog(`✓ Added character "${name}" to studio cast!`);
    }

    autoMatchScriptCharacters();
    saveStudioState();
    S.studioStep = 3;
  } catch (err) {
    console.error('Character generation error:', err);
    S.studioError = 'Character generation notice: ' + err.message;
    studioLog('⚠️ ' + err.message);
    // Ensure avatar is still created so pipeline proceeds smoothly
    const fallbackUrl = generateLocalCharacterAvatar(name, desc);
    const charId = 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    if (!S.studioCharacters) S.studioCharacters = [];
    S.studioCharacters.push({ id: charId, name: name, url: fallbackUrl, description: desc, prompt: prompt });
    autoMatchScriptCharacters();
    saveStudioState();
  } finally {
    S.studioLoading = false;
    S.studioProgress = '';
    render();
  }
}

async function autoGenerateAllStoryCharacters() {
  const storyChars = detectStoryCharacters();
  if (!storyChars.length) {
    storyChars.push({
      name: (S.studioTopic || 'Hero').split(' ')[0] || 'Hero',
      description: S.studioTopic || 'Story protagonist'
    });
  }

  S.studioLoading = true;
  S.studioProgress = `Auto-generating portraits for ${storyChars.length} story characters...`;
  render();

  for (let i = 0; i < storyChars.length; i++) {
    const sc = storyChars[i];
    S.studioProgress = `Generating portrait (${i + 1}/${storyChars.length}): "${sc.name}"...`;
    render();
    const prompt = generateSampleCharacterPrompt(sc.name, sc.description);
    await generateCharacterFromPrompt(prompt, sc.name, sc.description);
  }

  S.studioLoading = false;
  S.studioProgress = '';
  studioLog(`✓ All ${storyChars.length} characters generated successfully!`);
  render();
}

async function generateCharacterRef() {
  S.studioStep = 3;
  const storyChars = detectStoryCharacters();
  const first = storyChars[0] || {
    name: S.studioScript?.mainCharacter?.split(':')?.[0]?.trim() || (S.studioTopic || 'Protagonist').split(' ')[0] || 'Hero',
    description: S.studioScript?.mainCharacter || S.studioTopic || 'Main character'
  };

  S.charNameInput = first.name;
  S.charRoleInput = first.description;
  S.charPromptInput = generateSampleCharacterPrompt(first.name, first.description);

  if (S.studioCharacters && S.studioCharacters.length) {
    render();
    return;
  }

  await generateCharacterFromPrompt(S.charPromptInput, S.charNameInput, S.charRoleInput);
}

// ── Step 4: Clip Generation with Distinct Scene Visuals ──────────────
async function generateStudioClip(idx) {
  const promptData = S.studioPrompts?.[idx];
  const sceneData = S.studioScript?.scenes?.[idx];
  if (!promptData && !sceneData) return;

  const charId = sceneData?.assignedCharacterId;
  const assignedChar = (S.studioCharacters || []).find(c => c.id === charId);
  if (!assignedChar) {
    S.studioClips[idx] = {
      sceneIndex: idx,
      status: 'error',
      videoUrl: null,
      imageUrl: null,
      prompt: promptData?.veoPrompt || sceneData?.description,
      error: 'Scene missing mandatory character assignment! Please assign a character in Step 3.',
      cuts: S.studioClips?.[idx]?.cuts || []
    };
    render();
    return;
  }

  S.studioClips[idx] = {
    sceneIndex: idx,
    status: 'generating',
    videoUrl: null,
    imageUrl: S.studioClips[idx]?.imageUrl || null,
    characterId: assignedChar.id,
    characterName: assignedChar.name,
    characterUrl: assignedChar.url,
    prompt: promptData?.veoPrompt || sceneData?.description,
    error: null,
    cuts: S.studioClips?.[idx]?.cuts || []
  };
  studioLog(`Generating visual for Scene ${idx + 1} (${sceneData?.title || ''}) featuring "${assignedChar.name}"...`);
  render();

  try {
    if (S.googleApiKey) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${S.googleApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: promptData?.veoPrompt || sceneData?.description }],
          parameters: { aspectRatio: S.studioAspect, durationSeconds: promptData?.duration || 5, personGeneration: 'allow_adult', numberOfVideos: 1 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.name) {
          S.studioClips[idx].status = 'polling';
          render();
          await pollVideoOperation(idx, data.name);
          return;
        }
      }
    }

    // Generate unique scene-specific visual featuring the assigned character!
    const styleInfo = STUDIO_STYLES[S.studioStyle] || STUDIO_STYLES.kids3d;
    const sceneTitle = sceneData?.title || promptData?.title || `Scene ${idx + 1}`;
    const sceneAction = promptData?.veoPrompt || sceneData?.description || '';
    const sceneEnv = sceneData?.environment || '';

    const visualPrompt = encodeURIComponent(
      `${sceneTitle}, featuring character ${assignedChar.name} (${(assignedChar.description || '').substring(0, 80)}), ${sceneAction}, setting in ${sceneEnv}, ${styleInfo.label} visual style, ultra detailed 4k cinematic render, colorful lighting`
    );
    const aspectWidth = S.studioAspect === '9:16' ? 576 : (S.studioAspect === '1:1' ? 768 : 1024);
    const aspectHeight = S.studioAspect === '9:16' ? 1024 : (S.studioAspect === '1:1' ? 768 : 576);
    const seed = (idx + 1) * 78910 + 12345;
    const currentImgModel = (typeof IMAGE_MODELS !== 'undefined' ? IMAGE_MODELS.find(m => m.id === S.activeImageModel) : null) || { label: 'Flux.1 Schnell', shortLabel: 'Flux.1', engine: 'pollinations', param: 'flux' };
    const modelParam = currentImgModel.engine === 'pollinations' ? currentImgModel.param : 'flux';
    const uniqueSceneUrl = `https://image.pollinations.ai/prompt/${visualPrompt}?width=${aspectWidth}&height=${aspectHeight}&nologo=true&seed=${seed}&model=${modelParam}`;

    S.studioClips[idx].status = 'done';
    S.studioClips[idx].imageUrl = uniqueSceneUrl;
    S.studioClips[idx].characterId = assignedChar.id;
    S.studioClips[idx].characterName = assignedChar.name;
    S.studioClips[idx].characterUrl = assignedChar.url;
    S.studioClips[idx].videoUrl = null;
    studioLog(`Scene ${idx + 1}: Unique visual generated featuring "${assignedChar.name}"!`);
    render();
  } catch (e) {
    S.studioClips[idx].status = 'error';
    S.studioClips[idx].error = e.message;
    studioLog(`Scene ${idx + 1} error: ${e.message}`);
    render();
  }
}

async function pollVideoOperation(idx, opName) {
  const maxAttempts = 60;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opName}?key=${S.googleApiKey}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.done) {
        const videoUri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
        if (videoUri) {
          S.studioClips[idx].status = 'done';
          S.studioClips[idx].videoUrl = videoUri;
          studioLog(`Clip ${idx + 1}: Generated successfully!`);
        } else {
          S.studioClips[idx].status = 'pending-manual';
          S.studioClips[idx].error = 'Generation completed but no video URL returned.';
        }
        render();
        return;
      }
    } catch {}
  }
  S.studioClips[idx].status = 'error';
  S.studioClips[idx].error = 'Polling timed out after 5 minutes.';
  render();
}

async function generateAllClips() {
  const unassigned = getUnassignedScenes();
  if (unassigned.length > 0) {
    alert(`⚠️ Mandatory Character Assignment Required:\n\n${unassigned.length} scene(s) do not have an assigned character image yet!\nPlease assign a character image to every scene before proceeding.`);
    S.studioStep = 3;
    render();
    return;
  }

  S.studioStep = 4;
  const numScenes = S.studioPrompts?.length || S.studioScript?.scenes?.length || 0;
  S.studioClips = Array.from({ length: numScenes }, (_, i) => {
    const sc = S.studioScript?.scenes?.[i];
    const ch = (S.studioCharacters || []).find(c => c.id === sc?.assignedCharacterId);
    const p = S.studioPrompts?.[i];
    return {
      sceneIndex: i,
      status: 'queued',
      videoUrl: null,
      imageUrl: S.studioClips?.[i]?.imageUrl || null,
      characterId: ch?.id,
      characterName: ch?.name,
      characterUrl: ch?.url,
      prompt: p?.veoPrompt || sc?.description || '',
      error: null,
      cuts: S.studioClips?.[i]?.cuts || []
    };
  });
  studioLog('Starting batch video generation with distinct scene visuals...');
  render();

  for (let i = 0; i < numScenes; i++) {
    S.studioProgress = `Rendering distinct scene ${i + 1} of ${numScenes} featuring assigned characters...`;
    render();
    await generateStudioClip(i);
  }
  S.studioStep = 5;
  S.studioProgress = '';
  saveStudioState();
  saveCurrentProjectToHistory();
  studioLog('All clips generated with distinct scene visuals and character consistency!');
  render();
}

async function runFullPipeline() {
  studioLog('=== Full Pipeline Started ===');
  await generateStudioScript();
  if (S.studioError) return;
  await expandStudioPrompts();
  if (S.studioError) return;
  await generateCharacterRef();
  if (S.studioError && !S.studioError.includes('API key')) return;
  S.studioError = '';

  const unassigned = getUnassignedScenes();
  if (unassigned.length > 0) {
    S.studioStep = 3;
    studioLog(`⚠️ Full Auto paused at Step 3: ${unassigned.length} scene(s) require character assignment.`);
    render();
    return;
  }

  await generateAllClips();
  studioLog('=== Full Pipeline Complete ===');
}

// ── Step 5: Timeline & Clip Segment Cutter ────────────────────────────
function getClipCutTotal(idx) {
  const cuts = S.studioClips?.[idx]?.cuts || [];
  return cuts.reduce((acc, c) => acc + Math.max(0, (c.end || 0) - (c.start || 0)), 0);
}

function getClipEffectiveDuration(idx) {
  const orig = S.studioScript?.scenes?.[idx]?.duration || S.studioPrompts?.[idx]?.duration || 35;
  const cutTotal = getClipCutTotal(idx);
  return Math.max(1, Math.round((orig - cutTotal) * 10) / 10);
}

function openClipCutModal(idx) {
  S.clipCutModal = { open: true, clipIndex: idx };
  render();
}

function closeClipCutModal() {
  S.clipCutModal = { open: false, clipIndex: null };
  render();
}

function addClipCut(idx, start, end, label) {
  if (idx == null || !S.studioClips?.[idx]) return;
  if (!S.studioClips[idx].cuts) S.studioClips[idx].cuts = [];
  const s = Math.max(0, parseFloat(start) || 0);
  const e = Math.max(s + 0.1, parseFloat(end) || (s + 0.5));
  const id = 'cut_' + Date.now();
  S.studioClips[idx].cuts.push({ id, start: s, end: e, label: label || `Cut ${s}s - ${e}s` });
  saveStudioState();
  render();
}

function removeClipCut(clipIdx, cutId) {
  if (!S.studioClips?.[clipIdx]?.cuts) return;
  S.studioClips[clipIdx].cuts = S.studioClips[clipIdx].cuts.filter(c => c.id !== cutId);
  saveStudioState();
  render();
}

function parseAndApplyCutCommand(idx, cmd) {
  if (!cmd || !cmd.trim()) return;
  const match = cmd.match(/(\d+(?:\.\d+)?)\s*s?\s*(?:to|-|through)\s*(\d+(?:\.\d+)?)\s*s?/i);
  if (match) {
    const s = parseFloat(match[1]);
    const e = parseFloat(match[2]);
    addClipCut(idx, s, e, `Trim ${s}s - ${e}s`);
    studioLog(`Scene ${idx+1}: Applied cut from ${s}s to ${e}s`);
  } else {
    alert('Could not parse cut range. Example formats: "remove from 1.1s to 1.6s", "cut 1.1s to 1.6s", or "1.1 to 1.6".');
  }
}

function reorderClip(from, to) {
  if (to < 0 || to >= S.studioClips.length) return;
  const [item] = S.studioClips.splice(from, 1);
  S.studioClips.splice(to, 0, item);
  if (S.studioPrompts.length > from) {
    const [pItem] = S.studioPrompts.splice(from, 1);
    S.studioPrompts.splice(to, 0, pItem);
  }
  saveStudioState();
  render();
}

// ── Step 5 & 6: Interactive Story Player ──────────────────────────────
let studioPlayerTimer = null;
let studioAudioCtx = null;

function playStudioTone(freq, duration = 0.3) {
  if (S.studioPlayerAudioMuted) return;
  try {
    if (!studioAudioCtx) studioAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (studioAudioCtx.state === 'suspended') studioAudioCtx.resume();
    const osc = studioAudioCtx.createOscillator();
    const gain = studioAudioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, studioAudioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, studioAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, studioAudioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(studioAudioCtx.destination);
    osc.start();
    osc.stop(studioAudioCtx.currentTime + duration);
  } catch (_) {}
}

function speakSceneNarration(text) {
  if (S.studioPlayerAudioMuted || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.pitch = 1.15;
  utter.rate = 1.05;
  window.speechSynthesis.speak(utter);
}

function studioPlayerGoTo(idx) {
  const total = S.studioClips.length || S.studioScript?.scenes?.length || 1;
  S.studioPlayerCurrentScene = Math.max(0, Math.min(idx, total - 1));
  const sc = S.studioScript?.scenes?.[S.studioPlayerCurrentScene];
  if (sc?.narration) speakSceneNarration(sc.narration);
  playStudioTone(440 + S.studioPlayerCurrentScene * 35, 0.4);
  render();
}

function studioPlayerNext() {
  const total = S.studioClips.length || S.studioScript?.scenes?.length || 1;
  if (S.studioPlayerCurrentScene < total - 1) {
    studioPlayerGoTo(S.studioPlayerCurrentScene + 1);
  } else {
    studioPlayerPause();
    studioPlayerGoTo(0);
  }
}

function studioPlayerPrev() {
  if (S.studioPlayerCurrentScene > 0) {
    studioPlayerGoTo(S.studioPlayerCurrentScene - 1);
  }
}

function studioPlayerPlay() {
  S.studioPlayerPlaying = true;
  const currentIdx = S.studioPlayerCurrentScene;
  const sc = S.studioScript?.scenes?.[currentIdx];
  if (sc?.narration) speakSceneNarration(sc.narration);
  playStudioTone(523.25, 0.3);

  const durationSec = getClipEffectiveDuration(currentIdx);
  clearInterval(studioPlayerTimer);
  studioPlayerTimer = setTimeout(() => {
    if (S.studioPlayerPlaying) studioPlayerNext();
  }, Math.max(3000, durationSec * 1000));
  render();
}

function studioPlayerPause() {
  S.studioPlayerPlaying = false;
  clearTimeout(studioPlayerTimer);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  render();
}

function studioPlayerToggle() {
  if (S.studioPlayerPlaying) studioPlayerPause();
  else studioPlayerPlay();
}

function renderStudioPlayer() {
  const total = S.studioClips.length || S.studioScript?.scenes?.length || 0;
  if (!total) return '';
  const idx = S.studioPlayerCurrentScene;
  const clip = S.studioClips[idx] || {};
  const scene = S.studioScript?.scenes?.[idx] || {};
  const prompt = S.studioPrompts?.[idx] || {};
  const cuts = clip.cuts || [];
  const effectiveSec = getClipEffectiveDuration(idx);
  const mediaUrl = clip.imageUrl ? resolveAssetUrl(clip.imageUrl) : '';

  return `
    <div class="studio-player-container">
      <div class="studio-player-screen">
        ${clip.videoUrl ? `
          <video src="${clip.videoUrl}" autoplay loop muted playsinline class="studio-player-media"></video>
        ` : mediaUrl ? `
          <img src="${mediaUrl}" class="studio-player-media studio-pan-zoom" alt="Scene ${idx+1}" />
        ` : `
          <div style="color:var(--text-muted);font-size:16px;display:flex;flex-direction:column;align-items:center;gap:8px">
            <i class="ti ti-movie-off" style="font-size:36px"></i>
            <span>No visuals generated yet</span>
          </div>
        `}

        ${scene.soundEffect ? `<div class="studio-player-badge"><i class="ti ti-bell"></i> ${scene.soundEffect}</div>` : ''}

        <div class="studio-player-subtitles">
          <div style="font-size:11px;font-weight:700;color:var(--brand);margin-bottom:2px;letter-spacing:0.5px">SCENE ${idx+1} OF ${total}: ${scene.title || prompt.title || 'Animated Scene'}</div>
          ${scene.narration ? `"${scene.narration}"` : (clip.prompt || prompt.veoPrompt || '').substring(0, 140)}
          ${scene.dialogue ? `<div style="color:#f59e0b;font-size:13px;margin-top:4px">💬 ${scene.dialogue}</div>` : ''}
        </div>
      </div>

      <div class="studio-player-controls">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn-ghost" style="padding:6px 12px" onclick="studioPlayerPrev()" ${idx === 0 ? 'disabled' : ''}><i class="ti ti-player-skip-back"></i></button>
          <button class="btn-primary" style="padding:6px 16px" onclick="studioPlayerToggle()">
            <i class="ti ${S.studioPlayerPlaying ? 'ti-player-pause' : 'ti-player-play'}"></i> ${S.studioPlayerPlaying ? 'Pause' : 'Play'}
          </button>
          <button class="btn-ghost" style="padding:6px 12px" onclick="studioPlayerNext()"><i class="ti ti-player-skip-forward"></i></button>
          <button class="btn-ghost" style="padding:6px 10px" onclick="studioPlayerGoTo(0)" title="Restart from beginning"><i class="ti ti-rotate-2"></i></button>
          <button class="btn-ghost" style="padding:6px 10px" onclick="S.studioPlayerAudioMuted=!S.studioPlayerAudioMuted;render()" title="Toggle voiceover & music">
            <i class="ti ${S.studioPlayerAudioMuted ? 'ti-volume-off' : 'ti-volume'}"></i>
          </button>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:12px">
          <span>Scene ${idx+1} / ${total}</span>
          <span><strong>${effectiveSec}s</strong>${cuts.length ? ` <span class="studio-cut-pill">${cuts.length} cut(s)</span>` : ''}</span>
          <button class="btn-ghost" style="font-size:11px;padding:3px 8px" onclick="openClipCutModal(${idx})"><i class="ti ti-scissors"></i> Cut/Trim</button>
        </div>
      </div>

      <div class="studio-player-tray">
        ${Array.from({ length: total }, (_, i) => `
          <div class="studio-tray-pill ${i === idx ? 'active' : ''}" onclick="studioPlayerGoTo(${i})">
            <span>${i+1}.</span>
            <span style="max-width:110px;overflow:hidden;text-overflow:ellipsis">${S.studioScript?.scenes?.[i]?.title || 'Scene ' + (i+1)}</span>
            <span style="color:var(--text-muted);font-size:10px">${getClipEffectiveDuration(i)}s</span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// ── Step 6: Full Movie Video Exporter (Canvas + Web Audio + MediaRecorder) ──
async function exportFullVideo() {
  const clips = S.studioClips;
  if (!clips || !clips.length) {
    alert('No clips generated to export.');
    return;
  }

  S.exportProgressModal = { open: true, progress: 0, currentScene: 1, totalScenes: clips.length, statusText: 'Initializing video compiler...' };
  render();

  try {
    const width = 1280;
    const height = 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioContext.createMediaStreamDestination();
    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
    const recorder = new MediaRecorder(combinedStream, { mimeType });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    const preloadImage = (clip) => new Promise(res => {
      if (!clip.imageUrl) return res(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = resolveAssetUrl(clip.imageUrl);
    });

    recorder.start();

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const sc = S.studioScript?.scenes?.[i] || {};
      const durationSec = Math.min(getClipEffectiveDuration(i), 15);

      S.exportProgressModal = {
        open: true,
        progress: Math.round((i / clips.length) * 100),
        currentScene: i + 1,
        totalScenes: clips.length,
        statusText: `Compiling Scene ${i+1} of ${clips.length}: "${sc.title || ''}"...`
      };
      render();

      const img = await preloadImage(clip);

      try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.frequency.setValueAtTime(220 + i * 40, audioContext.currentTime);
        gain.gain.setValueAtTime(0.06, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + durationSec);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(audioContext.currentTime + durationSec);
      } catch (_) {}

      const fps = 30;
      const totalFrames = Math.round(durationSec * fps);

      for (let frame = 0; frame < totalFrames; frame++) {
        ctx.fillStyle = '#050811';
        ctx.fillRect(0, 0, width, height);

        if (img) {
          const progress = frame / totalFrames;
          const scale = 1.0 + progress * 0.12;
          const dw = width * scale;
          const dh = height * scale;
          const dx = (width - dw) / 2;
          const dy = (height - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
        }

        const grad = ctx.createLinearGradient(0, height - 200, 0, height);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, height - 200, width, 200);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SCENE ${i+1}: ${sc.title || ''}`, width / 2, height - 90);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '20px Outfit, Inter, sans-serif';
        const line = sc.narration ? `"${sc.narration}"` : (clip.prompt || '').substring(0, 80);
        ctx.fillText(line, width / 2, height - 50);

        if (sc.soundEffect) {
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 22px Outfit, Inter, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(sc.soundEffect, width - 40, 60);
        }

        await new Promise(r => setTimeout(r, 1000 / fps));
      }
    }

    S.exportProgressModal.statusText = 'Finalizing movie encoding...';
    S.exportProgressModal.progress = 100;
    render();

    await new Promise(r => setTimeout(r, 500));
    recorder.stop();

    await new Promise(resolve => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wise_movie_${(S.studioTopic || 'story').substring(0,24).replace(/[^a-z0-9]/gi, '_')}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        resolve();
      };
    });

    S.exportProgressModal.open = false;
    saveCurrentProjectToHistory();
    render();
    studioLog('Full movie export downloaded successfully!');
  } catch (err) {
    alert('Movie export failed: ' + err.message);
    S.exportProgressModal.open = false;
    render();
  }
}

// ── Modals Markup ─────────────────────────────────────────────────────
function renderClipCutModal() {
  if (!S.clipCutModal.open) return '';
  const idx = S.clipCutModal.clipIndex;
  const clip = S.studioClips[idx];
  if (!clip) return '';
  const sc = S.studioScript?.scenes?.[idx] || {};
  const cuts = clip.cuts || [];
  const effectiveSec = getClipEffectiveDuration(idx);
  const origSec = sc.duration || 35;

  return `
    <div class="modal-overlay" onclick="if(event.target===this)closeClipCutModal()">
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-title"><i class="ti ti-scissors" style="color:#ef4444"></i> Cut / Trim Scene ${idx+1}</div>
          <button class="modal-close" onclick="closeClipCutModal()">&times;</button>
        </div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">
          <strong>${sc.title || 'Scene ' + (idx+1)}</strong> &mdash; Original: ${origSec}s | Current Duration: <strong style="color:var(--text-success)">${effectiveSec}s</strong>
        </div>
        ${clip.imageUrl ? `<img src="${resolveAssetUrl(clip.imageUrl)}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:12px" />` : ''}

        <div class="section-label" style="margin-bottom:6px">Natural Language Cut Command</div>
        <div style="display:flex;gap:8px;margin-bottom:14px">
          <input type="text" id="studio-cut-cmd-input" class="input-field" placeholder="e.g. remove from 1.1s to 1.6s, or cut 2s to 5s" onkeydown="if(event.key==='Enter'){parseAndApplyCutCommand(${idx}, this.value);this.value='';}" />
          <button class="btn-primary" style="padding:8px 14px" onclick="const el=document.getElementById('studio-cut-cmd-input');parseAndApplyCutCommand(${idx}, el.value);el.value='';"><i class="ti ti-check"></i> Apply</button>
        </div>

        <div class="section-label" style="margin-bottom:6px">Manual Cut Time Interval</div>
        <div style="display:flex;gap:8px;margin-bottom:14px;align-items:center">
          <input type="number" id="manual-cut-start" class="input-field" placeholder="Start (s)" step="0.1" min="0" style="width:100px" />
          <span style="color:var(--text-muted)">to</span>
          <input type="number" id="manual-cut-end" class="input-field" placeholder="End (s)" step="0.1" min="0.1" style="width:100px" />
          <button class="btn-ghost" onclick="const s=document.getElementById('manual-cut-start').value;const e=document.getElementById('manual-cut-end').value;if(s&&e){addClipCut(${idx}, s, e);document.getElementById('manual-cut-start').value='';document.getElementById('manual-cut-end').value='';}">Add Cut</button>
        </div>

        <div class="section-label" style="margin-bottom:6px">Active Cuts on this Scene (${cuts.length})</div>
        ${cuts.length ? `
          <div style="display:flex;flex-direction:column;gap:6px">
            ${cuts.map(c => `
              <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);padding:8px 12px;border-radius:6px;font-size:12px">
                <span class="studio-cut-pill"><i class="ti ti-scissors"></i> ${c.label || `${c.start}s - ${c.end}s`}</span>
                <span style="color:var(--text-muted);font-size:11px">-${Math.round((c.end - c.start)*10)/10}s deducted</span>
                <button class="btn-ghost" style="padding:2px 6px;color:#ef4444" onclick="removeClipCut(${idx}, '${c.id}')"><i class="ti ti-trash"></i></button>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="font-size:12px;color:var(--text-muted);padding:8px;background:var(--surface-2);border-radius:6px">No cuts applied yet. Full scene will play.</div>
        `}
      </div>
    </div>`;
}

function renderExportProgressModal() {
  if (!S.exportProgressModal.open) return '';
  const { progress, currentScene, totalScenes, statusText } = S.exportProgressModal;
  return `
    <div class="modal-overlay">
      <div class="modal-box" style="text-align:center">
        <div style="font-size:36px;color:var(--brand);margin-bottom:8px"><i class="ti ti-movie studio-spin"></i></div>
        <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:6px">Compiling Entire Movie</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">${statusText}</div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width:${progress}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted)">
          <span>Scene ${currentScene} of ${totalScenes}</span>
          <span>${progress}%</span>
        </div>
      </div>
    </div>`;
}

function renderLightbox() {
  if (!S.lightbox.open) return '';
  return `
    <div class="modal-overlay" onclick="S.lightbox.open=false;render()">
      <div style="max-width:90vw;max-height:90vh;position:relative">
        <img src="${S.lightbox.url}" style="max-width:100%;max-height:85vh;border-radius:8px;display:block" />
        <div style="color:#fff;text-align:center;margin-top:8px;font-weight:600">${S.lightbox.title}</div>
      </div>
    </div>`;
}

function openLightbox(url, title) {
  S.lightbox = { open: true, url, title };
  render();
}

function renderHistoryModal() {
  if (!S.historyModal.open) return '';
  const history = getProjectHistory();
  const driveToken = localStorage.getItem('gdrive-access-token');
  const histFilter = S.historyModal.filter || 'all';
  const activeCnt = history.filter(p => !p.archived).length;
  const archivedCnt = history.filter(p => p.archived).length;
  const displayedHistory = histFilter === 'active' 
    ? history.filter(p => !p.archived)
    : (histFilter === 'archived' ? history.filter(p => p.archived) : history);

  return `
    <div class="modal-overlay" onclick="if(event.target===this){S.historyModal.open=false;render();}">
      <div class="modal-box" style="max-width:760px">
        <div class="modal-header">
          <div class="modal-title">
            <i class="ti ti-history" style="color:var(--brand)"></i>
            Project History & Cloud Storage
          </div>
          <button class="modal-close" onclick="S.historyModal.open=false;render()">&times;</button>
        </div>

        ${S.historyNotice ? `
          <div style="background:${S.historyNotice.type === 'info' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)'};border:1px solid ${S.historyNotice.type === 'info' ? '#3b82f6' : '#10b981'};color:${S.historyNotice.type === 'info' ? '#93c5fd' : '#6ee7b7'};padding:10px 14px;border-radius:var(--radius-md);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600">
            <div style="display:flex;align-items:center;gap:8px">
              <i class="ti ${S.historyNotice.type === 'info' ? 'ti-info-circle' : 'ti-circle-check'}" style="font-size:16px"></i>
              <span>${S.historyNotice.msg}</span>
            </div>
            <button onclick="S.historyNotice=null;render()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:16px">&times;</button>
          </div>
        ` : ''}

        <!-- Google Drive Connection Bar -->
        <div style="background:var(--surface-2);border-radius:var(--radius-md);padding:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:10px">
            <i class="ti ti-brand-google-drive" style="font-size:26px;color:#4285f4"></i>
            <div>
              <div style="font-weight:600;font-size:13px;color:var(--text-primary)">
                ${driveToken ? '✓ Google Drive Connected' : 'Google Drive Cloud Sync'}
              </div>
              <div style="font-size:11px;color:var(--text-muted)">
                ${driveToken ? 'Projects sync to Google Drive &rsaquo; <b>My Animation Studio</b> &rsaquo; <b>&lt;Project Name&gt;</b>' : 'Connect your Google Drive to automatically back up projects to "My Animation Studio" in the cloud'}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${driveToken ? `
              <a href="${S.googleDriveStudioFolderUrl || (history.find(p => p.driveStudioFolderUrl)?.driveStudioFolderUrl) || 'https://drive.google.com/drive/search?q=My%20Animation%20Studio'}" target="_blank" rel="noopener" class="btn-ghost" style="padding:6px 12px;font-size:11px;color:#4285f4;text-decoration:none;display:inline-flex;align-items:center;gap:5px;font-weight:600;border:1px solid rgba(66,133,244,0.3);background:rgba(66,133,244,0.06);border-radius:6px" title="Open My Animation Studio folder in Google Drive">
                <i class="ti ti-folder"></i> Open "My Animation Studio" in Drive <i class="ti ti-external-link" style="font-size:10px"></i>
              </a>
              <button class="btn-ghost" style="padding:6px 12px;font-size:11px" onclick="syncAllLocalProjectsToDrive()"><i class="ti ti-cloud-upload"></i> Sync All to Drive</button>
              <button class="btn-ghost" style="padding:6px 12px;font-size:11px" onclick="disconnectGoogleDrive()">Disconnect</button>
            ` : `
              <button class="btn-primary" style="padding:6px 14px;font-size:12px;background:linear-gradient(135deg,#4285f4,#34a853)" onclick="connectGoogleDrive()">
                <i class="ti ti-login"></i> Connect Google Drive
              </button>
            `}
            <button class="btn-primary" style="padding:6px 14px;font-size:12px" onclick="saveCurrentProjectToHistory()">
              <i class="ti ti-device-floppy"></i> Save Current Project
            </button>
          </div>
        </div>

        ${(() => {
          const histFilter = S.historyModal.filter || 'all';
          const activeCnt = history.filter(p => !p.archived).length;
          const archivedCnt = history.filter(p => p.archived).length;
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
              <div class="section-label" style="margin-bottom:0">Saved Projects (${displayedHistory.length})</div>
              <div style="display:flex;gap:4px">
                <button class="btn-ghost" style="padding:4px 10px;font-size:11px;${histFilter === 'all' ? 'background:var(--brand);color:#fff;border-color:var(--brand);' : ''}" onclick="S.historyModal.filter='all';render()">All (${history.length})</button>
                <button class="btn-ghost" style="padding:4px 10px;font-size:11px;${histFilter === 'active' ? 'background:var(--brand);color:#fff;border-color:var(--brand);' : ''}" onclick="S.historyModal.filter='active';render()">Active (${activeCnt})</button>
                <button class="btn-ghost" style="padding:4px 10px;font-size:11px;${histFilter === 'archived' ? 'background:var(--brand);color:#fff;border-color:var(--brand);' : ''}" onclick="S.historyModal.filter='archived';render()">Archived (${archivedCnt})</button>
              </div>
            </div>
          `;
        })()}
        ${displayedHistory.length ? `
          <div class="history-grid">
            ${displayedHistory.map(proj => `
              <div class="history-card">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
                  <div style="display:flex;gap:5px;align-items:center">
                    <span class="cloud-badge ${proj.source === 'drive' ? 'drive' : 'local'}">
                    <i class="ti ${proj.source === 'drive' ? 'ti-cloud' : 'ti-device-floppy'}"></i> ${proj.source === 'drive' ? 'Google Drive' : 'Local Storage'}
                  </span>
                    ${proj.archived ? `
                      <span style="background:rgba(245,158,11,0.15);color:#f59e0b;font-weight:700;font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid rgba(245,158,11,0.3);display:inline-flex;align-items:center;gap:3px">
                        <i class="ti ti-archive"></i> Archived
                      </span>
                    ` : ''}
                  </div>
                  <span style="font-size:10px;color:var(--text-muted)">${proj.formattedDate || ''}</span>
                </div>

                ${proj.previewThumb ? `
                  <img src="${resolveAssetUrl(proj.previewThumb)}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;background:#000" />
                ` : ''}

                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${proj.title}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
                    ${proj.numScenes || 0} Scenes &bull; ${proj.duration || '420s'} &bull; Style: ${proj.style || 'kids3d'}
                  </div>
                </div>

                ${proj.source === 'drive' ? `
                  <div style="font-size:10px;color:var(--brand);margin-top:4px;display:flex;align-items:center;gap:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="Folder: My Animation Studio / ${proj.title}">
                    <i class="ti ti-folder"></i> My Animation Studio / ${proj.title}
                  </div>
                ` : ''}
                <div style="display:flex;gap:6px;margin-top:auto">
                  <button class="btn-primary" style="flex:1;padding:6px 10px;font-size:12px" onclick="loadProjectFromHistory('${proj.id}')">
                    <i class="ti ti-folder-open"></i> Load
                  </button>
                  ${proj.archived ? `
                    <button class="btn-ghost" style="padding:6px 10px;font-size:12px;color:var(--text-success)" onclick="restoreProjectFromHistory('${proj.id}')" title="Restore project to active">
                      <i class="ti ti-rotate-clockwise"></i> Restore
                    </button>
                  ` : ''}
                  ${(proj.source === 'drive' || proj.driveFolderId || proj.driveFileId) ? `
                    <a href="${proj.driveFolderUrl || (proj.driveFolderId ? 'https://drive.google.com/drive/folders/' + proj.driveFolderId : (proj.driveFileUrl || 'https://drive.google.com/drive/search?q=' + encodeURIComponent(proj.title)))}" target="_blank" rel="noopener" class="btn-ghost" style="padding:6px 10px;font-size:12px;text-decoration:none;display:inline-flex;align-items:center;gap:4px;color:#4285f4;font-weight:600;border:1px solid rgba(66,133,244,0.3);background:rgba(66,133,244,0.06);border-radius:6px" title="Open project directly in Google Drive">
                      <i class="ti ti-brand-google-drive"></i> Open in Drive <i class="ti ti-external-link" style="font-size:10px"></i>
                    </a>
                  ` : (driveToken ? `
                    <button class="btn-ghost" style="padding:6px 10px;font-size:12px;color:#4285f4;display:inline-flex;align-items:center;gap:4px" onclick="syncProjectToDrive('${proj.id}')" title="Upload this project to Google Drive">
                      <i class="ti ti-cloud-upload"></i> Sync to Drive
                    </button>
                  ` : '')}
                  <button class="btn-ghost" style="padding:6px 10px;color:#ef4444;font-size:12px" onclick="deleteProjectFromHistory('${proj.id}')" title="Delete project">
                    <i class="ti ti-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="info-box" style="text-align:center;padding:24px">
            <i class="ti ti-folder-off" style="font-size:28px;color:var(--text-muted);display:block;margin-bottom:8px"></i>
            <div>No saved projects found in history yet.</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Click "Save Current Project" above to store your project.</div>
          </div>
        `}
      </div>
    </div>`;
}

function renderSetupModal() {
  if (!S.showSetup) return '';
  return `
    <div class="modal-overlay" onclick="if(event.target===this){S.showSetup=false;render();}">
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-title"><i class="ti ti-key" style="color:var(--brand)"></i> API & Cloud Configuration</div>
          <button class="modal-close" onclick="S.showSetup=false;render()">&times;</button>
        </div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:14px">
          Wise Simple Studio runs 100% in your browser. API keys and tokens are stored securely in local browser storage.
        </div>

        <div class="section-label" style="margin-bottom:6px">Groq API Key (Fast LLM Script Generation)</div>
        <input type="password" class="input-field" placeholder="gsk_..." value="${S.apiKey}" oninput="S.apiKey=this.value.trim();localStorage.setItem('groq-key', this.value.trim());loadGroqModels();" style="margin-bottom:6px" />
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px">Get a free key from <a href="https://console.groq.com" target="_blank" style="color:var(--brand)">console.groq.com</a> (Free tier: 14,400 req/day).</div>

        <div class="section-label" style="margin-bottom:6px">Google Cloud OAuth Client ID (For Google Drive Sync)</div>
        <input type="text" class="input-field" placeholder="your-client-id.apps.googleusercontent.com" value="${S.googleClientId}" oninput="S.googleClientId=this.value.trim();localStorage.setItem('gdrive-client-id', this.value.trim())" style="margin-bottom:6px" />
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px">Enables 1-click cloud sync of projects and assets directly to your Google Drive.</div>

        <div class="section-label" style="margin-bottom:6px">Google Drive Target Folder (URL or ID)</div>
        <input type="text" class="input-field" placeholder="https://drive.google.com/drive/folders/..." value="${S.googleDriveFolderUrl || ('https://drive.google.com/drive/folders/' + (S.googleDriveFolderId || '1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY'))}" oninput="setTargetDriveFolder(this.value)" style="margin-bottom:6px" />
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px">
          Projects and character assets will be saved into subfolders inside this Google Drive folder.
          <a href="${S.googleDriveFolderUrl || ('https://drive.google.com/drive/folders/' + (S.googleDriveFolderId || '1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY'))}" target="_blank" rel="noopener" style="color:var(--brand);margin-left:4px;font-weight:600">Open Target Folder in Drive ↗</a>
        </div>

        <div class="section-label" style="margin-bottom:6px">AI Visual Model (Characters & Storyboards)</div>
        <div style="margin-bottom:8px">
          ${renderImageModelSelect()}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px">
          Select which AI model generates your character portraits and storyboard scenes. Free models (Flux.1, SDXL Turbo, SANA) run instantly without any key.
        </div>

        <div class="section-label" style="margin-bottom:6px">Google AI Studio API Key (Optional for Veo 2 / Google Imagen 3)</div>
        <input type="password" class="input-field" placeholder="AIza..." value="${S.googleApiKey}" oninput="S.googleApiKey=this.value;localStorage.setItem('google-key', this.value)" style="margin-bottom:6px" />
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:16px">Optional. Used if Google Imagen 3 or Veo 2 video generation is selected.</div>

        <button class="btn-primary" style="width:100%" onclick="S.showSetup=false;loadGroqModels();render()"><i class="ti ti-check"></i> Save & Continue</button>
      </div>
    </div>`;
}

// ── Studio Main Panels (Steps 0–6) ────────────────────────────────────
function canNavigateToStep(i) {
  if (i === 0) return true;
  if (i === 1) return !!S.studioScript;
  if (i === 2) return !!(S.studioScript && (S.studioScript.scenes?.length || Array.isArray(S.studioScript)));
  if (i === 3) return !!(S.studioPrompts && S.studioPrompts.length);
  if (i === 4) return !!(S.studioCharacters && S.studioCharacters.length);
  if (i === 5) return !!(S.studioClips && S.studioClips.length);
  if (i === 6) return !!(S.studioClips && S.studioClips.length);
  return false;
}

function buildStudio() {
  const steps = [
    { icon: 'ti-bulb',       label: 'Concept' },
    { icon: 'ti-script',     label: 'Script' },
    { icon: 'ti-wand',       label: 'Prompts' },
    { icon: 'ti-user-check', label: 'Characters' },
    { icon: 'ti-video',      label: 'Generate' },
    { icon: 'ti-layout-grid',label: 'Timeline' },
    { icon: 'ti-download',   label: 'Export' }
  ];

  const stepperHtml = `
    <div class="studio-stepper">
      ${steps.map((st, i) => `
        <div class="studio-step ${i === S.studioStep ? 'active' : ''} ${i < S.studioStep || (i !== S.studioStep && canNavigateToStep(i)) ? 'done' : ''}" onclick="${canNavigateToStep(i) ? `S.studioStep=${i};render()` : ''}" style="${canNavigateToStep(i) ? 'cursor:pointer' : 'cursor:not-allowed;opacity:0.6'}">
          <div class="studio-step-dot"><i class="ti ${i < S.studioStep ? 'ti-check' : st.icon}"></i></div>
          <span class="studio-step-label">${st.label}</span>
        </div>
        ${i < steps.length - 1 ? '<div class="studio-step-line ' + (i < S.studioStep ? 'done' : '') + '"></div>' : ''}
      `).join('')}
    </div>`;

  const errorHtml = S.studioError ? `<div class="error-box" style="margin-bottom:14px"><i class="ti ti-alert-circle"></i> ${S.studioError}</div>` : '';
  const progressHtml = S.studioProgress ? `<div class="info-box" style="margin-bottom:14px"><span class="pulse-dot"></span> ${S.studioProgress}</div>` : '';

  // Quality Validation Alert Banner
  const qualityAlertHtml = S.qualityAlert ? `
    <div class="quality-alert-box">
      <i class="ti ti-alert-triangle" style="font-size:24px;color:#ef4444;flex-shrink:0;margin-top:2px"></i>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px;color:#ef4444">${S.qualityAlert.title}</div>
        <div style="font-size:12px;margin-top:4px;color:#fecaca">${S.qualityAlert.reason}</div>
        <div style="font-size:11px;color:#fca5a5;margin-top:4px">
          <strong>File:</strong> ${S.qualityAlert.filename} &bull; <em>Rejected to preserve story visual quality.</em>
        </div>
      </div>
      <button onclick="S.qualityAlert=null;render()" style="background:none;border:none;color:#fca5a5;cursor:pointer;font-size:18px">&times;</button>
    </div>` : '';

  let panelHtml = '';

  // Step 0: Concept Input
  if (S.studioStep === 0) {
    const styleCards = Object.entries(STUDIO_STYLES).map(([key, st]) => `
      <button class="studio-style-card ${S.studioStyle === key ? 'active' : ''}" onclick="S.studioStyle='${key}';render()">
        <i class="ti ${st.icon}" style="font-size:20px;color:var(--brand)"></i>
        <span class="studio-style-name">${st.label}</span>
        <span class="studio-style-desc">${st.desc}</span>
      </button>
    `).join('');

    const durationBtns = STUDIO_DURATIONS.map(d => `
      <button class="pill-btn ${S.studioDuration === d.value ? 'active' : ''}" onclick="S.studioDuration='${d.value}';render()">${d.label} <span style="opacity:0.6;font-size:10px">(${d.scenes} scenes)</span></button>
    `).join('');

    const aspectBtns = ['16:9','9:16','1:1'].map(a => `
      <button class="pill-btn ${S.studioAspect === a ? 'active' : ''}" onclick="S.studioAspect='${a}';render()">${a}</button>
    `).join('');

    panelHtml = `
      <div class="card" style="border-left:4px solid var(--brand)">
        <div class="section-label" style="margin-bottom:14px"><i class="ti ti-sparkles" style="color:var(--brand)"></i> What is your animated story or video about?</div>
        <textarea class="input-field" rows="3" placeholder="Describe your story idea...\n\nExample: The Hare and Tortoise have an epic hill race with hilarious twists, inventive science gadgets, and a heartwarming moral lesson for kids." oninput="S.studioTopic=this.value">${S.studioTopic}</textarea>

        <div class="section-label" style="margin-top:18px;margin-bottom:10px">Visual Style</div>
        <div class="studio-style-grid">${styleCards}</div>

        <div class="section-label" style="margin-top:18px;margin-bottom:10px">Target Duration</div>
        <div class="filter-pills">${durationBtns}</div>

        <div class="section-label" style="margin-top:18px;margin-bottom:10px">Aspect Ratio</div>
        <div class="filter-pills">${aspectBtns}</div>

        <div style="display:flex;gap:10px;margin-top:22px;flex-wrap:wrap">
          <button class="btn-primary" onclick="generateStudioScript()" ${S.studioLoading ? 'disabled' : ''}>
            ${S.studioLoading ? '<span class="pulse-dot"></span> Generating...' : '<i class="ti ti-wand"></i> Generate Script'}
          </button>
          <button class="btn-primary" onclick="runFullPipeline()" ${S.studioLoading ? 'disabled' : ''} style="background:linear-gradient(135deg,#3b82f6,#10b981)">
            <i class="ti ti-bolt"></i> Full Auto Run
          </button>
          <button class="btn-primary" onclick="loadSampleEpic()" ${S.studioLoading ? 'disabled' : ''} style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff">
            <i class="ti ti-sparkles"></i> 🎬 Load 7-Min Kids Story
          </button>
        </div>
      </div>`;
  }

  // Step 1: Script Review
  if (S.studioStep === 1 && S.studioScript) {
    const scenes = S.studioScript.scenes || [];
    panelHtml = `
      <div class="card" style="margin-bottom:14px">
        <div class="section-label"><i class="ti ti-script"></i> Generated Scene-by-Scene Script</div>
        ${S.studioScript.mainCharacter && S.studioScript.mainCharacter !== 'none' ? `
          <div style="background:var(--surface-2);padding:12px;border-radius:8px;margin-top:10px;border-left:3px solid var(--brand)">
            <div style="font-size:12px;font-weight:700;color:var(--brand);margin-bottom:4px"><i class="ti ti-user"></i> Main Characters</div>
            <div style="font-size:13px;color:var(--text-secondary)">${renderMarkdown(S.studioScript.mainCharacter)}</div>
          </div>` : ''}
        ${S.studioScript.narrator ? `
          <div style="background:var(--surface-2);padding:12px;border-radius:8px;margin-top:8px;border-left:3px solid var(--text-success)">
            <div style="font-size:12px;font-weight:700;color:var(--text-success);margin-bottom:4px"><i class="ti ti-microphone"></i> Narration & Moral</div>
            <div style="font-size:13px;color:var(--text-secondary)">${renderMarkdown(S.studioScript.narrator)}</div>
          </div>` : ''}
      </div>

      ${scenes.map((sc, i) => `
        <div class="phase-card">
          <div class="phase-header">
            <span style="font-size:11px;font-weight:700;color:var(--brand);background:var(--bg-accent);padding:2px 8px;border-radius:10px">Scene ${sc.sceneNum || i+1}</span>
            <span class="phase-name">${sc.title}</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:auto">${sc.duration || '?'}s</span>
          </div>
          <div class="phase-summary">${renderMarkdown(sc.description)}</div>
          <div class="sub-points-list">
            <div class="sub-bullet-row"><i class="ti ti-map-pin"></i> <span>${sc.environment || ''}</span></div>
            <div class="sub-bullet-row"><i class="ti ti-sun"></i> <span>${sc.lighting || ''}</span></div>
            <div class="sub-bullet-row"><i class="ti ti-camera"></i> <span>${sc.camera || ''}</span></div>
            <div class="sub-bullet-row"><i class="ti ti-bell"></i> <span>${sc.soundEffect || 'No sound cue'}</span></div>
          </div>
        </div>
      `).join('')}

      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn-primary" onclick="expandStudioPrompts()" ${S.studioLoading ? 'disabled' : ''}>
          ${S.studioLoading ? '<span class="pulse-dot"></span> Expanding...' : '<i class="ti ti-arrow-right"></i> Expand to Prompts'}
        </button>
        <button class="btn-ghost" onclick="exportStudioScript()"><i class="ti ti-copy"></i> Copy Script</button>
        <button class="btn-ghost" onclick="S.studioStep=0;render()"><i class="ti ti-arrow-left"></i> Back</button>
      </div>`;
  }

  // Step 2: Cinematic Prompts
  if (S.studioStep === 2) {
    if (!S.studioPrompts || !S.studioPrompts.length) {
      if (S.studioScript && (S.studioScript.scenes?.length || Array.isArray(S.studioScript))) {
        S.studioPrompts = generateFallbackPrompts(S.studioScript);
        saveStudioState();
      }
    }
    panelHtml = `
      <div class="section-label" style="margin-bottom:10px"><i class="ti ti-wand"></i> Cinematic Video Prompts (${S.studioPrompts.length})</div>
      ${S.studioPrompts.map((p, i) => `
        <div class="phase-card">
          <div class="phase-header">
            <span style="font-size:11px;font-weight:700;color:var(--brand);background:var(--bg-accent);padding:2px 8px;border-radius:10px">${i+1}</span>
            <span class="phase-name">${p.title}</span>
            <span class="pill-btn" style="cursor:default;font-size:11px;padding:2px 8px">${p.cameraMove || ''}</span>
          </div>
          <div class="studio-prompt-text">${p.veoPrompt}</div>
          ${p.negativePrompt ? `<div style="font-size:11px;color:var(--text-danger);margin-top:6px"><strong>Negative:</strong> ${p.negativePrompt}</div>` : ''}
        </div>
      `).join('')}

      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn-primary" onclick="S.studioStep=3;render()" style="background:linear-gradient(135deg,#4285f4,#34a853)">
          <i class="ti ti-user-check"></i> Next: Assign Characters (Mandatory)
        </button>
        <button class="btn-ghost" style="font-size:12px;color:#f87171;border-color:rgba(239,68,68,0.4)" onclick="testLowQualityRejection()" title="Simulate quality gate rejection"><i class="ti ti-shield-alert"></i> Test Quality Gate</button>
            <button class="btn-ghost" onclick="generateCharacterRef()" ${S.studioLoading ? 'disabled' : ''}>
          <i class="ti ti-wand"></i> AI Character Ref
        </button>
        <button class="btn-ghost" onclick="exportStudioPrompts()"><i class="ti ti-clipboard"></i> Copy All Prompts</button>
        <button class="btn-ghost" onclick="S.studioStep=1;render()"><i class="ti ti-arrow-left"></i> Back</button>
      </div>`;
  }

  // Step 3: Character Studio & Mandatory Scene Assignment
  if (S.studioStep === 3) {
    const scenes = S.studioScript?.scenes || [];
    const characters = S.studioCharacters || [];
    const unassigned = getUnassignedScenes();
    const assignedCount = scenes.length - unassigned.length;
    const isAllAssigned = scenes.length > 0 && unassigned.length === 0;
    const detectedChars = detectStoryCharacters();

    // Auto-prefill if inputs are currently empty
    if (!S.charNameInput && detectedChars.length > 0) {
      S.charNameInput = detectedChars[0].name;
      S.charRoleInput = detectedChars[0].description;
      S.charPromptInput = generateSampleCharacterPrompt(detectedChars[0].name, detectedChars[0].description);
    }

    panelHtml = `
      <!-- AI Character Creator & Prompt Studio -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px">
          <div>
            <div class="section-label" style="margin-bottom:4px"><i class="ti ti-sparkles" style="color:var(--brand)"></i> AI Character Creator & Prompt Studio</div>
            <div style="font-size:12px;color:var(--text-secondary)">
              Generate character portraits with custom AI prompts, or generate sample prompts tailored to your story & scene requirements.
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${renderImageModelSelect(true)}
            <button class="btn-ghost" style="font-size:12px;color:var(--brand);border-color:var(--brand)" onclick="autoGenerateAllStoryCharacters()" ${S.studioLoading ? 'disabled' : ''} title="Generate portraits for all detected characters in the script">
              <i class="ti ti-users-group"></i> Auto-Generate All Story Characters (${detectedChars.length})
            </button>
            <button class="btn-ghost" style="font-size:12px" onclick="autoMatchScriptCharacters()" ${!characters.length || !scenes.length ? 'disabled' : ''} title="Match character art to scenes">
              <i class="ti ti-wand"></i> Auto-Match Scenes
            </button>
          </div>
        </div>

        <div style="background:var(--surface-2);border-radius:10px;padding:16px;border:1px solid var(--border);margin-bottom:14px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px">
                Select Story Character or Create New:
              </label>
              <select class="select-field" style="width:100%" onchange="handleSelectScriptChar(this.value)">
                <option value="">-- Choose Story Character (${detectedChars.length} detected) --</option>
                ${detectedChars.map(dc => `<option value="${dc.name}" ${dc.name === S.charNameInput ? 'selected' : ''}>${dc.name} (${(dc.description || '').substring(0, 30)}...)</option>`).join('')}
                <option value="__new__">+ New Custom Character</option>
              </select>
            </div>
            <div>
              <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px">
                Character Name:
              </label>
              <input type="text" class="input-field" placeholder="e.g. Toby the Tortoise" value="${S.charNameInput || ''}" oninput="S.charNameInput=this.value" />
            </div>
          </div>

          <div style="margin-bottom:12px">
            <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px">
              Role & Key Description:
            </label>
            <input type="text" class="input-field" placeholder="e.g. A determined little green tortoise with a polished jade shell and orange scarf" value="${S.charRoleInput || ''}" oninput="S.charRoleInput=this.value" />
          </div>

          <div style="margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:6px">
              <label style="font-size:11px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:4px">
                <i class="ti ti-prompt"></i> Character Visual Prompt (Edit or write your own):
              </label>
              <button class="btn-ghost" style="padding:4px 10px;font-size:11px;color:var(--brand);font-weight:600" onclick="handleGenerateSamplePrompt()" title="Generate optimized prompt from story & scenes">
                <i class="ti ti-sparkles"></i> Generate Sample Prompt from Story
              </button>
            </div>
            <textarea class="input-field" style="width:100%;height:84px;font-size:12px;line-height:1.5;font-family:inherit;padding:8px 10px" placeholder="Write or edit prompt here (e.g. 3D Pixar character portrait of Toby the Tortoise...)" oninput="S.charPromptInput=this.value">${S.charPromptInput || ''}</textarea>
          </div>

          <!-- Quick Style Modifiers -->
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:14px">
            <span style="font-size:11px;color:var(--text-muted);font-weight:600">Quick Modifiers:</span>
            <button class="btn-ghost" style="padding:2px 8px;font-size:10px" onclick="appendPromptModifier('3D Disney Pixar character concept art')">+ Pixar 3D</button>
            <button class="btn-ghost" style="padding:2px 8px;font-size:10px" onclick="appendPromptModifier('expressive eyes, warm cheerful smile')">+ Expressive Smile</button>
            <button class="btn-ghost" style="padding:2px 8px;font-size:10px" onclick="appendPromptModifier('close-up portrait looking at camera')">+ Close-up</button>
            <button class="btn-ghost" style="padding:2px 8px;font-size:10px" onclick="appendPromptModifier('full body turnaround sheet')">+ Full Body</button>
            <button class="btn-ghost" style="padding:2px 8px;font-size:10px" onclick="appendPromptModifier('volumetric studio lighting, soft glow')">+ Studio Glow</button>
            <button class="btn-ghost" style="padding:2px 8px;font-size:10px" onclick="appendPromptModifier('octane render, 8k resolution, ultra detailed textures')">+ 8K Octane</button>
          </div>

          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <button class="btn-primary" style="padding:10px 22px;font-size:13px;background:linear-gradient(135deg,#4285f4,#34a853)" onclick="generateCharacterFromPrompt()" ${S.studioLoading ? 'disabled' : ''}>
              ${S.studioLoading ? '<span class="pulse-dot"></span> Generating Character...' : '<i class="ti ti-sparkles"></i> Generate Character with AI'}
            </button>
            <button class="btn-ghost" style="font-size:12px" onclick="document.getElementById('studio-char-file-input').click()">
              <i class="ti ti-upload"></i> Or Upload Your Own Image
            </button>
          </div>
        </div>

        <input type="file" id="studio-char-file-input" accept="image/*" multiple onchange="handleCharacterUpload(event)" style="display:none" />

        <div class="studio-upload-zone" onclick="document.getElementById('studio-char-file-input').click()" ondragover="event.preventDefault();this.style.borderColor='var(--brand)'" ondragleave="this.style.borderColor=''" ondrop="handleCharacterDrop(event)">
          <i class="ti ti-cloud-upload"></i>
          <div style="font-size:14px;font-weight:600;margin-top:4px;color:var(--text-primary)">Click to Upload or Drag & Drop Character Artwork</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Quality Gate: Minimum 512x512px. Low quality images are automatically rejected to protect output quality.</div>
        </div>

        <div class="section-label" style="margin-top:20px;margin-bottom:10px"><i class="ti ti-users"></i> Available Characters (${characters.length})</div>
        ${characters.length ? `
          <div class="studio-char-grid">
            ${characters.map((c, i) => `
              <div class="studio-char-card">
                <div style="position:relative">
                  <img src="${resolveAssetUrl(c.url)}" alt="${c.name || 'Character'}" class="studio-char-img" onclick="openLightbox('${resolveAssetUrl(c.url)}', '${c.name || 'Character'}')" />
                  <span class="studio-char-badge">${c.name || 'Character ' + (i+1)}</span>
                  <button class="studio-char-delete-btn" onclick="deleteStudioCharacter('${c.id}')" title="Delete character"><i class="ti ti-trash"></i></button>
                </div>
                <div style="padding:10px">
                  <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${c.name || 'Character ' + (i+1)}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:4px;line-height:1.4">${renderMarkdown((c.description || '').substring(0, 95))}</div>
                  <div style="display:flex;gap:6px;margin-top:8px">
                    <button class="btn-ghost" style="flex:1;font-size:11px;padding:4px 6px;color:var(--brand)" onclick="editCharacterPrompt('${c.id}')" title="Load prompt and re-generate this character">
                      <i class="ti ti-edit"></i> Edit Prompt
                    </button>
                    <button class="btn-ghost" style="flex:1;font-size:11px;padding:4px 6px" onclick="assignCharacterToAllScenes('${c.id}')" title="Assign this character to all scenes">
                      <i class="ti ti-check-all"></i> Assign All
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="info-box" style="margin-top:10px">
            <i class="ti ti-info-circle"></i> No character images generated or uploaded yet. Click <strong>"Generate Character with AI"</strong> or <strong>"Auto-Generate All Story Characters"</strong> above!
          </div>
        `}
      </div>

      ${(S.archivedCharacters && S.archivedCharacters.length) ? `
          <div style="margin-top:20px;padding:12px;background:var(--surface-2);border-radius:var(--radius-md);border:1px solid var(--border)">
            <div class="section-label" style="margin-bottom:10px;font-size:12px;color:var(--text-muted)">
              <i class="ti ti-archive"></i> Archived Characters (${S.archivedCharacters.length})
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:10px">
              ${S.archivedCharacters.map(ac => `
                <div style="display:flex;align-items:center;gap:10px;background:var(--surface-1);padding:6px 12px;border-radius:6px;border:1px solid var(--border)">
                  <img src="${resolveAssetUrl(ac.url)}" style="width:36px;height:36px;border-radius:4px;object-fit:cover" />
                  <div>
                    <div style="font-size:12px;font-weight:600">${ac.name || 'Character'}</div>
                    <div style="font-size:10px;color:var(--text-muted)">Archived</div>
                  </div>
                  <button class="btn-ghost" style="padding:4px 8px;font-size:11px;color:var(--text-success)" onclick="restoreStudioCharacter('${ac.id}')" title="Restore character to active"><i class="ti ti-rotate-clockwise"></i> Restore</button>
                  <button class="btn-ghost" style="padding:4px 8px;font-size:11px;color:#ef4444" onclick="deleteArchivedCharacter('${ac.id}')" title="Permanently delete"><i class="ti ti-trash"></i></button>
                </div>
              `).join('')}
            </div>
          </div>
      ` : ''}

      <!-- Mandatory Scene Character Assignment Section -->
      <div class="card" style="margin-top:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <div>
            <div class="section-label" style="margin-bottom:2px">
              <i class="ti ti-layout-grid"></i> Scene Character Assignment Gate
            </div>
            <div style="font-size:12px;color:var(--text-muted)">
              ${isAllAssigned
                ? '<span style="color:var(--text-success);font-weight:600"><i class="ti ti-circle-check"></i> All scenes assigned! Ready to generate video clips.</span>'
                : `<span style="color:#f59e0b;font-weight:600"><i class="ti ti-alert-triangle"></i> ${unassigned.length} scene(s) unassigned. Every scene must have an assigned character!</span>`
              }
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--text-muted)">Assigned: ${assignedCount} / ${scenes.length}</span>
            <button class="btn-primary" onclick="S.studioStep=4;render()" ${!isAllAssigned ? 'disabled' : ''} style="${!isAllAssigned ? 'opacity:0.5;cursor:not-allowed;' : 'background:linear-gradient(135deg,#4285f4,#34a853);'}">
              Next: Generate Video Clips <i class="ti ti-arrow-right"></i>
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:10px">
          ${scenes.map((sc, idx) => {
            const isAssigned = !!sc.assignedCharacterId;
            const assignedChar = characters.find(c => c.id === sc.assignedCharacterId);
            return `
              <div style="background:var(--surface-2);border-radius:8px;padding:10px;border:1px solid ${isAssigned ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)'};display:flex;flex-direction:column;gap:6px">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:11px;font-weight:700;color:var(--brand)">Scene ${sc.sceneNum || idx + 1}</span>
                  <span style="font-size:10px;color:var(--text-muted)">${sc.duration || 30}s</span>
                </div>
                <div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${sc.title || 'Scene ' + (idx + 1)}
                </div>
                <div style="font-size:11px;color:var(--text-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
                  ${sc.visualAction || sc.description || sc.narration || ''}
                </div>
                <div style="margin-top:auto;padding-top:6px;border-top:1px solid var(--border)">
                  <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px">Assigned Character:</label>
                  <select class="select-field" style="width:100%;font-size:11px;padding:4px 6px" onchange="assignCharacterToScene(${idx}, this.value)">
                    <option value="">-- Select Character (Required) --</option>
                    ${characters.map(c => `<option value="${c.id}" ${c.id === sc.assignedCharacterId ? 'selected' : ''}>${c.name}</option>`).join('')}
                  </select>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
          <button class="btn-primary" onclick="S.studioStep=4;render()" ${!isAllAssigned ? 'disabled' : ''} style="${!isAllAssigned ? 'opacity:0.5;cursor:not-allowed;' : 'background:linear-gradient(135deg,#4285f4,#34a853);'}">
            Next: Generate Video Clips <i class="ti ti-arrow-right"></i>
          </button>
          <button class="btn-ghost" onclick="S.studioStep=2;render()"><i class="ti ti-arrow-left"></i> Back to Prompts</button>
        </div>
      </div>
    `;
  }

  // Step 4: Video Generation Progress
  if (S.studioStep === 4) {
    const activeVisualModel = (typeof IMAGE_MODELS !== 'undefined' ? IMAGE_MODELS.find(m => m.id === S.activeImageModel) : null) || { label: 'Flux.1 Schnell', shortLabel: 'Flux.1' };
    panelHtml = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div class="section-label" style="margin-bottom:0"><i class="ti ti-video"></i> Storyboard & Video Generation Progress</div>
        ${renderImageModelSelect(true)}
      </div>
      <div style="font-size:11px;color:var(--text-muted);background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px">
        <i class="ti ti-info-circle" style="color:var(--brand);font-size:16px"></i>
        <span>Storyboard scene visuals are rendered using <strong>${activeVisualModel.label}</strong>. You can switch visual engines anytime.</span>
      </div>
      ${S.studioClips.map((clip, i) => {
        const statusIcon = clip.status === 'done' ? 'ti-circle-check' : clip.status === 'error' ? 'ti-alert-circle' : clip.status === 'generating' || clip.status === 'polling' ? 'ti-loader' : clip.status === 'pending-manual' ? 'ti-hand-click' : 'ti-clock';
        const statusColor = clip.status === 'done' ? 'var(--text-success)' : clip.status === 'error' ? 'var(--text-danger)' : clip.status === 'pending-manual' ? 'var(--text-warning)' : 'var(--text-muted)';
        const statusText = clip.status === 'done' ? 'Ready' : clip.status === 'error' ? 'Error' : clip.status === 'generating' ? 'Generating...' : clip.status === 'polling' ? 'Processing...' : clip.status === 'pending-manual' ? 'Manual' : 'Queued';
        return `
          <div class="phase-card" style="border-left:3px solid ${statusColor}">
            <div class="phase-header">
              <i class="ti ${statusIcon} ${clip.status === 'generating' || clip.status === 'polling' ? 'studio-spin' : ''}" style="color:${statusColor};font-size:18px"></i>
              <span class="phase-name">Scene ${i+1}</span>
              <span style="font-size:12px;color:${statusColor};margin-left:auto">${statusText}</span>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${(clip.prompt || '').substring(0, 120)}${(clip.prompt || '').length > 120 ? '...' : ''}</div>
            ${clip.error ? `<div style="font-size:11px;color:var(--text-danger);margin-top:6px">${clip.error}</div>` : ''}
            ${clip.videoUrl ? `<video src="${clip.videoUrl}" controls class="studio-clip-preview" style="margin-top:8px"></video>` : clip.imageUrl ? `<img src="${resolveAssetUrl(clip.imageUrl)}" class="studio-clip-preview" style="margin-top:8px;border-radius:6px;max-height:220px;object-fit:cover" alt="Scene ${i+1}" />` : ''}
            ${clip.status === 'error' ? `<button class="btn-ghost" style="font-size:11px;padding:3px 8px;margin-top:6px" onclick="generateStudioClip(${i})"><i class="ti ti-refresh"></i> Retry</button>` : ''}
          </div>`;
      }).join('')}
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn-primary" onclick="S.studioStep=5;render()"><i class="ti ti-layout-grid"></i> Go to Timeline</button>
        <button class="btn-ghost" onclick="exportStudioPrompts()"><i class="ti ti-clipboard"></i> Copy Prompts</button>
      </div>`;
  }

  // Step 5: Timeline & Clips (Distinct Scene Thumbnails)
  if (S.studioStep === 5) {
    panelHtml = renderStudioPlayer() + `
      <div class="section-label" style="margin-bottom:10px"><i class="ti ti-layout-grid"></i> Timeline & Scenes</div>
      <div class="studio-timeline">
        ${S.studioClips.map((clip, i) => {
          const p = S.studioPrompts[i];
          const sc = S.studioScript?.scenes?.[i];
          const cuts = clip.cuts || [];
          const cutTotal = getClipCutTotal(i);
          const assignedChar = (S.studioCharacters || []).find(c => c.id === sc?.assignedCharacterId);

          return `
            <div class="studio-timeline-clip">
              <div class="studio-timeline-header">
                <span style="font-size:11px;font-weight:700;color:var(--brand)">${i+1}</span>
                <span style="font-size:12px;font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p?.title || 'Scene ' + (i+1)}</span>
                ${assignedChar ? `
                  <span class="studio-char-pill" title="Assigned Character: ${assignedChar.name}">
                    <img src="${resolveAssetUrl(assignedChar.url)}" class="studio-char-avatar" />
                    <span>${assignedChar.name.split(' ')[0]}</span>
                  </span>
                ` : ''}
                ${cuts.length ? `<span class="studio-cut-pill" style="font-size:9px;padding:1px 5px" title="${cuts.length} cut(s) applied"><i class="ti ti-scissors"></i> ${cuts.length}</span>` : ''}
                <div style="display:flex;gap:4px">
                  <button class="btn-ghost" style="padding:2px 6px;font-size:11px;color:${cuts.length ? '#f87171' : 'var(--text-muted)'}" onclick="openClipCutModal(${i})" title="Cut/Trim this scene"><i class="ti ti-scissors"></i></button>
                  <button class="btn-ghost" style="padding:2px 6px;font-size:11px" onclick="reorderClip(${i},${i-1})" ${i === 0 ? 'disabled' : ''}><i class="ti ti-arrow-up"></i></button>
                  <button class="btn-ghost" style="padding:2px 6px;font-size:11px" onclick="reorderClip(${i},${i+1})" ${i === S.studioClips.length - 1 ? 'disabled' : ''}><i class="ti ti-arrow-down"></i></button>
                </div>
              </div>
              ${clip.videoUrl ? `<video src="${clip.videoUrl}" controls class="studio-clip-preview"></video>` : clip.imageUrl ? `<img src="${resolveAssetUrl(clip.imageUrl)}" class="studio-clip-preview" alt="Scene ${i+1}" />` : `<div class="studio-clip-placeholder">No visual</div>`}
              <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;font-size:10px;color:var(--text-muted)">
                <span>${p?.cameraMove || ''}</span>
                <span><strong>${getClipEffectiveDuration(i)}s</strong>${cutTotal > 0 ? ` <s style="opacity:0.6">${sc?.duration || '?'}s</s>` : ''}</span>
              </div>
            </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn-primary" onclick="S.studioStep=6;render()"><i class="ti ti-download"></i> Go to Export</button>
        <button class="btn-ghost" onclick="exportStudioPrompts()"><i class="ti ti-clipboard"></i> Copy All Prompts</button>
        <button class="btn-ghost" onclick="S.studioStep=4;render()"><i class="ti ti-arrow-left"></i> Back</button>
      </div>`;
  }

  // Step 6: Export
  if (S.studioStep === 6) {
    panelHtml = `
      ${renderStudioPlayer()}
      <div class="studio-export-hero">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px">
              <i class="ti ti-movie" style="color:var(--brand);font-size:24px"></i>
              Export & Download Full Movie
            </div>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">
              Compiles all ${S.studioClips.length} animated scenes, motion visuals, dynamic subtitles, and audio soundtrack into a single downloadable .webm video file.
            </div>
          </div>
          <button class="btn-primary" style="padding:12px 24px;font-size:15px;background:linear-gradient(135deg,#10b981,#059669)" onclick="exportFullVideo()">
            <i class="ti ti-download"></i> Download Full Video
          </button>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;align-items:center">
        <button class="btn-primary" onclick="saveCurrentProjectToHistory()"><i class="ti ti-device-floppy"></i> Save to History & Drive</button>
        ${(S.lastSavedDriveFolderUrl || getProjectHistory().find(p => p.driveFolderUrl)?.driveFolderUrl) ? `
          <a href="${S.lastSavedDriveFolderUrl || getProjectHistory().find(p => p.driveFolderUrl)?.driveFolderUrl}" target="_blank" rel="noopener" class="btn-ghost" style="padding:8px 14px;font-size:13px;color:#4285f4;text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-weight:600;border:1px solid rgba(66,133,244,0.3);background:rgba(66,133,244,0.06);border-radius:6px" title="Open saved folder in Google Drive">
            <i class="ti ti-brand-google-drive"></i> Open in Google Drive <i class="ti ti-external-link" style="font-size:11px"></i>
          </a>
        ` : ''}
        <button class="btn-ghost" onclick="exportStudioJSON()"><i class="ti ti-file-export"></i> Save Project JSON</button>
        <button class="btn-ghost" onclick="exportStudioScript()"><i class="ti ti-copy"></i> Copy Script</button>
        <button class="btn-ghost" onclick="S.studioStep=5;render()"><i class="ti ti-arrow-left"></i> Back to Timeline</button>
      </div>`;
  }

  return stepperHtml + qualityAlertHtml + errorHtml + progressHtml + panelHtml;
}

// ── Application Root Renderer ─────────────────────────────────────────
function render() {
  const statusCls = !S.apiKey ? '' : 'ok';
  const statusTxt = !S.apiKey ? '<i class="ti ti-key"></i> Set API Key' : '<i class="ti ti-circle-check"></i> Groq Connected';

  document.getElementById('app').innerHTML = `
    ${renderSetupModal()}
    ${renderHistoryModal()}
    ${renderLightbox()}
    ${renderClipCutModal()}
    ${renderExportProgressModal()}
    <input type="file" id="studio-import-file-input" accept=".json" onchange="importStudioJSON(event)" style="display:none" />

    <div class="shell">
      <header class="header">
        <div class="header-left">
          <div class="logo-mark"><i class="ti ti-movie"></i></div>
          <div>
            <div class="logo-name">Wise Simple Studio</div>
            <div class="logo-sub">AI Video & Animated Story Creator</div>
          </div>
        </div>
        <div class="header-right">
          ${renderModelSelect()}
          ${renderImageModelSelect()}
          <button class="api-status ${statusCls}" onclick="S.showSetup=true;render()">${statusTxt}</button>
          <button class="btn-ghost" style="font-size:12px;padding:6px 12px;${S.historyModal.open ? 'color:var(--brand);font-weight:600;' : ''}" onclick="S.historyModal.open=true;render()" title="Browse project history & cloud backups">
            <i class="ti ti-history"></i> History & Drive
          </button>
          <button class="btn-ghost" style="font-size:12px;padding:6px 12px" onclick="document.getElementById('studio-import-file-input').click()" title="Import existing project JSON"><i class="ti ti-upload"></i> Import</button>
          <button class="btn-ghost" style="font-size:12px;padding:6px 12px" onclick="exportStudioJSON()" title="Export current project JSON"><i class="ti ti-download"></i> Export</button>
        </div>
      </header>

      <main>
        ${buildStudio()}
      </main>
    </div>`;
}

// ── Boot ──────────────────────────────────────────────────────────────
function init() {
  const restored = restoreStudioState();
  if (!restored) {
    loadSampleEpic();
  }
  // Ensure default selected tab on launch is Concept (Step 0)
  S.studioStep = 0;
  S.historyModal.open = false;
  render();
}

init();
loadGroqModels();

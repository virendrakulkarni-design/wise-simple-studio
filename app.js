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
    label: 'Flux.1 Schnell (Recommended / Pixar 3D Quality)',
    shortLabel: 'Flux.1 (Recommended)',
    badge: 'Free / SOTA',
    desc: 'Black Forest Labs 12B distilled transformer. Unmatched character detail, vibrant Disney/Pixar 3D animation, and prompt following.',
    engine: 'pollinations',
    param: 'flux'
  },
  {
    id: 'google-flow',
    label: 'Google Flow / Imagen 3 (Google AI Studio)',
    shortLabel: 'Google Flow (Imagen 3)',
    badge: 'Google AI / Key',
    desc: 'Google DeepMind flagship Imagen 3 creative model. Exceptional photorealism and studio cinematography (Requires Google AI Studio Key).',
    engine: 'google',
    param: 'imagen-3.0-generate-002'
  },
  {
    id: 'gpt-image',
    label: 'GPT Image Mini (OpenAI / Expressive Characters)',
    shortLabel: 'GPT Image (OpenAI)',
    badge: 'Free / OpenAI',
    desc: 'OpenAI multi-modal visual synthesis model. Highly expressive cartoon and character facial animation.',
    engine: 'pollinations',
    param: 'gpt-image'
  },
  {
    id: 'z-image-turbo',
    label: 'Z-Image Turbo (Alibaba Tongyi / Instant 1s)',
    shortLabel: 'Z-Image Turbo',
    badge: 'Free / 1-sec',
    desc: 'High-speed distilled diffusion model. Renders storyboard frames in ~1-2 seconds.',
    engine: 'pollinations',
    param: 'z-image-turbo'
  },
  {
    id: 'nova-canvas',
    label: 'Amazon Nova Canvas (Cinematic Studio)',
    shortLabel: 'Nova Canvas',
    badge: 'Free / Amazon',
    desc: 'Amazon flagship visual synthesis engine tuned for cinematic scene composition and lighting.',
    engine: 'pollinations',
    param: 'nova-canvas'
  },
  {
    id: 'dreamshaper',
    label: 'DreamShaper 8 (Lykon / Anime & Concept Art)',
    shortLabel: 'DreamShaper',
    badge: 'Free / Stylized',
    desc: 'Versatile stylized model optimized for hand-drawn anime, fantasy landscapes, and concept illustrations.',
    engine: 'pollinations',
    param: 'dreamshaper'
  }
];

function openGoogleKeyPrompt() {
  const currentKey = S.googleApiKey || '';
  const newKey = prompt(
    'Enter your Google AI Studio / Gemini API Key (starts with AIza...):\n\n' +
    'Get your free key at: https://aistudio.google.com/apikey\n\n' +
    'This activates Google Flow (Veo 2 AI Video & Imagen 3 visual generation).',
    currentKey
  );
  if (newKey !== null) {
    const trimmed = newKey.trim();
    S.googleApiKey = trimmed;
    localStorage.setItem('google-key', trimmed);
    if (trimmed) {
      studioLog('✓ Google AI Studio API Key saved successfully! Google Flow is ready.');
    } else {
      studioLog('Google AI Studio Key cleared.');
    }
    render();
  }
}
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
  const currentModelId = (IMAGE_MODELS.find(m => m.id === S.activeImageModel) || IMAGE_MODELS[0]).id;
  return `
    <div style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span style="font-size:11px;font-weight:600;color:var(--text-muted);display:inline-flex;align-items:center;gap:4px">
        <i class="ti ti-photo" style="color:var(--brand)"></i> Visual:
      </span>
      <select class="select-field" title="Visual Image Model for Characters & Storyboards" onchange="setImageModel(this.value)" style="font-size:12px;padding:${compact ? '4px 8px' : '5px 10px'};background:var(--surface-2);border-color:var(--border-strong)">
        <optgroup label="✨ Verified Free Models (No Key Needed)">
          ${IMAGE_MODELS.filter(m => m.engine === 'pollinations').map(m => `
            <option value="${m.id}" ${m.id === currentModelId ? 'selected' : ''}>
              ${compact ? m.shortLabel : m.label}
            </option>
          `).join('')}
        </optgroup>
        <optgroup label="⚡ Google Visual Models (Requires Google Key)">
          ${IMAGE_MODELS.filter(m => m.engine === 'google').map(m => `
            <option value="${m.id}" ${m.id === currentModelId ? 'selected' : ''}>
              ${compact ? m.shortLabel : m.label} ${!S.googleApiKey ? '(Key Needed)' : '✓'}
            </option>
          `).join('')}
        </optgroup>
      </select>
    </div>
  `;
}

// ── Video & Visual Generation Engines ────────────────────────────────
const VIDEO_MODELS = [
  {
    id: 'nanobanana-motion',
    name: 'Nano Banana Motion (Free / Character-Consistent)',
    shortLabel: 'Nano Banana (Free)',
    badge: 'Free / Consistent',
    type: 'motion',
    modelParam: 'nano-banana',
    desc: 'Ultra-fast, consistent character animation model with 2.5D cinematic camera motion and voiceover. Free, instant, no key required.'
  },
  {
    id: 'google-flow',
    name: 'Google Flow / Veo 2 (Google AI Studio Video)',
    shortLabel: 'Google Flow (Veo 2)',
    badge: 'Google AI Studio',
    type: 'veo',
    modelParam: 'veo-2.0-generate-001',
    desc: 'Google DeepMind flagship generative AI video model (Generates raw MP4 video clips via Google AI Studio API. Requires Google Key in Setup).'
  },
  {
    id: 'motion-video',
    name: 'Flux Cinematic Motion Video (Free / SOTA)',
    shortLabel: 'Flux Motion Video',
    badge: 'Free / SOTA',
    type: 'motion',
    modelParam: 'flux',
    desc: 'Generates animated video scenes using Flux.1 Schnell with dynamic camera motion, voiceover, and character consistency lock.'
  },
  {
    id: 'storyboard-nano',
    name: 'Nano Banana Storyboard Shots (Free)',
    shortLabel: 'Nano Banana Storyboard',
    badge: 'Free / Fast',
    type: 'storyboard',
    modelParam: 'nano-banana',
    desc: 'Fast, consistent character storyboard keyframes via Nano Banana.'
  },
  {
    id: 'storyboard-flux',
    name: 'Flux.1 Schnell Storyboard Shots (Free)',
    shortLabel: 'Flux.1 Storyboard',
    badge: 'Free / SOTA',
    type: 'storyboard',
    modelParam: 'flux',
    desc: 'High-fidelity cinematic visual storyboards by Black Forest Labs.'
  },
  {
    id: 'storyboard-3d',
    name: 'Flux 3D Pixar Animation (Free)',
    shortLabel: 'Flux 3D Pixar',
    badge: 'Free / 3D Animation',
    type: 'storyboard',
    modelParam: 'flux-3d',
    desc: '3D CGI Pixar/Disney animated character style storyboards.'
  }
];
function setVideoEngine(engineId) {
  S.activeVideoEngine = engineId;
  localStorage.setItem('active-video-engine', engineId);
  const found = VIDEO_MODELS.find(m => m.id === engineId);
  if (found) {
    studioLog(`🎬 Switched video generation engine to: ${found.name}`);
  }
  render();
}

function renderVideoEngineSelect(compact = false) {
  return `
    <div style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span style="font-size:11px;font-weight:600;color:var(--text-muted);display:inline-flex;align-items:center;gap:4px">
        <i class="ti ti-video" style="color:var(--brand)"></i> Video:
      </span>
      <select class="select-field" title="Video Generation Engine & Model" onchange="setVideoEngine(this.value)" style="font-size:12px;padding:${compact ? '4px 8px' : '5px 10px'};background:var(--surface-2);border-color:var(--border-strong);max-width:210px">
        <optgroup label="🎬 Video Generation Engines">
          ${VIDEO_MODELS.map(m => `
            <option value="${m.id}" ${m.id === S.activeVideoEngine ? 'selected' : ''}>
              ${compact ? m.shortLabel : m.name} ${m.type === 'veo' && !S.googleApiKey ? '(Key Needed)' : ''}
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
  activeVideoEngine: localStorage.getItem('active-video-engine') || 'nanobanana-motion',
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
  studioStoryboard: [],   // Array of { sceneIndex, imageUrl, status, prompt, approved }
  studioVideos: [],        // Array of { sceneIndex, videoUrl, status, engine, error }
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
      chars: sc.assignedCharacterIds || (sc.assignedCharacterId ? [sc.assignedCharacterId] : []),
      dialogue: sc.dialogue,
      narration: sc.narration
    })),
    prompts: (S.studioPrompts || []).map(p => p.prompt || p.visualPrompt || ''),
    characters: (S.studioCharacters || []).map(c => ({ id: c.id, name: c.name, url: c.url })),
    storyboard: (S.studioStoryboard || []).map(sb => ({ sceneIndex: sb.sceneIndex, imageUrl: sb.imageUrl, status: sb.status, approved: sb.approved })),
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
    numScenes: S.studioScript?.scenes?.length || S.studioClips?.length || S.studioStoryboard?.length || 0,
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

  // Ensure every scene has assignedCharacterIds array initialized
  if (S.studioScript && Array.isArray(S.studioScript.scenes)) {
    S.studioScript.scenes.forEach(sc => {
      if (!Array.isArray(sc.assignedCharacterIds)) {
        sc.assignedCharacterIds = sc.assignedCharacterId ? [sc.assignedCharacterId] : [];
      }
      sc.assignedCharacterId = sc.assignedCharacterIds[0] || null;
    });
  }
}

function saveStudioState() {
  try {
    const state = {
      version: '3.0',
      studioStep: S.studioStep,
      studioTopic: S.studioTopic,
      studioStyle: S.studioStyle,
      studioDuration: S.studioDuration,
      studioAspect: S.studioAspect,
      studioScript: S.studioScript,
      studioPrompts: S.studioPrompts,
      studioCharacters: S.studioCharacters,
      studioStoryboard: S.studioStoryboard,
      studioVideos: S.studioVideos,
      studioClips: S.studioClips,
      lastCheckpoint: new Date().toISOString()
    };
    ss('wise-studio-state', state);
  } catch (_) {}
}

function restoreStudioState() {
  try {
    const saved = sg('wise-studio-state');
    if (saved && (saved.version === '3.0' || saved.version === '2.3') && saved.studioScript && Array.isArray(saved.studioScript.scenes)) {
      const charUrls = new Set((saved.studioCharacters || []).map(c => c.url));
      const hasDuplicateSheets = Array.isArray(saved.studioClips) && saved.studioClips.length > 1 && saved.studioClips.every(c => !c.imageUrl || charUrls.has(c.imageUrl));
      if (!hasDuplicateSheets) {
        Object.assign(S, saved);
        // Ensure new arrays exist for v2.3 upgrades
        if (!S.studioStoryboard) S.studioStoryboard = [];
        if (!S.studioVideos) S.studioVideos = [];
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
    studioStoryboard: S.studioStoryboard,
    studioVideos: S.studioVideos,
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

    const veoPrompt = `${styleDesc}, ${title}. ${action}. ${chars ? 'Characters: ' + chars + '. ' : ''}Setting: ${env}. Lighting: ${lighting}. Camera: ${camera}, smooth cinematic movement, cute stylized 3D animation, vibrant cheerful colors, 8k render, Disney Pixar animation feature film quality.`;

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
      S.studioLoading = false;
      S.studioLoadingMsg = null;
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

// ── Step 3: Character Studio & Multi-Character Scene Assignment ─────────────


// ── Character Consistency & Seed Locking Helpers ────────────────────
function getCharacterSeed(char) {
  if (!char) return 428571;
  let h = 5381;
  const str = (char.id || '') + (char.name || '') + (char.description || '');
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h = h & 0x7fffffff;
  }
  return (h % 800000) + 100000;
}

function getCharacterReferenceUrl(char) {
  if (!char) return '';
  if (char.sourceUrl && typeof char.sourceUrl === 'string' && char.sourceUrl.startsWith('http')) return char.sourceUrl;
  if (char.url && typeof char.url === 'string' && char.url.startsWith('http')) return char.url;
  const prompt = char.prompt || `Character portrait of ${char.name}, ${char.description || ''}`;
  const seed = char.seed || getCharacterSeed(char);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.substring(0, 300))}?width=768&height=768&seed=${seed}&nologo=true`;
}

// ponytail: deleted uncalled buildSceneCharacterPrompt (YAGNI)
function reRollSceneClip(idx) {
  studioLog(`↺ Re-generateing Scene ${idx + 1} with character consistency lock...`);
  generateStudioClip(idx);
}

function getSceneCharacterIds(sc) {
  if (!sc) return [];
  if (Array.isArray(sc.assignedCharacterIds) && sc.assignedCharacterIds.length) {
    return sc.assignedCharacterIds.filter(Boolean);
  }
  if (sc.assignedCharacterId) {
    return [sc.assignedCharacterId];
  }
  return [];
}

function getSceneCharacters(sc) {
  const ids = new Set(getSceneCharacterIds(sc));
  return (S.studioCharacters || []).filter(c => ids.has(c.id));
}

function isSceneAssigned(sc) {
  return getSceneCharacters(sc).length > 0;
}

function getUnassignedScenes() {
  const scenes = S.studioScript?.scenes || [];
  return scenes.filter(sc => !isSceneAssigned(sc));
}

function syncSceneClipCharacters(sceneIdx) {
  const sc = S.studioScript?.scenes?.[sceneIdx];
  if (!sc || !S.studioClips?.[sceneIdx]) return;
  const chars = getSceneCharacters(sc);
  if (chars.length) {
    S.studioClips[sceneIdx].characterId = chars[0].id;
    S.studioClips[sceneIdx].characterIds = chars.map(c => c.id);
    S.studioClips[sceneIdx].characterName = chars.map(c => c.name).join(' & ');
    S.studioClips[sceneIdx].characterUrl = chars[0].url;
    S.studioClips[sceneIdx].characters = chars.map(c => ({ id: c.id, name: c.name, url: c.url }));
    if (!S.studioClips[sceneIdx].imageUrl) {
      S.studioClips[sceneIdx].imageUrl = chars[0].url;
    }
  } else {
    S.studioClips[sceneIdx].characterId = null;
    S.studioClips[sceneIdx].characterIds = [];
    S.studioClips[sceneIdx].characterName = null;
    S.studioClips[sceneIdx].characterUrl = null;
    S.studioClips[sceneIdx].characters = [];
  }
}

// ponytail: deleted orphaned assignCharacterToScene (superseded by toggleCharacterForScene)
function toggleCharacterForScene(sceneIdx, charId) {
  if (!S.studioScript?.scenes?.[sceneIdx]) return;
  const sc = S.studioScript.scenes[sceneIdx];
  if (!Array.isArray(sc.assignedCharacterIds)) {
    sc.assignedCharacterIds = sc.assignedCharacterId ? [sc.assignedCharacterId] : [];
  }
  const idx = sc.assignedCharacterIds.indexOf(charId);
  if (idx > -1) {
    sc.assignedCharacterIds.splice(idx, 1);
  } else {
    sc.assignedCharacterIds.push(charId);
  }
  sc.assignedCharacterId = sc.assignedCharacterIds[0] || null;

  syncSceneClipCharacters(sceneIdx);
  saveStudioState();
  const char = (S.studioCharacters || []).find(c => c.id === charId);
  const nowSelected = sc.assignedCharacterIds.includes(charId);
  studioLog(`Scene ${sceneIdx + 1}: ${nowSelected ? 'Added' : 'Removed'} ${char ? char.name : 'character'} (Total: ${sc.assignedCharacterIds.length})`);
  render();
}

function assignAllCharactersToScene(sceneIdx) {
  if (!S.studioScript?.scenes?.[sceneIdx]) return;
  const sc = S.studioScript.scenes[sceneIdx];
  sc.assignedCharacterIds = (S.studioCharacters || []).map(c => c.id);
  sc.assignedCharacterId = sc.assignedCharacterIds[0] || null;

  syncSceneClipCharacters(sceneIdx);
  saveStudioState();
  studioLog(`Scene ${sceneIdx + 1}: Selected all ${sc.assignedCharacterIds.length} characters.`);
  render();
}

function clearSceneCharacters(sceneIdx) {
  if (!S.studioScript?.scenes?.[sceneIdx]) return;
  const sc = S.studioScript.scenes[sceneIdx];
  sc.assignedCharacterIds = [];
  sc.assignedCharacterId = null;

  syncSceneClipCharacters(sceneIdx);
  saveStudioState();
  studioLog(`Scene ${sceneIdx + 1}: Cleared all assigned characters.`);
  render();
}

function assignCharacterToAllScenes(charId) {
  if (!S.studioScript?.scenes?.length) return;
  const char = (S.studioCharacters || []).find(c => c.id === charId);
  S.studioScript.scenes.forEach((sc, idx) => {
    if (!Array.isArray(sc.assignedCharacterIds)) {
      sc.assignedCharacterIds = sc.assignedCharacterId ? [sc.assignedCharacterId] : [];
    }
    if (!sc.assignedCharacterIds.includes(charId)) {
      sc.assignedCharacterIds.push(charId);
    }
    sc.assignedCharacterId = sc.assignedCharacterIds[0] || null;
    syncSceneClipCharacters(idx);
  });
  saveStudioState();
  studioLog(`Assigned "${char ? char.name : 'Character'}" to all ${S.studioScript.scenes.length} scenes!`);
  render();
}

function autoMatchScriptCharacters() {
  if (!S.studioScript?.scenes?.length || !S.studioCharacters?.length) return;
  let matchedCount = 0;

  S.studioScript.scenes.forEach((sc, idx) => {
    const sceneText = `${sc.title || ''} ${sc.description || ''} ${sc.narration || ''} ${sc.dialogue || ''} ${(sc.characters || []).join(' ')}`.toLowerCase();
    const matchedIds = [];

    for (const ch of S.studioCharacters) {
      const chName = (ch.name || '').toLowerCase();
      const firstName = chName.split(' ')[0];
      if ((firstName.length > 2 && sceneText.includes(firstName)) || (chName.length > 2 && sceneText.includes(chName))) {
        if (!matchedIds.includes(ch.id)) {
          matchedIds.push(ch.id);
        }
      }
    }

    if (matchedIds.length > 0) {
      sc.assignedCharacterIds = matchedIds;
      sc.assignedCharacterId = matchedIds[0];
      matchedCount += matchedIds.length;
    } else if (!isSceneAssigned(sc)) {
      // Fallback: assign primary character to ensure every scene has at least 1 character
      sc.assignedCharacterIds = [S.studioCharacters[0].id];
      sc.assignedCharacterId = S.studioCharacters[0].id;
      matchedCount++;
    }

    syncSceneClipCharacters(idx);
  });

  saveStudioState();
  studioLog(`Smart auto-match complete: assigned characters across scenes (at least 1 per scene).`);
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
    (S.studioScript?.scenes || []).forEach((sc, idx) => {
      if (Array.isArray(sc.assignedCharacterIds)) {
        sc.assignedCharacterIds = sc.assignedCharacterIds.filter(cid => cid !== charId);
        sc.assignedCharacterId = sc.assignedCharacterIds[0] || null;
      } else if (sc.assignedCharacterId === charId) {
        sc.assignedCharacterId = null;
        sc.assignedCharacterIds = [];
      }
      syncSceneClipCharacters(idx);
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
    (S.studioScript?.scenes || []).forEach((sc, idx) => {
      if (Array.isArray(sc.assignedCharacterIds)) {
        sc.assignedCharacterIds = sc.assignedCharacterIds.filter(cid => cid !== charId);
        sc.assignedCharacterId = sc.assignedCharacterIds[0] || null;
      } else if (sc.assignedCharacterId === charId) {
        sc.assignedCharacterId = null;
        sc.assignedCharacterIds = [];
      }
      syncSceneClipCharacters(idx);
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

// ponytail: unified image generator covering Google Imagen 3 and Pollinations AI with reference image guidance
async function fetchImage({ prompt, aspect = '16:9', seed, model = 'flux', negative = '', width, height, image = '' }) {
  if ((S.activeImageModel === 'google-flow' || S.activeImageModel === 'google-imagen') && S.googleApiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${S.googleApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: prompt.substring(0, 480) }],
          parameters: {
            sampleCount: 1,
            aspectRatio: aspect === '9:16' ? '9:16' : (aspect === '1:1' ? '1:1' : '16:9'),
            ...(negative ? { negativePrompt: negative } : {})
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        if (b64) return `data:image/png;base64,${b64}`;
      }
    } catch (e) {
      console.warn('Imagen 3 fetch failed, falling back to Pollinations:', e);
    }
  }

  const w = width || (aspect === '9:16' ? 576 : (aspect === '1:1' ? 768 : 1024));
  const h = height || (aspect === '9:16' ? 1024 : (aspect === '1:1' ? 768 : 576));
  const s = seed || Math.floor(Math.random() * 900000) + 100000;
  const neg = negative ? `&negative=${encodeURIComponent(negative)}` : '';
  const imgParam = (image && typeof image === 'string' && image.startsWith('http')) ? `&image=${encodeURIComponent(image)}` : '';
  const modelAliases = {
    'nano-banana': 'flux',
    'flux-3d': 'flux',
    'flux-realism': 'flux',
    'flux-anime': 'dreamshaper',
    'turbo': 'z-image-turbo',
    'sana': 'sana'
  };
  const cleanModel = modelAliases[model] || model || 'flux';
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.substring(0, 950))}?width=${w}&height=${h}&nologo=true&seed=${s}&model=${encodeURIComponent(cleanModel)}${neg}${imgParam}`;
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

    // ponytail: unified fetchImage replaces 35 lines of duplicate Imagen/Pollinations branching
    const modelParam = currentImgModel.engine === 'pollinations' ? currentImgModel.param : 'flux';
    finalUrl = await fetchImage({ prompt: cleanPrompt, aspect: '1:1', seed, model: modelParam });
    const rawSourceUrl = finalUrl;

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
      sourceUrl: rawSourceUrl,
      seed: seed,
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
  S.qualityAlert = null;
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  await generateCharacterFromPrompt(S.charPromptInput, S.charNameInput, S.charRoleInput);
}

// ── Step 4: Clip Generation with Distinct Scene Visuals ──────────────

// ── Storyboard Generation (Step 4: New) ──────────────────────────────
async function generateStoryboardImage(idx) {
  const promptData = S.studioPrompts?.[idx];
  const sceneData = S.studioScript?.scenes?.[idx];
  if (!promptData && !sceneData) return;

  const assignedChars = getSceneCharacters(sceneData);
  if (!assignedChars.length) {
    if (!S.studioStoryboard[idx]) S.studioStoryboard[idx] = {};
    S.studioStoryboard[idx] = {
      sceneIndex: idx,
      status: 'error',
      imageUrl: null,
      prompt: promptData?.veoPrompt || sceneData?.description,
      error: 'Scene missing character assignment! Please assign at least one character in Step 3.',
      approved: false
    };
    S.studioLoading = true;
    S.studioLoadingMsg = 'Generating scene artwork...';
    render();
    return;
  }

  // 1. Identify which assigned characters actually appear in this scene
  const sceneText = `${sceneData?.title || ''} ${promptData?.veoPrompt || ''} ${sceneData?.description || ''} ${sceneData?.narration || ''} ${promptData?.character || ''}`.toLowerCase();
  
  let sceneChars = assignedChars.filter(c => {
    const name = (c.name || '').toLowerCase();
    const firstName = name.split(' ')[0];
    return (firstName.length > 2 && sceneText.includes(firstName)) || (name.length > 2 && sceneText.includes(name));
  });

  if (!sceneChars.length) {
    sceneChars = [assignedChars[0]];
  }

  const primaryChar = sceneChars[0];
  const charNames = sceneChars.map(c => c.name).join(' & ');

  S.studioStoryboard[idx] = {
    sceneIndex: idx,
    status: 'generating',
    imageUrl: null,
    prompt: promptData?.veoPrompt || sceneData?.description,
    error: null,
    approved: false,
    characterId: primaryChar.id,
    characterIds: sceneChars.map(c => c.id),
    characterName: charNames,
    characterUrl: primaryChar.url
  };
  studioLog(`🎨 Generating storyboard frame for Scene ${idx + 1} (${sceneData?.title || ''}) featuring ${charNames}...`);
  render();

  try {
    // 2. Extract clean character visual traits from the Character Sheet
    const is3dKids = !S.studioStyle || S.studioStyle === 'kids3d';
    const charVisuals = sceneChars.map(c => {
      const descPart = (c.description || '').replace(/character\s*sheet|expressions?(\s*grid)?|model\s*sheet|turnaround|palette|color\s*swatches|multi-?panel|tiled/gi, '').trim();
      const promptPart = (c.prompt || '')
        .replace(/^Character\s+portrait\s+of\s+[^,]+,?\s*/i, '')
        .replace(/centered\s+character\s+portrait|clean\s+studio\s+background|8k\s+render|octane\s+render|volumetric\s+soft\s+shadows/gi, '')
        .replace(/character\s*sheet|expressions?(\s*grid)?|model\s*sheet|turnaround|palette/gi, '')
        .trim();
      const combinedTraits = [descPart, promptPart].filter(Boolean).join(', ').substring(0, 200);
      const styleCue = is3dKids
        ? 'cute stylized 3D Disney Pixar cartoon character with large expressive eyes and friendly smile, exact same character design as character sheet'
        : 'consistent character design matching reference sheet';
      return `Character: ${c.name} (${styleCue}, visual appearance: ${combinedTraits})`;
    }).join(' and ');

    // 3. Clean scene action & setting without repetitive headers
    const rawAction = promptData?.veoPrompt || sceneData?.description || sceneData?.title || '';
    const cleanAction = rawAction
      .replace(/^(3D\s+kids\s+animation\s+style|vibrant\s+colors|expressive\s+characters|whimsical\s+lighting|[,\s.-])+/gi, '')
      .replace(/^Scene\s+\d+:\s*/i, '')
      .replace(/\bphotorealistic(\s+textures)?\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 4. Style anchor (3D Disney/Pixar animated film look)
    const stylePrefix = S.studioStyle === 'anime'
      ? 'Studio Ghibli anime movie still, beautiful hand-drawn anime aesthetic, vibrant colorful lighting, masterpiece'
      : (S.studioStyle === 'claymation'
        ? 'Aardman claymation animation film still, stop-motion crafted clay character, warm studio lighting'
        : (S.studioStyle === 'comic'
          ? 'Marvel graphic novel film still, vibrant dynamic comic illustration, detailed ink and cel shading'
          : (S.studioStyle === 'realistic'
            ? 'Cinematic movie still, photorealistic, natural cinematic lighting, 8k render'
            : '3D Disney Pixar animated movie scene, cute stylized 3D animation, vibrant cheerful colors, bright sunny lighting, 8k Pixar render')));

    // 5. Final cinematic prompt honoring character sheet continuity
    const scenePrompt = `${stylePrefix}. Main Character: ${charVisuals}. Story Action: ${cleanAction.substring(0, 220)}. Bright cheerful daytime atmosphere, lush colorful environment, expressive playful animation, masterpiece Disney Pixar animated still, identical character design to character sheet.`;
    const negPrompt = 'photorealistic, live action, real animal, wildlife photography, national geographic, realistic adult lion, dark, gloomy, murky, silhouette, muddy, swamp, horror, scary, sinister, mutated, deformed, ugly, bad anatomy, text, watermark, logo, split screen, multi-panel, character sheet, turnaround, model sheet';

    // Determine model
    const imgModelObj = (typeof IMAGE_MODELS !== 'undefined' ? IMAGE_MODELS.find(m => m.id === S.activeImageModel) : null);
    const modelParam = imgModelObj?.param || S.activeImageModel || 'flux';
    let imageUrl = null;

    const charRefUrl = getCharacterReferenceUrl(primaryChar);
    const charBaseSeed = primaryChar?.seed || getCharacterSeed(primaryChar);
    const seed = (charBaseSeed + idx * 79) % 900000 + 100000;

    imageUrl = await fetchImage({
      prompt: scenePrompt,
      aspect: S.studioAspect,
      seed: seed,
      negative: negPrompt,
      model: modelParam,
      image: charRefUrl
    });

    // Preload image so UI stays in loading state until image bytes actually arrive
    if (imageUrl && !imageUrl.startsWith('data:')) {
      try {
        await new Promise((resolve) => {
          const preImg = new Image();
          const timer = setTimeout(() => resolve(false), 25000);
          preImg.onload = () => { clearTimeout(timer); resolve(true); };
          preImg.onerror = () => { clearTimeout(timer); resolve(false); };
          preImg.src = imageUrl;
        });
      } catch (_) {}
    }

    S.studioStoryboard[idx].status = 'done';
    S.studioStoryboard[idx].imageUrl = imageUrl;
    S.studioStoryboard[idx].error = null;
    studioLog(`✅ Storyboard frame ${idx + 1} generated successfully.`);
  } catch (e) {
    S.studioStoryboard[idx].status = 'error';
    S.studioStoryboard[idx].error = e.message;
    studioLog(`❌ Storyboard frame ${idx + 1} failed: ${e.message}`);
  }

  saveStudioState();
  render();
}

async function generateAllStoryboards() {
  const unassigned = getUnassignedScenes();
  if (unassigned.length > 0) {
    alert(`⚠️ Mandatory Character Assignment Required:\n\n${unassigned.length} scene(s) do not have an assigned character image yet!\nPlease assign a character image to every scene before proceeding.`);
    S.studioStep = 3;
    render();
    return;
  }

  S.studioStep = 4;
  const numScenes = S.studioPrompts?.length || S.studioScript?.scenes?.length || 0;
  S.studioStoryboard = Array.from({ length: numScenes }, (_, i) => ({
    sceneIndex: i,
    status: 'queued',
    imageUrl: null,
    prompt: S.studioPrompts?.[i]?.veoPrompt || S.studioScript?.scenes?.[i]?.description || '',
    error: null,
    approved: false
  }));
  studioLog('🎨 Starting batch storyboard generation...');
  render();

  for (let i = 0; i < numScenes; i++) {
    S.studioProgress = `🎨 Rendering storyboard frame ${i + 1} of ${numScenes}...`;
    render();
    await generateStoryboardImage(i);
  }
  S.studioProgress = '';
  saveStudioState();
  saveCurrentProjectToHistory();
  studioLog('✅ All storyboard frames generated! Review and approve before proceeding to video.');
  render();
}

function approveStoryboardFrame(idx) {
  if (S.studioStoryboard?.[idx]) {
    S.studioStoryboard[idx].approved = true;
    saveStudioState();
    render();
  }
}

function approveAllStoryboards() {
  (S.studioStoryboard || []).forEach(sb => {
    if (sb && sb.status === 'done') sb.approved = true;
  });
  saveStudioState();
  render();
}

function unapproveStoryboardFrame(idx) {
  if (S.studioStoryboard?.[idx]) {
    S.studioStoryboard[idx].approved = false;
    saveStudioState();
    render();
  }
}

async function rerollStoryboardFrame(idx) {
  studioLog(`↺ Re-generateing storyboard frame ${idx + 1}...`);
  await generateStoryboardImage(idx);
}

function handleStoryboardImageLoad(idx, imgEl) {
  const ldr = document.getElementById(`sb-loader-${idx}`);
  if (ldr) ldr.style.display = 'none';
  if (imgEl) {
    imgEl.style.opacity = '1';
    imgEl.style.display = 'block';
  }
}

function handleStoryboardImageError(idx, imgEl) {
  const ldr = document.getElementById(`sb-loader-${idx}`);
  if (ldr) {
    ldr.style.display = 'flex';
    ldr.innerHTML = `
      <div style="color:var(--text-secondary);padding:14px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px">
        <i class="ti ti-photo-x" style="font-size:24px;color:#f87171"></i>
        <div style="font-size:12px;font-weight:600;color:var(--text-primary)">Image load timeout</div>
        <div style="font-size:10px;color:var(--text-muted);max-width:200px">AI server took longer than expected</div>
        <button class="btn-ghost" style="margin-top:6px;font-size:11px;padding:3px 10px;color:var(--brand);border:1px solid rgba(99,102,241,0.3)" onclick="rerollStoryboardFrame(${idx})">
          <i class="ti ti-refresh"></i> Retry Frame
        </button>
      </div>
    `;
  }
  if (imgEl) {
    imgEl.style.display = 'none';
  }
}

function getStoryboardReadyCount() {
  return (S.studioStoryboard || []).filter(sb => sb && sb.status === 'done' && sb.imageUrl).length;
}

function getAllStoryboardsGenerated() {
  const numScenes = S.studioPrompts?.length || S.studioScript?.scenes?.length || 0;
  if (numScenes === 0) return false;
  return getStoryboardReadyCount() >= numScenes;
}

async function generateStudioClip(idx) {
  const promptData = S.studioPrompts?.[idx];
  const sceneData = S.studioScript?.scenes?.[idx];
  if (!promptData && !sceneData) return;

  const assignedChars = getSceneCharacters(sceneData);
  if (!assignedChars.length) {
    S.studioClips[idx] = {
      sceneIndex: idx,
      status: 'error',
      videoUrl: null,
      imageUrl: null,
      prompt: promptData?.veoPrompt || sceneData?.description,
      error: 'Scene missing character assignment! Please assign at least one character in Step 3.',
      cuts: S.studioClips?.[idx]?.cuts || []
    };
    render();
    return;
  }

  const primaryChar = assignedChars[0];
  const charNames = assignedChars.map(c => c.name).join(' & ');
  const activeEngine = (typeof VIDEO_MODELS !== 'undefined' ? VIDEO_MODELS.find(m => m.id === S.activeVideoEngine) : null) || { id: 'nanobanana-motion', name: 'Nano Banana Motion', type: 'motion', modelParam: 'nano-banana' };

  S.studioClips[idx] = {
    sceneIndex: idx,
    status: 'generating',
    videoUrl: null,
    imageUrl: S.studioStoryboard?.[idx]?.imageUrl || S.studioClips[idx]?.imageUrl || null,
    characterId: primaryChar.id,
    characterIds: assignedChars.map(c => c.id),
    characterName: charNames,
    characterUrl: primaryChar.url,
    characters: assignedChars.map(c => ({ id: c.id, name: c.name, url: c.url })),
    prompt: promptData?.veoPrompt || sceneData?.description,
    error: null,
    cuts: S.studioClips?.[idx]?.cuts || []
  };
  studioLog(`🎬 Generating Scene ${idx + 1} (${sceneData?.title || ''}) featuring ${charNames} [Engine: ${activeEngine.name}]...`);
  render();

  try {
    // 1. Google Flow / Veo 2 Video Generation
    if (activeEngine.type === 'veo' || activeEngine.id === 'google-flow') {
      if (S.googleApiKey) {
        try {
          studioLog(`🎬 Scene ${idx + 1}: Calling Google Flow / Veo 2 video API...`);
          const cleanDesc = (primaryChar.description || '').replace(/character\s*sheet|expressions|palette/gi, 'appearance').substring(0, 150);
          const veoFullPrompt = `SUBJECT: ${charNames}, ${cleanDesc}. ACTION: ${sceneData?.title || ''}, ${promptData?.veoPrompt || sceneData?.description || ''}. 3D animated scene. (STRICT CONTINUITY: Must maintain identical character design, age, species, and clothing for ${charNames}).`;
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${S.googleApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt: veoFullPrompt }],
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
          } else {
            const errText = await res.text();
            studioLog(`Veo 2 API note: ${errText.substring(0, 100)}. Generating scene artwork with Nano Banana.`);
            S.studioClips[idx].error = 'Google Key did not grant Veo 2 video. Rendered with Nano Banana motion visual.';
          }
        } catch (veoErr) {
          studioLog(`Veo 2 API request error: ${veoErr.message}. Generating scene artwork with Nano Banana.`);
          S.studioClips[idx].error = 'Google Key did not grant Veo 2 video. Rendered with Nano Banana motion visual.';
        }
      } else {
        studioLog(`Scene ${idx + 1}: Google Key not provided for Google Flow. Generating scene visual with Nano Banana.`);
        S.studioClips[idx].error = 'Google AI Studio Key needed for Google Flow. Scene visual generated with free Nano Banana.';
      }
    }

    // 2. High-Fidelity Scene Artwork Generation (Nano Banana / Flux)
    const styleInfo = STUDIO_STYLES[S.studioStyle] || STUDIO_STYLES.kids3d;
    const sceneTitle = sceneData?.title || promptData?.title || `Scene ${idx + 1}`;
    const sceneAction = promptData?.veoPrompt || sceneData?.description || '';
    const sceneEnv = sceneData?.environment || '';

    // Determine model parameter (prefer flux)
    let modelParam = 'flux';
    if (activeEngine.modelParam && activeEngine.modelParam !== 'veo-2.0-generate-001') {
      modelParam = (activeEngine.modelParam === 'nano-banana') ? 'flux' : activeEngine.modelParam;
    } else if (S.activeImageModel && S.activeImageModel !== 'google-flow' && S.activeImageModel !== 'google-imagen') {
      const imgModel = (typeof IMAGE_MODELS !== 'undefined' ? IMAGE_MODELS.find(m => m.id === S.activeImageModel) : null);
      if (imgModel?.param) modelParam = (imgModel.param === 'nano-banana') ? 'flux' : imgModel.param;
    }

    // 1. Identify which assigned characters actually appear in this scene
    const sceneText = `${sceneData?.title || ''} ${promptData?.veoPrompt || ''} ${sceneData?.description || ''} ${sceneData?.narration || ''} ${promptData?.character || ''}`.toLowerCase();
    let sceneChars = assignedChars.filter(c => {
      const name = (c.name || '').toLowerCase();
      const firstName = name.split(' ')[0];
      return (firstName.length > 2 && sceneText.includes(firstName)) || (name.length > 2 && sceneText.includes(name));
    });
    if (!sceneChars.length) sceneChars = [assignedChars[0]];

    const primaryChar = sceneChars[0];
    const charNames = sceneChars.map(c => c.name).join(' & ');

    // Extract clean character visual traits from the Character Sheet
    const is3dKids = !S.studioStyle || S.studioStyle === 'kids3d';
    const cleanChars = sceneChars.map(c => {
      const descPart = (c.description || '').replace(/character\s*sheet|expressions|model\s*sheet|palette|turnaround/gi, '').trim();
      const promptPart = (c.prompt || '').replace(/^Character\s+portrait\s+of\s+[^,]+,?\s*/i, '').trim();
      const combinedTraits = [descPart, promptPart].filter(Boolean).join(', ').substring(0, 180);
      const styleCue = is3dKids ? 'cute stylized 3D Disney Pixar cartoon character with large expressive eyes, exact same design as character sheet' : 'consistent character design';
      return `${c.name} (${styleCue}, ${combinedTraits})`;
    }).join(' and ');

    const cleanAction = (promptData?.veoPrompt || sceneData?.description || sceneData?.title || '')
      .replace(/^(3D\s+kids\s+animation\s+style|vibrant\s+colors|expressive\s+characters|whimsical\s+lighting|[,\s.-])+/gi, '')
      .replace(/^Scene\s+\d+:\s*/i, '')
      .replace(/\bphotorealistic(\s+textures)?\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const fullScenePrompt = `3D Disney Pixar animated movie scene, cute stylized 3D animation, vibrant cheerful colors, bright sunny lighting, 8k render. Character: ${cleanChars}. Scene: ${cleanAction.substring(0, 220)}. Joyful, expressive, cinematic wide composition, detailed animated movie still, identical character design to character sheet.`;

    const charRefUrl = getCharacterReferenceUrl(primaryChar);
    const charBaseSeed = primaryChar?.seed || getCharacterSeed(primaryChar);
    const seed = (charBaseSeed + idx * 79) % 900000 + 100000;

    // ponytail: reuse storyboard frame if present; eliminates visual drift and saves network roundtrip
    let uniqueSceneUrl = S.studioStoryboard?.[idx]?.imageUrl || '';
    if (!uniqueSceneUrl) {
      uniqueSceneUrl = await fetchImage({
        prompt: fullScenePrompt,
        aspect: S.studioAspect,
        seed,
        model: modelParam,
        negative: 'photorealistic, live action, real animal, wildlife photography, national geographic, realistic adult lion, dark, gloomy, murky, silhouette, muddy, swamp, horror, scary, sinister, mutated, deformed, ugly, bad anatomy, text, watermark, logo, split screen, multi-panel, character sheet, turnaround, model sheet',
        image: charRefUrl
      });
    }

    S.studioClips[idx].status = 'done';
    S.studioClips[idx].imageUrl = uniqueSceneUrl;
    S.studioClips[idx].characterId = primaryChar.id;
    S.studioClips[idx].characterIds = assignedChars.map(c => c.id);
    S.studioClips[idx].characterName = charNames;
    S.studioClips[idx].characterUrl = primaryChar.url;
    S.studioClips[idx].characters = assignedChars.map(c => ({ id: c.id, name: c.name, url: c.url }));
    S.studioClips[idx].videoUrl = null;
    studioLog(`✓ Scene ${idx + 1}: Generated scene artwork successfully!`);
    render();
  } catch (e) {
    S.studioClips[idx].status = 'done';
    S.studioClips[idx].error = e.message;
    studioLog(`Scene ${idx + 1} completed.`);
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

  S.studioStep = 5;
  const numScenes = S.studioPrompts?.length || S.studioScript?.scenes?.length || 0;
  S.studioClips = Array.from({ length: numScenes }, (_, i) => {
    const sc = S.studioScript?.scenes?.[i];
    const assignedChars = getSceneCharacters(sc);
    const p = S.studioPrompts?.[i];
    const sbImage = S.studioStoryboard?.[i]?.imageUrl || null;
    return {
      sceneIndex: i,
      status: 'queued',
      videoUrl: null,
      imageUrl: sbImage || S.studioClips?.[i]?.imageUrl || null,
      characterId: assignedChars[0]?.id || null,
      characterIds: assignedChars.map(c => c.id),
      characterName: assignedChars.map(c => c.name).join(' & ') || null,
      characterUrl: assignedChars[0]?.url || null,
      characters: assignedChars.map(c => ({ id: c.id, name: c.name, url: c.url })),
      prompt: p?.veoPrompt || sc?.description || '',
      error: null,
      cuts: S.studioClips?.[i]?.cuts || [],
      storyboardRef: sbImage
    };
  });
  studioLog('🎬 Starting batch video generation...');
  render();

  for (let i = 0; i < numScenes; i++) {
    S.studioProgress = `🎬 Rendering video scene ${i + 1} of ${numScenes}...`;
    render();
    await generateStudioClip(i);
  }
  S.studioStep = 6;
  S.studioProgress = '';
  saveStudioState();
  saveCurrentProjectToHistory();
  studioLog('✅ All video clips generated!');
  render();
}


// ── Per-Scene Video Generation (Step 5) ───────────────────────────────
async function generateSceneVideo(idx) {
  // Ensure clip structure exists
  const sc = S.studioScript?.scenes?.[idx];
  const assignedChars = getSceneCharacters(sc);
  const p = S.studioPrompts?.[idx];
  const sbImage = S.studioStoryboard?.[idx]?.imageUrl || null;

  if (!S.studioClips) S.studioClips = [];
  S.studioClips[idx] = {
    sceneIndex: idx,
    status: 'queued',
    videoUrl: null,
    imageUrl: sbImage || S.studioClips?.[idx]?.imageUrl || null,
    characterId: assignedChars?.[0]?.id || null,
    characterIds: (assignedChars || []).map(c => c.id),
    characterName: (assignedChars || []).map(c => c.name).join(' & ') || null,
    characterUrl: assignedChars?.[0]?.url || null,
    characters: (assignedChars || []).map(c => ({ id: c.id, name: c.name, url: c.url })),
    prompt: p?.veoPrompt || sc?.description || '',
    error: null,
    cuts: S.studioClips?.[idx]?.cuts || [],
    storyboardRef: sbImage
  };
  render();
  await generateStudioClip(idx);
  saveStudioState();
}

function skipSceneToStoryboard(idx) {
  const sbImage = S.studioStoryboard?.[idx]?.imageUrl;
  if (!sbImage) {
    studioLog(`⚠️ Scene ${idx+1}: No storyboard image to use as still.`);
    return;
  }
  if (!S.studioClips) S.studioClips = [];
  const sc = S.studioScript?.scenes?.[idx];
  const assignedChars = getSceneCharacters(sc);
  const p = S.studioPrompts?.[idx];
  S.studioClips[idx] = {
    sceneIndex: idx,
    status: 'done',
    videoUrl: null,
    imageUrl: sbImage,
    characterId: assignedChars?.[0]?.id || null,
    characterIds: (assignedChars || []).map(c => c.id),
    characterName: (assignedChars || []).map(c => c.name).join(' & ') || null,
    characterUrl: assignedChars?.[0]?.url || null,
    characters: (assignedChars || []).map(c => ({ id: c.id, name: c.name, url: c.url })),
    prompt: p?.veoPrompt || sc?.description || '',
    error: null,
    cuts: S.studioClips?.[idx]?.cuts || [],
    storyboardRef: sbImage,
    isStill: true
  };
  studioLog(`⏭️ Scene ${idx+1}: Using storyboard still with Ken Burns animation.`);
  saveStudioState();
  render();
}

function skipAllToStoryboard() {
  const numScenes = S.studioPrompts?.length || S.studioScript?.scenes?.length || 0;
  for (let i = 0; i < numScenes; i++) {
    if (!S.studioClips?.[i]?.videoUrl) {
      skipSceneToStoryboard(i);
    }
  }
  studioLog('⏭️ All scenes set to storyboard stills with Ken Burns animation.');
}

// ponytail: deleted uncalled generateSelectedVideos (YAGNI, generateSceneVideo covers per-scene generation)

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

  // Generate storyboards first
  await generateAllStoryboards();
  if (!getAllStoryboardsGenerated()) {
    S.studioStep = 4;
    studioLog('⚠️ Full Auto paused at Step 4: Some storyboard frames could not be generated.');
    render();
    return;
  }

  // Then generate videos
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
        ${mediaUrl ? `<div class="studio-player-ambient" style="background-image: url('${mediaUrl}')"></div>` : ''}
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
      <div style="max-width:90vw;max-height:90vh;position:relative" onclick="event.stopPropagation()">
        <img src="${S.lightbox.url}" style="max-width:100%;max-height:82vh;border-radius:8px;display:block;margin:0 auto;box-shadow:0 10px 40px rgba(0,0,0,0.85);object-fit:contain" />
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:10px">
          <span style="color:#fff;font-weight:600;font-size:13px">${S.lightbox.title}</span>
          <button class="btn-ghost" style="padding:4px 12px;font-size:11px;color:#fff;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:6px;cursor:pointer" onclick="S.lightbox.open=false;render()">&times; Close</button>
        </div>
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

function setSetupModalTab(tab) {
  S.setupModalTab = tab;
  render();
}

function getStepLockReason(i) {
  if (i === 1 && !S.studioScript) return 'Enter a story concept and generate a script first.';
  if (i === 2 && (!S.studioScript || (!S.studioScript.scenes?.length && !Array.isArray(S.studioScript)))) return 'Generate a script with scenes first to unlock visual prompts.';
  if (i === 3 && (!S.studioPrompts || !S.studioPrompts.length)) return 'Expand prompts first to unlock character design studio.';
  if (i === 4 && (!S.studioCharacters || !S.studioCharacters.length || getUnassignedScenes().length > 0)) {
    const unassigned = getUnassignedScenes();
    return 'Assign characters to all scenes in Step 3 (' + unassigned.length + ' unassigned).';
  }
  if (i === 5 && !getAllStoryboardsGenerated()) return 'Generate storyboard frames for all scenes in Step 4 first.';
  if (i >= 6 && (!S.studioClips || !S.studioClips.length || !S.studioClips.some(c => c.status === 'done'))) return 'Generate video clips or use storyboard stills in Step 5 first.';
  return null;
}

function goToStep(i) {
  if (!canNavigateToStep(i)) {
    const reason = getStepLockReason(i) || 'Complete previous steps to unlock this section.';
    studioLog('🔒 ' + reason);
    return;
  }
  S.studioStep = i;
  S.qualityAlert = null; // Auto-clear quality error on navigation!
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderStickyBottomBar() {
  const step = S.studioStep;
  const totalSteps = 8;
  const lastSaved = sg('wise-studio-state')?.lastCheckpoint;
  const savedAgo = lastSaved ? getTimeAgo(lastSaved) : null;
  let leftHtml = '';
  let rightHtml = '';

  const checkpointHtml = savedAgo ? `<span style="font-size:10px;color:var(--text-muted);display:flex;align-items:center;gap:3px"><i class="ti ti-device-floppy" style="font-size:12px"></i> ${savedAgo}</span>` : '';

  if (step === 0) {
    leftHtml = `
      <span class="studio-sticky-badge">Step 1 of ${totalSteps}</span>
      <span class="studio-sticky-title">Story Concept & Vision</span>
      ${checkpointHtml}
    `;
    rightHtml = `
      <button class="btn-primary" onclick="goToStep(1)" ${!canNavigateToStep(1) ? 'disabled title="Generate a story first"' : ''}>
        Next: Script <i class="ti ti-arrow-right"></i>
      </button>
    `;
  } else if (step === 1) {
    leftHtml = `
      <span class="studio-sticky-badge">Step 2 of ${totalSteps}</span>
      <span class="studio-sticky-title">Script & Scene Breakdown</span>
      ${checkpointHtml}
    `;
    rightHtml = `
      <button class="btn-ghost" onclick="goToStep(0)"><i class="ti ti-arrow-left"></i> Back</button>
      <button class="btn-primary" onclick="goToStep(2)" ${!canNavigateToStep(2) ? 'disabled' : ''}>
        Next: Prompts <i class="ti ti-arrow-right"></i>
      </button>
    `;
  } else if (step === 2) {
    leftHtml = `
      <span class="studio-sticky-badge">Step 3 of ${totalSteps}</span>
      <span class="studio-sticky-title">Visual Prompts</span>
      ${checkpointHtml}
    `;
    rightHtml = `
      <button class="btn-ghost" onclick="goToStep(1)"><i class="ti ti-arrow-left"></i> Back</button>
      <button class="btn-primary" onclick="goToStep(3)" ${!canNavigateToStep(3) ? 'disabled' : ''}>
        Next: Characters <i class="ti ti-arrow-right"></i>
      </button>
    `;
  } else if (step === 3) {
    leftHtml = `
      <span class="studio-sticky-badge">Step 4 of ${totalSteps}</span>
      <span class="studio-sticky-title">Characters & Assignment</span>
      ${checkpointHtml}
    `;
    rightHtml = `
      <button class="btn-ghost" onclick="goToStep(2)"><i class="ti ti-arrow-left"></i> Back</button>
      <button class="btn-primary" onclick="goToStep(4)" ${!canNavigateToStep(4) ? 'disabled' : ''}>
        Next: Storyboard <i class="ti ti-arrow-right"></i>
      </button>
    `;
  } else if (step === 4) {
    leftHtml = `
      <span class="studio-sticky-badge">Step 5 of ${totalSteps}</span>
      <span class="studio-sticky-title">Storyboard Review</span>
      ${checkpointHtml}
    `;
    rightHtml = `
      <button class="btn-ghost" onclick="goToStep(3)"><i class="ti ti-arrow-left"></i> Back</button>
      <button class="btn-primary" onclick="goToStep(5)" ${!canNavigateToStep(5) ? 'disabled title="Generate all storyboard frames first"' : ''}>
        Next: Video <i class="ti ti-arrow-right"></i>
      </button>
    `;
  } else if (step === 5) {
    leftHtml = `
      <span class="studio-sticky-badge">Step 6 of ${totalSteps}</span>
      <span class="studio-sticky-title">Video Generation</span>
      ${checkpointHtml}
    `;
    rightHtml = `
      <button class="btn-ghost" onclick="goToStep(4)"><i class="ti ti-arrow-left"></i> Back</button>
      <button class="btn-primary" onclick="goToStep(6)" ${!canNavigateToStep(6) ? 'disabled' : ''}>
        Go to Timeline <i class="ti ti-arrow-right"></i>
      </button>
    `;
  } else if (step === 6) {
    leftHtml = `
      <span class="studio-sticky-badge">Step 7 of ${totalSteps}</span>
      <span class="studio-sticky-title">Timeline & Audio Playback</span>
      ${checkpointHtml}
    `;
    rightHtml = `
      <button class="btn-ghost" onclick="goToStep(5)"><i class="ti ti-arrow-left"></i> Back</button>
      <button class="btn-primary" onclick="goToStep(7)">
        Proceed to Export <i class="ti ti-arrow-right"></i>
      </button>
    `;
  } else if (step === 7) {
    leftHtml = `
      <span class="studio-sticky-badge">Step 8 of ${totalSteps}</span>
      <span class="studio-sticky-title">Production Export</span>
      ${checkpointHtml}
    `;
    rightHtml = `
      <button class="btn-ghost" onclick="goToStep(6)"><i class="ti ti-arrow-left"></i> Back to Timeline</button>
      <button class="btn-primary" onclick="exportStudioJSON()">
        <i class="ti ti-download"></i> Export Project JSON
      </button>
    `;
  }

  return `
    <div class="studio-sticky-bar">
      <div class="studio-sticky-left">${leftHtml}</div>
      <div class="studio-sticky-actions">${rightHtml}</div>
    </div>
  `;
}

function getTimeAgo(isoStr) {
  try {
    const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diff < 60) return 'Saved just now';
    if (diff < 3600) return `Saved ${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `Saved ${Math.floor(diff/3600)}h ago`;
    return `Saved ${Math.floor(diff/86400)}d ago`;
  } catch { return ''; }
}

function renderSetupModal() {
  if (!S.showSetup) return '';
  const currentTab = S.setupModalTab || 'keys';

  return `
    <div class="modal-overlay" onclick="if(event.target===this){S.showSetup=false;render();}">
      <div class="modal-box modal-box-ergonomic">
        <div class="modal-ergonomic-header">
          <div class="modal-title"><i class="ti ti-settings" style="color:var(--brand)"></i> Studio Setup & Configuration</div>
          <button class="modal-close" onclick="S.showSetup=false;render()">&times;</button>
        </div>

        <div class="modal-tabs">
          <button class="modal-tab-btn ${currentTab === 'keys' ? 'active' : ''}" onclick="setSetupModalTab('keys')">
            <i class="ti ti-key"></i> 🔑 API Keys
          </button>
          <button class="modal-tab-btn ${currentTab === 'drive' ? 'active' : ''}" onclick="setSetupModalTab('drive')">
            <i class="ti ti-brand-google-drive"></i> ☁️ Google Drive
          </button>
          <button class="modal-tab-btn ${currentTab === 'models' ? 'active' : ''}" onclick="setSetupModalTab('models')">
            <i class="ti ti-photo"></i> 🎨 AI Visual Model
          </button>
        </div>

        <div class="modal-ergonomic-body">
          ${currentTab === 'keys' ? `
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px">
              Keys are stored securely 100% in your local browser storage.
            </div>

            <div class="section-label" style="margin-bottom:6px">Groq API Key (High-Speed LLM Story Generator)</div>
            <input type="password" class="input-field" placeholder="gsk_..." value="${S.apiKey}" oninput="S.apiKey=this.value.trim();localStorage.setItem('groq-key', this.value.trim());loadGroqModels();" style="margin-bottom:6px" />
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:16px">
              Get a free key at <a href="https://console.groq.com" target="_blank" style="color:var(--brand)">console.groq.com</a> (Free tier: 14,400 requests/day).
            </div>

            <div class="section-label" style="margin-bottom:6px">Google AI Studio API Key (For Google Flow / Veo 2 & Imagen 3)</div>
            <input type="password" class="input-field" placeholder="AIza..." value="${S.googleApiKey}" oninput="S.googleApiKey=this.value.trim();localStorage.setItem('google-key', this.value.trim())" style="margin-bottom:6px" />
            <div style="font-size:11px;color:var(--text-muted)">
              Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--brand)">aistudio.google.com/apikey</a>. Unlocks Google Flow (Veo 2 Video & Imagen 3 creative visuals).
            </div>
          ` : currentTab === 'drive' ? `
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px">
              Direct cloud sync saves all generated scripts, character reference sheets, and videos directly to your Google Drive.
            </div>

            <div class="section-label" style="margin-bottom:6px">Google Cloud OAuth Client ID</div>
            <input type="text" class="input-field" placeholder="your-client-id.apps.googleusercontent.com" value="${S.googleClientId}" oninput="S.googleClientId=this.value.trim();localStorage.setItem('gdrive-client-id', this.value.trim())" style="margin-bottom:6px" />
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:16px">Enables 1-click cloud sync of projects and assets directly to your Google Drive.</div>

            <div class="section-label" style="margin-bottom:6px">Google Drive Target Folder (URL or ID)</div>
            <input type="text" class="input-field" placeholder="https://drive.google.com/drive/folders/..." value="${S.googleDriveFolderUrl || ('https://drive.google.com/drive/folders/' + (S.googleDriveFolderId || '1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY'))}" oninput="setTargetDriveFolder(this.value)" style="margin-bottom:6px" />
            <div style="font-size:11px;color:var(--text-muted)">
              Projects will be saved into subfolders inside this Google Drive folder.
              <a href="${S.googleDriveFolderUrl || ('https://drive.google.com/drive/folders/' + (S.googleDriveFolderId || '1t_SvBfCFwnGEcypTrV0gHBEHrDHOG-FY'))}" target="_blank" rel="noopener" style="color:var(--brand);margin-left:4px;font-weight:600">Open Target Folder in Drive ↗</a>
            </div>
          ` : `
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px">
              Choose the visual model for character portraits, concept art, and storyboard scenes.
            </div>
            <div style="margin-bottom:10px">
              ${renderImageModelSelect()}
            </div>
            <div style="font-size:11px;color:var(--text-muted)">
              Free models like <strong>Nano Banana</strong>, <strong>Flux.1 Schnell</strong>, and <strong>SDXL Turbo</strong> run instantly without requiring any API keys.
            </div>
          `}
        </div>

        <div class="modal-ergonomic-footer">
          <div style="font-size:11px;color:var(--text-success);display:flex;align-items:center;gap:4px">
            <i class="ti ti-shield-check"></i> Stored in Local Browser Storage
          </div>
          <button class="btn-primary" onclick="S.showSetup=false;loadGroqModels();render()">
            <i class="ti ti-check"></i> Save & Close
          </button>
        </div>
      </div>
    </div>`;
}
function canNavigateToStep(i) {
  if (i === 0) return true;
  if (i === 1) return !!S.studioScript;
  if (i === 2) return !!(S.studioScript && (S.studioScript.scenes?.length || Array.isArray(S.studioScript)));
  if (i === 3) return !!(S.studioPrompts && S.studioPrompts.length);
  if (i === 4) return !!(S.studioCharacters && S.studioCharacters.length && getUnassignedScenes().length === 0);
  if (i === 5) return getAllStoryboardsGenerated();
  if (i === 6) return !!(S.studioClips && S.studioClips.length && S.studioClips.some(c => c.status === 'done'));
  if (i === 7) return !!(S.studioClips && S.studioClips.length && S.studioClips.some(c => c.status === 'done'));
  return false;
}

function buildStudio() {
  if (S.studioStep === 2 && (!S.studioPrompts || !S.studioPrompts.length)) {
    if (S.studioScript && (S.studioScript.scenes?.length || Array.isArray(S.studioScript))) {
      S.studioPrompts = generateFallbackPrompts(S.studioScript);
      saveStudioState();
    }
  }

  const steps = [
    { icon: 'ti-bulb',       label: 'Concept' },
    { icon: 'ti-script',     label: 'Script' },
    { icon: 'ti-wand',       label: 'Prompts' },
    { icon: 'ti-user-check', label: 'Characters' },
    { icon: 'ti-photo',      label: 'Storyboard' },
    { icon: 'ti-video',      label: 'Video' },
    { icon: 'ti-layout-grid',label: 'Timeline' },
    { icon: 'ti-download',   label: 'Export' }
  ];

  const stepperHtml = `
    <div class="studio-stepper">
      ${steps.map((st, i) => {
        const canNav = canNavigateToStep(i);
        const lockReason = !canNav ? getStepLockReason(i) : '';
        const isDone = i < S.studioStep || (i !== S.studioStep && canNav);
        return `
          <div class="studio-step ${i === S.studioStep ? 'active' : ''} ${isDone ? 'done' : ''} ${!canNav ? 'locked' : ''}"
               onclick="goToStep(${i})"
               title="${!canNav ? '🔒 Locked: ' + lockReason : 'Navigate to ' + st.label}">
            <div class="studio-step-dot">
              <i class="ti ${i < S.studioStep ? 'ti-check' : st.icon}"></i>
              ${!canNav ? '<span class="studio-step-lock-badge"><i class="ti ti-lock"></i></span>' : ''}
            </div>
            <span class="studio-step-label">${st.label}</span>
          </div>
          ${i < steps.length - 1 ? '<div class="studio-step-line ' + (i < S.studioStep ? 'done' : '') + '"></div>' : ''}
        `;
      }).join('')}
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

        <div style="display:flex;align-items:center;gap:12px;margin-top:24px;flex-wrap:wrap">
          <button class="btn-primary" style="font-size:14px;padding:10px 22px;box-shadow:0 4px 18px rgba(99,102,241,0.35)" onclick="generateStudioScript()" ${S.studioLoading ? 'disabled' : ''}>
            ${S.studioLoading ? '<span class="pulse-dot"></span> Generating Story...' : '<i class="ti ti-wand"></i> Generate Story & Script'}
          </button>
          <button class="btn-ghost" style="font-size:13px;padding:9px 18px;color:#06b6d4;border-color:rgba(6,182,212,0.45);background:rgba(6,182,212,0.06)" onclick="runFullPipeline()" ${S.studioLoading ? 'disabled' : ''} title="One-click full generation: Script, Prompts, Characters, and Video Scenes">
            <i class="ti ti-bolt"></i> Full Auto Run (One-Click)
          </button>
          <button class="btn-ghost" style="font-size:12px;padding:9px 16px;color:#f59e0b;border-color:rgba(245,158,11,0.4)" onclick="loadSampleEpic()" ${S.studioLoading ? 'disabled' : ''} title="Load pre-built Hare & Tortoise 7-Minute Kids Epic Demo">
            <i class="ti ti-sparkles"></i> 🎬 Load 7-Min Kids Story (Demo)
          </button>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:12px;display:flex;align-items:center;gap:6px">
          <i class="ti ti-bulb" style="color:#f59e0b"></i>
          <span><strong>Tip:</strong> Choose <em>Generate Story & Script</em> for step-by-step creative control, or <em>Full Auto Run</em> to generate the entire film automatically.</span>
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
        <button class="btn-ghost" onclick="goToStep(0)"><i class="ti ti-arrow-left"></i> Back</button>
      </div>`;
  }

  // Step 2: Cinematic Prompts
  if (S.studioStep === 2) {
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
        <button class="btn-primary" onclick="goToStep(3)" style="background:linear-gradient(135deg,#4285f4,#34a853)">
          <i class="ti ti-user-check"></i> Next: Assign Characters (Mandatory)
        </button>
        <button class="btn-ghost" onclick="generateCharacterRef()" ${S.studioLoading ? 'disabled' : ''}>
          <i class="ti ti-wand"></i> AI Character Ref
        </button>
        <button class="btn-ghost" onclick="exportStudioPrompts()"><i class="ti ti-clipboard"></i> Copy All Prompts</button>
        <button class="btn-ghost" onclick="goToStep(1)"><i class="ti ti-arrow-left"></i> Back</button>
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
              <i class="ti ti-layout-grid"></i> Scene Character Assignment (Multi-Character Support)
            </div>
            <div style="font-size:12px;color:var(--text-muted)">
              ${isAllAssigned
                ? '<span style="color:var(--text-success);font-weight:600"><i class="ti ti-circle-check"></i> All scenes assigned! (Each scene has at least 1 character). Ready to generate video clips.</span>'
                : `<span style="color:#f59e0b;font-weight:600"><i class="ti ti-alert-triangle"></i> ${unassigned.length} scene(s) missing characters. Every scene must have at least one character! (You can select multiple).</span>`
              }
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:11px;color:var(--text-muted)">Assigned: ${assignedCount} / ${scenes.length}</span>
            <button class="btn-ghost" style="font-size:11px;padding:4px 10px;color:var(--brand)" onclick="autoMatchScriptCharacters()" title="Auto-detect characters mentioned in scenes and assign them">
              <i class="ti ti-wand"></i> Auto-Match All
            </button>
            <button class="btn-primary" onclick="goToStep(4)" ${!isAllAssigned ? 'disabled' : ''} style="${!isAllAssigned ? 'opacity:0.5;cursor:not-allowed;' : 'background:linear-gradient(135deg,#4285f4,#34a853);'}">
              Next: Storyboard <i class="ti ti-arrow-right"></i>
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:12px">
          ${scenes.map((sc, idx) => {
            const assignedChars = getSceneCharacters(sc);
            const isAssigned = assignedChars.length > 0;
            const assignedIds = new Set(assignedChars.map(c => c.id));

            return `
              <div style="background:var(--surface-2);border-radius:10px;padding:12px;border:1.5px solid ${isAssigned ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.5)'};box-shadow:${isAssigned ? 'none' : '0 0 10px rgba(239,68,68,0.1)'};display:flex;flex-direction:column;gap:8px;position:relative">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:11px;font-weight:700;color:var(--brand);background:rgba(66,133,244,0.1);padding:2px 8px;border-radius:4px">
                    Scene ${sc.sceneNum || idx + 1}
                  </span>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:10px;color:var(--text-muted)">${sc.duration || 30}s</span>
                    <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;background:${isAssigned ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'};color:${isAssigned ? 'var(--text-success)' : 'var(--text-danger)'}">
                      ${isAssigned ? `<i class="ti ti-check"></i> ${assignedChars.length} selected` : '<i class="ti ti-alert-triangle"></i> At least 1 required'}
                    </span>
                  </div>
                </div>

                <div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${sc.title || 'Scene ' + (idx + 1)}
                </div>

                <div style="font-size:11px;color:var(--text-secondary);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
                  ${sc.visualAction || sc.description || sc.narration || ''}
                </div>

                <div style="margin-top:auto;padding-top:8px;border-top:1px solid var(--border)">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <label style="font-size:11px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:4px">
                      <i class="ti ti-users" style="color:var(--brand)"></i> Select Characters:
                    </label>
                    <div style="display:flex;gap:4px">
                      <button type="button" class="btn-ghost" style="font-size:10px;padding:2px 6px;color:var(--brand)" onclick="assignAllCharactersToScene(${idx})" title="Add all characters to this scene">
                        + All
                      </button>
                      <button type="button" class="btn-ghost" style="font-size:10px;padding:2px 6px;color:var(--text-muted)" onclick="clearSceneCharacters(${idx})" title="Clear character selections for this scene">
                        Clear
                      </button>
                    </div>
                  </div>

                  <!-- Multi-Character Select Chips -->
                  <div style="display:flex;flex-wrap:wrap;gap:6px">
                    ${characters.map(c => {
                      const isSel = assignedIds.has(c.id);
                      return `
                        <button type="button" 
                          class="char-chip-toggle ${isSel ? 'selected' : ''}" 
                          onclick="toggleCharacterForScene(${idx}, '${c.id}')"
                          title="${isSel ? 'Click to deselect ' + c.name : 'Click to select ' + c.name + ' for this scene'}"
                          style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:20px;font-size:11px;cursor:pointer;transition:all 0.15s;border:1.5px solid ${isSel ? 'var(--brand)' : 'var(--border)'};background:${isSel ? 'rgba(66,133,244,0.18)' : 'var(--surface-3, rgba(255,255,255,0.04))'};color:${isSel ? 'var(--text-primary)' : 'var(--text-secondary)'};font-weight:${isSel ? '600' : '400'}">
                          <img src="${resolveAssetUrl(c.url)}" style="width:18px;height:18px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.2)" />
                          <span>${c.name}</span>
                          <i class="ti ${isSel ? 'ti-check' : 'ti-plus'}" style="font-size:11px;color:${isSel ? 'var(--brand)' : 'var(--text-muted)'}"></i>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
          <button class="btn-primary" onclick="goToStep(4)" ${!isAllAssigned ? 'disabled' : ''} style="${!isAllAssigned ? 'opacity:0.5;cursor:not-allowed;' : 'background:linear-gradient(135deg,#4285f4,#34a853);'}">
            Next: Storyboard <i class="ti ti-arrow-right"></i>
          </button>
          <button class="btn-ghost" onclick="goToStep(2)"><i class="ti ti-arrow-left"></i> Back to Prompts</button>
        </div>
      </div>
    `;
  }

  
  // Step 4: Storyboard Generation & Review (NEW)
  if (S.studioStep === 4) {
    const numScenes = S.studioPrompts?.length || S.studioScript?.scenes?.length || 0;
    const readyCount = getStoryboardReadyCount();
    const approvedCount = (S.studioStoryboard || []).filter(sb => sb?.approved).length;
    const allGenerated = readyCount >= numScenes;

    panelHtml = `
      <!-- Storyboard Control Bar -->
      <div class="card" style="margin-bottom:14px;border:1px solid rgba(168,85,247,0.35);background:linear-gradient(180deg, var(--surface-2), rgba(168,85,247,0.04))">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:8px">
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px">
              <i class="ti ti-photo" style="color:#a855f7"></i> Storyboard Frame Generation
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">
              Generate and review storyboard images for each scene before committing to video.
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${renderImageModelSelect(true)}
            <button class="btn-primary" style="font-size:12px;padding:6px 14px" onclick="generateAllStoryboards()" ${S.studioLoading ? 'disabled' : ''}>
              <i class="ti ti-palette"></i> ${readyCount > 0 ? 'Re-generate All' : 'Generate All Storyboards'}
            </button>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:16px;padding-top:8px;border-top:1px solid var(--border);font-size:12px">
          <span style="color:var(--text-muted)">
            <i class="ti ti-photo"></i> ${readyCount}/${numScenes} generated
          </span>
          <span style="color:${approvedCount >= numScenes ? 'var(--text-success)' : 'var(--text-muted)'}">
            <i class="ti ti-circle-check"></i> ${approvedCount}/${numScenes} approved
          </span>
          ${allGenerated ? `
            <button class="btn-ghost" style="font-size:11px;padding:3px 8px;color:var(--text-success);margin-left:auto" onclick="approveAllStoryboards()">
              <i class="ti ti-checks"></i> Approve All
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Storyboard Grid -->
      <div class="studio-storyboard-grid">
        ${Array.from({ length: numScenes }, (_, i) => {
          const sb = S.studioStoryboard?.[i] || {};
          const sc = S.studioScript?.scenes?.[i];
          const p = S.studioPrompts?.[i];
          const assignedChars = getSceneCharacters(sc);
          const statusIcon = sb.status === 'done' ? 'ti-circle-check' : sb.status === 'error' ? 'ti-alert-circle' : sb.status === 'generating' ? 'ti-loader' : 'ti-clock';
          const statusColor = sb.status === 'done' ? (sb.approved ? 'var(--text-success)' : '#a855f7') : sb.status === 'error' ? 'var(--text-danger)' : 'var(--text-muted)';

          return `
            <div class="storyboard-card ${sb.approved ? 'approved' : ''}" style="border-left:3px solid ${statusColor}">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <div style="display:flex;align-items:center;gap:6px">
                  <i class="ti ${statusIcon} ${sb.status === 'generating' ? 'studio-spin' : ''}" style="color:${statusColor};font-size:16px"></i>
                  <span style="font-weight:700;font-size:13px;color:var(--text-primary)">Scene ${i+1}</span>
                  ${sb.characterName ? `<span style="font-size:10px;color:var(--brand);background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);padding:1px 6px;border-radius:6px;font-weight:600" title="Locked to character sheet">${sb.characterName}</span>` : ''}
                  ${sb.approved ? '<span style="font-size:10px;background:rgba(34,197,94,0.15);color:var(--text-success);padding:1px 6px;border-radius:8px;font-weight:600">✓ Approved</span>' : ''}
                </div>
                <div style="display:flex;gap:4px">
                  ${assignedChars.map(ac => {
                    const isFeatured = sb.characterIds?.includes(ac.id) || sb.characterId === ac.id;
                    return `
                      <img src="${resolveAssetUrl(ac.url)}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;border:${isFeatured ? '2px solid var(--brand)' : '1px solid var(--border)'};opacity:${isFeatured ? '1' : '0.5'}" title="${ac.name} ${isFeatured ? '(Active in Scene)' : ''}" />
                    `;
                  }).join('')}
                </div>
              </div>

              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;line-height:1.4">
                ${(p?.veoPrompt || sc?.description || '').substring(0, 150)}${(p?.veoPrompt || sc?.description || '').length > 150 ? '...' : ''}
              </div>

              ${(() => {
                const aspectStyle = S.studioAspect === '9:16'
                  ? 'height: 280px;'
                  : (S.studioAspect === '1:1' ? 'height: 240px;' : 'height: 200px;');

                if (sb.status === 'generating') {
                  return `
                    <div class="storyboard-img-container" style="${aspectStyle}">
                      <div class="storyboard-loading-box">
                        <div class="storyboard-loader-icon">
                          <div class="storyboard-loader-spinner"></div>
                          <i class="ti ti-photo" style="font-size:20px;color:var(--brand)"></i>
                        </div>
                        <div style="font-size:13px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px">
                          <span class="pulse-dot"></span> Generating Storyboard...
                        </div>
                        <div style="font-size:11px;color:var(--text-secondary);max-width:240px;line-height:1.4">
                          Rendering AI frame for Scene ${i+1}...
                        </div>
                        <div class="sb-shimmer-bar">
                          <div class="sb-shimmer-progress"></div>
                        </div>
                      </div>
                    </div>
                  `;
                }

                if (sb.status === 'queued') {
                  return `
                    <div class="storyboard-img-container" style="${aspectStyle}">
                      <div class="storyboard-queued-box">
                        <i class="ti ti-clock" style="font-size:24px;color:var(--text-muted);opacity:0.6"></i>
                        <span style="font-size:12px;font-weight:600;color:var(--text-primary)">Queued for Generation</span>
                        <span style="font-size:10px;color:var(--text-muted)">Waiting to generate...</span>
                      </div>
                    </div>
                  `;
                }

                if (sb.imageUrl) {
                  return `
                    <div class="storyboard-img-container" style="${aspectStyle}">
                      <div class="storyboard-loading-box" id="sb-loader-${i}" style="position:absolute;inset:0;z-index:2;display:flex">
                        <div class="storyboard-loader-icon">
                          <div class="storyboard-loader-spinner"></div>
                          <i class="ti ti-photo" style="font-size:20px;color:var(--brand)"></i>
                        </div>
                        <div style="font-size:12px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px">
                          <span class="pulse-dot"></span> Loading Visual...
                        </div>
                      </div>
                      <img src="${resolveAssetUrl(sb.imageUrl)}"
                           class="storyboard-frame-img"
                           alt="Scene ${i+1} Storyboard"
                           onload="handleStoryboardImageLoad(${i}, this)"
                           onerror="handleStoryboardImageError(${i}, this)"
                           onclick="openLightbox('${resolveAssetUrl(sb.imageUrl)}', 'Scene ${i+1} Storyboard')"
                           style="opacity:0;transition:opacity 0.25s ease;" />
                      ${sb.approved ? '<div class="storyboard-approved-overlay"><i class="ti ti-circle-check"></i></div>' : ''}
                    </div>
                  `;
                }

                return `
                  <div class="storyboard-img-container" style="${aspectStyle}">
                    <div class="storyboard-placeholder">
                      <i class="ti ti-photo-off" style="font-size:28px;opacity:0.4"></i>
                      <span style="font-weight:600;font-size:12px">Not generated</span>
                      <span style="font-size:10px;color:var(--text-muted)">Click "Generate" below</span>
                    </div>
                  </div>
                `;
              })()}

              ${sb.error ? `
                <div style="font-size:11px;color:#f59e0b;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:6px;padding:4px 8px;margin-bottom:6px">
                  <i class="ti ti-alert-circle"></i> ${sb.error}
                </div>
              ` : ''}

              <div style="display:flex;gap:4px;flex-wrap:wrap">
                ${sb.imageUrl || sb.status === 'generating' ? `<button class="btn-ghost" style="font-size:11px;padding:3px 8px" onclick="rerollStoryboardFrame(${i})" ${sb.status === 'generating' || S.studioLoading ? 'disabled' : ''}>
                  <i class="ti ${sb.status === 'generating' ? 'ti-loader studio-spin' : 'ti-rotate'}"></i> ${sb.status === 'generating' ? 'Generating...' : 'Re-generate'}
                </button>` : ''}
                ${sb.status === 'done' && !sb.approved ? `
                  <button class="btn-ghost" style="font-size:11px;padding:3px 8px;color:var(--text-success)" onclick="approveStoryboardFrame(${i})">
                    <i class="ti ti-circle-check"></i> Approve
                  </button>
                ` : ''}
                ${sb.approved ? `
                  <button class="btn-ghost" style="font-size:11px;padding:3px 8px;color:var(--text-muted)" onclick="unapproveStoryboardFrame(${i})">
                    <i class="ti ti-circle-x"></i> Unapprove
                  </button>
                ` : ''}
                ${!sb.imageUrl ? `
                  <button class="btn-ghost" style="font-size:11px;padding:3px 8px;color:var(--brand)" onclick="generateStoryboardImage(${i})" ${sb.status === 'generating' || S.studioLoading ? 'disabled' : ''}>
                    <i class="ti ti-sparkles"></i> Generate
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;align-items:center">
        ${allGenerated ? `
          <button class="btn-primary" onclick="goToStep(5)">
            <i class="ti ti-video"></i> Proceed to Video Generation
          </button>
        ` : `
          <button class="btn-primary" onclick="generateAllStoryboards()" ${S.studioLoading ? 'disabled' : ''}>
            <i class="ti ti-palette"></i> Generate All Storyboards
          </button>
        `}
        <button class="btn-ghost" onclick="goToStep(3)"><i class="ti ti-arrow-left"></i> Back to Characters</button>
      </div>
    `;
  }

if (S.studioStep === 5) {
    const activeEngine = (typeof VIDEO_MODELS !== 'undefined' ? VIDEO_MODELS.find(m => m.id === S.activeVideoEngine) : null) || { id: 'motion-video', name: 'Cinematic Motion Video', type: 'motion' };
    panelHtml = `
      <!-- Video Generation Engine & Character Continuity Bar -->
      <div class="card" style="margin-bottom:14px;border:1px solid rgba(66,133,244,0.35);background:linear-gradient(180deg, var(--surface-2), rgba(66,133,244,0.04))">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:8px">
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px">
              <i class="ti ti-video" style="color:var(--brand)"></i> Video Generation Engine & Character Consistency
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">
              Select your video generation model and configure character sheet continuity.
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${renderVideoEngineSelect()}
            ${renderImageModelSelect(true)}
            ${!S.googleApiKey ? `
              <button class="btn-ghost" style="font-size:11px;padding:5px 9px;color:#f59e0b;border-color:rgba(245,158,11,0.4);display:inline-flex;align-items:center;gap:4px" onclick="openGoogleKeyPrompt()" title="Add Google AI Studio key for Google Flow / Veo 2">
                <i class="ti ti-key"></i> + Google Key
              </button>
            ` : ''}
          </div>
        </div>
        ${(activeEngine.type === 'veo' || activeEngine.id === 'google-flow') && !S.googleApiKey ? `
          <div style="margin-bottom:10px;padding:8px 12px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:8px;font-size:12px;color:#f59e0b;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <span><i class="ti ti-info-circle"></i> <strong>Google Flow (Veo 2) Selected:</strong> A free Google AI Studio Key is required for native Veo 2 video clips.</span>
            <div style="display:flex;gap:6px">
              <button class="btn-primary" style="font-size:11px;padding:3px 10px;background:#f59e0b;color:#000;font-weight:700" onclick="openGoogleKeyPrompt()"><i class="ti ti-key"></i> Enter Google Key</button>
              <button class="btn-ghost" style="font-size:11px;padding:3px 8px" onclick="setVideoEngine('nanobanana-motion');generateAllClips()"><i class="ti ti-bolt"></i> Switch to Free Nano Banana</button>
            </div>
          </div>
        ` : ''}

        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding-top:8px;border-top:1px solid var(--border);font-size:11px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:var(--text-success);font-weight:600;display:flex;align-items:center;gap:4px">
              <i class="ti ti-shield-check"></i> Character Sheet Lock: ACTIVE
            </span>
            <span style="color:var(--text-muted)">• Character facial DNA, species, age & colors are locked from reference sheets.</span>
          </div>
          <button class="btn-ghost" style="font-size:11px;padding:3px 8px;color:var(--brand)" onclick="generateAllClips()" ${S.studioLoading ? 'disabled' : ''}>
            <i class="ti ti-refresh"></i> Re-generate All Scenes
          </button>
        </div>
      </div>
      <!-- Per-scene & batch video controls -->
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        <button class="btn-primary" style="font-size:12px;padding:6px 14px" onclick="generateAllClips()" ${S.studioLoading ? 'disabled' : ''}>
          <i class="ti ti-video"></i> Generate All Videos
        </button>
        <button class="btn-ghost" style="font-size:12px;padding:6px 14px" onclick="skipAllToStoryboard()">
          <i class="ti ti-photo"></i> Use All Storyboards as Stills
        </button>
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
            ${clip.error ? `
  <div style="font-size:11px;color:#f59e0b;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:6px;padding:6px 10px;margin-top:6px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
    <span><i class="ti ti-info-circle"></i> ${clip.error}</span>
    ${!S.googleApiKey ? `
      <div style="display:flex;gap:6px">
        <button class="btn-primary" style="font-size:11px;padding:2px 8px;background:#f59e0b;color:#000;font-weight:700" onclick="openGoogleKeyPrompt()"><i class="ti ti-key"></i> Enter Key</button>
        <button class="btn-ghost" style="font-size:10px;padding:2px 6px" onclick="setVideoEngine('nanobanana-motion');reRollSceneClip(${i})">Use Nano Banana</button>
      </div>
    ` : ''}
  </div>
` : ''}
            ${clip.videoUrl ? `
              <video src="${clip.videoUrl}" controls class="studio-clip-preview" style="margin-top:8px"></video>
            ` : clip.imageUrl ? `
              <div style="position:relative;margin-top:8px">
                <img src="${resolveAssetUrl(clip.imageUrl)}" 
                     onerror="if(this.src!=='${resolveAssetUrl(clip.characterUrl || '')}'){this.src='${resolveAssetUrl(clip.characterUrl || '')}';}" 
                     class="studio-clip-preview" 
                     style="border-radius:6px;max-height:220px;object-fit:cover;width:100%" 
                     alt="Scene ${i+1}" />
                ${clip.characterUrl ? `
                  <div style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);padding:3px 8px;border-radius:12px;font-size:10px;color:#fff;display:flex;align-items:center;gap:5px;border:1px solid rgba(255,255,255,0.2)">
                    <img src="${resolveAssetUrl(clip.characterUrl)}" style="width:14px;height:14px;border-radius:50%;object-fit:cover" />
                    <span>Locked: ${clip.characterName || 'Character'}</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            <div style="display:flex;gap:6px;margin-top:8px;align-items:center">
              ${S.studioStoryboard?.[i]?.imageUrl ? `
                <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;display:flex;align-items:center;gap:4px">
                  <img src="${resolveAssetUrl(S.studioStoryboard[i].imageUrl)}" style="width:32px;height:20px;border-radius:3px;object-fit:cover" />
                  <span>Storyboard ref</span>
                </div>
              ` : ''}
              <button class="btn-ghost" style="font-size:11px;padding:3px 8px" onclick="reRollSceneClip(${i})" ${S.studioLoading ? 'disabled' : ''} title="Re-generate this scene with character consistency lock">
                <i class="ti ti-rotate"></i> Re-generate Scene
              </button>
              ${clip.status === 'error' ? `<button class="btn-ghost" style="font-size:11px;padding:3px 8px;color:var(--brand)" onclick="generateStudioClip(${i})"><i class="ti ti-refresh"></i> Retry</button>` : ''}
              ${!clip.videoUrl && clip.status !== 'generating' && clip.status !== 'polling' ? `
                <button class="btn-ghost" style="font-size:11px;padding:3px 8px;color:#a855f7" onclick="skipSceneToStoryboard(${i})" title="Use storyboard still with Ken Burns animation">
                  <i class="ti ti-photo"></i> Use Still
                </button>
              ` : ''}
              ${clip.isStill ? '<span style="font-size:10px;color:#a855f7;display:flex;align-items:center;gap:3px"><i class="ti ti-photo"></i> Still + Ken Burns</span>' : ''}
            </div>
          </div>`;
      }).join('')}
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn-primary" onclick="goToStep(6)"><i class="ti ti-layout-grid"></i> Go to Timeline</button>
        <button class="btn-ghost" onclick="exportStudioPrompts()"><i class="ti ti-clipboard"></i> Copy Prompts</button>
      </div>`;
  }

  // Step 6: Timeline & Clips (Distinct Scene Thumbnails)
  if (S.studioStep === 6) {
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
                ${(() => {
                  const assignedChars = getSceneCharacters(sc);
                  if (!assignedChars.length) return '';
                  return `
                    <div style="display:flex;align-items:center;gap:4px" title="Assigned: ${assignedChars.map(c => c.name).join(', ')}">
                      ${assignedChars.map(ac => `
                        <span class="studio-char-pill" style="margin-right:0">
                          <img src="${resolveAssetUrl(ac.url)}" class="studio-char-avatar" />
                          <span>${ac.name.split(' ')[0]}</span>
                        </span>
                      `).join('')}
                    </div>
                  `;
                })()}
                ${cuts.length ? `<span class="studio-cut-pill" style="font-size:9px;padding:1px 5px" title="${cuts.length} cut(s) applied"><i class="ti ti-scissors"></i> ${cuts.length}</span>` : ''}
                <div style="display:flex;gap:4px">
                  <button class="btn-ghost" style="padding:2px 6px;font-size:11px;color:${cuts.length ? '#f87171' : 'var(--text-muted)'}" onclick="openClipCutModal(${i})" title="Cut/Trim this scene"><i class="ti ti-scissors"></i></button>
                  <button class="btn-ghost" style="padding:2px 6px;font-size:11px" onclick="reorderClip(${i},${i-1})" ${i === 0 ? 'disabled' : ''}><i class="ti ti-arrow-up"></i></button>
                  <button class="btn-ghost" style="padding:2px 6px;font-size:11px" onclick="reorderClip(${i},${i+1})" ${i === S.studioClips.length - 1 ? 'disabled' : ''}><i class="ti ti-arrow-down"></i></button>
                </div>
              </div>
              ${clip.videoUrl ? `
  <video src="${clip.videoUrl}" controls class="studio-clip-preview"></video>
` : clip.imageUrl ? `
  <div style="position:relative;width:100%;height:100%">
    <img src="${resolveAssetUrl(clip.imageUrl)}" 
         onerror="if(this.src!=='${resolveAssetUrl(clip.characterUrl || '')}'){this.src='${resolveAssetUrl(clip.characterUrl || '')}';}" 
         class="studio-clip-preview" 
         alt="Scene ${i+1}" />
    <button type="button" class="btn-ghost" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.7);padding:2px 6px;font-size:10px;border-radius:4px;color:#fff;border:1px solid rgba(255,255,255,0.2)" onclick="reRollSceneClip(${i})" title="Re-generate this scene visual">
      <i class="ti ti-rotate"></i>
    </button>
  </div>
` : `<div class="studio-clip-placeholder">No visual</div>`}
              <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;font-size:10px;color:var(--text-muted)">
                <span>${p?.cameraMove || ''}</span>
                <span><strong>${getClipEffectiveDuration(i)}s</strong>${cutTotal > 0 ? ` <s style="opacity:0.6">${sc?.duration || '?'}s</s>` : ''}</span>
              </div>
            </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn-primary" onclick="goToStep(7)"><i class="ti ti-download"></i> Go to Export</button>
        <button class="btn-ghost" onclick="exportStudioPrompts()"><i class="ti ti-clipboard"></i> Copy All Prompts</button>
        <button class="btn-ghost" onclick="goToStep(5)"><i class="ti ti-arrow-left"></i> Back</button>
      </div>`;
  }

  // Step 7: Export
  if (S.studioStep === 7) {
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
        <button class="btn-ghost" onclick="goToStep(6)"><i class="ti ti-arrow-left"></i> Back to Timeline</button>
      </div>`;
  }

  return stepperHtml + qualityAlertHtml + errorHtml + progressHtml + '<div class="studio-content-pad">' + panelHtml + '</div>' + renderStickyBottomBar();
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
            <div class="logo-name" style="display:flex;align-items:center;gap:6px">Wise Simple Studio <span style="font-size:10px;font-weight:700;color:var(--brand);background:rgba(99,102,241,0.14);border:1px solid rgba(99,102,241,0.3);padding:1px 6px;border-radius:10px">v4.7</span></div>
            <div class="logo-sub">AI Video & Animated Story Creator</div>
          </div>
        </div>
        <div class="header-right">
          ${renderModelSelect()}
          ${renderVideoEngineSelect(true)}
          <button class="btn-ghost" style="font-size:12px;padding:6px 12px;display:inline-flex;align-items:center;gap:5px" onclick="S.showSetup=true;render()" title="Configure API Keys (Google AI Studio, Groq, Google Drive)">
            <i class="ti ti-settings"></i> Setup & Keys
          </button>
          ${!S.googleApiKey ? `
            <button class="btn-ghost" style="font-size:11px;padding:5px 10px;color:#f59e0b;border-color:rgba(245,158,11,0.5);display:inline-flex;align-items:center;gap:4px" onclick="openGoogleKeyPrompt()" title="Enter your Google AI Studio / Gemini API Key for Google Flow & Veo 2">
              <i class="ti ti-key"></i> + Google Key
            </button>
          ` : `
            <span style="font-size:11px;color:var(--text-success);font-weight:600;display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(34,197,94,0.1);border-radius:12px;border:1px solid rgba(34,197,94,0.3)" title="Google AI Studio Key Connected">
              <i class="ti ti-circle-check"></i> Google Key
            </span>
          `}
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

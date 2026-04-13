/* ═══════════════════════════════════════════════════════
   JustRemove — Core Interaction Logic (v4.0 - Clean White)
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    console.log("JustRemove v4.0 Active");

    // ─── STATE & ELEMENTS ────────────────────────────────────
    let state = {
        originalImage: null,
        maskCanvas: null,
        maskCtx: null,
        isDrawing: false,
        lastX: 0,
        lastY: 0,
        brushSize: 30,
        scaleFactor: 1,
        zoom: 1,
        minZoom: 0.5,
        maxZoom: 3,
        history: [],
        historyStep: -1
    };

    const sections = {
        upload: document.getElementById('upload-section'),
        editor: document.getElementById('editor-section'),
        result: document.getElementById('result-section')
    };

    const elements = {
        imageInput: document.getElementById('image-input'),
        uploadTrigger: document.getElementById('upload-trigger-btn'),
        dropZone: document.getElementById('drop-zone'),
        navUpload: document.getElementById('nav-upload-btn'),

        mainCanvas: document.getElementById('main-canvas'),
        maskCanvas: document.getElementById('mask-canvas'),
        brushSlider: document.getElementById('brush-size'),
        brushSizeVal: document.getElementById('brush-size-val'),
        zoomInBtn: document.getElementById('zoom-in-btn'),
        zoomOutBtn: document.getElementById('zoom-out-btn'),
        zoomVal: document.getElementById('zoom-val'),
        undoBtn: document.getElementById('undo-btn'),
        redoBtn: document.getElementById('redo-btn'),
        resetMaskBtn: document.getElementById('reset-mask-btn'),
        clearBtn: document.getElementById('clear-mask'),
        removeBtn: document.getElementById('remove-btn'),
        tryDifferentBtn: document.getElementById('try-different-btn'),

        originalPrev: document.getElementById('original-preview'),
        resultPrev: document.getElementById('result-preview'),
        resetBtn: document.getElementById('reset-btn'),
        downloadBtn: document.getElementById('download-btn'),
        compSlider: document.getElementById('comparison-slider'),
        compAfter: document.getElementById('comparison-after'),
        compHandle: document.getElementById('comparison-handle'),
        touchDebug: document.getElementById('touch-debug')
    };

    // ─── UTILS ──────────────────────────────────────────────
    const switchSection = (name) => {
        Object.keys(sections).forEach(k => sections[k].classList.remove('active'));
        if (sections[name]) {
            sections[name].classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // ─── UPLOAD & DRAG/DROP ─────────────────────────────────
    const handleFileUpload = (file) => {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                state.originalImage = img;
                switchSection('editor');
                // Ensure display block is rendered before calculating dimensions
                setTimeout(initEditor, 10);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Fix: Trigger hidden input
    elements.uploadTrigger.onclick = (e) => {
        e.stopPropagation();
        elements.imageInput.click();
    };
    
    elements.dropZone.onclick = () => elements.imageInput.click();
    elements.navUpload.onclick = () => elements.imageInput.click();

    elements.imageInput.onchange = (e) => handleFileUpload(e.target.files[0]);

    // Drag and Drop
    elements.dropZone.ondragover = (e) => {
        e.preventDefault();
        elements.dropZone.classList.add('drag-over');
    };
    elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('drag-over');
    elements.dropZone.ondrop = (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('drag-over');
        handleFileUpload(e.dataTransfer.files[0]);
    };

    // ─── EDITOR LOGIC ───────────────────────────────────────
    const initEditor = () => {
        state.zoom = 1;
        state.history = [];
        state.historyStep = -1;
        elements.zoomVal.textContent = '100%';
        updateCanvasSize();
        updateHistoryButtons();
    };

    const getPos = (e) => {
        const rect = elements.maskCanvas.getBoundingClientRect();
        
        // Get touch or mouse position in viewport
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Convert to position relative to canvas display size
        let x = clientX - rect.left;
        let y = clientY - rect.top;
        
        // Scale to canvas internal resolution
        // Canvas is displayed at rect.width x rect.height but internally w*dpr x h*dpr
        const scaleX = elements.maskCanvas.width / rect.width;
        const scaleY = elements.maskCanvas.height / rect.height;
        
        x = x * scaleX;
        y = y * scaleY;
        
        // Clamp to canvas bounds
        x = Math.max(0, Math.min(x, elements.maskCanvas.width));
        y = Math.max(0, Math.min(y, elements.maskCanvas.height));
        
        return { x, y };
    };

    // ─── UNDO/REDO HISTORY ──────────────────────────────────
    const saveToHistory = () => {
        // Remove any states after current step (when redo was available)
        state.history = state.history.slice(0, state.historyStep + 1);
        // Save current mask state
        state.history.push(elements.maskCanvas.toDataURL());
        state.historyStep++;
        updateHistoryButtons();
    };

    const undo = () => {
        if (state.historyStep > 0) {
            state.historyStep--;
            restoreFromHistory();
        }
    };

    const redo = () => {
        if (state.historyStep < state.history.length - 1) {
            state.historyStep++;
            restoreFromHistory();
        }
    };

    const restoreFromHistory = () => {
        const imageData = state.history[state.historyStep];
        const img = new Image();
        img.onload = () => {
            state.maskCtx.clearRect(0, 0, elements.maskCanvas.width, elements.maskCanvas.height);
            state.maskCtx.drawImage(img, 0, 0);
            updateHistoryButtons();
        };
        img.src = imageData;
    };

    const resetMask = () => {
        state.maskCtx.clearRect(0, 0, elements.maskCanvas.width, elements.maskCanvas.height);
        state.history = [];
        state.historyStep = -1;
        updateHistoryButtons();
    };

    const updateHistoryButtons = () => {
        if (elements.undoBtn) {
            elements.undoBtn.disabled = state.historyStep <= 0;
        }
        if (elements.redoBtn) {
            elements.redoBtn.disabled = state.historyStep >= state.history.length - 1;
        }
    };

    const startDrawing = (e) => {
        if (e.type === 'touchstart') {
            e.preventDefault();
            e.stopPropagation();
        }
        state.isDrawing = true;
        const pos = getPos(e);
        [state.lastX, state.lastY] = [pos.x, pos.y];
        const msg = `🖍️ TOUCH START\nX: ${Math.round(pos.x)} Y: ${Math.round(pos.y)}\nCanvas: ${elements.maskCanvas.width}x${elements.maskCanvas.height}`;
        console.log(msg);
        if (elements.touchDebug) {
            elements.touchDebug.style.display = 'block';
            elements.touchDebug.textContent = msg;
        }
    };

    const draw = (e) => {
        if (!state.isDrawing) return;
        if (e.type === 'touchmove') {
            e.preventDefault();
            e.stopPropagation();
        }
        const pos = getPos(e);

        state.maskCtx.beginPath();
        state.maskCtx.moveTo(state.lastX, state.lastY);
        state.maskCtx.lineTo(pos.x, pos.y);
        state.maskCtx.stroke();

        [state.lastX, state.lastY] = [pos.x, pos.y];
        if (elements.touchDebug) {
            elements.touchDebug.textContent = `🖍️ DRAWING\nX: ${Math.round(pos.x)} Y: ${Math.round(pos.y)}`;
        }
    };

    const stopDrawing = (e) => {
        if (e && e.type === 'touchend') {
            e.preventDefault();
            e.stopPropagation();
        }
        if (state.isDrawing) {
            saveToHistory();
        }
        state.isDrawing = false;
        console.log('🛑 STOP DRAW:', e?.type);
        if (elements.touchDebug) {
            elements.touchDebug.style.display = 'none';
        }
    };

    // Mouse Events
    elements.maskCanvas.addEventListener('mousedown', startDrawing);
    elements.maskCanvas.addEventListener('mousemove', draw);
    elements.maskCanvas.addEventListener('mouseup', stopDrawing);
    elements.maskCanvas.addEventListener('mouseout', stopDrawing);

    // Touch Events
    elements.maskCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    elements.maskCanvas.addEventListener('touchmove', draw, { passive: false });
    elements.maskCanvas.addEventListener('touchend', stopDrawing, { passive: false });
    elements.maskCanvas.addEventListener('touchcancel', stopDrawing, { passive: false });

    elements.brushSlider.oninput = (e) => {
        const val = e.target.value;
        elements.brushSizeVal.textContent = val + 'px';
        if (state.maskCtx) state.maskCtx.lineWidth = val;
    };

    elements.clearBtn.onclick = () => {
        resetMask();
    };

    // ─── UNDO/REDO/RESET BUTTONS ────────────────────────────
    if (elements.undoBtn) {
        elements.undoBtn.onclick = undo;
    }
    if (elements.redoBtn) {
        elements.redoBtn.onclick = redo;
    }
    if (elements.resetMaskBtn) {
        elements.resetMaskBtn.onclick = resetMask;
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) {
                e.preventDefault();
                redo();
            }
        }
    });

    // ─── ZOOM FUNCTIONALITY ─────────────────────────────────
    const updateCanvasSize = () => {
        const container = sections.editor.querySelector('.canvas-wrapper');
        const img = state.originalImage;

        if (!img || !container) return;

        // Calculate base size
        const isMobile = window.innerWidth < 600;
        const padding = isMobile ? 10 : 48;
        const containerWidth = container.clientWidth - padding;
        const availableHeight = isMobile ? window.innerHeight * 0.75 : window.innerHeight * 0.55;

        const scaleW = containerWidth / img.width;
        const scaleH = availableHeight / img.height;
        const baseFactor = Math.min(1, scaleW, scaleH);

        // Apply zoom
        const zoomedFactor = baseFactor * state.zoom;
        const dpr = window.devicePixelRatio || 1;

        const w = Math.floor(img.width * zoomedFactor);
        const h = Math.floor(img.height * zoomedFactor);

        // Update canvas internal size (for drawing) - no DPR multiplication needed
        // Browser handles pixel density automatically
        elements.mainCanvas.width = elements.maskCanvas.width = w;
        elements.mainCanvas.height = elements.maskCanvas.height = h;

        // Update canvas display size
        elements.mainCanvas.style.width = elements.maskCanvas.style.width = w + 'px';
        elements.mainCanvas.style.height = elements.maskCanvas.style.height = h + 'px';

        // Redraw image on main canvas (no scaling context, drawing naturally)
        const ctx = elements.mainCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        // Update mask context (no scale applied, coordinates are direct)
        state.maskCtx = elements.maskCanvas.getContext('2d');
        state.maskCtx.lineCap = 'round';
        state.maskCtx.lineJoin = 'round';
        state.maskCtx.strokeStyle = 'rgba(242, 78, 30, 0.7)';
        state.maskCtx.lineWidth = elements.brushSlider.value;
    };

    elements.zoomInBtn.onclick = () => {
        state.zoom = Math.min(state.maxZoom, state.zoom + 0.2);
        updateCanvasSize();
        elements.zoomVal.textContent = Math.round(state.zoom * 100) + '%';
    };

    elements.zoomOutBtn.onclick = () => {
        state.zoom = Math.max(state.minZoom, state.zoom - 0.2);
        updateCanvasSize();
        elements.zoomVal.textContent = Math.round(state.zoom * 100) + '%';
    };

    elements.tryDifferentBtn.onclick = () => {
        elements.imageInput.value = '';
        state.originalImage = null;
        state.zoom = 1;
        switchSection('upload');
    };

    // ─── AI REMOVAL ─────────────────────────────────────────
    elements.removeBtn.onclick = async () => {
        elements.removeBtn.disabled = true;
        elements.removeBtn.textContent = 'Removing...';

        try {
            const imgBlob = await new Promise(r => elements.mainCanvas.toBlob(r, 'image/png'));
            
            // Generate mask: White where painted, Black elsewhere
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = elements.maskCanvas.width;
            tempCanvas.height = elements.maskCanvas.height;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.fillStyle = 'black';
            tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            tCtx.globalCompositeOperation = 'destination-out';
            tCtx.drawImage(elements.maskCanvas, 0, 0);
            tCtx.globalCompositeOperation = 'destination-over';
            tCtx.fillStyle = 'white';
            tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            const maskBlob = await new Promise(r => tempCanvas.toBlob(r, 'image/png'));

            const formData = new FormData();
            formData.append('image', imgBlob, 'file.png');
            formData.append('mask', maskBlob, 'mask.png');

            console.log('Sending request to', CONFIG.API_URL + '/remove-watermark');
            const response = await fetch(CONFIG.API_URL + '/remove-watermark', { 
                method: 'POST', 
                body: formData 
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error (${response.status}):`, errorText);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const resultBlob = await response.blob();
            const resultUrl = URL.createObjectURL(resultBlob);

            elements.originalPrev.src = elements.mainCanvas.toDataURL();
            elements.resultPrev.src = resultUrl;
            elements.downloadBtn.href = resultUrl;
            
            initComparison();
            switchSection('result');
        } catch (err) {
            console.error('Watermark removal error:', err);
            alert(`Error removing watermark: ${err.message}`);
        } finally {
            elements.removeBtn.disabled = false;
            elements.removeBtn.textContent = 'Remove';
        }
    };

    // ─── COMPARISON SLIDER ──────────────────────────────────
    const initComparison = () => {
        elements.compAfter.style.width = '50%';
        elements.compHandle.style.left = '50%';

        const move = (e) => {
            if (!elements.compSlider.classList.contains('dragging')) return;
            const rect = elements.compSlider.getBoundingClientRect();
            const pageX = e.touches ? e.touches[0].pageX : e.pageX;
            let x = (pageX - rect.left) / rect.width;
            x = Math.max(0, Math.min(1, x));
            elements.compAfter.style.width = (x * 100) + '%';
            elements.compHandle.style.left = (x * 100) + '%';
        };

        const startMove = () => elements.compSlider.classList.add('dragging');
        const endMove = () => elements.compSlider.classList.remove('dragging');

        elements.compHandle.addEventListener('mousedown', startMove);
        elements.compHandle.addEventListener('touchstart', startMove);
        
        window.addEventListener('mouseup', endMove);
        window.addEventListener('touchend', endMove);
        
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, { passive: false });
    };

    elements.resetBtn.onclick = () => {
        elements.imageInput.value = '';
        state.originalImage = null;
        switchSection('upload');
    };
});

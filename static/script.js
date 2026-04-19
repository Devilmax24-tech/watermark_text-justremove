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
        maxZoom: 3
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
        clearBtn: document.getElementById('clear-mask'),
        removeBtn: document.getElementById('remove-btn'),
        tryDifferentBtn: document.getElementById('try-different-btn'),

        originalPrev: document.getElementById('original-preview'),
        resultPrev: document.getElementById('result-preview'),
        resetBtn: document.getElementById('reset-btn'),
        downloadBtn: document.getElementById('download-btn'),
        compSlider: document.getElementById('comparison-slider'),
        compAfter: document.getElementById('comparison-after'),
        compHandle: document.getElementById('comparison-handle')
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
        elements.zoomVal.textContent = '100%';
        updateCanvasSize();
    };

    const getPos = (e) => {
        const rect = elements.maskCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Handle both Mouse and Touch events
        let x, y;
        if (e.touches && e.touches.length > 0) {
            x = (e.touches[0].clientX - rect.left) * dpr;
            y = (e.touches[0].clientY - rect.top) * dpr;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            x = (e.changedTouches[0].clientX - rect.left) * dpr;
            y = (e.changedTouches[0].clientY - rect.top) * dpr;
        } else {
            x = (e.clientX - rect.left) * dpr;
            y = (e.clientY - rect.top) * dpr;
        }

        // Clamp to canvas bounds
        x = Math.max(0, Math.min(x, elements.maskCanvas.width));
        y = Math.max(0, Math.min(y, elements.maskCanvas.height));

        return { x, y };
    };

    const startDrawing = (e) => {
        if (e.type === 'touchstart') e.preventDefault();
        state.isDrawing = true;
        const pos = getPos(e);
        [state.lastX, state.lastY] = [pos.x, pos.y];
    };

    const draw = (e) => {
        if (!state.isDrawing) return;
        if (e.type === 'touchmove') e.preventDefault();
        const pos = getPos(e);

        state.maskCtx.beginPath();
        state.maskCtx.moveTo(state.lastX, state.lastY);
        state.maskCtx.lineTo(pos.x, pos.y);
        state.maskCtx.stroke();

        [state.lastX, state.lastY] = [pos.x, pos.y];
    };

    const stopDrawing = () => state.isDrawing = false;

    // Mouse Events
    elements.maskCanvas.addEventListener('mousedown', startDrawing);
    elements.maskCanvas.addEventListener('mousemove', draw);
    elements.maskCanvas.addEventListener('mouseup', stopDrawing);
    elements.maskCanvas.addEventListener('mouseout', stopDrawing);

    // Touch Events
    elements.maskCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    elements.maskCanvas.addEventListener('touchmove', draw, { passive: false });
    elements.maskCanvas.addEventListener('touchend', stopDrawing);
    elements.maskCanvas.addEventListener('touchcancel', stopDrawing);

    elements.brushSlider.oninput = (e) => {
        const val = e.target.value;
        elements.brushSizeVal.textContent = val + 'px';
        if (state.maskCtx) state.maskCtx.lineWidth = val;
    };

    elements.clearBtn.onclick = () => {
        state.maskCtx.clearRect(0, 0, elements.maskCanvas.width, elements.maskCanvas.height);
    };

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
        const dpr = window.devicePixelRatio || 1;
        const zoomedFactor = baseFactor * state.zoom;

        const w = Math.floor(img.width * zoomedFactor);
        const h = Math.floor(img.height * zoomedFactor);

        // Update canvas internal size (for drawing)
        elements.mainCanvas.width = elements.maskCanvas.width = w * dpr;
        elements.mainCanvas.height = elements.maskCanvas.height = h * dpr;

        // Update canvas display size
        elements.mainCanvas.style.width = elements.maskCanvas.style.width = w + 'px';
        elements.mainCanvas.style.height = elements.maskCanvas.style.height = h + 'px';

        // Redraw image on main canvas
        const ctx = elements.mainCanvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.drawImage(img, 0, 0, w, h);

        // Update mask context scale (canvas resize clears the mask, which is okay for zoom)
        state.maskCtx = elements.maskCanvas.getContext('2d');
        state.maskCtx.scale(dpr, dpr);
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

            const API_URL = 'https://justremove-api-ibu3.onrender.com';
            const response = await fetch(API_URL + '/remove-watermark', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Failed to remove watermark');

            const resultBlob = await response.blob();
            const resultUrl = URL.createObjectURL(resultBlob);

            elements.originalPrev.src = elements.mainCanvas.toDataURL();
            elements.resultPrev.src = resultUrl;
            elements.downloadBtn.href = resultUrl;
            
            initComparison();
            switchSection('result');
        } catch (err) {
            console.error(err);
            alert("Error removing watermark. Please try again.");
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

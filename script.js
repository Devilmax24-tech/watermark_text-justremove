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
        scaleFactor: 1
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
        clearBtn: document.getElementById('clear-mask'),
        removeBtn: document.getElementById('remove-btn'),
        
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
        const img = state.originalImage;
        const container = sections.editor.querySelector('.editor-container');
        const padding = 48; // 1.5rem * 2
        const containerWidth = container.clientWidth - padding;
        const availableHeight = window.innerHeight * 0.5; // Max 50vh for canvas
        
        const scaleW = containerWidth / img.width;
        const scaleH = availableHeight / img.height;
        state.scaleFactor = Math.min(1, scaleW, scaleH);
        
        const w = img.width * state.scaleFactor;
        const h = img.height * state.scaleFactor;

        elements.mainCanvas.width = elements.maskCanvas.width = w;
        elements.mainCanvas.height = elements.maskCanvas.height = h;

        const ctx = elements.mainCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        state.maskCtx = elements.maskCanvas.getContext('2d');
        state.maskCtx.lineCap = 'round';
        state.maskCtx.lineJoin = 'round';
        state.maskCtx.strokeStyle = 'rgba(242, 78, 30, 0.7)'; // Vibrant orange mask
        state.maskCtx.lineWidth = elements.brushSlider.value;
    };

    const getMousePos = (e) => {
        const rect = elements.maskCanvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const draw = (e) => {
        if (!state.isDrawing) return;
        const pos = getMousePos(e);

        state.maskCtx.beginPath();
        state.maskCtx.moveTo(state.lastX, state.lastY);
        state.maskCtx.lineTo(pos.x, pos.y);
        state.maskCtx.stroke();

        [state.lastX, state.lastY] = [pos.x, pos.y];
    };

    elements.maskCanvas.onmousedown = (e) => {
        state.isDrawing = true;
        const pos = getMousePos(e);
        [state.lastX, state.lastY] = [pos.x, pos.y];
    };

    elements.maskCanvas.onmousemove = draw;
    elements.maskCanvas.onmouseup = () => state.isDrawing = false;
    elements.maskCanvas.onmouseout = () => state.isDrawing = false;

    elements.brushSlider.oninput = (e) => {
        const val = e.target.value;
        elements.brushSizeVal.textContent = val + 'px';
        if (state.maskCtx) state.maskCtx.lineWidth = val;
    };

    elements.clearBtn.onclick = () => {
        state.maskCtx.clearRect(0, 0, elements.maskCanvas.width, elements.maskCanvas.height);
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

            const response = await fetch('/remove-watermark', { method: 'POST', body: formData });
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
            let x = (e.pageX - rect.left) / rect.width;
            x = Math.max(0, Math.min(1, x));
            elements.compAfter.style.width = (x * 100) + '%';
            elements.compHandle.style.left = (x * 100) + '%';
        };

        elements.compHandle.onmousedown = () => elements.compSlider.classList.add('dragging');
        window.onmouseup = () => elements.compSlider.classList.remove('dragging');
        window.onmousemove = move;
    };

    elements.resetBtn.onclick = () => {
        elements.imageInput.value = '';
        state.originalImage = null;
        switchSection('upload');
    };
});

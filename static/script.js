/* ═══════════════════════════════════════════════════════
   JustRemove — Core Interaction Logic (v2)
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    console.log("JustRemove JS Initialized");

    // ─── ROADMAP INTERACTION ─────────────────────────────────
    const roadmapSteps = document.querySelectorAll('.step-item');
    const visualBoxBody = document.getElementById('visual-box-body');
    const boxFilename = document.getElementById('box-filename');

    const STEP_CONTENT = {
        1: `
            <div class="visual-content" style="animation: fadeUp 0.4s easeOutQuant">
                <p style="color: #6b7280; font-style: italic; margin-bottom: 1rem;"># Phase I: Ingestion</p>
                <div style="background: #111; padding: 1rem; border-radius: 8px; border: 1px solid #222;">
                    <p><span style="color: #f472b6;">const</span> engine = <span style="color: #60a5fa;">require</span>(<span style="color: #34d399;">"@justremove/core"</span>)</p>
                    <p>engine.<span style="color: #60a5fa;">listen</span>({ port: 8000 })</p>
                </div>
                <br>
                <div style="color: #22c55e; font-family: monospace; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #22c55e;"></span>
                    AWAITING PAYLOAD...
                </div>
            </div>
        `,
        2: `
            <div class="visual-content" style="animation: fadeUp 0.4s easeOutQuant">
                <p style="color: #6b7280; font-style: italic; margin-bottom: 1rem;"># Phase II: Transformation</p>
                <div style="background: #111; padding: 1rem; border-radius: 8px; border: 1px solid #222;">
                    <p><span style="color: #f472b6;">const</span> result = <span style="color: #60a5fa;">await</span> engine.<span style="color: #60a5fa;">process</span>({</p>
                    <p>&nbsp;&nbsp;model: <span style="color: #34d399;">"lama-high-res"</span>,</p>
                    <p>&nbsp;&nbsp;device: <span style="color: #34d399;">"device:0"</span></p>
                    <p>})</p>
                </div>
                <br>
                <div style="color: #3b82f6; font-family: monospace; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #3b82f6;"></span>
                    RECONSTRUCTING PIXELS...
                </div>
            </div>
        `,
        3: `
            <div class="visual-content" style="animation: fadeUp 0.4s easeOutQuant">
                <p style="color: #6b7280; font-style: italic; margin-bottom: 1rem;"># Phase III: Restoration</p>
                <div style="background: #111; padding: 1rem; border-radius: 8px; border: 1px solid #222;">
                    <p><span style="color: #60a5fa;">return</span> <span style="color: #f472b6;">new</span> Response(result, {</p>
                    <p>&nbsp;&nbsp;headers: { <span style="color: #34d399;">"X-AI-Clean"</span>: <span style="color: #34d399;">"true"</span> }</p>
                    <p>})</p>
                </div>
                <br>
                <div style="color: #f472b6; font-family: monospace; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="width: 8px; height: 8px; background: #f472b6; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #f472b6;"></span>
                    READY FOR DEPLOYMENT
                </div>
            </div>
        `
    };

    const roadmapObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            console.log("Entry intersecting:", entry.target.dataset.step, entry.isIntersecting);
            if (entry.isIntersecting) {
                const step = entry.target.getAttribute('data-step');
                
                // Update active state
                roadmapSteps.forEach(s => s.classList.remove('active'));
                entry.target.classList.add('active');
                
                // Update container box
                if (visualBoxBody && STEP_CONTENT[step]) {
                    console.log("Updating box for step:", step);
                    visualBoxBody.innerHTML = STEP_CONTENT[step];
                    if (boxFilename) boxFilename.textContent = 'processor_v' + step + '.sh';
                }
            }
        });
    }, { 
        threshold: 0.2, // Be very permissive
        rootMargin: "0px" 
    });

    roadmapSteps.forEach(step => {
        console.log("Observing step:", step.dataset.step);
        roadmapObserver.observe(step);
    });

    // ─── NAV CLICK TRIGGER ───────────────────────────────────
    const createBtn = document.querySelector('.btn-primary');
    if (createBtn) {
        createBtn.addEventListener('click', (e) => {
            if (createBtn.getAttribute('href') === '#upload-section') {
                e.preventDefault();
                const target = document.getElementById('upload-section');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});

(function() { // IIFE Start. Se eliminó la etiqueta <script> anidada.
        /*
         * POMODORO WEB APP - AUDIO ENGINE & LOGIC
         * Realized with high-quality Web Audio API synthesis (zero static audio asset requirements).
         */

        // Audio Engine Class
        class CozyAudioEngine {
            constructor() {
                this.ctx = null;
                this.rainNode = null;
                this.kettleNode = null;
                this.radioNode = null;
                
                // Active gains
                this.rainGain = null;
                this.kettleGain = null;
                this.radioGain = null;

                this.initialized = false;
                this.isMuted = false;
            }

            init() {
                if (this.initialized) return;
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    this.ctx = new AudioContext();
                    
                    this.setupRainSynth();
                    this.setupKettleSynth();
                    this.setupRadioSynth();
                    
                    this.initialized = true;
                    console.log("Audio Engine initialized successfully!");
                } catch(e) {
                    console.error("Failed to initialize Audio Engine:", e);
                }
            }

            toggleMute() {
                if (!this.initialized) return false;
                this.isMuted = !this.isMuted;
                
                if (this.isMuted) {
                    this.rainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
                    this.kettleGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
                    this.radioGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
                } else {
                    this.setVolume('rain', document.getElementById('rainSlider').value);
                    this.setVolume('kettle', document.getElementById('kettleSlider').value);
                    this.setVolume('radio', document.getElementById('radioSlider').value);
                }
                return this.isMuted;
            }

            createNoiseBuffer(type = 'white') {
                const bufferSize = 2 * this.ctx.sampleRate;
                const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                
                let lastOut = 0.0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    if (type === 'pink') {
                        output[i] = (lastOut + (0.02 * white)) / 1.02;
                        lastOut = output[i];
                        output[i] *= 3.5; 
                    } else if (type === 'brown') {
                        output[i] = (lastOut + (0.02 * white)) / 1.01;
                        lastOut = output[i];
                        output[i] *= 3.5;
                    } else {
                        output[i] = white;
                    }
                }
                return noiseBuffer;
            }

            setupRainSynth() {
                const source = this.ctx.createBufferSource();
                source.buffer = this.createNoiseBuffer('brown');
                source.loop = true;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, this.ctx.currentTime);

                this.rainGain = this.ctx.createGain();
                this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

                const modulator = this.ctx.createOscillator();
                modulator.frequency.value = 0.08; 
                const modGain = this.ctx.createGain();
                modGain.gain.value = 0.15;

                modulator.connect(modGain);
                modGain.connect(this.rainGain.gain); 

                source.connect(filter);
                filter.connect(this.rainGain);
                this.rainGain.connect(this.ctx.destination);

                source.start();
                modulator.start();
            }

            setupKettleSynth() {
                const source = this.ctx.createBufferSource();
                source.buffer = this.createNoiseBuffer('pink');
                source.loop = true;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(4500, this.ctx.currentTime);
                filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

                this.kettleGain = this.ctx.createGain();
                this.kettleGain.gain.setValueAtTime(0, this.ctx.currentTime);

                const modulator = this.ctx.createOscillator();
                modulator.frequency.value = 3.5; 
                const modGain = this.ctx.createGain();
                modGain.gain.value = 0.05;

                modulator.connect(modGain);
                modGain.connect(this.kettleGain.gain);

                source.connect(filter);
                filter.connect(this.kettleGain);
                this.kettleGain.connect(this.ctx.destination);

                source.start();
                modulator.start();
            }

            setupRadioSynth() {
                const staticSrc = this.ctx.createBufferSource();
                staticSrc.buffer = this.createNoiseBuffer('white');
                staticSrc.loop = true;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
                filter.Q.setValueAtTime(0.7, this.ctx.currentTime);

                const humOsc = this.ctx.createOscillator();
                humOsc.type = 'sine';
                humOsc.frequency.setValueAtTime(50, this.ctx.currentTime);
                const humGain = this.ctx.createGain();
                humGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

                this.radioGain = this.ctx.createGain();
                this.radioGain.gain.setValueAtTime(0, this.ctx.currentTime);

                humOsc.connect(humGain);
                humGain.connect(this.radioGain);

                staticSrc.connect(filter);
                filter.connect(this.radioGain);
                
                this.radioGain.connect(this.ctx.destination);

                staticSrc.start();
                humOsc.start();
            }

            setVolume(channel, percentage) {
                if (!this.initialized || this.isMuted) return; 
                const value = (percentage / 100) * 0.45; 
                const targetNode = channel === 'rain' ? this.rainGain : channel === 'kettle' ? this.kettleGain : this.radioGain;
                if (targetNode) {
                    targetNode.gain.linearRampToValueAtTime(value, this.ctx.currentTime + 0.5);
                }
            }

            playRetroChime() {
                if (!this.initialized) return;
                const now = this.ctx.currentTime;
                const osc1 = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(523.25, now); 
                osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.4);

                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(783.99, now); 
                osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.5);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(this.ctx.destination);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.9);
                osc2.stop(now + 0.9);
            }
        }

        const audioEngine = new CozyAudioEngine();

        const state = {
            times: {
                study: 30 * 60,
                short: 5 * 60,
                long: 15 * 60
            },
            currentMode: 'study', 
            timeLeft: 30 * 60,
            timerInterval: null,
            isRunning: false,
            focusMinutes: 0,
            tasks: [
                { id: 1, text: "Preparar apuntes del día", completed: false },
                { id: 2, text: "Estudiar bloque teórico 1", completed: false }
            ],
            zenMode: false
        };

        // UI DOM Elements
        const timerDisplay = document.getElementById('timerDisplay');
        const statusLabel = document.getElementById('statusLabel');
        const progressRing = document.getElementById('progressRing');
        
        const modeStudyBtn = document.getElementById('modeStudy');
        const modeShortBtn = document.getElementById('modeShort');
        const modeLongBtn = document.getElementById('modeLong');
        
        const playPauseBtn = document.getElementById('playPauseBtn');
        const playIcon = document.getElementById('playIcon');
        const resetTimerBtn = document.getElementById('resetTimerBtn');
        const skipTimerBtn = document.getElementById('skipTimerBtn');

        const audioInitBtn = document.getElementById('audioInitBtn');
        
        const rainSlider = document.getElementById('rainSlider');
        const kettleSlider = document.getElementById('kettleSlider');
        const radioSlider = document.getElementById('radioSlider');
        
        const rainVolVal = document.getElementById('rainVolVal');
        const kettleVolVal = document.getElementById('kettleVolVal');
        const radioVolVal = document.getElementById('radioVolVal');

        const taskList = document.getElementById('taskList');
        const newTaskInput = document.getElementById('newTaskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const taskCount = document.getElementById('taskCount');

        const leftPanel = document.getElementById('leftPanel');
        const rightPanel = document.getElementById('rightPanel');
        const toggleZenBtn = document.getElementById('toggleZenBtn');

        const configToggleBtn = document.getElementById('configToggleBtn');
        const configPanel = document.getElementById('configPanel');
        const configCancelBtn = document.getElementById('configCancelBtn');
        const configSaveBtn = document.getElementById('configSaveBtn');
        const cfgStudy = document.getElementById('cfgStudy');
        const cfgShort = document.getElementById('cfgShort');
        const cfgLong = document.getElementById('cfgLong');

        const toastNotification = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');

        function initApp() {
            const radius = progressRing.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
            progressRing.style.strokeDashoffset = circumference;

            loadState();
            updateTimerUI();
            renderTasks();
            setupEventListeners();
            fetchWeather();
        }

        // Lógica del Clima corregida y optimizada
        function fetchWeather() {
            const weatherLocation = document.getElementById('weatherLocation');
            const weatherContent = document.getElementById('weatherContent');
            
            const iconMap = {
                "Cielo despejado": "fa-sun text-amber-400",
                "Soleado": "fa-sun text-amber-400",
                "Parcialmente nublado": "fa-cloud-sun text-slate-300",
                "Nublado": "fa-cloud text-slate-400",
                "Neblina": "fa-smog text-slate-300",
                "Lluvia moderada": "fa-cloud-showers-heavy text-sky-400",
                "Lluvia ligera": "fa-cloud-rain text-sky-300",
                "Chubascos dispersos": "fa-cloud-sun-showers text-sky-300"
            };

            fetch('https://wttr.in/?format=j1', { headers: { 'Accept-Language': 'es' } })
                .then(res => res.json())
                .then(data => {
                    const current = data.current_condition[0];
                    const area = data.nearest_area[0];
                    
                    const temp = current.temp_C;
                    const desc = current.lang_es ? current.lang_es[0].value : current.weatherDesc[0].value;
                    const ciudad = area.areaName[0].value;
                    const provincia = area.region[0].value;

                    let iconClass = "fa-cloud text-slate-300";
                    const foundKey = Object.keys(iconMap).find(key => desc.toLowerCase().includes(key.toLowerCase()));
                    if (foundKey) {
                        iconClass = iconMap[foundKey];
                    }


                    weatherLocation.textContent = `${ciudad}, ${provincia}`; // Seguro, usa textContent
                    weatherContent.innerHTML = ''; // Limpiar contenido anterior

                    const container = document.createElement('div');
                    container.className = 'flex items-center gap-3';

                    const iconEl = document.createElement('i');
                    iconEl.className = `fa-solid ${iconClass} text-3xl drop-shadow-md`;

                    const textDiv = document.createElement('div');
                    const tempSpan = document.createElement('span');
                    tempSpan.className = 'text-3xl font-bold tracking-tight font-mono';
                    tempSpan.textContent = `${temp}°C`; // Seguro

                    const descSpan = document.createElement('span');
                    descSpan.className = 'block text-[11px] opacity-70 font-light max-w-[140px] truncate capitalize';
                    descSpan.textContent = desc; // Seguro, usa textContent

                    textDiv.append(tempSpan, descSpan);
                    container.append(iconEl, textDiv);
                    weatherContent.appendChild(container);
                })
                .catch(err => {
                    console.error("Error al obtener clima:", err);
                    weatherLocation.textContent = "Argentina";
                    weatherContent.innerHTML = `
                        <div class="text-center text-[11px] opacity-50 py-2">
                            <i class="fa-solid fa-triangle-exclamation mr-1"></i> No se pudo cargar el clima
                        </div>
                    `;
                });
        }

        function showToast(msg) {
            toastMessage.textContent = msg;
            toastNotification.classList.remove('translate-y-[-150%]', 'opacity-0');
            toastNotification.classList.add('translate-y-0', 'opacity-100');
            
            setTimeout(() => {
                toastNotification.classList.add('translate-y-[-150%]', 'opacity-0');
                toastNotification.classList.remove('translate-y-0', 'opacity-100');
            }, 3500);
        }

        function setupEventListeners() {
            const audioBtnText = document.getElementById('audioBtnText');
            const audioBtnIcon = document.getElementById('audioBtnIcon');

            audioInitBtn.addEventListener('click', () => {
                if (!audioEngine.initialized) {
                    audioEngine.init();
                    audioBtnText.textContent = "Desactivar Sonidos";
                    audioBtnIcon.className = "fa-solid fa-volume-xmark";                    
                    audioInitBtn.classList.replace('bg-amber-600/30', 'bg-red-600/30');
                    audioInitBtn.classList.replace('border-amber-500/40', 'border-red-500/40');
                    showToast("🔊 Sonidos activados. Ajustá el ambiente a tu gusto.");
                } else {
                    const muted = audioEngine.toggleMute();
                    if (muted) {
                        audioBtnText.textContent = "Activar Sonidos";
                        audioBtnIcon.className = "fa-solid fa-volume-high";
                        audioInitBtn.classList.replace('bg-red-600/30', 'bg-amber-600/30');
                        audioInitBtn.classList.replace('border-red-500/40', 'border-amber-500/40');
                        showToast("🔇 Ambiente silenciado.");
                    } else {
                        audioBtnText.textContent = "Desactivar Sonidos";
                        audioBtnIcon.className = "fa-solid fa-volume-xmark";
                        audioInitBtn.classList.replace('bg-amber-600/30', 'bg-red-600/30');
                        audioInitBtn.classList.replace('border-amber-500/40', 'border-red-500/40');
                        showToast("🔊 Ambiente reactivado.");
                    }
                }
            });

            playPauseBtn.addEventListener('click', () => {
                audioEngine.init();
                if (state.isRunning) {
                    pauseTimer();
                } else {
                    startTimer();
                }
            });

            resetTimerBtn.addEventListener('click', resetTimer);
            skipTimerBtn.addEventListener('click', skipTimer);

            modeStudyBtn.addEventListener('click', () => setTimerMode('study'));
            modeShortBtn.addEventListener('click', () => setTimerMode('short'));
            modeLongBtn.addEventListener('click', () => setTimerMode('long'));

            rainSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                rainVolVal.textContent = `${val}%`;
                audioEngine.setVolume('rain', val);
            });
            kettleSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                kettleVolVal.textContent = `${val}%`;
                audioEngine.setVolume('kettle', val);
            });
            radioSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                radioVolVal.textContent = `${val}%`;
                audioEngine.setVolume('radio', val);
            });

            toggleZenBtn.addEventListener('click', () => {
                state.zenMode = !state.zenMode;
                if (state.zenMode) {
                    leftPanel.classList.add('opacity-0', 'pointer-events-none', 'hidden');
                    rightPanel.classList.add('opacity-0', 'pointer-events-none', 'hidden');
                    toggleZenBtn.innerHTML = `<i class="fa-solid fa-eye"></i> <span class="hidden sm:inline">Mostrar</span>`;
                    document.getElementById('centerPanel').className = 'col-span-1 md:col-span-12 order-1 flex flex-col justify-center items-center';
                } else {
                    leftPanel.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
                    rightPanel.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
                    toggleZenBtn.innerHTML = `<i class="fa-solid fa-eye-slash"></i> <span class="hidden sm:inline">Ocultar</span>`;
                    document.getElementById('centerPanel').className = 'col-span-1 md:col-span-4 lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center items-center';
                }
            });

            configToggleBtn.addEventListener('click', () => {
                configPanel.classList.remove('translate-y-full');
            });
            configCancelBtn.addEventListener('click', () => {
                configPanel.classList.add('translate-y-full');
            });
            configSaveBtn.addEventListener('click', () => {
                const studyMin = Math.max(1, parseInt(cfgStudy.value) || 30);
                const shortMin = Math.max(1, parseInt(cfgShort.value) || 5);
                const longMin = Math.max(1, parseInt(cfgLong.value) || 15);

                state.times.study = studyMin * 60;
                state.times.short = shortMin * 60;
                state.times.long = longMin * 60;

                saveState();
                resetTimer();
                configPanel.classList.add('translate-y-full');
                showToast("⏱️ Tiempos de estudio configurados.");
            });

            addTaskBtn.addEventListener('click', addNewTask);
            newTaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addNewTask();
            });

            // Event Delegation for tasks
            taskList.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;

                const action = target.dataset.action;
                const id = parseInt(target.dataset.id, 10);

                if (action === 'toggle') {
                    toggleTask(id);
                } else if (action === 'delete') {
                    deleteTask(id);
                }
            });
        }

        function setTimerMode(mode) {
            pauseTimer();
            state.currentMode = mode;
            state.timeLeft = state.times[mode];
            
            [modeStudyBtn, modeShortBtn, modeLongBtn].forEach(b => {
                b.classList.remove('bg-white/10', 'shadow-sm', 'text-white');
                b.classList.add('text-white/60');
            });

            if (mode === 'study') {
                modeStudyBtn.classList.add('bg-white/10', 'shadow-sm', 'text-white');
                statusLabel.textContent = "ESTUDIANDO";
                progressRing.className = "progress-ring__circle text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all";
            } else if (mode === 'short') {
                modeShortBtn.classList.add('bg-white/10', 'shadow-sm', 'text-white');
                statusLabel.textContent = "RECREO CORTO";
                progressRing.className = "progress-ring__circle text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all";
            } else {
                modeLongBtn.classList.add('bg-white/10', 'shadow-sm', 'text-white');
                statusLabel.textContent = "RECREO LARGO";
                progressRing.className = "progress-ring__circle text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all";
            }

            updateTimerUI();
        }

        function startTimer() {
            if (state.isRunning) return;
            state.isRunning = true;
            playIcon.className = "fa-solid fa-pause";
            
            state.timerInterval = setInterval(() => {
                state.timeLeft--;
                
                if (state.currentMode === 'study' && state.timeLeft % 60 === 0) {
                    state.focusMinutes++;
                }

                if (state.timeLeft <= 0) {
                    clearInterval(state.timerInterval);
                    timerFinished();
                } else {
                    updateTimerUI();
                }
            }, 1000);
        }

        function pauseTimer() {
            if (!state.isRunning) return;
            state.isRunning = false;
            playIcon.className = "fa-solid fa-play ml-1";
            clearInterval(state.timerInterval);
        }

        function resetTimer() {
            pauseTimer();
            state.timeLeft = state.times[state.currentMode];
            updateTimerUI();
        }

        function skipTimer() {
            pauseTimer();
            if (state.currentMode === 'study') {
                setTimerMode('short');
            } else if (state.currentMode === 'short') {
                setTimerMode('study');
            } else {
                setTimerMode('study');
            }
        }

        function timerFinished() {
            pauseTimer();
            audioEngine.playRetroChime();
            
            if (state.currentMode === 'study') {
                showToast("🏆 ¡Terminaste tu bloque de estudio! Descansá un momento.");
                setTimerMode('short');
            } else {
                showToast("💪 ¡Terminó el recreo! Hora de volver al foco.");
                setTimerMode('study');
            }
            startTimer();
        }

        // UX / UI Update Timer (Línea corregida)
        function updateTimerUI() {
            const minutes = Math.floor(state.timeLeft / 60);
            const seconds = state.timeLeft % 60;
            const displayStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            timerDisplay.textContent = displayStr;

            document.title = `⏱️ ${displayStr} - Pomodoro`;

            const radius = progressRing.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            const total = state.times[state.currentMode];
            const offset = circumference - ((state.timeLeft / total) * circumference);
            progressRing.style.strokeDashoffset = offset;
        }

        function renderTasks() {
            taskList.innerHTML = '';
            let completedCount = 0;
            
            state.tasks.forEach(task => {
                if (task.completed) completedCount++;

                const li = document.createElement('li');
                li.className = `flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-xl gap-2 transition-all hover:bg-white/10 ${task.completed ? 'opacity-60 line-through' : ''}`;
                li.dataset.id = task.id;

                const taskDiv = document.createElement('div');
                taskDiv.className = 'flex items-center gap-2 cursor-pointer flex-1';
                taskDiv.dataset.action = 'toggle';
                taskDiv.dataset.id = task.id;

                const icon = document.createElement('i');
                icon.className = `fa-regular ${task.completed ? 'fa-circle-check text-amber-400' : 'fa-circle text-white/50'}`;

                const textSpan = document.createElement('span');
                textSpan.textContent = task.text; // Usar textContent previene XSS

                taskDiv.append(icon, textSpan);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'text-white/30 hover:text-red-400 p-1';
                deleteBtn.dataset.action = 'delete';
                deleteBtn.dataset.id = task.id;
                deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;

                li.append(taskDiv, deleteBtn);
                taskList.appendChild(li);
            });

            taskCount.textContent = `${completedCount}/${state.tasks.length}`;
        }
        
        function toggleTask(id) {
            const task = state.tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                saveState();
                renderTasks();
            }
        }
        function deleteTask(id) {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveState();
            renderTasks();
        };

        function addNewTask() {
            const text = newTaskInput.value.trim();
            if (!text) return;

            state.tasks.push({
                id: Date.now(),
                text: text,
                completed: false
            });

            newTaskInput.value = '';
            saveState();
            renderTasks();
        }

        function saveState() {
            const stateToSave = {
                times: state.times,
                focusMinutes: state.focusMinutes,
                tasks: state.tasks
            };
            localStorage.setItem('pomodoro_matero_state', JSON.stringify(stateToSave));
        }

        function loadState() {
            const saved = localStorage.getItem('pomodoro_matero_state');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    state.times = parsed.times || state.times;
                    state.focusMinutes = parsed.focusMinutes || 0;
                    state.tasks = parsed.tasks || state.tasks;
                    
                    cfgStudy.value = state.times.study / 60;
                    cfgShort.value = state.times.short / 60;
                    cfgLong.value = state.times.long / 60;
                    
                    state.timeLeft = state.times.study;
                } catch (e) {
                    console.error("Error parsing saved state:", e);
                }
            }
        }

        window.onload = function() {
            initApp();
        };
    
})();
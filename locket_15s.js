// ========================================
// Locket 15s Video Unlocker (Smart Override)
// Tự động quét và nâng độ dài video lên 15s
// ========================================

var body = $response.body;
try {
    var obj = JSON.parse(body);

    function overrideVideoLength(data) {
        if (typeof data === 'object' && data !== null) {
            for (var k in data) {
                var keyLower = k.toLowerCase();
                
                if (keyLower.includes("video") && (keyLower.includes("length") || keyLower.includes("duration") || keyLower.includes("limit") || keyLower.includes("max"))) {
                    if (typeof data[k] === 'number') {
                        if (data[k] > 1000) {
                            data[k] = 15000;
                        } else {
                            data[k] = 15;
                        }
                    } else if (typeof data[k] === 'string') {
                        if (parseInt(data[k]) > 1000) {
                            data[k] = "15000";
                        } else {
                            data[k] = "15";
                        }
                    }
                } 
                else if (typeof data[k] === 'object') {
                    overrideVideoLength(data[k]);
                }
            }
        }
    }

    overrideVideoLength(obj);

    if (obj.entries) {
        overrideVideoLength(obj.entries);
    }
    
    // Explicit override for known remote config key
    if (obj.entries && obj.entries.max_video_length_seconds) {
        obj.entries.max_video_length_seconds = 15;
    }

    body = JSON.stringify(obj);
} catch (e) {
    console.log("Locket 15s Script Error: " + e);
}

$done({body});

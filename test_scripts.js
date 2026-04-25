const fs = require('fs');
const path = require('path');

console.log("=== BẮT ĐẦU QUÁ TRÌNH TEST TỰ ĐỘNG ===");

// Hàm giả lập môi trường Shadowrocket cho script locket_15s.js
function testLocket15s() {
    console.log("\\n--- Testing locket_15s.js ---");
    const scriptPath = path.join(__dirname, 'locket_15s.js');
    const scriptCode = fs.readFileSync(scriptPath, 'utf8');

    const testCases = [
        {
            name: "Basic Locket Firebase Payload",
            payload: {
                entries: {
                    max_video_length_seconds: 10,
                    some_other_key: 5
                }
            },
            expectedVideoLength: 15
        },
        {
            name: "Deeply Nested Video Length",
            payload: {
                data: {
                    videoConfig: {
                        duration_max: 10,
                        video_limit: "10"
                    }
                }
            },
            expectedMaxVideoConfigLength: 15,
            expectedStringVideoLimit: "15"
        },
        {
            name: "Non-JSON response (Error handling)",
            payload: "<html><body>Error</body></html>",
            shouldCatch: true
        }
    ];

    let passed = 0;

    testCases.forEach((tc, idx) => {
        let finalBody = null;
        // Mock Shadowrocket Variables
        const $response = { body: typeof tc.payload === 'string' ? tc.payload : JSON.stringify(tc.payload) };
        const $done = function(result) {
            finalBody = result.body;
        };

        try {
            // Thực thi script trong môi trường local
            eval(scriptCode);

            if (tc.shouldCatch) {
                // If it was supposed to catch, it should just return the original body unmodified
                if (finalBody === $response.body) {
                    console.log(`✅ [Pass] ${tc.name} - Handled invalid JSON gracefully.`);
                    passed++;
                } else {
                    console.log(`❌ [Fail] ${tc.name} - Did not handle invalid JSON properly.`);
                }
            } else {
                let resultObj = JSON.parse(finalBody);
                let isPassed = false;
                if (idx === 0 && resultObj.entries && resultObj.entries.max_video_length_seconds === tc.expectedVideoLength) isPassed = true;
                if (idx === 1 && resultObj.data.videoConfig.duration_max === tc.expectedMaxVideoConfigLength && resultObj.data.videoConfig.video_limit === tc.expectedStringVideoLimit) isPassed = true;

                if (isPassed) {
                    console.log(`✅ [Pass] ${tc.name}`);
                    passed++;
                } else {
                    console.log(`❌ [Fail] ${tc.name} - Output mismatch.\\nExpected length logic, got:`, resultObj);
                }
            }
        } catch (err) {
            console.log(`❌ [Fail] ${tc.name} threw an unexpected runtime error:`, err);
        }
    });

    console.log(`Kết quả Locket 15s: ${passed}/${testCases.length} Passed.`);
}

function testRevenueCat() {
    console.log("\\n--- Testing revenuecat_multi.js ---");
    const scriptPath = path.join(__dirname, 'revenuecat_multi.js');
    const scriptCode = fs.readFileSync(scriptPath, 'utf8');

    const testCases = [
        {
            name: "Locket - User without Real Gold",
            userAgent: "Locket/1.48 (iPhone; iOS 16.0; Scale/3.00)",
            payload: {
                request_date_ms: 1713024000000,
                subscriber: {
                    entitlements: {},
                    subscriptions: {}
                }
            },
            expectedEntitlement: "Gold",
            expectFakeInjected: true
        },
        {
            name: "Locket - User with Real Lifetime Gold (Smart Bypass)",
            userAgent: "Locket/1.48 (iPhone; iOS 16.0; Scale/3.00)",
            payload: {
                subscriber: {
                    entitlements: {
                        "Gold": {
                            expires_date: null,
                            product_identifier: "locket_lifetime",
                            purchase_date: "2024-01-01T00:00:00Z"
                        }
                    },
                    subscriptions: {}
                }
            },
            expectedEntitlement: "Gold",
            expectFakeInjected: false // Should bypass
        },
        {
            name: "Locket - User with Real Expiring Gold (Smart Bypass)",
            userAgent: "Locket/1.48",
            payload: {
                subscriber: {
                    entitlements: {
                        "Gold": {
                            expires_date: "2099-01-01T00:00:00Z",
                            product_identifier: "locket_1y",
                            purchase_date: "2024-01-01T00:00:00Z"
                        }
                    },
                    subscriptions: {}
                }
            },
            expectedEntitlement: "Gold",
            expectFakeInjected: false // Should bypass
        },
        {
            name: "Other App - Generic App (Not mapped)",
            userAgent: "RandomApp/1.0",
            payload: {
                subscriber: {
                    entitlements: {},
                    subscriptions: {}
                }
            },
            expectedEntitlement: "pro", // Default generic
            expectFakeInjected: true
        }
    ];

    let passed = 0;

    testCases.forEach((tc) => {
        let finalBody = null;
        // Mock Shadowrocket Variables
        const $request = { headers: { "User-Agent": tc.userAgent } };
        const $response = { body: JSON.stringify(tc.payload) };
        const $done = function(result) {
            finalBody = result.body;
        };

        try {
            eval(scriptCode);
            let resultObj = JSON.parse(finalBody);
            let hasEntitlement = resultObj.subscriber && resultObj.subscriber.entitlements && resultObj.subscriber.entitlements[tc.expectedEntitlement];
            let isFakeInjected = false;

            if (hasEntitlement) {
                // Check if store_transaction_id is the fake one we inject
                if (resultObj.subscriber.subscriptions && 
                    (resultObj.subscriber.subscriptions["locket_1600_1y"] || resultObj.subscriber.subscriptions["pro_1y"])) {
                    
                    let subData = resultObj.subscriber.subscriptions["locket_1600_1y"] || resultObj.subscriber.subscriptions["pro_1y"];
                    if (subData && subData.store_transaction_id === "2000001108724193") {
                        isFakeInjected = true;
                    }
                }
            }

            if (isFakeInjected === tc.expectFakeInjected) {
                console.log(`✅ [Pass] ${tc.name}`);
                passed++;
            } else {
                console.log(`❌ [Fail] ${tc.name} - Expected Fake Injected: ${tc.expectFakeInjected}, got: ${isFakeInjected}`);
            }

        } catch (err) {
            console.log(`❌ [Fail] ${tc.name} threw an unexpected error:`, err);
        }
    });

    console.log(`Kết quả RevenueCat: ${passed}/${testCases.length} Passed.`);
}

testLocket15s();
testRevenueCat();
console.log("\\n=== KẾT THÚC TEST ===");

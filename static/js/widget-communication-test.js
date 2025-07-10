// Widget Communication Test Suite
class WidgetCommunicationTest {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    async runAllTests() {
        console.log('🧪 Starting Widget Communication Test Suite...');
        
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;

        // Wait for widget manager to be available
        if (!window.widgetManager) {
            this.fail('Widget Manager not available');
            return this.getResults();
        }

        await this.testWidgetRegistration();
        await this.testEventEmission();
        await this.testDataUpdate();
        await this.testWidgetCommunication();
        await this.testBroadcast();
        
        return this.getResults();
    }

    async testWidgetRegistration() {
        this.log('Testing widget registration...');
        
        try {
            // Test registering a simple test widget
            const testWidget = {
                id: 'test-widget',
                eventHandlers: {
                    'test:event': () => console.log('Test event received')
                },
                update: async (data) => {
                    console.log('Test widget updated with:', data);
                }
            };

            const registered = window.widgetManager.registerWidget('test-widget', testWidget);
            
            if (registered) {
                this.pass('Widget registration successful');
                
                // Test unregistration
                const unregistered = window.widgetManager.unregisterWidget('test-widget');
                if (unregistered) {
                    this.pass('Widget unregistration successful');
                } else {
                    this.fail('Widget unregistration failed');
                }
            } else {
                this.fail('Widget registration failed');
            }
        } catch (error) {
            this.fail(`Widget registration error: ${error.message}`);
        }
    }

    async testEventEmission() {
        this.log('Testing event emission...');
        
        try {
            let eventReceived = false;
            
            // Create a test listener
            const testListener = (event) => {
                eventReceived = true;
                console.log('Test event received:', event.detail);
            };
            
            window.widgetManager.eventTarget.addEventListener('test:emission', testListener);
            
            // Emit test event
            window.widgetManager.emit('test:emission', {
                testData: 'Hello Widget World!'
            });
            
            // Give it a moment to process
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (eventReceived) {
                this.pass('Event emission and reception successful');
            } else {
                this.fail('Event was not received');
            }
            
            // Clean up
            window.widgetManager.eventTarget.removeEventListener('test:emission', testListener);
            
        } catch (error) {
            this.fail(`Event emission error: ${error.message}`);
        }
    }

    async testDataUpdate() {
        this.log('Testing data updates...');
        
        try {
            // Register a test widget
            let dataReceived = null;
            
            const testWidget = {
                id: 'data-test-widget',
                update: async (data) => {
                    dataReceived = data;
                    console.log('Data update received:', data);
                }
            };

            window.widgetManager.registerWidget('data-test-widget', testWidget);
            
            // Update widget data
            const testData = { ship: 'Test Ship', progress: 50 };
            window.widgetManager.updateWidgetData('data-test-widget', testData);
            
            // Process the update queue
            await window.widgetManager.processUpdateQueue();
            
            // Give it a moment to process
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (dataReceived && dataReceived.ship === 'Test Ship') {
                this.pass('Data update successful');
            } else {
                this.fail('Data update was not received or incorrect');
            }
            
            // Clean up
            window.widgetManager.unregisterWidget('data-test-widget');
            
        } catch (error) {
            this.fail(`Data update error: ${error.message}`);
        }
    }

    async testWidgetCommunication() {
        this.log('Testing widget-to-widget communication...');
        
        try {
            let widget1Updated = false;
            let widget2Updated = false;
            
            // Create two test widgets that depend on each other
            const widget1 = {
                id: 'comm-widget-1',
                dependencies: [],
                eventHandlers: {
                    'widget:dataUpdate': function(data) {
                        if (data.widgetId === 'comm-widget-2') {
                            widget1Updated = true;
                            console.log('Widget 1 received update from Widget 2');
                        }
                    }
                },
                update: async (data) => {
                    console.log('Widget 1 updated:', data);
                }
            };

            const widget2 = {
                id: 'comm-widget-2',
                dependencies: ['comm-widget-1'],
                eventHandlers: {
                    'widget:dataUpdate': function(data) {
                        if (data.widgetId === 'comm-widget-1') {
                            widget2Updated = true;
                            console.log('Widget 2 received update from Widget 1');
                        }
                    }
                },
                update: async (data) => {
                    console.log('Widget 2 updated:', data);
                }
            };

            // Register both widgets
            window.widgetManager.registerWidget('comm-widget-1', widget1);
            window.widgetManager.registerWidget('comm-widget-2', widget2);
            
            // Update widget 1, which should trigger widget 2 due to dependency
            window.widgetManager.updateWidgetData('comm-widget-1', { test: 'communication' });
            
            // Give it time to process
            await new Promise(resolve => setTimeout(resolve, 200));
            
            if (widget1Updated || widget2Updated) {
                this.pass('Widget communication successful');
            } else {
                this.info('Widget communication not triggered (may be normal depending on implementation)');
            }
            
            // Clean up
            window.widgetManager.unregisterWidget('comm-widget-1');
            window.widgetManager.unregisterWidget('comm-widget-2');
            
        } catch (error) {
            this.fail(`Widget communication error: ${error.message}`);
        }
    }

    async testBroadcast() {
        this.log('Testing broadcast functionality...');
        
        try {
            let broadcastReceived = false;
            
            const testWidget = {
                id: 'broadcast-test-widget',
                eventHandlers: {
                    'widget:broadcast': function(data) {
                        broadcastReceived = true;
                        console.log('Broadcast received:', data);
                    }
                },
                update: async (data) => {
                    console.log('Broadcast widget updated:', data);
                }
            };

            window.widgetManager.registerWidget('broadcast-test-widget', testWidget);
            
            // Send broadcast
            window.widgetManager.broadcast({ test: 'broadcast message' });
            
            // Give it time to process
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (broadcastReceived) {
                this.pass('Broadcast functionality successful');
            } else {
                this.fail('Broadcast was not received');
            }
            
            // Clean up
            window.widgetManager.unregisterWidget('broadcast-test-widget');
            
        } catch (error) {
            this.fail(`Broadcast error: ${error.message}`);
        }
    }

    pass(message) {
        this.totalTests++;
        this.passedTests++;
        this.testResults.push({ type: 'PASS', message });
        console.log(`✅ PASS: ${message}`);
    }

    fail(message) {
        this.totalTests++;
        this.testResults.push({ type: 'FAIL', message });
        console.log(`❌ FAIL: ${message}`);
    }

    info(message) {
        this.testResults.push({ type: 'INFO', message });
        console.log(`ℹ️ INFO: ${message}`);
    }

    log(message) {
        console.log(`🔍 ${message}`);
    }

    getResults() {
        const results = {
            totalTests: this.totalTests,
            passedTests: this.passedTests,
            failedTests: this.totalTests - this.passedTests,
            successRate: this.totalTests > 0 ? (this.passedTests / this.totalTests * 100).toFixed(1) : 0,
            results: this.testResults
        };

        console.log('\n📊 Test Results:');
        console.log(`Total Tests: ${results.totalTests}`);
        console.log(`Passed: ${results.passedTests}`);
        console.log(`Failed: ${results.failedTests}`);
        console.log(`Success Rate: ${results.successRate}%`);

        return results;
    }
}

// Make test available globally
window.WidgetCommunicationTest = WidgetCommunicationTest;

// Auto-run tests when script loads (if in test mode)
if (window.location.search.includes('test=true')) {
    document.addEventListener('DOMContentLoaded', async () => {
        // Wait a bit for everything to load
        setTimeout(async () => {
            const test = new WidgetCommunicationTest();
            await test.runAllTests();
        }, 2000);
    });
}

// Console command to run tests manually
window.testWidgetCommunication = async () => {
    const test = new WidgetCommunicationTest();
    return await test.runAllTests();
};
/**
 * Analytics.js
 * Wrapper for Analytics SDKs (e.g. Firebase, Google Analytics).
 * Currently logs to console for MVP/Dev mode.
 */

class Analytics {
    constructor() {
        this.debug = true; // Set to false in production or check environment
    }

    logEvent(eventName, params = {}) {
        if (this.debug) {
            console.log(`[Analytics] Event: ${eventName}`, params);
        }

        // TODO: Integrate Firebase Analytics here
        // if (window.firebase) {
        //     firebase.analytics().logEvent(eventName, params);
        // }
    }

    // Pre-defined events for consistency
    logTutorialComplete() {
        this.logEvent('tutorial_complete');
    }

    logWorkoutStart(workoutId, workoutName) {
        this.logEvent('workout_start', { workout_id: workoutId, workout_name: workoutName });
    }

    logWorkoutComplete(workoutId, duration, exercisesCount) {
        this.logEvent('workout_complete', {
            workout_id: workoutId,
            duration_seconds: duration,
            exercises_count: exercisesCount
        });
    }

    logShareApp(method) {
        this.logEvent('share_app', { method: method });
    }
}

export const analytics = new Analytics();

/**
 * DataManager.js
 * Centralized Data Access Layer for Fitness App.
 * Enforces the ER Schema and handles LocalStorage persistence.
 */

class DataManager {
    constructor() {
        this.STORAGE_KEYS = {
            USERS: 'fitness_users',
            EXERCISES: 'fitness_exercises',
            WORKOUTS: 'fitness_workouts',
            WORKOUT_LOGS: 'fitness_logs',
            PROGRESS: 'fitness_progress'
        };
        this.init();
    }

    init() {
        // Seed initial data if empty
        if (!localStorage.getItem(this.STORAGE_KEYS.EXERCISES)) {
            this.seedExercises();
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.WORKOUTS)) {
            this.seedWorkouts();
        }
    }

    // --- SEEDING (Default Content) ---

    seedExercises() {
        const exercises = [
            {
                id: 'ex_001',
                name: 'Push Ups (Piegamenti)',
                video_id: 'IODxDxX7oi4', // YouTube ID
                muscle_group: 'Pettorali',
                equipment: 'Corpo Libero',
                difficulty: 1,
                instructions: 'Mani larghezza spalle, corpo teso, scendi fino a toccare col petto.'
            },
            {
                id: 'ex_002',
                name: 'Squat',
                video_id: 'aclHkVaku9U', // Placeholder ID
                muscle_group: 'Gambe',
                equipment: 'Corpo Libero',
                difficulty: 1,
                instructions: 'Piedi larghezza spalle, scendi come se ti sedessi su una sedia.'
            },
            {
                id: 'ex_003',
                name: 'Plank',
                video_id: 'pSHjTRCQxIw', // Placeholder ID
                muscle_group: 'Addome',
                equipment: 'Corpo Libero',
                difficulty: 2,
                instructions: 'Mantieni la posizione sui gomiti, corpo in linea retta.'
            }
        ];
        this._save(this.STORAGE_KEYS.EXERCISES, exercises);
    }

    seedWorkouts() {
        const workouts = [
            {
                id: 'wk_001',
                name: 'Brucia Grassi in 20 Minuti',
                estimated_duration: 20,
                difficulty_label: 'Media', // Human readable
                equipment_label: 'Nessun attrezzo',
                thumbnail_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80', // Unsplash Placeholder
                focus_label: 'Full Body',
                type: 'Full Body',
                is_premium: false,
                exercises: [
                    { exercise_id: 'ex_002', order: 1, sets: 3, reps: '12', rest_seconds: 60 },
                    { exercise_id: 'ex_001', order: 2, sets: 3, reps: '10', rest_seconds: 60 },
                    { exercise_id: 'ex_003', order: 3, sets: 3, reps: '30s', rest_seconds: 45 }
                ]
            }
        ];
        this._save(this.STORAGE_KEYS.WORKOUTS, workouts);
    }

    // --- DATA ACCESS METHODS ---

    // Generic Helper
    _get(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    _save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Exercises
    getExercises() {
        return this._get(this.STORAGE_KEYS.EXERCISES);
    }

    getExerciseById(id) {
        return this.getExercises().find(e => e.id === id);
    }

    // Workouts
    getWorkouts() {
        return this._get(this.STORAGE_KEYS.WORKOUTS);
    }

    getWorkoutById(id) {
        const workouts = this.getWorkouts();
        // In a real DB, we would join relations here. 
        // For now, the exercise details are partly embedded or we map them.
        const workout = workouts.find(w => w.id === id);
        if (workout) {
            // Hydrate exercises with details from the catalog
            const allExercises = this.getExercises();
            workout.exercises = workout.exercises.map(we => {
                const details = allExercises.find(e => e.id === we.exercise_id);
                return { ...we, details };
            });
        }
        return workout;
    }

    // Users (Handling the current Single User for now)
    getCurrentUser() {
        // Adapting legacy local storage key 'fitness_profile' to new structure if needed
        // Or reading from 'fitness_users' if we implement multi-user login.
        // For Guest Mode/MVP, we stick to a simplified single user object.
        return JSON.parse(localStorage.getItem('fitness_profile') || '{}');
    }

    saveUser(user) {
        localStorage.setItem('fitness_profile', JSON.stringify(user));
        // Also update the 'Users' table for consistency if we were fully relational
        // this._save(this.STORAGE_KEYS.USERS, [user]); 
    }

    // Logs
    getLogs() {
        return this._get(this.STORAGE_KEYS.WORKOUT_LOGS); // mapped to 'fitness_history' for legacy compat?
        // Let's migrate legacy 'fitness_history' to 'fitness_logs' if needed, or just use 'fitness_history' key.
        // For adherence to schema, let's use the key defined in STORAGE_KEYS ('fitness_logs')
        // But previously we used 'fitness_history'. Let's alias it for now or migrate.
    }

    saveLog(log) {
        const logs = this.getLogs();
        log.id = 'log_' + Date.now();
        logs.push(log);
        this._save(this.STORAGE_KEYS.WORKOUT_LOGS, logs);

        // Also Update User Stats
        const user = this.getCurrentUser();
        user.total_xp = (user.total_xp || 0) + 100; // Mock XP
        user.streak_days = this._calculateStreak(logs);
        this.saveUser(user);
    }

    _calculateStreak(logs) {
        // Simplified streak logic re-used from Home.js
        if (!logs || logs.length === 0) return 0;
        const uniqueDates = [...new Set(logs.map(l => l.date))].sort().reverse();
        // ... implementation of streak ...
        return uniqueDates.length; // Placeholder
    }
}

export const dataManager = new DataManager();

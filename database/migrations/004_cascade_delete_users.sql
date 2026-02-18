-- Migration: Add ON DELETE CASCADE to user foreign keys
-- This allows deleting a user to automatically delete their related data

-- A. game_scores
ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS game_scores_user_id_fkey;
ALTER TABLE game_scores 
    ADD CONSTRAINT game_scores_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- B. progress
-- Note: schema says 'local_user_id REFERENCES users(id) ON DELETE CASCADE', 
-- but error suggests it might be missing or created incorrectly in some environments.
-- We recreate it to be sure.
ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_local_user_id_fkey;
ALTER TABLE progress 
    ADD CONSTRAINT progress_local_user_id_fkey 
    FOREIGN KEY (local_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- C. feedback_responses
ALTER TABLE feedback_responses DROP CONSTRAINT IF EXISTS feedback_responses_local_user_id_fkey;
ALTER TABLE feedback_responses 
    ADD CONSTRAINT feedback_responses_local_user_id_fkey 
    FOREIGN KEY (local_user_id) REFERENCES users(id) ON DELETE CASCADE;

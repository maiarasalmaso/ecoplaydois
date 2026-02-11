import { sql } from "@vercel/postgres";

async function addUniqueConstraint() {
    try {
        await sql`ALTER TABLE feedback_responses ADD CONSTRAINT unique_user_feedback UNIQUE (local_user_id);`;
        console.log("Unique constraint added successfully.");
    } catch (error) {
        if (error.code === '42710') { // 42710 error code for duplicate key
            console.log("Constraint already likely exists (or duplicate key value violates unique constraint), proceeding.");
        } else {
            console.error("Error adding unique constraint:", error);
        }
    }
}

addUniqueConstraint();

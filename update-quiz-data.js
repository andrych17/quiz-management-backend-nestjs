const { Client } = require('pg');
require('dotenv').config();

async function updateQuizData() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Update existing quizzes with start/end dates and quiz links
    const updateSMQuiz = await client.query(`
      UPDATE quizzes 
      SET "startDateTime" = '2024-08-01 08:00:00', 
          "endDateTime" = '2025-08-30 23:59:59',
          "quizLink" = 'https://quiz.gms.com/q/sm-batch-1-2024'
      WHERE slug = 'test-sm-batch-1'
    `);

    const updateNetworkQuiz = await client.query(`
      UPDATE quizzes 
      SET "startDateTime" = '2024-08-15 08:00:00', 
          "endDateTime" = '2025-09-15 23:59:59',
          "quizLink" = 'https://quiz.gms.com/q/network-batch-2-2024'
      WHERE slug = 'test-network-batch-2'
    `);

    console.log('✅ Updated SM Quiz:', updateSMQuiz.rowCount);
    console.log('✅ Updated Network Quiz:', updateNetworkQuiz.rowCount);

    // Verify the updates
    const result = await client.query('SELECT id, title, "startDateTime", "endDateTime", "quizLink" FROM quizzes');
    console.log('Updated quiz data:');
    result.rows.forEach(row => {
      console.log(`- ${row.title}: ${row.startDateTime} to ${row.endDateTime} | Link: ${row.quizLink}`);
    });

    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    await client.end();
  }
}

updateQuizData();
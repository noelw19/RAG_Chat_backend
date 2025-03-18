
// src/config/config.js
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 3000,
    mongoUri: `mongodb+srv://noelw19:${process.env.MONGOPASS}@agentcluster.fhsjt.mongodb.net/?retryWrites=true&w=majority&appName=AgentCluster`,
    jwtSecret: process.env.JWT_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    vectorDbPath: process.env.VECTOR_DB_PATH || './vectorstore',
    allowedFileTypes: ['.pdf', '.docx', '.html', '.txt', '.md'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    models: {
        embedding: "text-embedding-3-small",
        chat: "gpt-4o"
    },
    tokenLimits: {
        inputMax: 8000,
        historyMax: 4000
    }
};

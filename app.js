require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./models');
const { requireAuth } = require('./middleware/auth.middleware');
const app = express();

var corsOptions = {
  // origin: "*",
  origin: ["https://lead-desk.pages.dev", 'https://sweet-boat-c450.jatharnikhil007.workers.dev','https://lead-desk.jatharnikhil007.workers.dev'],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Origin",
    "x-access-token",
    "X-Requested-With",
    "Accept",
  ],
  methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/leads', requireAuth, require('./routes/lead.routes'));
app.use('/api/notes', requireAuth, require('./routes/note.routes'));
app.use('/api/dashboard', requireAuth, require('./routes/dashboard.routes'));

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
});

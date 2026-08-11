const app = require('./app');
const { env } = require('./config/env');
const { startJobs } = require('./jobs/cleanupAttachments');

const PORT = env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`🚀 Box Engine server running on port ${PORT}`);
  startJobs();
});

docker exec backend-worker-1 node -e "
  const { subscriptionSummaryQueue } = require('./dist/queues/subscriptionSummaryQueue.js');
  subscriptionSummaryQueue.add('subscription-summary', {}).then(() => process.exit(0));
"
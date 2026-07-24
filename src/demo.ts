import { runDemoPipeline } from './core/runDemoPipeline';

runDemoPipeline().catch(err => {
  console.error('Fatal error running MedX demo workflow:', err);
});

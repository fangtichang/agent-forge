import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
} from '@mui/material';
import type { GenerationPhase } from '@/types';
import { PROGRESS_STEPS } from '@/constants';

/** Props for ProgressStepper component. */
interface ProgressStepperProps {
  /** Current generation phase. */
  phase: GenerationPhase;
}

/** Map GenerationPhase to the active step index. */
const PHASE_TO_STEP: Record<GenerationPhase, number> = {
  input: 0,
  decomposing: 0,
  searching: 1,
  generating: 2,
  done: 3,
};

/**
 * Progress stepper showing the 4 phases of report generation:
 * Decompose → Search → Generate → Complete
 */
export default function ProgressStepper({ phase }: ProgressStepperProps) {
  const activeStep = PHASE_TO_STEP[phase];

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {PROGRESS_STEPS.map((label, index) => (
          <Step key={label} completed={index < activeStep}>
            <StepLabel>
              <Typography variant="body2" sx={{ fontWeight: index === activeStep ? 600 : 400 }}>
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

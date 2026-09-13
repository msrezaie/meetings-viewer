"use client";

import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

const STAGES = [
  {
    label: "Draft PR opened",
    body: "Spider file, mixin (if factory pattern), test file, and saved fixtures are in. The draft flag signals 'ready for a first pass', not merge consideration.",
    who: "Contributor",
  },
  {
    label: "CTD review",
    body: "A CTD reviewer runs the spider and checks output against the field rubric (QA), then reads the code (logic, style, edge cases, test coverage).",
    who: "CTD team lead",
  },
  {
    label: "Ready for review",
    body: "Contributor resolves the first-pass feedback and unmarks draft. PDW reviewers are added; the Airtable backlog record moves to 'Ready to integrate to staging'.",
    who: "Contributor + PDW",
  },
  {
    label: "Merge to staging",
    body: "PDW completes its review and merges the PR into the staging branch - the PR itself stays open. The spider's output goes live on the staging site.",
    who: "PDW",
  },
  {
    label: "CB QA on staging",
    body: "City Bureau checks output against the public-site standard. Feedback goes back on the still-open PR; fixes are pushed and re-merged to staging.",
    who: "City Bureau",
  },
  {
    label: "Sign-off and launch",
    body: "CB approval is recorded in the Airtable backlog ('Ready for launch'). The PR merges to main, closes, and output begins appearing on the public site.",
    who: "PDW merges",
  },
];

/**
 * The five-plus-one stage scraper PR lifecycle as a MUI Stepper. Rendered by
 * qa/review-process.mdx; the stage text lives here so it renders identically
 * wherever it is embedded.
 */
export function PRLifecycle() {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Stepper orientation="vertical" nonLinear>
        {STAGES.map((s) => (
          <Step key={s.label} active expanded>
            <StepLabel>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {s.label}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  {s.who}
                </Typography>
              </Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">
                {s.body}
              </Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
}

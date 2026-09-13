import defaultMdxComponents from "fumadocs-ui/mdx";
import { Tabs, Tab } from "fumadocs-ui/components/tabs";
import { Accordions, Accordion } from "fumadocs-ui/components/accordion";
import { Steps, Step } from "fumadocs-ui/components/steps";
import { Files, File, Folder } from "fumadocs-ui/components/files";
import { StatusChip } from "@/components/ui/StatusChip";
import { RepoScope } from "@/components/docs/repo-scope";
import {
  SchemaTable,
  StatusVocabulary,
  ClassificationVocabulary,
} from "@/components/docs/schema-table";
import { RubricReport } from "@/components/docs/rubric-report";
import { CommandBlock } from "@/components/docs/command-block";
import { PRLifecycle } from "@/components/docs/pr-lifecycle";
import { LinkIndex } from "@/components/docs/link-index";
import { ConflictPanel } from "@/components/docs/conflict-panel";
import { KpiTile, KpiRow } from "@/components/docs/kpi-tile";
import { Sparkline } from "@/components/docs/sparkline";
import { LighthouseTrend } from "@/components/docs/lighthouse-trend";

export function getMDXComponents(
  components?: Record<string, React.ComponentType>
) {
  return {
    ...defaultMdxComponents,
    Tabs,
    Tab,
    Accordions,
    Accordion,
    Steps,
    Step,
    Files,
    File,
    Folder,
    StatusChip,
    RepoScope,
    SchemaTable,
    StatusVocabulary,
    ClassificationVocabulary,
    RubricReport,
    CommandBlock,
    PRLifecycle,
    LinkIndex,
    ConflictPanel,
    KpiTile,
    KpiRow,
    Sparkline,
    LighthouseTrend,
    ...components,
  };
}

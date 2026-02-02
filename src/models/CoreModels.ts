// Core Data Models for BugFixer Platform

/**
 * Represents a detected issue in the source code.
 */
export class Bug {
  constructor(
    public bug_id: string,
    public file_path: string,
    public start_line: number,
    public end_line: number,
    public type: 'syntax_error' | 'code_smell' | 'security_vuln' | 'style',
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public message: string,
    public status: 'open' | 'reviewed' | 'fixed' | 'dismissed' = 'open',
    public evidence: Record<string, any> = {}
  ) {}
}

/**
 * Represents a proposed fix for a Bug.
 */
export class Patch {
  constructor(
    public patch_id: string,
    public bug_id: string,
    public author: string = 'BugFixer Bot',
    public created_at: Date = new Date(),
    public diff_content: string,
    public status: 'pending' | 'approved' | 'rejected' | 'applied' = 'pending',
    public notes?: string
  ) {}
}

/**
 * Represents a configuration rule for analysis.
 */
export class Rule {
  constructor(
    public rule_id: string,
    public language: string,
    public description: string,
    public severity_level: 'low' | 'medium' | 'high' | 'critical',
    public enabled: boolean = true,
    public plugin_source: string
  ) {}
}

/**
 * Represents a complete execution cycle of analysis on a repository.
 */
export class AnalysisRun {
  constructor(
    public run_id: string,
    public repo_url: string,
    public branch: string,
    public initiator_id: string,
    public start_time: Date = new Date(),
    public status: 'queued' | 'running' | 'completed' | 'failed' = 'queued',
    public end_time?: Date,
    public summary: {
      total_bugs: number;
      by_severity: Record<string, number>;
    } = { total_bugs: 0, by_severity: {} },
    public bugs: Bug[] = []
  ) {}
}

import { Bug, Patch } from '../models/CoreModels';

/**
 * Interface for any Static Analysis Plugin.
 * Plugins must implement this to be loaded by the Orchestrator.
 */
export interface IAnalyzerPlugin {
  /**
   * Unique name of the plugin (e.g., "pylint-analyzer")
   */
  name: string;

  /**
   * List of file extensions this plugin supports (e.g., [".py"])
   */
  supportedExtensions: string[];

  /**
   * Executes analysis on a given file content.
   * @param filePath Path to the file being analyzed
   * @param content Raw string content of the file
   * @returns Promise resolving to a list of detected Bugs
   */
  analyze(filePath: string, content: string): Promise<Bug[]>;
}

/**
 * Interface for any Fixer Plugin.
 * Plugins must implement this to provide automated fixes.
 */
export interface IFixerPlugin {
  /**
   * Unique name of the fixer (e.g., "black-formatter")
   */
  name: string;

  /**
   * Checks if this fixer can handle a specific bug type.
   * @param bug The bug to check against
   */
  canFix(bug: Bug): boolean;

  /**
   * Generates a patch for a specific bug.
   * @param bug The bug to fix
   * @param originalContent The original file content
   * @returns Promise resolving to a Patch object
   */
  generateFix(bug: Bug, originalContent: string): Promise<Patch>;
}

// --- Example Plugin Implementation (Python Mock) ---

export class MockPythonAnalyzer implements IAnalyzerPlugin {
  name = 'mock-python-analyzer';
  supportedExtensions = ['.py'];

  async analyze(filePath: string, content: string): Promise<Bug[]> {
    const bugs: Bug[] = [];
    if (content.includes('eval(')) {
      bugs.push(new Bug(
        `bug-${Math.random()}`,
        filePath,
        1, 1,
        'security_vuln',
        'critical',
        'Avoid using eval() as it poses security risks.'
      ));
    }
    return bugs;
  }
}

/** Stable identifiers of issues, identical in all arguebuf implementations. */
export const issueCodes = [
  "duplicate-id",
  "unknown-element",
  "invalid-major-claim",
  "self-loop",
  "atom-edge",
  "parallel-edge",
  "invalid-patch",
  "invalid-input",
  "unknown-scheme",
  "untyped-scheme",
  "reference-mismatch",
  "reference-unresolved",
  "orphaned-atom",
  "scheme-without-premise",
  "scheme-without-conclusion",
  "scheme-multiple-conclusions",
  "scheme-multiple-premises",
  "circular-scheme",
  "disconnected",
  "no-major-claim",
  "unreachable-major-claim",
] as const;

export type IssueCode = (typeof issueCodes)[number];

/** Whether the string is an issue code, e.g. given in a configuration. */
export function isIssueCode(value: string): value is IssueCode {
  return issueCodes.some((code) => code === value);
}

export type Severity = "error" | "warning";

/**
 * Problem of a graph or of an input, serializable as JSON.
 *
 * Errors prevent an operation, warnings describe a repair or a quality problem.
 */
export interface Issue {
  readonly code: IssueCode;
  readonly severity: Severity;
  /** Complete sentence naming the affected elements. */
  readonly message: string;
  /** Imperative remediation for humans and agents. */
  readonly hint?: string;
  /** Ids of the affected elements. */
  readonly elements: readonly string[];
  /** Location in the input, e.g. `["schemes", 2, "premises"]`. */
  readonly path?: readonly (string | number)[];
}

/** Receives the issues of loaders and other lenient operations. */
export type Reporter = (issue: Issue) => void;

const errors: ReadonlySet<IssueCode> = new Set<IssueCode>([
  "duplicate-id",
  "unknown-element",
  "invalid-major-claim",
  "self-loop",
  "atom-edge",
  "parallel-edge",
  "invalid-patch",
  "invalid-input",
  "untyped-scheme",
]);

const hints: Readonly<Partial<Record<IssueCode, string>>> = {
  "duplicate-id": "Use an id that is not taken.",
  "unknown-element": "Reference an existing element or create it first.",
  "invalid-major-claim": "Choose an atom as major claim.",
  "self-loop": "Connect the node to another node.",
  "atom-edge": "Connect atoms through a scheme node.",
  "parallel-edge": "Remove the duplicate connection.",
  "invalid-input": "Check the input against the specification of its format.",
  "untyped-scheme": "Set the type to support, attack, rephrase, or preference.",
  "unknown-scheme": "Use a scheme of the type, e.g. Expert Opinion, or omit it.",
  "reference-mismatch": "Quote the source text verbatim.",
  "reference-unresolved": "Quote the source text verbatim.",
  "orphaned-atom": "Connect the atom through a scheme node or remove it.",
  "scheme-without-premise": "Add a premise or remove the scheme.",
  "scheme-without-conclusion": "Add a conclusion or remove the scheme.",
  "scheme-multiple-conclusions": "Split the scheme so that each one has a single conclusion.",
  "scheme-multiple-premises": "Split the scheme so that each one has a single premise, only supports can have several.",
  "circular-scheme": "Use different nodes as premise and conclusion.",
  disconnected: "Connect the parts into a single argument.",
  "no-major-claim": "Set the atom that the argument is about as major claim.",
  "unreachable-major-claim": "Connect the atom to the major claim, directly or indirectly.",
};

/** Create an issue with the default severity and hint of its code. */
export function issue(
  code: IssueCode,
  message: string,
  elements: readonly string[] = [],
  severity: Severity = errors.has(code) ? "error" : "warning",
): Issue {
  const hint = hints[code];

  return hint === undefined
    ? { code, severity, message, elements }
    : { code, severity, message, hint, elements };
}

export function hasErrors(issues: readonly Issue[]): boolean {
  return issues.some((item) => item.severity === "error");
}

/** Error thrown by the strict model, its `issue` describes the cause. */
export class GraphError extends Error {
  readonly issue: Issue;

  constructor(issue: Issue) {
    super(issue.message);
    this.name = "GraphError";
    this.issue = issue;
  }
}

/** Run the action and return the issue of its `GraphError`, other errors are rethrown. */
export function catchGraphError(action: () => void): Issue | undefined {
  try {
    action();

    return undefined;
  } catch (error) {
    if (error instanceof GraphError) {
      return error.issue;
    }

    throw error;
  }
}

/** The reference of the atom is not found in its resource. */
export function unresolvedReference(atom: string, resource: string): Issue {
  return issue(
    "reference-unresolved",
    `The reference of atom '${atom}' is not found in resource '${resource}'.`,
    [atom, resource],
  );
}

export function fail(code: IssueCode, message: string, elements: readonly string[] = []): never {
  throw new GraphError(issue(code, message, elements));
}

/** Default reporter of loaders. */
export function warn(item: Issue): void {
  console.warn(`arguebuf: ${item.message}`);
}

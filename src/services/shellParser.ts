export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

export interface ParsedPipeline {
  commands: ParsedCommand[];
  redirectOutputFile?: string;
  appendOutput?: boolean;
}

export class ShellParser {
  /**
   * Parse a raw command string into a pipeline of commands and possible redirection.
   * Handles single quotes, double quotes, and pipe symbols safely without eval().
   */
  public static parse(input: string): ParsedPipeline {
    const trimmed = input.trim();
    if (!trimmed) {
      return { commands: [] };
    }

    // Check for redirection at the end: > or >>
    let redirectOutputFile: string | undefined;
    let appendOutput = false;
    let commandStream = trimmed;

    // Redirection detection (outside of quotes)
    const redirMatch = this.findRedirection(trimmed);
    if (redirMatch) {
      commandStream = redirMatch.before;
      redirectOutputFile = redirMatch.target;
      appendOutput = redirMatch.append;
    }

    // Split by pipe '|' respecting quotes
    const rawPipes = this.splitByPipe(commandStream);
    const commands: ParsedCommand[] = [];

    for (const rawPipe of rawPipes) {
      const tokens = this.tokenize(rawPipe);
      if (tokens.length > 0) {
        commands.push({
          command: tokens[0],
          args: tokens.slice(1),
          raw: rawPipe.trim(),
        });
      }
    }

    return {
      commands,
      redirectOutputFile,
      appendOutput,
    };
  }

  /**
   * Tokenize a single command line into arguments, respecting quotes and backslash escapes.
   */
  public static tokenize(cmdStr: string): string[] {
    const tokens: string[] = [];
    let currentToken = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;

    for (let i = 0; i < cmdStr.length; i++) {
      const char = cmdStr[i];

      if (escaped) {
        currentToken += char;
        escaped = false;
        continue;
      }

      if (char === '\\' && !inSingleQuote) {
        escaped = true;
        continue;
      }

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if ((char === ' ' || char === '\t') && !inSingleQuote && !inDoubleQuote) {
        if (currentToken.length > 0) {
          tokens.push(currentToken);
          currentToken = '';
        }
        continue;
      }

      currentToken += char;
    }

    if (currentToken.length > 0) {
      tokens.push(currentToken);
    }

    return tokens;
  }

  /**
   * Split string by pipe `|` only when outside quotes.
   */
  private static splitByPipe(str: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }

      if (char === '\\' && !inSingleQuote) {
        escaped = true;
        current += char;
        continue;
      }

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        current += char;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        current += char;
        continue;
      }

      if (char === '|' && !inSingleQuote && !inDoubleQuote) {
        parts.push(current);
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim().length > 0) {
      parts.push(current);
    }

    return parts;
  }

  /**
   * Find output redirection `>` or `>>` outside quotes.
   */
  private static findRedirection(str: string): { before: string; target: string; append: boolean } | null {
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;

    for (let i = str.length - 1; i >= 0; i--) {
      const char = str[i];

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }
      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (!inSingleQuote && !inDoubleQuote && !escaped) {
        if (char === '>') {
          const isAppend = i > 0 && str[i - 1] === '>';
          const splitIdx = isAppend ? i - 1 : i;
          const before = str.substring(0, splitIdx).trim();
          const target = str.substring(i + 1).trim();
          return { before, target, append: isAppend };
        }
      }
    }

    return null;
  }
}

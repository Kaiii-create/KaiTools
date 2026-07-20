declare module "diff-match-patch" {
  export type DiffOperation = number;

  export class diff_match_patch {
    diff_main(text1: string, text2: string, opt?: boolean): [number, string][];
    diff_cleanupSemantic(diffs: [number, string][]): void;
    diff_linesToChars_(
      text1: string,
      text2: string
    ): { chars1: string; chars2: string; lineArray: string[] };
    diff_charsToLines_(
      diffs: { chars1: string; chars2: string; lineArray: string[] }
    ): [number, string][];
  }

  export const diff_match_patch: {
    new (): diff_match_patch;
  };
}

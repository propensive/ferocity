export function outputToString(out: Buffer | string | null | undefined): string {
  return out instanceof Buffer ? out.toString('utf8') : out ? <string>out : '';
};
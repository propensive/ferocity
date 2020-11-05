import * as path from 'path';
import * as os from 'os';

export const ferocityDirectory = path.join(os.homedir(), '.ferocity');
export const javaDirectory = path.join(ferocityDirectory, 'java');
export const jabbaDirectory = path.join(ferocityDirectory, 'jabba');
export const furyDirectory = path.join(ferocityDirectory, 'fury');
export const furyBin = path.join(ferocityDirectory, 'fury', 'bin', 'fury');

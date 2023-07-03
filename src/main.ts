import * as core from '@actions/core'
import * as exec from '@actions/exec'

import { wait } from './wait'

interface StatusResult {
  Added: string[];
  Deleted: string[];
  Modified: string[];
  Unknown: string[];
}

function post(message: string, files: string[]) {
  if (files.length > 0) {
    core.startGroup(message);

    for (let file in files) {
      core.error(file)
    }
    core.endGroup();
  }
}

async function run(): Promise<void> {
  try {
    const path: string = core.getInput('path')
    core.debug(`Checking $path for changes`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    const result: StatusResult = {
      Added: [],
      Deleted: [],
      Modified: [],
      Unknown: [],
    };

    const options: exec.ExecOptions = {};
    options.listeners = {
      stdout: (data: Buffer) => {
        const line = data.toString();
        core.debug(line)
        const split = line.split(" ");

        if (split.length == 2) {
          if (split[0] == "M") {
            result.Modified.push(split[1]);
            return;
          }
          if (split[0] == "D") {
            result.Deleted.push(split[1]);
            return;
          }
          if (split[0] == "A") {
            result.Added.push(split[1]);
            return;
          }
        }

        result.Unknown.push(line);
      },
      stderr: (data: Buffer) => {
      }
    };

    await exec.exec("git", ['status', '--porcelain', '--', path], options)

    post("Modified files", result.Modified);
    post("Added files", result.Added);
    post("Removed files", result.Deleted);
    post("Unknown entries", result.Unknown);

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

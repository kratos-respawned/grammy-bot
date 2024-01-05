import { exec } from "child_process";
export function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        resolve(err.message);
      } else if (stderr) {
        resolve(stderr);
      } else {
        if (stdout.length === 0) resolve("Command executed successfully!");
        resolve(stdout);
      }
    });
  });
}

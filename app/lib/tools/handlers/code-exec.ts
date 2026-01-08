// lib/tools/handlers/code-exec.ts - Secure Python Executor
// Uses Ollama's code interpreter or vm2 sandbox - simplified here
type FunctionArguments = Record<string, any>;
import { NodeVM } from 'vm2'; // npm i vm2

export default async function code_exec(args: FunctionArguments) {
  const { code } = args as { code: string };
  
  // Secure sandbox for Python-like JS eval (extend with pyodide for real Python)
  const vm = new NodeVM({
    sandbox: { console },
    eval: false,
    wasm: false,
    require: { external: false }
  });
  
  try {
    const result = await vm.run(code);
    return { code, output: result ?? 'Executed successfully', error: null };
  } catch (error) {
    return { code, output: null, error: error instanceof Error ? error.message : String(error) };
  }
}
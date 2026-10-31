# Benchfox – Linux Performance Benchmarking Tool

Measures and compares CPU, memory and I/O performance of different programs.
Resource figures come straight from the kernel (`wait4` / `rusage`), so they cover the
program and every child process it spawns.

## Run the website
    pip install -r requirements.txt
    python3 app.py            # open http://127.0.0.1:5000

## Or use the command line
    python3 bench.py "python3 samples/cpu_work.py" "sleep 1" -n 5
    python3 bench.py "ls -R /usr" --json

## Metrics
wall time, user/system CPU time, peak RSS memory, disk I/O (512-byte blocks → MB),
voluntary/involuntary context switches, minor/major page faults. Each is averaged over N runs
(with min, max and standard deviation in the JSON output).

## Files
- bench.py – measurement engine + CLI
- app.py – Flask API (`/api/benchmark`, `/api/samples`)
- static/ – dashboard (HTML, CSS, JS; no external dependencies)
- samples/ – CPU, memory and I/O workloads to try

## Notes
- Linux only. The server listens on 127.0.0.1 because it executes the commands you enter.
- I/O counts only reads/writes that reach the block layer, so cached files may show 0.

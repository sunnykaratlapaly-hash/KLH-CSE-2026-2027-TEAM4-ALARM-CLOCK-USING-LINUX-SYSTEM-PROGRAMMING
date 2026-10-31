#!/usr/bin/env python3
"""Core benchmarking engine + CLI. Linux only (uses wait4 / rusage)."""
import os, sys, time, shlex, subprocess, statistics, json, argparse

def run_once(cmd, timeout=120):
    """Run one command, return resource usage measured by the kernel."""
    args = shlex.split(cmd)
    start = time.perf_counter()
    p = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        _, status, ru = _wait(p, timeout)
    except TimeoutError:
        p.kill(); os.wait4(p.pid, 0)
        raise
    wall = time.perf_counter() - start
    return {
        "wall_s": wall,
        "user_s": ru.ru_utime,
        "sys_s": ru.ru_stime,
        "cpu_s": ru.ru_utime + ru.ru_stime,
        "max_rss_mb": ru.ru_maxrss / 1024,      # KB on Linux
        "io_read_blocks": ru.ru_inblock,        # 512-byte blocks
        "io_write_blocks": ru.ru_oublock,
        "io_mb": (ru.ru_inblock + ru.ru_oublock) * 512 / 1048576,
        "ctx_voluntary": ru.ru_nvcsw,
        "ctx_involuntary": ru.ru_nivcsw,
        "minor_faults": ru.ru_minflt,
        "major_faults": ru.ru_majflt,
        "exit_code": os.waitstatus_to_exitcode(status),
    }

def _wait(p, timeout):
    deadline = time.time() + timeout
    while True:
        pid, status, ru = os.wait4(p.pid, os.WNOHANG)
        if pid:
            p.returncode = 0  # reaped manually
            return pid, status, ru
        if time.time() > deadline:
            raise TimeoutError(f"timed out after {timeout}s")
        time.sleep(0.005)

METRICS = ["wall_s", "cpu_s", "user_s", "sys_s", "max_rss_mb", "io_mb",
           "ctx_voluntary", "ctx_involuntary", "minor_faults", "major_faults"]

def benchmark(cmd, runs=5, timeout=120):
    samples = [run_once(cmd, timeout) for _ in range(runs)]
    out = {"command": cmd, "runs": runs, "exit_codes": [s["exit_code"] for s in samples]}
    for m in METRICS:
        vals = [s[m] for s in samples]
        out[m] = {"mean": statistics.mean(vals), "min": min(vals), "max": max(vals),
                  "stdev": statistics.stdev(vals) if len(vals) > 1 else 0.0}
    return out

def compare(commands, runs=5, timeout=120):
    results = []
    for c in commands:
        try:
            results.append(benchmark(c, runs, timeout))
        except (FileNotFoundError, PermissionError, TimeoutError, ValueError) as e:
            results.append({"command": c, "error": str(e)})
    ok = [r for r in results if "error" not in r]
    if ok:
        for key in ("wall_s", "cpu_s", "max_rss_mb", "io_mb"):
            best = min(r[key]["mean"] for r in ok)
            for r in ok:
                r.setdefault("relative", {})[key] = (r[key]["mean"] / best) if best else 1.0
    return results

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Compare CPU, memory and I/O of programs")
    ap.add_argument("commands", nargs="+", help='quoted commands, e.g. "python3 a.py"')
    ap.add_argument("-n", "--runs", type=int, default=5)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    res = compare(a.commands, a.runs)
    if a.json:
        print(json.dumps(res, indent=2)); sys.exit()
    print(f"{'command':32} {'wall(s)':>9} {'cpu(s)':>9} {'rss(MB)':>9} {'io(MB)':>9}")
    for r in res:
        if "error" in r: print(f"{r['command'][:32]:32} ERROR: {r['error']}"); continue
        print(f"{r['command'][:32]:32} {r['wall_s']['mean']:9.3f} {r['cpu_s']['mean']:9.3f} "
              f"{r['max_rss_mb']['mean']:9.1f} {r['io_mb']['mean']:9.2f}")

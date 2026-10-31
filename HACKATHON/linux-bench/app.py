"""Flask server: serves the dashboard and exposes the benchmark engine as an API."""
import os, sys
from flask import Flask, jsonify, request, send_from_directory
import bench

app = Flask(__name__, static_folder="static", static_url_path="")
HERE = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable

SAMPLES = [
    {"label": "CPU heavy (primes)",   "cmd": f"{PY} {HERE}/samples/cpu_work.py"},
    {"label": "Memory heavy (arrays)", "cmd": f"{PY} {HERE}/samples/mem_work.py"},
    {"label": "I/O heavy (files)",     "cmd": f"{PY} {HERE}/samples/io_work.py"},
    {"label": "Idle (sleep 1)",        "cmd": "sleep 1"},
]

@app.get("/")
def index():
    return send_from_directory("static", "index.html")

@app.get("/api/samples")
def samples():
    return jsonify(SAMPLES)

@app.post("/api/benchmark")
def run():
    body = request.get_json(force=True)
    cmds = [c.strip() for c in body.get("commands", []) if c.strip()]
    runs = max(1, min(int(body.get("runs", 3)), 20))
    if len(cmds) < 1 or len(cmds) > 8:
        return jsonify(error="Enter between 1 and 8 commands."), 400
    return jsonify(bench.compare(cmds, runs))

if __name__ == "__main__":
    # Bound to localhost on purpose: this app executes the commands you type.
    app.run(host="127.0.0.1", port=5000, debug=False)

import os, tempfile
chunk = os.urandom(1024 * 1024)
with tempfile.NamedTemporaryFile() as f:
    for _ in range(100):
        f.write(chunk)
    f.flush(); os.fsync(f.fileno())
    f.seek(0)
    while f.read(1024 * 1024): pass

data = [bytearray(1024 * 1024) for _ in range(150)]   # ~150 MB
for b in data: b[0] = 1
print(len(data))

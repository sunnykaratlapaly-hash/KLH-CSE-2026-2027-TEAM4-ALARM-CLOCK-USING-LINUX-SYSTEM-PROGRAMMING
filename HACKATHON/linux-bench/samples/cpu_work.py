n, c = 300000, 0
for i in range(2, n):
    if all(i % d for d in range(2, int(i ** 0.5) + 1)):
        c += 1
print(c)

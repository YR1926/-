"""单通道、步长1、无填充互相关；实践中常称卷积。"""
image = [[0, 0, 1, 1, 1] for _ in range(5)]
kernel = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]]
output = []
for row in range(3):
    result_row = []
    for col in range(3):
        value = 0
        for kr in range(3):
            for kc in range(3):
                value += image[row + kr][col + kc] * kernel[kr][kc]
        result_row.append(value)
    output.append(result_row)
for row in output:
    print(row)
assert output == [[3, 3, 0], [3, 3, 0], [3, 3, 0]]

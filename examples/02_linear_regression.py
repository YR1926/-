"""用全批量梯度下降拟合 y=2x+1；此整齐数据仅用于教学。"""
xs, ys = [0, 1, 2, 3], [1, 3, 5, 7]
w, b, learning_rate = 0.0, 0.0, 0.05
for step in range(1000):
    errors = [w * x + b - y for x, y in zip(xs, ys)]
    dw = 2 * sum(e * x for e, x in zip(errors, xs)) / len(xs)
    db = 2 * sum(errors) / len(xs)
    w -= learning_rate * dw
    b -= learning_rate * db
print(f'w={w:.3f}, b={b:.3f}')
print('预测：', [round(w * x + b, 3) for x in xs])
assert abs(w - 2) < 0.001 and abs(b - 1) < 0.001

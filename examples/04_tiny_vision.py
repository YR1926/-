"""从合成图像到线性学习：标准库即可运行的可解释小项目。

这不是 CNN；手工特征 + 线性分数 + MSE 用于连接前15课。
"""
import argparse
import csv
import json
import math
import random
from pathlib import Path


def make_dataset(count, seed):
    rng = random.Random(seed)
    samples = []
    for i in range(count):
        label = i % 2  # 0 横线，1 竖线
        position = rng.choice([1, 2, 3])
        image = []
        for row in range(5):
            image_row = []
            for col in range(5):
                on_line = (row == position) if label == 0 else (col == position)
                base = 0.8 if on_line else 0.1
                image_row.append(min(1.0, max(0.0, base + rng.uniform(-0.08, 0.08))))
            image.append(image_row)
        samples.append((image, label))
    return samples


def feature(image):
    # 竖线在左右方向产生较强变化；横线在上下方向产生较强变化。
    horizontal_change = sum(abs(image[r][c+1] - image[r][c]) for r in range(5) for c in range(4)) / 20
    vertical_change = sum(abs(image[r+1][c] - image[r][c]) for r in range(4) for c in range(5)) / 20
    return horizontal_change - vertical_change


def evaluate(dataset, w, b):
    pairs = [(feature(image), label) for image, label in dataset]
    errors = [(w*x+b-y)**2 for x, y in pairs]
    accuracy = sum(int(w*x+b >= 0.5) == y for x, y in pairs) / len(pairs)
    return {'mse': sum(errors)/len(errors), 'accuracy': accuracy, 'count': len(pairs)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--learning-rate', type=float, default=0.1)
    parser.add_argument('--steps', type=int, default=1000)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if not math.isfinite(args.learning_rate) or not 0 <= args.learning_rate <= 1:
        parser.error('本教学项目的 learning-rate 须在 0～1 之间')
    if not 1 <= args.steps <= 100000:
        parser.error('steps 须在 1～100000 之间')

    train = make_dataset(120, 101)
    valid = make_dataset(40, 202)
    test = make_dataset(40, 303)
    for image, label in train[:2]:
        print('\n类别：', '竖线' if label else '横线')
        for row in image:
            print(' '.join('#' if x > 0.5 else '.' for x in row))
    pairs = [(feature(image), label) for image, label in train]
    w, b = 0.0, 0.0
    initial = evaluate(train, w, b)
    for _ in range(args.steps):
        errors = [w*x+b-y for x,y in pairs]
        dw = 2*sum(e*x for e,(x,_) in zip(errors,pairs))/len(pairs)
        db = 2*sum(errors)/len(pairs)
        w -= args.learning_rate * dw
        b -= args.learning_rate * db
    report = {
        'task': '合成5×5横线/竖线分类；非真实场景评估',
        'seeds': {'train':101,'validation':202,'test':303},
        'learning_rate':args.learning_rate, 'steps':args.steps,
        'weight':w, 'bias':b, 'initial_train':initial,
        'train':evaluate(train,w,b), 'validation':evaluate(valid,w,b), 'test':evaluate(test,w,b),
        'limitations':'人工方向特征、合成同分布样本；连续分数不是概率，结果不能推论到真实物体。',
    }
    print('\n训练/验证/测试：120 / 40 / 40')
    print(f'初始训练MSE：{initial["mse"]:.6f} → 最终：{report["train"]["mse"]:.6f}')
    print(f'w={w:.4f}, b={b:.4f}')
    print(f'验证准确率：{report["validation"]["accuracy"]:.1%}')
    print(f'测试准确率：{report["test"]["accuracy"]:.1%}')
    print(report['limitations'])
    if args.output:
        args.output.mkdir(parents=True, exist_ok=True)
        (args.output/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        with (args.output/'scores.csv').open('w',newline='',encoding='utf-8-sig') as handle:
            writer=csv.writer(handle)
            writer.writerow(['test_index','feature','label','score','prediction'])
            for i,(image,label) in enumerate(test):
                x=feature(image);score=w*x+b
                writer.writerow([i,x,label,score,int(score>=0.5)])
        print('报告已保存到：',args.output.resolve())


if __name__ == '__main__':
    main()

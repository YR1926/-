# 多层感知机与表达能力

## 你会解决什么问题

★★★★★ 把线性层和激活组成可训练的非线性函数。

## 核心概念与计算

★★★★★ 两层MLP可写为 h=ReLU(XW1+b1)，z=hW2+b2。输入D维、隐藏H维、输出K维，参数数目为DH+H+HK+K。隐藏层宽度控制容量的一部分，不能只凭参数多就推断效果好。

★★★★ XOR数据中，同号输入属于一类、异号属于另一类，单一直线不能分开。带非线性隐藏层可表达弯折的边界。通用逼近性质不保证给定训练过程、数据量和网络宽度都能学好。

## 一次具体的推演

```python
import torch
model = torch.nn.Sequential(torch.nn.Linear(2, 8), torch.nn.ReLU(), torch.nn.Linear(8, 2))
print(sum(p.numel() for p in model.parameters()))  # 42
print(tuple(model(torch.zeros(4, 2)).shape))  # (4, 2)
```

## 自己试一试

★★★★ 先遮住答案复述上面的计算，再改变一个输入或超参数，写下预期结果。若结果不同，先检查公式、形状与数据划分，不只重复运行。

## 常见误区

- ★★★★★ 最后一层是否激活取决于任务与损失，不要机械加ReLU。
- ★★★★ 隐藏神经元没有预先指定的人类语义。

## 与计算机视觉的联系

★★★★ 视觉骨干输出的特征可接MLP头；Transformer中的前馈子层也与这种结构有关。

## PyTorch 与代码实践

★★★★ 本页对应可下载实现：`torch_foundations.py`。在页面的“代码实践”区查看完整脚本与运行方式。核心方法和教学简化在脚本注释中标明，默认使用 CPU，不下载数据集。

## 参考与编写说明

参考：[动手学深度学习：多层感知机](https://zh.d2l.ai/chapter_multilayer-perceptrons/mlp.html)，配套英文书籍 2023 年；在线章节持续更新；隐藏层、激活函数、ReLU；查阅于 2026-10-19。

参考：[PyTorch：Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html)，持续更新；无统一发布日期；张量、自动微分、数据加载与优化；查阅于 2026-10-19。

来源：依据上述资料的概念进行模型原创教学整理与算例编写，待教师审核。代码运行检查不等于教学效果验证。

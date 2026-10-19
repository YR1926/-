# 从 LeNet 到小型 CNN

## 你会解决什么问题

★★★★★ 把卷积、非线性与分类头组合成可训练模型。

## 核心概念与计算

一个小型CNN可以按“局部特征→空间压缩→更丰富特征→分类”组织。LeNet提供了这类经典思路，但本课脚本使用ReLU和最大池化，是教学小CNN，不是原始LeNet-5的逐层复现。

输入[N,1,16,16]，3×3卷积且padding1得到[N,8,16,16]，2×2池化得[N,8,8,8]，再卷积至16通道、池化得[N,16,4,4]。展平为[N,256]后用Linear输出[N,2] logits。CrossEntropyLoss直接接logits和整数类别，不先加softmax。

## 一次具体的推演

输入16×16包含一条横线或竖线，网络学习方向分类。随机位置和噪声让它不能只记住固定像素。训练集240、验证集80、测试集80；每轮只按验证损失保存最佳权重，所有选择结束后评估一次测试集。

examples/cnn_basics.py包含真正的mini-batch训练、model.train/eval切换、no_grad验证、最佳权重复制以及最终测试。脚本默认CPU、无需下载图片。它验证训练流程，不代表真实照片识别性能。

## PyTorch 最小实现

```python
import torch
from torch import nn
model = nn.Sequential(nn.Conv2d(1, 8, 3, padding=1), nn.ReLU(),
    nn.MaxPool2d(2), nn.Conv2d(8, 16, 3, padding=1), nn.ReLU(),
    nn.MaxPool2d(2), nn.Flatten(), nn.Linear(16*4*4, 2))
assert model(torch.zeros(4, 1, 16, 16)).shape == (4, 2)
print(sum(p.numel() for p in model.parameters()))
```

完整小CNN训练见页面代码面板cnn_basics.py；本页短代码只验证当前概念，不代表所有架构的完整训练。

## 自己试一试

★★★★ 改变算例中的一个尺寸或配置，先写出预测，再执行代码核对。用自己的话解释输出为什么变化，并指出哪些参数或统计量没有变化。

## 常见误区

- ★★★★ 不要用测试集挑epoch或学习率。
- ★★★★ 看到loss下降后还要核对标签、样本拆分和简单基线。
- ★★★★ 展平前维度变化会导致Linear输入特征数不匹配。

## 与计算机视觉的联系

这个流程是更大视觉模型的基本骨架。把合成数据替换成真实数据时，需要重新审查划分、标签质量、增强和指标。

## 参考与编写说明

参考：[PyTorch：Optimizing Model Parameters](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html)，持续更新；无统一发布日期；查阅于2026-10-19。

来源：依据上述资料的概念进行模型原创教学整理，算例为教学简化，待教师审核。

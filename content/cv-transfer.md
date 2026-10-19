# 迁移学习与微调

## 你会解决什么问题

★★★★★ 设置冻结层、学习率与训练/验证协议。

## 核心概念与计算

迁移学习把源任务得到的表示用于新任务。冻结特征提取器时，只训练新的分类头；微调则允许部分或全部预训练参数更新，通常给已有层更小的学习率。数据少时先建立冻结基线，再根据验证结果考虑逐层解冻。

requires_grad=False禁止参数梯度，但不等于model.eval()。BatchNorm的运行统计是buffer，不因冻结参数自动停止更新；Dropout也仍受train/eval模式影响。冻结主干时通常让主干eval、分类头train；解冻后重新确认优化器包含需要更新的参数。

## 一次具体的推演

假设预训练主干输出512维，新任务有3类，则新Linear头含512×3+3=1539参数。主干冻结后这些参数仍参与前向，只是不参与参数更新。

下面代码演示冻结和梯度检查，主干随机初始化，刻意不下载权重，因此不能宣称得到了预训练迁移效果。真实迁移实验需要选定权重来源、对应预处理，并与从头训练的公平基线比较。

## PyTorch 最小实现

```python
import torch
from torch import nn
backbone = nn.Sequential(nn.Linear(4, 8), nn.ReLU())
for p in backbone.parameters():
    p.requires_grad_(False)
head = nn.Linear(8, 3)
backbone.eval(); head.train()
loss = nn.functional.cross_entropy(head(backbone(torch.randn(5, 4))),
    torch.tensor([0, 1, 2, 0, 1]))
loss.backward()
assert all(p.grad is None for p in backbone.parameters())
assert head.weight.grad is not None
print("Frozen backbone; head receives gradients.")
```

完整小CNN训练见页面代码面板cnn_basics.py；本页短代码只验证当前概念，不代表所有架构的完整训练。

## 自己试一试

★★★★ 改变算例中的一个尺寸或配置，先写出预测，再执行代码核对。用自己的话解释输出为什么变化，并指出哪些参数或统计量没有变化。

## 常见误区

- ★★★★ 随机初始化后冻结的网络不能冒充预训练迁移学习。
- ★★★★ 预训练不保证适合所有领域，可能出现负迁移。
- ★★★★ 冻结参数与冻结BatchNorm统计不是一件事。

## 与计算机视觉的联系

小样本视觉项目常从预训练骨干起步。比较时记录来源数据、权重版本、解冻层和验证协议，评估领域偏移与数据重叠风险。

## 参考与编写说明

参考：[PyTorch：Transfer Learning for Computer Vision Tutorial](https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html)，持续更新；无统一发布日期；查阅于2026-10-19。

来源：依据上述资料的概念进行模型原创教学整理，算例为教学简化，待教师审核。

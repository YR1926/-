# Softmax、交叉熵与 logits

## 你会解决什么问题

★★★★★ 区分模型分数、概率分布和分类目标。

## 核心概念与计算

★★★★★ Softmax将K个logit z_i 转成 exp(z_i)/Σexp(z_j)。减去最大logit不会改变结果，可改善数值稳定性。硬标签交叉熵等于真实类负对数概率；PyTorch CrossEntropyLoss直接接收logits，不要求先softmax。

★★★★ 对(N,K)输出，目标类别索引一般是(N,) long，取值0至K-1。二分类既可用两个logit加CrossEntropyLoss，也可用一个logit加BCEWithLogitsLoss，但不要混用标签形状。

## 一次具体的推演

```python
import torch
logits = torch.tensor([[0., 0.]])
target = torch.tensor([1])
loss = torch.nn.functional.cross_entropy(logits, target)
print(round(loss.item(), 3))  # 0.693
```

## 自己试一试

★★★★ 先遮住答案复述上面的计算，再改变一个输入或超参数，写下预期结果。若结果不同，先检查公式、形状与数据划分，不只重复运行。

## 常见误区

- ★★★★★ CE前再次softmax会改变优化问题。
- ★★★★ Softmax分布不自动校准，对陌生图像也可能非常自信。

## 与计算机视觉的联系

★★★★ 多类图像分类使用类别概率；多标签识别通常不是对全部类别做一个互斥softmax。

## PyTorch 与代码实践

★★★★ 本页对应可下载实现：`torch_foundations.py`。在页面的“代码实践”区查看完整脚本与运行方式。核心方法和教学简化在脚本注释中标明，默认使用 CPU，不下载数据集。

## 参考与编写说明

参考：[PyTorch：Optimizing Model Parameters](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html)，持续更新；无统一发布日期；zero_grad、backward、step 与 train/test loop；查阅于 2026-10-19。

来源：依据上述资料的概念进行模型原创教学整理与算例编写，待教师审核。代码运行检查不等于教学效果验证。

# 自动微分与反向传播

## 你会解决什么问题

★★★★★ 连接计算图、叶子参数和梯度累积，正确完成一次更新。

## 核心概念与计算

★★★★★ 对需要求导的张量设置requires_grad，前向运算构建计算图，标量loss.backward()把导数累积到叶子张量的.grad。优化器.step()才根据梯度更新参数，两步不能混同。

★★★★ 多次backward默认累积梯度，因此常在新一轮更新前zero_grad。`torch.no_grad()`用于不需要构建计算图的推理和目标计算；`detach()`得到与原图断开的视图，但不保证复制底层存储。

## 一次具体的推演

```python
import torch
w = torch.tensor(1., requires_grad=True)
loss = (2 * w - 3) ** 2
loss.backward()
print(w.grad.item())  # -4.0
with torch.no_grad():
    w -= 0.1 * w.grad
print(round(w.item(), 2))  # 1.4
```

## 自己试一试

★★★★ 先遮住答案复述上面的计算，再改变一个输入或超参数，写下预期结果。若结果不同，先检查公式、形状与数据划分，不只重复运行。

## 常见误区

- ★★★★★ 不对需要梯度的参数随意原地修改；参数更新交给优化器。
- ★★★★ `.eval()`不会关闭梯度；推理通常还需no_grad或inference_mode。

## 与计算机视觉的联系

★★★★ 冻结视觉主干与训练分类头时，需要明确哪些参数求梯度，哪些模块改变训练/推理行为。

## PyTorch 与代码实践

★★★★ 本页对应可下载实现：`torch_foundations.py`。在页面的“代码实践”区查看完整脚本与运行方式。核心方法和教学简化在脚本注释中标明，默认使用 CPU，不下载数据集。

## 参考与编写说明

参考：[PyTorch：Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html)，持续更新；无统一发布日期；张量、自动微分、数据加载与优化；查阅于 2026-10-19。

参考：[PyTorch：Optimizing Model Parameters](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html)，持续更新；无统一发布日期；zero_grad、backward、step 与 train/test loop；查阅于 2026-10-19。

来源：依据上述资料的概念进行模型原创教学整理与算例编写，待教师审核。代码运行检查不等于教学效果验证。

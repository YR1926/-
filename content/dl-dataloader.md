# Dataset、DataLoader 与批次

## 你会解决什么问题

★★★★★ 建立可追踪的数据到模型的管道。

## 核心概念与计算

★★★★★ Dataset定义如何按索引获得一个样本；DataLoader把样本组成批次，控制打乱、工作进程和最后一批。训练通常打乱，验证通常保持确定性。随机增强只能作用于合理的训练流程，不能偷偷改变标签含义。

★★★★ TensorDataset适合已在内存的张量。真实图像通常按路径读取。Windows下多进程DataLoader需注意main入口；本库CPU小例子用num_workers=0，减少新环境复杂度。

## 一次具体的推演

```python
import torch
from torch.utils.data import TensorDataset, DataLoader
x = torch.arange(10, dtype=torch.float32).reshape(5, 2)
y = torch.tensor([0, 1, 0, 1, 0])
loader = DataLoader(TensorDataset(x, y), batch_size=2, shuffle=False)
print([len(labels) for _, labels in loader])  # [2, 2, 1]
```

## 自己试一试

★★★★ 先遮住答案复述上面的计算，再改变一个输入或超参数，写下预期结果。若结果不同，先检查公式、形状与数据划分，不只重复运行。

## 常见误区

- ★★★★★ 指标汇总须按实际样本数加权，不能简单平均大小不同批次的准确率。
- ★★★★ 数据划分先于拟合预处理；训练和测试共享归一化参数不是共享拟合数据。

## 与计算机视觉的联系

★★★★ 记录图像、标签和样本ID的对应关系，避免增强或排序后错位。

## PyTorch 与代码实践

★★★★ 本页对应可下载实现：`torch_foundations.py`。在页面的“代码实践”区查看完整脚本与运行方式。核心方法和教学简化在脚本注释中标明，默认使用 CPU，不下载数据集。

## 参考与编写说明

参考：[PyTorch：Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html)，持续更新；无统一发布日期；张量、自动微分、数据加载与优化；查阅于 2026-10-19。

来源：依据上述资料的概念进行模型原创教学整理与算例编写，待教师审核。代码运行检查不等于教学效果验证。

# PyTorch：从算法到可运行实验

默认已会Python。主线关注数学、机器学习与深度学习；强化学习脚本属于第三轮选修。所有任务使用CPU和人工数据，不下载数据集或预训练权重。

## ★★★★★ 环境

学习网页无需Python/torch。执行算法需要Python和PyTorch，请按 [官方安装选择器](https://pytorch.org/get-started/locally/) 选择系统、包管理器与CPU配置；首次安装需联网。实际验证为Python 3.13.7、torch 2.12.0+cpu。

```text
python -c "import torch; print(torch.__version__)"
```

以下命令在examples目录运行。

## ★★★★★ 第一轮与第二轮实现

- ★★★★★ `python torch_ml.py --task all`：线性回归、逻辑回归、kNN、K-means、PCA，也可用 `--task logistic` 单独运行。
- ★★★★★ `python torch_foundations.py`：自动微分、卷积形状与MLP训练/验证/测试；人工二维非线性分类。
- ★★★★★ `python cnn_basics.py --seed 7`：小CNN横竖线图像分类，训练240、验证80、测试80；训练统计归一化、mini-batch、验证选权重、最终测试。附通道参数量、投影残差、冻结梯度检查。

CNN采用ReLU/最大池化的教学网络，不是原版LeNet-5、完整ResNet或预训练迁移实验；冻结示例使用随机权重，只证明梯度边界，不能证明迁移效果。

## ★★★★★ 观察和练习

- ★★★★★ 线性回归w接近2、b接近1；kNN预测[0,1]；K-means中心[1,9]；PCA把4×2压到4×1并重建。
- ★★★★★ 拟合统计量只看训练集，验证集选权重，测试集仅在选择结束后评估。检查形状、dtype、标签和划分，不只看loss。
- ★★★★★ CNN输入[N,1,16,16]，输出[N,2] logits，CrossEntropyLoss前不做softmax。换种子、噪声强度或模型大小，记录变化；不要反复依据测试分数调参。
- ★★★★ 练习预测卷积输出尺寸和参数量，再运行代码；修改stride时同步修改残差捷径。

## ★★★★ 第三轮选修实现

- ★★★★ `python q_learning.py`：表格Q-learning五状态走廊，只用标准库。
- ★★★★ `python dqn_torch.py --seed 17`：小DQN，含经验回放、目标网络、终止掩码与评估；需同目录q_learning.py。
- ★★★★ `python policy_torch.py --seed 17`：REINFORCE小训练和PPO裁剪目标检查；需同目录q_learning.py。PPO没有rollout、GAE和critic训练，不能称为完整复现。

表格Q/DQN应学到2→3→4。真正终止不加后继价值，采样超时截断仍bootstrap。REINFORCE是有限时域任务，剩余时间并入观测，到时结束为任务终止。PPO正负优势算例约为2.4与-1.6。

## ★★★★ 三个纯Python数值例子

02_linear_regression.py手写梯度下降，03_convolution.py互相关计算，04_tiny_vision.py合成横竖线特征分类。它们用于理解算法，不承担Python语言教学。

## ★★★★★ 实验边界

人工任务很简单，100%准确率不能作为真实视觉性能证据。记录数据机制、种子、模型和预算。树模型正文解释分裂与集成，不提供“Linear层代替决策树”的误导代码。

参考：各正文中的PyTorch官方教程、D2L、scikit-learn、Spinning Up，持续更新；查阅于2026-10-19。脚本与教学算例为本项目整理，待教师审核。

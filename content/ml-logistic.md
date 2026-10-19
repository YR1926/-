# 逻辑回归与二分类损失

## 你会解决什么问题

★★★★★ 把线性分数转换成二分类概率模型，并用稳定的损失训练。

## 核心概念与计算

★★★★★ z=w·x+b 称为logit，sigmoid(z)=1/(1+exp(-z)) 得到模型给正类的概率p。二元交叉熵为 -[y log p+(1-y)log(1-p)]。预测阈值0.5对应z=0，但最佳阈值由应用与验证协议决定。

★★★★ PyTorch的BCEWithLogitsLoss直接接收logit，内部用数值稳定形式组合sigmoid和损失。目标通常为float，形状须与输出一致，例如都为(N,1)。推理时才用sigmoid转换概率。

## 一次具体的推演

z=0时p=0.5；正类样本的损失为-log(0.5)≈0.693。z≈2.197时p≈0.9，正类损失约0.105；同样预测若真实是负类，损失约2.303。自信地犯错会受到更大代价。

## 自己试一试

★★★★ 先遮住答案复述上面的计算，再改变一个输入或超参数，写下预期结果。若结果不同，先检查公式、形状与数据划分，不只重复运行。

## 常见误区

- ★★★★★ 不先sigmoid再送入BCEWithLogitsLoss。
- ★★★★ 名称含“回归”，通常仍用于分类；线性边界不能直接表达XOR。

## 与计算机视觉的联系

★★★★ 可作为冻结视觉特征后的线性探针，也可用于二分类检测头的某些形式。

## PyTorch 与代码实践

★★★★ 本页对应可下载实现：`torch_ml.py`。在页面的“代码实践”区查看完整脚本与运行方式。核心方法和教学简化在脚本注释中标明，默认使用 CPU，不下载数据集。

## 参考与编写说明

参考：[PyTorch：Optimizing Model Parameters](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html)，持续更新；无统一发布日期；zero_grad、backward、step 与 train/test loop；查阅于 2026-10-19。

参考：[scikit-learn：模型评估指标](https://scikit-learn.org/stable/modules/model_evaluation.html)，持续更新；无统一发布日期；混淆矩阵、precision、recall、F1 与评价目标；查阅于 2026-10-19。

来源：依据上述资料的概念进行模型原创教学整理与算例编写，待教师审核。代码运行检查不等于教学效果验证。

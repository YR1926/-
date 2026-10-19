"""Verify teaching algorithms on CPU. Requires torch; optional JSON output."""
import argparse
import json
import math
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'examples'))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    try:
        import torch
        import torch_ml,torch_foundations,q_learning,dqn_torch,policy_torch,cnn_basics
    except ImportError as e:
        raise SystemExit('PyTorch is required for algorithm verification; browser reading does not need it. '+str(e))
    torch.set_num_threads(1)
    assert q_learning.transition(3,1)==(4,1.0,True)
    assert q_learning.transition(2,1)==(3,-.02,False)
    assert abs((.4+.2*(1+.9*.5-.4))-.61)<1e-12
    assert abs((.4+.2*(1-.4))-.52)<1e-12
    assert torch_ml.knn()['prediction']==[0,1]
    assert torch_ml.kmeans()['centers']==[1.,9.]
    assert torch_ml.pca()['reconstruction_mse']<1e-10
    policy_target=policy_torch.ppo_clip_check()
    assert abs(policy_target['objective'][0]-2.4)<1e-5
    assert abs(policy_target['objective'][1]+1.6)<1e-5
    results=[]
    for seed in [7,17,29]:
        linear=torch_ml.linear(seed);classification=torch_ml.logistic(seed)
        network=torch_foundations.run(seed);table=q_learning.train(seed)
        dqn=dqn_torch.run(seed);policy=policy_torch.run(seed)
        cnn=cnn_basics.run(seed)
        assert cnn['final_train_ce'] < cnn['initial_train_ce']
        assert cnn['validation_accuracy'] >= .9 and cnn['test_accuracy'] >= .9
        assert cnn['conv_shape'] == [2,8,4,4] and cnn['conv_parameters'] == 224
        assert cnn['residual_shape'] == [2,16,8,8] and cnn['freeze_gradient_check']
        assert abs(linear['w']-2)<1e-4 and abs(linear['b']-1)<1e-4
        assert classification['final_bce']<classification['initial_bce']
        assert classification['test_accuracy']>=.85
        assert network['autograd_dw']==-4 and network['conv_shape']==[4,2,3,3]
        assert network['test_accuracy']>=.85
        assert table['greedy_path']==[2,3,4]
        assert dqn['greedy_path']==[2,3,4] and dqn['target_gradients_absent']
        assert abs(dqn['q'][2][1]-.93)<.08
        assert policy['stochastic_evaluation']['success_rate']>=.8
        assert policy['greedy_evaluation']['success_rate']==1
        results.append(dict(seed=seed,linear=linear,logistic=classification,mlp=network,cnn=cnn,q_learning=table,dqn=dqn,policy=policy))
        print('PASS seed',seed,flush=True)
    for name in ['02_linear_regression.py','03_convolution.py','04_tiny_vision.py']:
        result=subprocess.run([sys.executable,'-X','utf8',str(ROOT/'examples'/name)],capture_output=True,text=True,encoding='utf-8',timeout=30)
        assert result.returncode==0,(name,result.stderr)
    version=json.loads((ROOT/'curriculum.json').read_text(encoding='utf-8'))['version']
    report=dict(version=version,date='2026-10-19',python=sys.version,torch=torch.__version__,device='cpu',seeds=[7,17,29],results=results,scope='Synthetic educational tasks; not real-world evaluation or teacher review.')
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print('PASS: ML, autograd, train/validation/test, tabular Q, DQN, REINFORCE, PPO objective and legacy numeric examples.')


if __name__=='__main__':main()

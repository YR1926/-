"""Small but complete DQN: replay, target network, terminal mask and greedy eval.
Run: python dqn_torch.py --seed 7
Only torch is required. Environment is defined in sibling q_learning.py.
"""
import argparse
import copy
import json
import random
from collections import deque
import torch
from torch import nn
from q_learning import transition


def run(seed=7,episodes=220):
    torch.set_num_threads(1);torch.manual_seed(seed);rng=random.Random(seed)
    eye=torch.eye(5)
    online=nn.Sequential(nn.Linear(5,24),nn.ReLU(),nn.Linear(24,2))
    target=copy.deepcopy(online).eval()
    for p in target.parameters():p.requires_grad_(False)
    optimizer=torch.optim.Adam(online.parameters(),lr=.003)
    replay=deque(maxlen=2000);updates=0;losses=[];gamma=.95
    for ep in range(episodes):
        state=2;epsilon=max(.05,1-ep/150)
        for step in range(30):
            with torch.no_grad():greedy=int(online(eye[state]).argmax())
            action=rng.randrange(2) if rng.random()<epsilon else greedy
            nxt,reward,terminated=transition(state,action)
            replay.append((state,action,reward,nxt,terminated))
            if len(replay)>=32:
                batch=rng.sample(list(replay),32)
                ss,aa,rr,ns,tt=zip(*batch)
                actions=torch.tensor(aa).reshape(-1,1)
                prediction=online(eye[list(ss)]).gather(1,actions).squeeze(1)
                with torch.no_grad():
                    future=target(eye[list(ns)]).max(dim=1).values
                    goal=torch.tensor(rr)+gamma*(~torch.tensor(tt))*future
                assert prediction.shape==goal.shape==(32,)
                loss=nn.functional.smooth_l1_loss(prediction,goal)
                optimizer.zero_grad();loss.backward();nn.utils.clip_grad_norm_(online.parameters(),5.);optimizer.step()
                losses.append(loss.item());updates+=1
                if updates%40==0:target.load_state_dict(online.state_dict())
            state=nxt
            if terminated:break
            # Hitting the cap only ends sampling; transitions still bootstrap.
    online.eval();state=2;path=[2];total=0
    with torch.no_grad():
        for _ in range(30):
            action=int(online(eye[state]).argmax())
            state,reward,done=transition(state,action);path.append(state);total+=reward
            if done:break
        values=online(eye).tolist()
    return dict(seed=seed,updates=updates,last_loss=losses[-1],greedy_path=path,greedy_return=total,success=state==4,q=values,target_gradients_absent=all(p.grad is None for p in target.parameters()),scope='One-hot state DQN, no CNN; no Atari/Gym benchmark claim.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--seed',type=int,default=7)
    print(json.dumps(run(parser.parse_args().seed),indent=2))

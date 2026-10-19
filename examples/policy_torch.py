"""Complete REINFORCE on a finite-horizon corridor + PPO-Clip arithmetic check.

State includes position AND steps remaining, because timeout is a true finite-
horizon terminal condition here. PPO check is not a complete PPO trainer.
"""
import argparse
import json
import torch
from torch import nn
from torch.distributions import Categorical
from q_learning import transition


def ppo_clip_check():
    ratio=torch.tensor([1.5,.5],requires_grad=True)
    advantage=torch.tensor([2.,-2.])
    objective=torch.minimum(ratio*advantage,ratio.clamp(.8,1.2)*advantage)
    loss=-objective.mean();loss.backward()
    return dict(objective=objective.detach().tolist(),loss=loss.item(),ratio_grad=ratio.grad.tolist(),scope='Clipped surrogate only; not PPO rollout/GAE/critic training.')


def run(seed=7,epochs=140):
    torch.set_num_threads(1);torch.manual_seed(seed)
    policy=nn.Sequential(nn.Linear(6,16),nn.Tanh(),nn.Linear(16,2))
    optimizer=torch.optim.Adam(policy.parameters(),lr=.015)
    gamma=.95;horizon=12;eye=torch.eye(5)
    def observation(state,t):return torch.cat([eye[state],torch.tensor([(horizon-t)/horizon])])
    history=[]
    for _ in range(epochs):
        # Sum per trajectory; then average across trajectories, not mixed steps.
        trajectory_losses=[];episode_returns=[]
        for episode in range(12):
            state=2;logs=[];rewards=[]
            for t in range(horizon):
                distribution=Categorical(logits=policy(observation(state,t)))
                action=distribution.sample();logs.append(distribution.log_prob(action))
                state,reward,done=transition(state,int(action));rewards.append(reward)
                if done:break
            ret=0.;returns=[]
            for reward in reversed(rewards):ret=reward+gamma*ret;returns.insert(0,ret)
            weights=torch.tensor([gamma**t*g for t,g in enumerate(returns)])
            trajectory_losses.append(-(torch.stack(logs)*weights.detach()).sum())
            episode_returns.append(sum(rewards))
        loss=torch.stack(trajectory_losses).mean()
        optimizer.zero_grad();loss.backward();nn.utils.clip_grad_norm_(policy.parameters(),5.);optimizer.step()
        history.append(sum(episode_returns)/len(episode_returns))
    def evaluate(stochastic):
        success=0;rewards=[]
        with torch.no_grad():
            for episode in range(100):
                state=2;total=0
                for t in range(horizon):
                    logits=policy(observation(state,t))
                    action=int(Categorical(logits=logits).sample()) if stochastic else int(logits.argmax())
                    state,reward,done=transition(state,action);total+=reward
                    if done:break
                success+=state==4;rewards.append(total)
        return dict(success_rate=success/100,mean_return=sum(rewards)/100)
    return dict(seed=seed,first_batch_return=history[0],last_batch_return=history[-1],stochastic_evaluation=evaluate(True),greedy_evaluation=evaluate(False),ppo_clip=ppo_clip_check(),scope='Finite-horizon synthetic corridor; PPO section only checks its objective.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--seed',type=int,default=7)
    print(json.dumps(run(parser.parse_args().seed),indent=2))

"""Tabular Q-learning in a 5-state corridor; standard library only.

0 = terminal failure (-1), 4 = terminal success (+1), start at 2.
Nonterminal steps cost -0.02. The rollout cap is truncation, not termination.
"""
import argparse
import json
import random


def transition(state,action):
    if state not in (1,2,3):raise ValueError('Cannot step terminal state')
    if action not in (0,1):raise ValueError('Action must be left=0 or right=1')
    next_state=max(0,min(4,state+(-1 if action==0 else 1)))
    terminated=next_state in (0,4)
    reward=1.0 if next_state==4 else -1.0 if next_state==0 else -.02
    return next_state,reward,terminated


def train(seed=7,episodes=500):
    rng=random.Random(seed);q=[[0.,0.] for _ in range(5)]
    gamma=.95;alpha=.2
    for episode in range(episodes):
        state=2;epsilon=max(.05,1-episode/350)
        for _ in range(30):
            greedy=[i for i,v in enumerate(q[state]) if v==max(q[state])]
            action=rng.randrange(2) if rng.random()<epsilon else rng.choice(greedy)
            nxt,reward,terminated=transition(state,action)
            target=reward+(0 if terminated else gamma*max(q[nxt]))
            q[state][action]+=alpha*(target-q[state][action])
            state=nxt
            if terminated:break
    state=2;path=[state];total=0
    for _ in range(30):
        action=max(range(2),key=lambda a:q[state][a])
        state,reward,done=transition(state,action);path.append(state);total+=reward
        if done:break
    return dict(seed=seed,q=q,greedy_path=path,greedy_return=total,success=state==4,scope='Tiny deterministic state environment; not visual navigation.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--seed',type=int,default=7)
    print(json.dumps(train(parser.parse_args().seed),indent=2))

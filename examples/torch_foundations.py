"""Tensors, autograd, CNN shape check, and complete train/validation/test loop.
Run: python torch_foundations.py --seed 7
"""
import argparse
import copy
import json
import torch
from torch import nn
from torch.utils.data import TensorDataset,DataLoader


def run(seed=7):
    torch.set_num_threads(1);torch.manual_seed(seed)
    w=torch.tensor(1.,requires_grad=True)
    ((2*w-3)**2).backward()
    derivative=w.grad.item()
    conv=nn.Conv2d(1,2,kernel_size=3,bias=False)
    conv_shape=list(conv(torch.zeros(4,1,5,5)).shape)
    gen=torch.Generator().manual_seed(seed)
    x=torch.randn(400,2,generator=gen)
    y=(x[:,0]*x[:,1]>0).long()  # XOR-like task: needs nonlinear boundary.
    train=x[:240];mean=train.mean(0);std=train.std(0).clamp_min(1e-6)
    x=(x-mean)/std
    loader=DataLoader(TensorDataset(x[:240],y[:240]),batch_size=32,shuffle=True,generator=gen,num_workers=0)
    model=nn.Sequential(nn.Linear(2,24),nn.ReLU(),nn.Linear(24,2))
    loss_fn=nn.CrossEntropyLoss();opt=torch.optim.Adam(model.parameters(),lr=.02)
    initial=loss_fn(model(x[:240]),y[:240]).item()
    best=float('inf');best_epoch=-1;weights=None
    for epoch in range(100):
        model.train()
        for xb,yb in loader:
            logits=model(xb)
            assert logits.shape==(len(yb),2) and yb.dtype==torch.long
            loss=loss_fn(logits,yb)
            opt.zero_grad();loss.backward();opt.step()
        model.eval()
        with torch.no_grad():val=loss_fn(model(x[240:320]),y[240:320]).item()
        if val<best:best=val;best_epoch=epoch;weights=copy.deepcopy(model.state_dict())
    model.load_state_dict(weights);model.eval()
    with torch.no_grad():
        final=loss_fn(model(x[:240]),y[:240]).item()
        acc=(model(x[320:]).argmax(1)==y[320:]).float().mean().item()
    return dict(seed=seed,autograd_dw=derivative,conv_shape=conv_shape,initial_train_ce=initial,final_train_ce=final,best_validation_ce=best,best_epoch=best_epoch,test_accuracy=acc,counts=[240,80,80],scope='Synthetic XOR-like data; CNN is a shape check, not CNN training.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--seed',type=int,default=7)
    print(json.dumps(run(parser.parse_args().seed),indent=2))

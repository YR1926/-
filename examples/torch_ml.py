"""CPU-only ML laboratory: python torch_ml.py --task all

Pure PyTorch; generated data, no downloads. kNN/K-means/PCA do not need autograd.
"""
import argparse
import json
import torch
from torch import nn


def linear(seed=7):
    torch.manual_seed(seed)
    x=torch.linspace(-1,1,80).reshape(-1,1)
    y=2*x+1
    model=nn.Linear(1,1)
    opt=torch.optim.SGD(model.parameters(),lr=0.15)
    first=nn.functional.mse_loss(model(x),y).item()
    for _ in range(160):
        loss=nn.functional.mse_loss(model(x),y)
        opt.zero_grad();loss.backward();opt.step()
    with torch.no_grad():final=nn.functional.mse_loss(model(x),y).item()
    return dict(initial_mse=first,final_mse=final,w=model.weight.item(),b=model.bias.item())


def logistic(seed=7):
    gen=torch.Generator().manual_seed(seed)
    def make(n):
        x=torch.randn(n,2,generator=gen)
        y=(x[:,0]+0.6*x[:,1]>0).float().reshape(-1,1)
        return x,y
    train,y=make(200);valid,yv=make(80);test,yt=make(100)
    # Fit preprocessing only on training data.
    mean,std=train.mean(0),train.std(0).clamp_min(1e-6)
    train,valid,test=[(x-mean)/std for x in (train,valid,test)]
    torch.manual_seed(seed)
    model=nn.Linear(2,1);opt=torch.optim.AdamW(model.parameters(),lr=.05,weight_decay=.01)
    loss_fn=nn.BCEWithLogitsLoss()
    initial=loss_fn(model(train),y).item();best=float('inf');weights=None
    for _ in range(160):
        loss=loss_fn(model(train),y)
        opt.zero_grad();loss.backward();opt.step()
        with torch.no_grad():v=loss_fn(model(valid),yv).item()
        if v<best:best=v;weights={k:v.detach().clone() for k,v in model.state_dict().items()}
    model.load_state_dict(weights);model.eval()
    with torch.no_grad():
        pred=model(test).sigmoid()>=.5;truth=yt.bool()
        tp=int((pred&truth).sum());fp=int((pred&~truth).sum());fn=int((~pred&truth).sum())
        final=loss_fn(model(train),y).item()
    return dict(initial_bce=initial,final_bce=final,validation_bce=best,test_accuracy=(pred==truth).float().mean().item(),tp=tp,fp=fp,fn=fn,precision=tp/max(tp+fp,1),recall=tp/max(tp+fn,1))


def knn():
    train=torch.tensor([[0.],[1.],[4.],[5.]])
    labels=torch.tensor([0,0,1,1]);query=torch.tensor([[1.2],[4.2]])
    # cdist is query_count x train_count; labels are never taken from test points.
    distances=torch.cdist(query,train)
    nearest=distances.topk(3,largest=False).indices
    prediction=labels[nearest].mode(dim=1).values
    return dict(neighbors=nearest.tolist(),prediction=prediction.tolist())


def kmeans():
    x=torch.tensor([[0.],[2.],[8.],[10.]])
    centers=x[[0,2]].clone()
    history=[]
    for _ in range(5):
        assignment=torch.cdist(x,centers).argmin(1)
        # Retain old center for an empty cluster; this policy is explicit.
        centers=torch.stack([x[assignment==k].mean(0) if (assignment==k).any() else centers[k] for k in range(2)])
        history.append(centers.flatten().tolist())
    return dict(centers=centers.flatten().tolist(),assignments=assignment.tolist(),history=history)


def pca():
    x=torch.tensor([[0.,0.],[1.,2.],[2.,4.],[3.,6.]])
    mean=x.mean(0);centered=x-mean
    _,singular,vh=torch.linalg.svd(centered,full_matrices=False)
    basis=vh[:1].T
    z=centered@basis;reconstructed=z@basis.T+mean
    return dict(projected_shape=list(z.shape),variance_ratio=(singular[0]**2/singular.square().sum()).item(),reconstruction_mse=(reconstructed-x).square().mean().item())


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--task',choices=['all','linear','logistic','knn','kmeans','pca'],default='all')
    parser.add_argument('--seed',type=int,default=7)
    args=parser.parse_args();torch.set_num_threads(1)
    functions={'linear':lambda:linear(args.seed),'logistic':lambda:logistic(args.seed),'knn':knn,'kmeans':kmeans,'pca':pca}
    result={k:f() for k,f in functions.items() if args.task in ('all',k)}
    print(json.dumps({'torch':torch.__version__,'seed':args.seed,'results':result,'scope':'Generated tiny data; no real-world performance claim.'},indent=2))


if __name__=='__main__':main()

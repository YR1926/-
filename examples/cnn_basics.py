"""Train a small CNN on synthetic horizontal/vertical bars, offline on CPU.

Not original LeNet-5, a full ResNet, or a pretrained transfer experiment.
Run: python cnn_basics.py --seed 7
"""
import argparse
import copy
import json

import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset


def make_data(count, seed):
    generator = torch.Generator().manual_seed(seed)
    labels = torch.arange(count) % 2
    images = torch.randn(count, 1, 16, 16, generator=generator) * 0.12
    positions = torch.randint(3, 12, (count,), generator=generator)
    for i, (label, position) in enumerate(zip(labels, positions)):
        if label == 0:
            images[i, 0, position:position+2, 2:14] += 1
        else:
            images[i, 0, 2:14, position:position+2] += 1
    return images, labels.long()


def run(seed=7):
    torch.set_num_threads(1)
    torch.manual_seed(seed)
    # Independent random streams for train/validation/test images.
    train_x, train_y = make_data(240, seed)
    val_x, val_y = make_data(80, seed+1000)
    test_x, test_y = make_data(80, seed+2000)
    mean, std = train_x.mean(), train_x.std().clamp_min(1e-6)
    train_x, val_x, test_x = [(x-mean)/std for x in (train_x, val_x, test_x)]
    generator = torch.Generator().manual_seed(seed+3000)
    loader = DataLoader(TensorDataset(train_x, train_y), batch_size=32,
                        shuffle=True, generator=generator, num_workers=0)
    model = nn.Sequential(
        nn.Conv2d(1, 8, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
        nn.Conv2d(8, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
        nn.Flatten(), nn.Linear(16*4*4, 2))
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.003)
    with torch.no_grad():
        initial = criterion(model(train_x), train_y).item()
    best, best_epoch, best_weights = float('inf'), -1, None
    for epoch in range(25):
        model.train()
        for xb, yb in loader:
            optimizer.zero_grad()
            loss = criterion(model(xb), yb)
            loss.backward()
            optimizer.step()
        model.eval()
        with torch.no_grad():
            val_loss = criterion(model(val_x), val_y).item()
        if val_loss < best:
            best, best_epoch = val_loss, epoch+1
            best_weights = copy.deepcopy(model.state_dict())
    model.load_state_dict(best_weights)
    model.eval()
    with torch.no_grad():
        final = criterion(model(train_x), train_y).item()
        val_acc = (model(val_x).argmax(1) == val_y).float().mean().item()
        test_acc = (model(test_x).argmax(1) == test_y).float().mean().item()
    # Concept checks: stride/channel parameters and a projection shortcut.
    conv = nn.Conv2d(3, 8, 3, stride=2, padding=1)
    shape = list(conv(torch.zeros(2, 3, 7, 7)).shape)
    x = torch.randn(2, 8, 16, 16)
    branch = nn.Conv2d(8, 16, 3, stride=2, padding=1)
    shortcut = nn.Conv2d(8, 16, 1, stride=2)
    residual_shape = list((branch(x)+shortcut(x)).shape)
    # Freeze example deliberately uses RANDOM weights; no transfer claim.
    backbone = nn.Sequential(nn.Linear(4, 8), nn.ReLU())
    for parameter in backbone.parameters():
        parameter.requires_grad_(False)
    head = nn.Linear(8, 3)
    backbone.eval()
    head.train()
    criterion(head(backbone(torch.randn(5, 4))), torch.tensor([0, 1, 2, 0, 1])).backward()
    frozen_ok = all(p.grad is None for p in backbone.parameters()) and head.weight.grad is not None
    return dict(seed=seed, counts=[240, 80, 80], initial_train_ce=initial,
                final_train_ce=final, best_validation_ce=best, best_epoch=best_epoch,
                validation_accuracy=val_acc, test_accuracy=test_acc,
                conv_shape=shape, conv_parameters=sum(p.numel() for p in conv.parameters()),
                residual_shape=residual_shape, freeze_gradient_check=frozen_ok,
                scope='Synthetic bars only; CNN training plus residual/freeze checks, not pretrained transfer.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seed', type=int, default=7)
    print(json.dumps(run(parser.parse_args().seed), indent=2))

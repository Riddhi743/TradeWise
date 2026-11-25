"""Fine-tune FinBERT on financial tweets + PhraseBank.
Run from backend/ with venv active:  python -m app.ml.finetune_sentiment
"""
import random
import time
from pathlib import Path

import numpy as np
import torch
from datasets import load_dataset
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from torch.utils.data import DataLoader
from transformers import AutoModelForSequenceClassification, AutoTokenizer, get_linear_schedule_with_warmup

SEED = 42
BASE = "ProsusAI/finbert"
OUT = Path(__file__).parent / "finbert-tradewise"
EPOCHS, BATCH, LR, MAX_LEN = 3, 32, 2e-5, 64
LABELS = ["negative", "neutral", "positive"]

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

tok = AutoTokenizer.from_pretrained(BASE)
model = AutoModelForSequenceClassification.from_pretrained(BASE)
label2id = {k.lower(): v for k, v in model.config.label2id.items()}  # use the model's own ids
print("Model label ids:", label2id)

TWEET_MAP = {0: "negative", 1: "positive", 2: "neutral"}
PB_MAP = {0: "negative", 1: "neutral", 2: "positive"}


def to_pairs(split, text_col, mapping):
    return [(t, label2id[mapping[l]]) for t, l in zip(split[text_col], split["label"])]


tw = load_dataset("zeroshot/twitter-financial-news-sentiment")
pb = load_dataset("FinanceInc/auditor_sentiment")

train = to_pairs(tw["train"], "text", TWEET_MAP) + to_pairs(pb["train"], "sentence", PB_MAP)
tw_test = to_pairs(tw["validation"], "text", TWEET_MAP)
pb_test = to_pairs(pb["test"], "sentence", PB_MAP)
random.shuffle(train)
print(f"train={len(train)}  tweets_test={len(tw_test)}  phrasebank_test={len(pb_test)}")


def collate(batch):
    enc = tok([b[0] for b in batch], padding=True, truncation=True, max_length=MAX_LEN, return_tensors="pt")
    enc["labels"] = torch.tensor([b[1] for b in batch])
    return enc


# class weights (softened) so rare "negative" isn't ignored
counts = np.bincount([y for _, y in train], minlength=3).astype(float)
w = (counts.sum() / counts) ** 0.5
w = torch.tensor(w / w.mean(), dtype=torch.float)
loss_fn = torch.nn.CrossEntropyLoss(weight=w)

loader = DataLoader(train, batch_size=BATCH, shuffle=True, collate_fn=collate)
opt = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=0.01)
total_steps = EPOCHS * len(loader)
sched = get_linear_schedule_with_warmup(opt, int(0.06 * total_steps), total_steps)


def evaluate(pairs, title):
    model.eval()
    id2label = {v: k for k, v in label2id.items()}
    y_true, y_pred = [], []
    with torch.no_grad():
        for i in range(0, len(pairs), 64):
            b = collate(pairs[i:i + 64])
            y = b.pop("labels")
            logits = model(**b).logits
            y_true += [id2label[int(t)] for t in y]
            y_pred += [id2label[int(p)] for p in logits.argmax(-1)]
    print(f"\n===== {title} =====")
    print("Accuracy :", round(accuracy_score(y_true, y_pred), 4))
    print("Macro F1 :", round(f1_score(y_true, y_pred, average="macro", labels=LABELS), 4))
    print("Confusion matrix (rows=true, cols=pred, order: neg, neu, pos)")
    print(confusion_matrix(y_true, y_pred, labels=LABELS))
    print(classification_report(y_true, y_pred, labels=LABELS, digits=3))
    model.train()


model.train()
start, step = time.time(), 0
for epoch in range(EPOCHS):
    for batch in loader:
        labels = batch.pop("labels")
        loss = loss_fn(model(**batch).logits, labels)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()
        sched.step()
        opt.zero_grad()
        step += 1
        if step % 50 == 0:
            mins = (time.time() - start) / 60
            print(f"epoch {epoch + 1}/{EPOCHS}  step {step}/{total_steps}  loss {loss.item():.3f}  {mins:.1f} min elapsed")
    OUT.mkdir(exist_ok=True)
    model.save_pretrained(OUT)
    tok.save_pretrained(OUT)
    print(f"Saved checkpoint after epoch {epoch + 1} -> {OUT}")

evaluate(tw_test, "Financial tweets (held-out)")
evaluate(pb_test, "Financial PhraseBank (held-out)")
print("Done. Model saved at", OUT)